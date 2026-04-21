import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { FuneralContractService } from '../../services/funeral-contract.service';
import { BurialEvent, BurialEventChargeLine, BurialEventDetails } from '../../models/burial-event.model';
import { FuneralContract } from '../../models/funeral-contract.model';
import { ContractCharges } from '../../models/contract-charges.model';
import { FuneralChargesService } from '../../services/funeral-charges.service';
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
    private funeralChargesService: FuneralChargesService,
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
        .pipe(
          switchMap((contracts: FuneralContract[]) =>
            this.buildChargeLookup(contracts).pipe(
              map((chargeLookup) => ({ contracts, chargeLookup }))
            )
          )
        )
        .subscribe({
          next: ({ contracts, chargeLookup }) => {
            console.log('✅ API Response received successfully');
            console.log('   Total contracts:', contracts.length);
            
            this.events = this.transformContractsToEvents(contracts, chargeLookup);
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
  private transformContractsToEvents(
    contracts: FuneralContract[],
    chargeLookup: Map<number, ContractCharges[]> = new Map()
  ): BurialEvent[] {
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
      const charges = contract.id ? chargeLookup.get(contract.id) ?? [] : [];
      const event = this.mapContractToEvent(contract, index, charges);
      console.log(`   [${index + 1}] Event created:`, {
        contractNo: contract.contractNo,
        burialDate: event.start,
        deceased: event.title,
        status: event.extendedProps.status,
        totalCharges: event.extendedProps.amount
      });
      return event;
    });

    return events;
  }

  private buildChargeLookup(contracts: FuneralContract[]) {
    const contractIds = contracts
      .map((contract) => contract.id)
      .filter((id): id is number => typeof id === 'number' && Number.isFinite(id));

    if (contractIds.length === 0) {
      return of(new Map<number, ContractCharges[]>());
    }

    return forkJoin(
      contractIds.map((contractId) =>
        this.funeralChargesService.getChargesByServiceId(contractId).pipe(
          catchError((error) => {
            console.warn('⚠️ Failed to load charges for contract:', contractId, error);
            return of([] as ContractCharges[]);
          }),
          map((charges) => this.filterUsefulCharges(charges))
        )
      )
    ).pipe(
      map((chargeGroups) => {
        const chargeLookup = new Map<number, ContractCharges[]>();
        contractIds.forEach((contractId, index) => {
          chargeLookup.set(contractId, chargeGroups[index] || []);
        });
        return chargeLookup;
      })
    );
  }

  private filterUsefulCharges(charges: ContractCharges[]): ContractCharges[] {
    return charges.filter((charge) => this.isUsefulCharge(charge));
  }

  private isUsefulCharge(charge: ContractCharges): boolean {
    return !!(
      charge.id ||
      (charge.chargeType && charge.chargeType.trim()) ||
      (charge.description && charge.description.trim()) ||
      Number(charge.quantity) ||
      Number(charge.unitPrice) ||
      Number(charge.discount)
    );
  }

  /**
   * Map single funeral contract to burial event
   */
  private mapContractToEvent(contract: FuneralContract, index: number, charges: ContractCharges[] = []): BurialEvent {
    const deceasedName = this.buildDeceasedName(contract);
    const status: BurialEventDetails['status'] = 'Scheduled';
    const burialDateString = this.convertTimestampToDateString(contract.dateOfBurial);
    const legacyPrice = this.toNumber(contract.price);
    const chargeItems = this.buildChargeItems(charges);
    const totalCharges = chargeItems.reduce((sum, charge) => sum + charge.amount, 0);
    const amount = chargeItems.length > 0 ? totalCharges : legacyPrice;

    return {
      id: contract.id || `burial-${index}`,
      title: deceasedName,
      start: burialDateString,
      extendedProps: {
        contractNo: contract.contractNo || 'N/A',
        deceasedName,
        contractee: contract.contractee || 'N/A',
        serviceType: contract.type || 'Not specified',
        burialDate: this.formatReadableDate(contract.dateOfBurial) || 'Not scheduled',
        wakeLocation: contract.transferAddress || 'Not specified',
        cemetery: contract.cementary || 'TBD',
        church: contract.church || 'Not specified',
        driver: contract.burialDriver || 'Unassigned',
        contactNo: contract.contactNo || 'Not provided',
        status,
        amount,
        chargeCount: chargeItems.length,
        chargeItems,
        deliveryRemarks: contract.deliveryRemarks,
        remarks: contract.remarks,
        billingRemarks: contract.billingRemarks,
        contractId: contract.id
      },
      backgroundColor: '#475569',
      borderColor: '#475569',
      textColor: '#ffffff'
    };
  }

  private buildChargeItems(charges: ContractCharges[]): BurialEventChargeLine[] {
    return charges.map((charge) => ({
      label: this.buildChargeLabel(charge),
      quantity: this.toNumber(charge.quantity),
      unitPrice: this.toNumber(charge.unitPrice),
      discount: this.toNumber(charge.discount),
      amount: this.calculateChargeAmount(charge)
    }));
  }

  private buildChargeLabel(charge: ContractCharges): string {
    const parts = [charge.chargeType, charge.description]
      .filter((part): part is string => !!part && part.trim().length > 0);
    return parts.length > 0 ? parts.join(' - ') : 'Charge';
  }

  private calculateChargeAmount(charge: ContractCharges): number {
    const qty = Number(charge.quantity) || 0;
    const unitPrice = Number(charge.unitPrice) || 0;
    const discount = Number(charge.discount) || 0;
    return (qty * unitPrice) - discount;
  }

  private toNumber(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private formatReadableDate(dateValue?: string | null): string | null {
    if (!dateValue) {
      return null;
    }

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
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
    return event.backgroundColor || '#475569';
  }

  /**
   * Get status badge styling
   */
  getStatusBadgeClass(): string {
    return 'bg-slate-100 text-slate-800';
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
