import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { FuneralContractService } from '../../services/funeral-contract.service';
import { BurialEvent, BurialEventDetails } from '../../models/burial-event.model';
import { FuneralContract } from '../../models/funeral-contract.model';
import { CalendarSkeletonComponent } from '../../shared/components/calendar-skeleton/calendar-skeleton.component';

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: BurialEvent[];
  fullDate: Date;
}

interface CalendarWeek {
  days: CalendarDay[];
}

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CalendarSkeletonComponent
  ],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.scss'
})
export class ScheduleComponent implements OnInit {
  // State management
  isLoading = true;
  hasError = false;
  errorMessage = '';
  events: BurialEvent[] = [];
  selectedEvent: BurialEventDetails | null = null;
  isEventModalOpen = false;

  // Day view state
  isDayViewOpen = false;
  selectedDayDate: Date | null = null;
  selectedDayEvents: BurialEvent[] = [];
  selectedDayDateString = '';

  // Date state
  currentDate: Date = new Date();
  currentMonth: number = this.currentDate.getMonth();
  currentYear: number = this.currentDate.getFullYear();
  isInitialLoad = true; // Flag to track if this is the first load

  // Calendar view
  weeks: CalendarWeek[] = [];
  monthName: string = '';
  dayNames: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  constructor(
    private funeralContractService: FuneralContractService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private router: Router
  ) {
    console.log('🚀 Schedule component initializing...');
    console.log('   Current date:', this.currentDate);
    console.log('   Month:', this.currentMonth + 1, '- Year:', this.currentYear);
    this.generateCalendar();
  }

  ngOnInit(): void {
    this.loadBurialSchedule();
  }

  /**
   * Load burial schedule from API
   */
  private loadBurialSchedule(): void {
    this.isLoading = true;
    this.hasError = false;

    let startDate: Date;
    let endDate: Date;

    if (this.isInitialLoad) {
      // On first load: Load entire year to capture all historical data
      startDate = new Date(this.currentYear, 0, 1); // January 1st
      endDate = new Date(this.currentYear, 11, 31); // December 31st
      console.log('📅 INITIAL LOAD - Fetching year-wide data...');
      this.isInitialLoad = false;
    } else {
      // On month navigation: Load just the selected month
      startDate = this.getMonthStartDate();
      endDate = this.getMonthEndDate();
      console.log('📅 MONTH NAVIGATION - Fetching month-specific data...');
    }

    const formattedStartDate = this.formatDate(startDate);
    const formattedEndDate = this.formatDate(endDate);

    console.log('   Start date:', formattedStartDate);
    console.log('   End date:', formattedEndDate);
    console.log('   📡 API Endpoint:');
    console.log('      GET /funeralservice/find_by_burial/' + formattedStartDate + '/' + formattedEndDate);

    this.ngZone.run(() => {
      this.funeralContractService
        .getBurialSchedule(formattedStartDate, formattedEndDate)
        .subscribe({
          next: (contracts: FuneralContract[]) => {
            console.log('✅ API Response received successfully');
            console.log('   Total contracts:', contracts.length);
            
            this.events = this.transformContractsToEvents(contracts);
            console.log('   Transformed events:', this.events.length);
            
            this.generateCalendar();
            console.log('✅ Calendar grid generated');
          },
          error: (error: any) => {
            console.error('❌ Error loading burial schedule:', error);
            console.error('   Error details:', error?.message || error?.error || error);
            this.hasError = true;
            this.errorMessage = 'Failed to load burial schedule. Please try again.';
          },
          complete: () => {
            console.log('✅ API call complete - Setting isLoading to false');
            this.isLoading = false;
            this.cdr.markForCheck();
            this.cdr.detectChanges();
            console.log('✅ UI marked for update - isLoading:', this.isLoading);
          }
        });
    });
  }

  /**
   * Transform FuneralContract data to BurialEvent
   */
  private transformContractsToEvents(contracts: FuneralContract[]): BurialEvent[] {
    console.log('🔄 Transforming', contracts.length, 'contracts to events...');
    
    const filtered = contracts.filter(contract => {
      const hasDate = !!contract.dateOfBurial;
      if (!hasDate) {
        console.warn('⚠️  Contract skipped - no dateOfBurial:', contract.contractNo);
      }
      return hasDate;
    });

    console.log('   Filtered to', filtered.length, 'contracts with burial dates');

    const events = filtered.map((contract, index) => {
      const event = this.mapContractToEvent(contract, index);
      console.log(`   [${index + 1}] Event created:`, {
        contractNo: contract.contractNo,
        burialDate: event.start,
        deceased: event.title,
        status: event.extendedProps.status
      });
      return event;
    });

    return events;
  }

  /**
   * Map single funeral contract to burial event
   */
  private mapContractToEvent(contract: FuneralContract, index: number): BurialEvent {
    const deceasedName = this.buildDeceasedName(contract);
    const status = this.getEventStatus(contract.deliveryStatus);
    const backgroundColor = this.getStatusColor(status);
    const burialDateString = this.convertTimestampToDateString(contract.dateOfBurial);
    const price = typeof contract.price === 'string' ? parseFloat(contract.price) : contract.price;

    return {
      id: contract.id || `burial-${index}`,
      title: deceasedName,
      start: burialDateString,
      extendedProps: {
        contractNo: contract.contractNo || 'N/A',
        deceasedName,
        cemetery: contract.cementary || 'TBD',
        driver: contract.burialDriver || 'Unassigned',
        status,
        amount: price,
        remarks: contract.deliveryRemarks,
        contractId: contract.id
      },
      backgroundColor,
      borderColor: backgroundColor,
      textColor: '#ffffff'
    };
  }

  /**
   * Build deceased full name
   */
  private buildDeceasedName(contract: FuneralContract): string {
    const parts = [
      contract.firstName,
      contract.middleName,
      contract.lastName
    ].filter(part => part && part.trim());

    return parts.length > 0 ? parts.join(' ') : 'Unknown Deceased';
  }

  /**
   * Map delivery status to event status
   */
  private getEventStatus(deliveryStatus: string | null | undefined): BurialEventDetails['status'] {
    if (!deliveryStatus) return 'Scheduled';

    const statusMap: Record<string, BurialEventDetails['status']> = {
      'Completed': 'Completed',
      'In Progress': 'In Progress',
      'Cancelled': 'Cancelled'
    };

    return statusMap[deliveryStatus] || 'Scheduled';
  }

  /**
   * Get color based on event status
   */
  private getStatusColor(status: BurialEventDetails['status']): string {
    const colors: Record<BurialEventDetails['status'], string> = {
      'Scheduled': '#3b82f6',
      'In Progress': '#f59e0b',
      'Completed': '#10b981',
      'Cancelled': '#ef4444'
    };

    return colors[status];
  }

  /**
   * Generate calendar grid for the current month
   */
  private generateCalendar(): void {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const prevLastDay = new Date(this.currentYear, this.currentMonth, 0);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    this.monthName = `${monthNames[this.currentMonth]} ${this.currentYear}`;

    console.log('🗓️ Generating calendar:', this.monthName);
    console.log('   Available events:', this.events.length);

    this.weeks = [];
    let week: CalendarDay[] = [];

    // Previous month days
    for (let i = firstDay.getDay(); i > 0; i--) {
      const date = prevLastDay.getDate() - i + 1;
      week.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        events: [],
        fullDate: new Date(this.currentYear, this.currentMonth - 1, date)
      });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const fullDate = new Date(this.currentYear, this.currentMonth, i);
      const isToday = this.isToday(fullDate);
      const dateStr = this.formatDate(fullDate);
      const dayEvents = this.events.filter(e => e.start === dateStr);

      week.push({
        date: i,
        isCurrentMonth: true,
        isToday,
        events: dayEvents,
        fullDate
      });

      if (week.length === 7) {
        this.weeks.push({ days: week });
        week = [];
      }
    }

    // Next month days
    const remainingDays = 7 - week.length;
    for (let i = 1; i <= remainingDays; i++) {
      week.push({
        date: i,
        isCurrentMonth: false,
        isToday: false,
        events: [],
        fullDate: new Date(this.currentYear, this.currentMonth + 1, i)
      });
    }

    if (week.length > 0) {
      this.weeks.push({ days: week });
    }
  }

  /**
   * Check if date is today
   */
  private isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

  /**
   * Convert Unix timestamp (milliseconds) to YYYY-MM-DD format
   * Handles both millisecond timestamps from API and Date objects
   */
  private convertTimestampToDateString(timestamp: any): string {
    if (!timestamp) return '';

    try {
      // If it's a number (milliseconds), convert to Date
      if (typeof timestamp === 'number') {
        const date = new Date(timestamp);
        return this.formatDate(date);
      }
      
      // If it's already a string in ISO format, extract just the date part
      if (typeof timestamp === 'string') {
        return timestamp.split('T')[0];
      }

      return '';
    } catch (error) {
      console.error('Error converting timestamp:', timestamp, error);
      return '';
    }
  }

  /**
   * Format date to YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get start date of current month
   */
  private getMonthStartDate(): Date {
    return new Date(this.currentYear, this.currentMonth, 1);
  }

  /**
   * Get end date of current month
   */
  private getMonthEndDate(): Date {
    return new Date(this.currentYear, this.currentMonth + 1, 0);
  }

  /**
   * Navigate to previous month
   */
  goToPreviousMonth(): void {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    console.log('◀️  Previous month:', this.currentMonth + 1, '/', this.currentYear);
    this.loadBurialSchedule();
  }

  /**
   * Navigate to next month
   */
  goToNextMonth(): void {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    console.log('▶️  Next month:', this.currentMonth + 1, '/', this.currentYear);
    this.loadBurialSchedule();
  }

  /**
   * Navigate to today
   */
  goToToday(): void {
    const today = new Date();
    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();
    console.log('📍 Today button clicked:', this.currentMonth + 1, '/', this.currentYear);
    this.loadBurialSchedule();
  }

  /**
   * Refresh schedule
   */
  refreshSchedule(): void {
    console.log('🔄 Refresh button clicked');
    this.loadBurialSchedule();
  }

  /**
   * Open event details modal
   */
  openEventModal(event: BurialEvent): void {
    this.selectedEvent = event.extendedProps;
    this.isEventModalOpen = true;
    console.log('📅 Event clicked:', this.selectedEvent);
  }

  /**
   * Close event modal
   */
  closeEventModal(): void {
    this.isEventModalOpen = false;
    this.selectedEvent = null;
  }

  /**
   * Open day view modal with all appointments for that day
   */
  openDayView(day: CalendarDay): void {
    this.selectedDayDate = day.fullDate;
    this.selectedDayDateString = this.formatDayString(day.fullDate);
    this.selectedDayEvents = day.events;
    this.isDayViewOpen = true;
    console.log('📅 Day clicked:', this.selectedDayDateString);
    console.log('   Events for this day:', this.selectedDayEvents.length);
  }

  /**
   * Close day view modal
   */
  closeDayView(): void {
    this.isDayViewOpen = false;
    this.selectedDayDate = null;
    this.selectedDayEvents = [];
    this.selectedDayDateString = '';
  }

  /**
   * Print Statement of Account
   */
  printStatementOfAccount(): void {
    if (this.selectedEvent?.contractId) {
      console.log('📄 Printing Statement of Account for contract:', this.selectedEvent.contractId);
      this.router.navigate(['/print/statement-of-account', this.selectedEvent.contractId]);
      this.closeEventModal();
    }
  }

  /**
   * Print Funeral Service Contract
   */
  printFuneralServiceContract(): void {
    if (this.selectedEvent?.contractId) {
      console.log('📋 Printing Funeral Service Contract for contract:', this.selectedEvent.contractId);
      this.router.navigate(['/print/funeral-service-contract', this.selectedEvent.contractId]);
      this.closeEventModal();
    }
  }

  /**
   * Print Authority to Cremate Remains
   */
  printAuthorizationToCremateRemains(): void {
    if (this.selectedEvent?.contractId) {
      console.log('🔥 Printing Authority to Cremate Remains for contract:', this.selectedEvent.contractId);
      this.router.navigate(['/print/authority-to-cremate-remains', this.selectedEvent.contractId]);
      this.closeEventModal();
    }
  }

  /**
   * Print Cremation Certificate
   */
  printCremationCertificate(): void {
    if (this.selectedEvent?.contractId) {
      console.log('📜 Printing Cremation Certificate for contract:', this.selectedEvent.contractId);
      this.router.navigate(['/print/cremation-certificate', this.selectedEvent.contractId]);
      this.closeEventModal();
    }
  }

  /**
   * Format date to readable string (e.g., "Monday, April 13, 2026")
   */
  private formatDayString(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dayNum = date.getDate();
    const year = date.getFullYear();
    
    return `${dayName}, ${monthName} ${dayNum}, ${year}`;
  }

  /**
   * Get event color
   */
  getEventColor(event: BurialEvent): string {
    return event.backgroundColor || '#3b82f6';
  }

  /**
   * Get status badge styling
   */
  getStatusBadgeClass(status: string): string {
    const statusMap: Record<string, string> = {
      'Scheduled': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-amber-100 text-amber-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) {
      return '—';
    }
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Get limited events to display (max 2 to avoid overflow)
   */
  getLimitedEvents(events: BurialEvent[], limit: number = 2): BurialEvent[] {
    return events.slice(0, limit);
  }

  /**
   * Check if there are more events than displayed
   */
  hasMoreEvents(events: BurialEvent[], displayed: number = 2): boolean {
    return events.length > displayed;
  }
}
