import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { FuneralContract } from '../../models/funeral-contract.model';
import { FuneralPayment } from '../../models/funeral-payment.model';
import { FuneralContractService } from '../../services/funeral-contract.service';
import { FuneralPaymentsService } from '../../services/funeral-payments.service';
import { User } from '../../shared/features/users/users.model';
import { UserService } from '../../shared/features/users/users.service';

interface DistributionItem {
  label: string;
  count: number;
}

interface MonthlyActivity {
  label: string;
  paymentsTotal: number;
  contractsCreated: number;
}

interface PaymentChannelItem {
  label: string;
  total: number;
  count: number;
}

interface ServiceScheduleItem {
  id: number;
  contractNo: string;
  deceasedName: string;
  serviceType: string;
  scheduleLabel: string;
  scheduledFor: Date | null;
  location: string;
}

interface ReceivableWatchItem {
  id: number;
  contractNo: string;
  contractee: string;
  dueDate: Date | null;
  serviceType: string;
  daysOverdue: number;
}

interface AgingBucket {
  label: string;
  count: number;
  tone: 'slate' | 'amber' | 'rose' | 'plum';
}

interface RecentContractItem {
  id: number;
  contractNo: string;
  deceasedName: string;
  type: string;
  contractDate: Date | null;
  status: string;
}

interface RecentPaymentItem {
  id: number;
  controlNumber: string;
  accountNumber: string;
  amount: number;
  dateIssued: Date | null;
  description: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  loading = true;
  errorMessage = '';

  totalContracts = 0;
  totalCollected = 0;
  paymentCount = 0;
  averagePayment = 0;
  overdueContracts = 0;
  upcomingServices = 0;
  totalUsers = 0;
  adminUsers = 0;
  billerUsers = 0;
  accountingUsers = 0;
  burialCases = 0;
  cremationCases = 0;
  clearedPaymentRate = 0;
  contractsDueThisWeek = 0;

  serviceTypeBreakdown: DistributionItem[] = [];
  userRoleBreakdown: DistributionItem[] = [];
  monthlyActivity: MonthlyActivity[] = [];
  paymentChannelBreakdown: PaymentChannelItem[] = [];
  upcomingServiceBoard: ServiceScheduleItem[] = [];
  receivableWatchlist: ReceivableWatchItem[] = [];
  agingBuckets: AgingBucket[] = [];
  recentContracts: RecentContractItem[] = [];
  recentPayments: RecentPaymentItem[] = [];

  constructor(
    private funeralContractService: FuneralContractService,
    private funeralPaymentsService: FuneralPaymentsService,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  get maxPaymentMonthTotal(): number {
    return Math.max(...this.monthlyActivity.map((item) => item.paymentsTotal), 0);
  }

  get maxContractMonthTotal(): number {
    return Math.max(...this.monthlyActivity.map((item) => item.contractsCreated), 0);
  }

  get maxServiceTypeCount(): number {
    return Math.max(...this.serviceTypeBreakdown.map((item) => item.count), 0);
  }

  get maxRoleCount(): number {
    return Math.max(...this.userRoleBreakdown.map((item) => item.count), 0);
  }

  get maxPaymentChannelTotal(): number {
    return Math.max(...this.paymentChannelBreakdown.map((item) => item.total), 0);
  }

  getBarWidth(value: number, maxValue: number): number {
    if (!maxValue || value <= 0) {
      return 0;
    }

    return Math.max(8, (value / maxValue) * 100);
  }

  private loadDashboard(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      contracts: this.funeralContractService.getFuneralServices(1, 200),
      payments: this.funeralPaymentsService.getFuneralPayments(1, 500),
      users: this.userService.getUsers(),
    }).subscribe({
      next: ({ contracts, payments, users }) => {
        this.buildAnalytics(contracts, payments, users);
        this.loading = false;
      },
      error: (error) => {
        console.error('[DashboardComponent] Failed to load admin analytics:', error);
        this.errorMessage = 'Unable to load admin analytics right now.';
        this.loading = false;
      },
    });
  }

  private buildAnalytics(contracts: FuneralContract[], payments: FuneralPayment[], users: User[]): void {
    this.totalContracts = contracts.length;
    this.paymentCount = payments.length;
    this.totalCollected = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
    this.averagePayment = this.paymentCount > 0 ? this.totalCollected / this.paymentCount : 0;
    this.overdueContracts = contracts.filter((contract) => this.isOverdue(contract)).length;
    this.upcomingServices = contracts.filter((contract) => this.hasUpcomingService(contract, 7)).length;
    this.totalUsers = users.length;
    this.adminUsers = users.filter((user) => user.role === 'Admin').length;
    this.billerUsers = users.filter((user) => user.role === 'Biller').length;
    this.accountingUsers = users.filter((user) => user.role === 'Accounting').length;
    this.clearedPaymentRate = this.paymentCount > 0
      ? (payments.filter((payment) => payment.checkCleared).length / this.paymentCount) * 100
      : 0;
    this.contractsDueThisWeek = contracts.filter((contract) => this.isDueWithinDays(contract, 7)).length;

    this.burialCases = contracts.filter((contract) => this.getServiceCategory(contract) === 'Burial').length;
    this.cremationCases = contracts.filter((contract) => this.getServiceCategory(contract) === 'Cremation').length;

    this.serviceTypeBreakdown = this.buildDistribution(
      contracts.map((contract) => this.cleanLabel(contract.type, 'Unspecified Service'))
    );
    this.userRoleBreakdown = this.buildDistribution(
      users.map((user) => this.cleanLabel(user.role, 'User'))
    );
    this.monthlyActivity = this.buildMonthlyActivity(contracts, payments);
    this.paymentChannelBreakdown = this.buildPaymentChannelBreakdown(payments);
    this.upcomingServiceBoard = this.buildUpcomingServiceBoard(contracts);
    this.receivableWatchlist = this.buildReceivableWatchlist(contracts);
    this.agingBuckets = this.buildAgingBuckets(contracts);
    this.recentContracts = this.buildRecentContracts(contracts);
    this.recentPayments = this.buildRecentPayments(payments);
  }

  private buildDistribution(values: string[]): DistributionItem[] {
    const counts = new Map<string, number>();

    values.forEach((value) => {
      counts.set(value, (counts.get(value) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 6);
  }

  private buildMonthlyActivity(contracts: FuneralContract[], payments: FuneralPayment[]): MonthlyActivity[] {
    const formatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      date.setDate(1);

      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: formatter.format(date),
        paymentsTotal: 0,
        contractsCreated: 0,
      };
    });

    const monthLookup = new Map(months.map((month) => [month.key, month]));

    contracts.forEach((contract) => {
      const contractDate = this.parseDate(contract.contractDate || contract.startOfTransaction);
      if (!contractDate) {
        return;
      }

      const month = monthLookup.get(`${contractDate.getFullYear()}-${contractDate.getMonth()}`);
      if (month) {
        month.contractsCreated += 1;
      }
    });

    payments.forEach((payment) => {
      const paymentDate = this.parseDate(payment.dateIssued || payment.checkDate);
      if (!paymentDate) {
        return;
      }

      const month = monthLookup.get(`${paymentDate.getFullYear()}-${paymentDate.getMonth()}`);
      if (month) {
        month.paymentsTotal += Number(payment.amount) || 0;
      }
    });

    return months;
  }

  private buildPaymentChannelBreakdown(payments: FuneralPayment[]): PaymentChannelItem[] {
    const totals = new Map<string, PaymentChannelItem>();

    payments.forEach((payment) => {
      const label = this.cleanLabel(payment.bank || payment.description, 'Unspecified Channel');
      const current = totals.get(label) || { label, total: 0, count: 0 };
      current.total += Number(payment.amount) || 0;
      current.count += 1;
      totals.set(label, current);
    });

    return Array.from(totals.values())
      .sort((left, right) => right.total - left.total)
      .slice(0, 5);
  }

  private buildUpcomingServiceBoard(contracts: FuneralContract[]): ServiceScheduleItem[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return contracts
      .flatMap((contract) => {
        const burialDate = this.parseDate(contract.dateOfBurial);
        const cremationDate = this.parseDate(contract.cremationDate);
        const items: ServiceScheduleItem[] = [];

        if (burialDate && burialDate.getTime() >= today.getTime()) {
          items.push({
            id: contract.id || 0,
            contractNo: this.cleanLabel(contract.contractNo, 'Pending Number'),
            deceasedName: this.composeName(contract.firstName, contract.lastName),
            serviceType: this.cleanLabel(contract.type, 'Burial Service'),
            scheduleLabel: 'Burial',
            scheduledFor: burialDate,
            location: this.cleanLabel(contract.cementary || contract.church || contract.municipality, 'Location pending'),
          });
        }

        if (cremationDate && cremationDate.getTime() >= today.getTime()) {
          items.push({
            id: contract.id || 0,
            contractNo: this.cleanLabel(contract.contractNo, 'Pending Number'),
            deceasedName: this.composeName(contract.firstName, contract.lastName),
            serviceType: this.cleanLabel(contract.type, 'Cremation Service'),
            scheduleLabel: 'Cremation',
            scheduledFor: cremationDate,
            location: this.cleanLabel(contract.church || contract.municipality, 'Location pending'),
          });
        }

        return items;
      })
      .sort((left, right) => (left.scheduledFor?.getTime() || 0) - (right.scheduledFor?.getTime() || 0))
      .slice(0, 6);
  }

  private buildReceivableWatchlist(contracts: FuneralContract[]): ReceivableWatchItem[] {
    return contracts
      .filter((contract) => this.isOverdue(contract))
      .sort((left, right) => this.getDaysOverdue(right) - this.getDaysOverdue(left))
      .slice(0, 6)
      .map((contract) => ({
        id: contract.id || 0,
        contractNo: this.cleanLabel(contract.contractNo, 'Pending Number'),
        contractee: this.cleanLabel(contract.contractee, 'No contractee'),
        dueDate: this.parseDate(contract.dueDate),
        serviceType: this.cleanLabel(contract.type, 'Unspecified Service'),
        daysOverdue: this.getDaysOverdue(contract),
      }));
  }

  private buildAgingBuckets(contracts: FuneralContract[]): AgingBucket[] {
    const overdueContracts = contracts.filter((contract) => this.isOverdue(contract));

    const bucketCounts = {
      current: contracts.filter((contract) => !contract.cleared && !this.isOverdue(contract)).length,
      week: overdueContracts.filter((contract) => this.getDaysOverdue(contract) <= 7).length,
      month: overdueContracts.filter((contract) => this.getDaysOverdue(contract) > 7 && this.getDaysOverdue(contract) <= 30).length,
      long: overdueContracts.filter((contract) => this.getDaysOverdue(contract) > 30).length,
    };

    return [
      { label: 'Current', count: bucketCounts.current, tone: 'slate' },
      { label: '1-7 Days', count: bucketCounts.week, tone: 'amber' },
      { label: '8-30 Days', count: bucketCounts.month, tone: 'rose' },
      { label: '30+ Days', count: bucketCounts.long, tone: 'plum' },
    ];
  }

  private buildRecentContracts(contracts: FuneralContract[]): RecentContractItem[] {
    return [...contracts]
      .sort((left, right) => {
        const rightDate = this.parseDate(right.contractDate || right.startOfTransaction)?.getTime() || 0;
        const leftDate = this.parseDate(left.contractDate || left.startOfTransaction)?.getTime() || 0;
        return rightDate - leftDate;
      })
      .slice(0, 6)
      .map((contract) => ({
        id: contract.id || 0,
        contractNo: this.cleanLabel(contract.contractNo, 'Pending Number'),
        deceasedName: this.composeName(contract.firstName, contract.lastName),
        type: this.cleanLabel(contract.type, 'Unspecified Service'),
        contractDate: this.parseDate(contract.contractDate || contract.startOfTransaction),
        status: contract.cleared ? 'Cleared' : this.isOverdue(contract) ? 'Overdue' : 'Active',
      }));
  }

  private buildRecentPayments(payments: FuneralPayment[]): RecentPaymentItem[] {
    return [...payments]
      .sort((left, right) => {
        const rightDate = this.parseDate(right.dateIssued || right.checkDate)?.getTime() || 0;
        const leftDate = this.parseDate(left.dateIssued || left.checkDate)?.getTime() || 0;
        return rightDate - leftDate;
      })
      .slice(0, 6)
      .map((payment) => ({
        id: payment.id || 0,
        controlNumber: this.cleanLabel(payment.controlNumber, 'No control number'),
        accountNumber: this.cleanLabel(payment.accountNumber, 'No account'),
        amount: Number(payment.amount) || 0,
        dateIssued: this.parseDate(payment.dateIssued || payment.checkDate),
        description: this.cleanLabel(payment.description, 'Unspecified payment'),
      }));
  }

  private isOverdue(contract: FuneralContract): boolean {
    if (contract.cleared) {
      return false;
    }

    const dueDate = this.parseDate(contract.dueDate);
    if (!dueDate) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate.getTime() < today.getTime();
  }

  private hasUpcomingService(contract: FuneralContract, daysAhead: number): boolean {
    const serviceDates = [contract.dateOfBurial, contract.cremationDate]
      .map((value) => this.parseDate(value))
      .filter((value): value is Date => !!value);

    if (serviceDates.length === 0) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(today);
    limit.setDate(limit.getDate() + daysAhead);

    return serviceDates.some((date) => date.getTime() >= today.getTime() && date.getTime() <= limit.getTime());
  }

  private isDueWithinDays(contract: FuneralContract, daysAhead: number): boolean {
    if (contract.cleared) {
      return false;
    }

    const dueDate = this.parseDate(contract.dueDate);
    if (!dueDate) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(today);
    limit.setDate(limit.getDate() + daysAhead);

    return dueDate.getTime() >= today.getTime() && dueDate.getTime() <= limit.getTime();
  }

  private getDaysOverdue(contract: FuneralContract): number {
    const dueDate = this.parseDate(contract.dueDate);
    if (!dueDate) {
      return 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffMs = today.getTime() - dueDate.getTime();
    return diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0;
  }

  private getServiceCategory(contract: FuneralContract): string {
    const normalizedType = String(contract.type || '').trim().toLowerCase();

    if (normalizedType.includes('crema') || !!contract.cremationDate) {
      return 'Cremation';
    }

    if (normalizedType.includes('burial') || !!contract.dateOfBurial) {
      return 'Burial';
    }

    return 'Other';
  }

  private composeName(firstName: string | null | undefined, lastName: string | null | undefined): string {
    const name = [firstName, lastName].filter(Boolean).join(' ').trim();
    return name || 'Unnamed Case';
  }

  private cleanLabel(value: string | null | undefined, fallback: string): string {
    const trimmedValue = String(value ?? '').trim();
    return trimmedValue || fallback;
  }

  private parseDate(value: unknown): Date | null {
    if (!value) {
      return null;
    }

    const parsedDate = value instanceof Date ? value : new Date(value as string | number);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

}
