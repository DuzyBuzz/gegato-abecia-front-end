import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { catchError, of } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import type { ChartData, ChartOptions } from 'chart.js';
import { FuneralContract } from '../../models/funeral-contract.model';
import { FuneralPayment } from '../../models/funeral-payment.model';
import { FuneralContractService } from '../../services/funeral-contract.service';
import { FuneralPaymentsService } from '../../services/funeral-payments.service';
import { User } from '../../shared/features/users/users.model';
import { UserService } from '../../shared/features/users/users.service';
import { RoleAccess, resolveRoleAccess } from '../../utils/role-access.util';
import 'chart.js/auto';

interface DistributionItem {
  label: string;
  count: number;
}

interface MonthlyActivity {
  periodKey: string;
  periodStart: Date;
  label: string;
  paymentsTotal: number;
  contractsCreated: number;
  paymentCount: number;
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

interface BillingReportItem {
  contractNo: string;
  contractee: string;
  deceasedName: string;
  serviceType: string;
  totalDue: number;
  dueDate: Date | null;
  status: string;
}

interface CollectionReportItem {
  controlNumber: string;
  dateIssued: Date | null;
  checkDate: Date | null;
  accountNumber: string;
  paymentType: string;
  amount: number;
  issuedBy: string;
  description: string;
  remarks: string;
  checkCleared: boolean;
}

type DashboardReportTab =
  | 'billing-report'
  | 'collections-report'
  | 'service-distribution'
  | 'receivables-aging'
  | 'upcoming-services'
  | 'monthly-trend';

type DashboardPeriodMode = 'monthly' | 'yearly';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ChartModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  loading = true;
  errorMessage = '';

  activeTab: DashboardReportTab = 'billing-report';
  periodMode: DashboardPeriodMode = 'monthly';
  periodCursor = new Date();
  yearlyChunksLoaded = 0;
  yearlyChunksTotal = 12;
  scopeStatus = 'Idle';
  baseSourcesLoaded = 0;
  readonly baseSourcesTotal = 3;

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
  billingReportRows: BillingReportItem[] = [];
  collectionReportRows: CollectionReportItem[] = [];
  reportFromDate = '';
  reportToDate = '';
  reportLoading = false;
  reportErrorMessage = '';
  reportRangeLabel = '';
  summaryTotalCollection = 0;
  summaryAverageCollection = 0;
  summaryTransactionCount = 0;
  summaryClearedCount = 0;
  summaryPendingCount = 0;
  summaryTopChannel = 'Unspecified';
  summaryTopAccount = 'No account';
  summaryTopDescription = 'No description';

  billingByServiceChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  billingByServiceChartOptions: ChartOptions<'bar'> = this.getBillingByServiceChartOptions();
  billingStatusChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  billingStatusChartOptions: ChartOptions<'doughnut'> = this.getBillingStatusChartOptions();
  billingTotalDue = 0;
  billingOpenCount = 0;
  billingOverdueCount = 0;
  billingAverageDue = 0;

  collectionByChannelChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  collectionByChannelChartOptions: ChartOptions<'bar'> = this.getCollectionByChannelChartOptions();
  collectionStatusChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  collectionStatusChartOptions: ChartOptions<'doughnut'> = this.getCollectionStatusChartOptions();
  collectionDailyTrendChartData: ChartData<'line'> = { labels: [], datasets: [] };
  collectionDailyTrendChartOptions: ChartOptions<'line'> = this.getCollectionDailyTrendChartOptions();

  serviceDistributionChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  serviceDistributionChartOptions: ChartOptions<'bar'> = this.getServiceDistributionChartOptions();
  serviceDistributionTotalCases = 0;
  serviceDistributionTopService = 'N/A';

  agingDistributionChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  agingDistributionChartOptions: ChartOptions<'bar'> = this.getAgingDistributionChartOptions();
  receivableHighRiskCount = 0;
  receivableMaxOverdueDays = 0;

  upcomingScheduleChartData: ChartData<'line'> = { labels: [], datasets: [] };
  upcomingScheduleChartOptions: ChartOptions<'line'> = this.getUpcomingScheduleChartOptions();
  upcomingBurialCount = 0;
  upcomingCremationCount = 0;
  upcomingPrimaryLocation = 'N/A';

  monthlyTrendChartData: ChartData<'line'> = { labels: [], datasets: [] };
  monthlyTrendChartOptions: ChartOptions<'line'> = this.getMonthlyTrendChartOptions();
  monthlyTrendVolumeChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  monthlyTrendVolumeChartOptions: ChartOptions<'bar'> = this.getMonthlyTrendVolumeChartOptions();
  trendTotalCollections = 0;
  trendTotalContracts = 0;
  trendTotalPayments = 0;
  trendPeakPeriod = 'N/A';

  private allContracts: FuneralContract[] = [];
  private allPayments: FuneralPayment[] = [];
  private allUsers: User[] = [];
  private reportLoadToken = 0;
  private baseLoadFinalized = false;

  maxPaymentMonthTotal = 0;
  maxContractMonthTotal = 0;
  maxServiceTypeCount = 0;
  maxRoleCount = 0;
  maxPaymentChannelTotal = 0;
  isYearlyMode = false;
  scopeLabel = '';
  scopeDateRangeLabel = '';
  yearlyProgressPercent = 0;
  dataStatusBadge = 'Live data';
  hasAnyData = false;

  readonly reportTabs: Array<{ id: DashboardReportTab; label: string }> = [
    { id: 'billing-report', label: 'Billing Report' },
    { id: 'collections-report', label: 'Collections Report' },
    { id: 'service-distribution', label: 'Service Type Distribution' },
    { id: 'receivables-aging', label: 'Receivables Aging' },
    { id: 'upcoming-services', label: 'Upcoming Services' },
    { id: 'monthly-trend', label: 'Monthly Contracts vs Collections' },
  ];

  constructor(
    private funeralContractService: FuneralContractService,
    private funeralPaymentsService: FuneralPaymentsService,
    private userService: UserService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.periodCursor = this.startOfMonth(new Date());
    this.syncScopeLabels();
    this.syncProgressDisplay();
    this.syncDataStatusBadge();
    this.loadBaseData();
  }

  getBarWidth(value: number, maxValue: number): number {
    if (!maxValue || value <= 0) {
      return 0;
    }

    return Math.max(8, (value / maxValue) * 100);
  }


  setActiveTab(tab: DashboardReportTab): void {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }

  setPeriodMode(mode: DashboardPeriodMode): void {
    if (this.periodMode === mode) {
      return;
    }

    this.periodMode = mode;
    this.periodCursor = mode === 'monthly'
      ? this.startOfMonth(this.periodCursor)
      : this.startOfYear(this.periodCursor);
    this.syncScopeLabels();
    this.syncDataStatusBadge();
    void this.refreshPeriodView();
  }

  shiftPeriod(delta: number): void {
    const next = new Date(this.periodCursor);
    if (this.periodMode === 'monthly') {
      next.setMonth(next.getMonth() + delta);
      this.periodCursor = this.startOfMonth(next);
    } else {
      next.setFullYear(next.getFullYear() + delta);
      this.periodCursor = this.startOfYear(next);
    }

    this.syncScopeLabels();
    this.syncDataStatusBadge();
    void this.refreshPeriodView();
  }

  private loadBaseData(): void {
    this.loading = true;
    this.errorMessage = '';
    this.scopeStatus = `Loading base datasets (0/${this.baseSourcesTotal})...`;
    this.baseSourcesLoaded = 0;
    this.baseLoadFinalized = false;
    this.allContracts = [];
    this.allPayments = [];
    this.allUsers = [];
    this.syncDataStatusBadge();
    this.syncProgressDisplay();
    this.cdr.markForCheck();

    this.funeralContractService.getFuneralServices(1, 800).pipe(
      catchError((err) => {
        console.error('[DashboardComponent] Failed to load contracts:', err);
        this.handleSourceLoadError('contracts');
        return of([] as FuneralContract[]);
      }),
    ).subscribe((contracts) => {
      this.allContracts = contracts;
      this.baseSourcesLoaded += 1;
      this.scopeStatus = `Loading base datasets (${this.baseSourcesLoaded}/${this.baseSourcesTotal})...`;
      this.updateProgressiveAnalytics();
      this.finalizeBaseLoadIfDone();
      this.syncDataStatusBadge();
      this.cdr.markForCheck();
    });

    this.funeralPaymentsService.getFuneralPayments(1, 1200).pipe(
      catchError((err) => {
        console.error('[DashboardComponent] Failed to load payments:', err);
        this.handleSourceLoadError('payments');
        return of([] as FuneralPayment[]);
      }),
    ).subscribe((payments) => {
      this.allPayments = payments;
      this.baseSourcesLoaded += 1;
      this.scopeStatus = `Loading base datasets (${this.baseSourcesLoaded}/${this.baseSourcesTotal})...`;
      this.updateProgressiveAnalytics();
      this.finalizeBaseLoadIfDone();
      this.syncDataStatusBadge();
      this.cdr.markForCheck();
    });

    this.userService.getUsers().pipe(
      catchError((err) => {
        console.error('[DashboardComponent] Failed to load users:', err);
        this.handleSourceLoadError('users');
        return of([] as User[]);
      }),
    ).subscribe((users) => {
      this.allUsers = users;
      this.baseSourcesLoaded += 1;
      this.scopeStatus = `Loading base datasets (${this.baseSourcesLoaded}/${this.baseSourcesTotal})...`;
      this.updateProgressiveAnalytics();
      this.finalizeBaseLoadIfDone();
      this.syncDataStatusBadge();
      this.cdr.markForCheck();
    });
  }

  private async refreshPeriodView(): Promise<void> {
    const [from, to] = this.getCurrentRange();
    this.reportFromDate = this.formatInputDate(from);
    this.reportToDate = this.formatInputDate(to);

    const filteredContracts = this.filterContractsByRange(this.allContracts, from, to);
    const filteredPayments = this.filterPaymentsByRange(this.allPayments, from, to);
    this.buildAnalytics(filteredContracts, filteredPayments, this.allUsers);

    if (this.periodMode === 'yearly') {
      await this.loadSummaryReportYearlyProgressive();
      return;
    }

    this.scopeStatus = 'Loading monthly report...';
    await this.loadSummaryReportMonthlyProgressive();
  }

  private buildAnalytics(contracts: FuneralContract[], payments: FuneralPayment[], users: User[]): void {
    this.totalContracts = contracts.length;
    this.paymentCount = payments.length;
    this.totalCollected = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
    this.averagePayment = this.paymentCount > 0 ? this.totalCollected / this.paymentCount : 0;
    this.overdueContracts = contracts.filter((contract) => this.isOverdue(contract)).length;
    this.upcomingServices = contracts.filter((contract) => this.hasUpcomingService(contract, 7)).length;
    this.totalUsers = users.length;
    this.adminUsers = users.filter((user) => resolveRoleAccess(user.roleAccess, user.companyRole || user.role) === RoleAccess.Admin).length;
    this.billerUsers = users.filter((user) => resolveRoleAccess(user.roleAccess, user.companyRole || user.role) === RoleAccess.Biller).length;
    this.accountingUsers = users.filter((user) => resolveRoleAccess(user.roleAccess, user.companyRole || user.role) === RoleAccess.Accounting).length;
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
    this.rebuildMonthlyTrendAnalytics();
    this.paymentChannelBreakdown = this.buildPaymentChannelBreakdown(payments);
    this.upcomingServiceBoard = this.buildUpcomingServiceBoard(contracts);
    this.receivableWatchlist = this.buildReceivableWatchlist(contracts);
    this.agingBuckets = this.buildAgingBuckets(contracts);
    this.rebuildServiceDistributionAnalytics();
    this.rebuildReceivablesAnalytics();
    this.rebuildUpcomingServicesAnalytics();
    this.recentContracts = this.buildRecentContracts(contracts);
    this.recentPayments = this.buildRecentPayments(payments);
    this.syncMaxMetrics();
    this.syncHasAnyData();
  }

  trackByReportTab = (_i: number, tab: { id: DashboardReportTab; label: string }): string => tab.id;

  trackByContractNo = (_i: number, item: BillingReportItem): string => `${item.contractNo}-${item.dueDate?.toISOString() || 'none'}`;

  trackByControlNo = (_i: number, item: CollectionReportItem): string => `${item.controlNumber}-${item.dateIssued?.toISOString() || item.checkDate?.toISOString() || 'none'}`;

  trackByDistribution = (_i: number, item: DistributionItem): string => item.label;

  trackByAgingBucket = (_i: number, bucket: AgingBucket): string => bucket.label;

  trackByReceivable = (_i: number, item: ReceivableWatchItem): string => `${item.id}-${item.contractNo}`;

  trackBySchedule = (_i: number, item: ServiceScheduleItem): string => `${item.id}-${item.scheduleLabel}-${item.scheduledFor?.toISOString() || 'none'}`;

  trackByMonthlyActivity = (_i: number, item: MonthlyActivity): string => item.periodKey;

  applyReportRange(): void {
    void this.refreshPeriodView();
  }

  async exportBillingReport(): Promise<void> {
    const { utils, writeFile } = await import('xlsx');
    const rows = this.billingReportRows.map((item) => ({
      'Contract No': item.contractNo,
      Contractee: item.contractee,
      Deceased: item.deceasedName,
      'Service Type': item.serviceType,
      'Total Due': item.totalDue,
      'Due Date': item.dueDate ? item.dueDate.toISOString().slice(0, 10) : '',
      Status: item.status,
    }));
    const worksheet = utils.json_to_sheet(rows);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Billing Report');
    writeFile(workbook, `billing-report-${this.getReportRangeSuffix()}.xlsx`);
  }

  async exportCollectionReport(): Promise<void> {
    const { utils, writeFile } = await import('xlsx');
    const rows = this.collectionReportRows.map((item) => ({
      'Control No': item.controlNumber,
      'Date Issued': item.dateIssued ? item.dateIssued.toISOString().slice(0, 10) : '',
      'Check Date': item.checkDate ? item.checkDate.toISOString().slice(0, 10) : '',
      'Account Number': item.accountNumber,
      'Payment Type': item.paymentType,
      Amount: item.amount,
      'Issued By': item.issuedBy,
      Description: item.description,
    }));
    const worksheet = utils.json_to_sheet(rows);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Collections Report');
    writeFile(workbook, `collections-report-${this.getReportRangeSuffix()}.xlsx`);
  }

  printBillingReport(): void {
    this.printReport('Billing Report', this.buildBillingReportHtml(), this.reportRangeLabel);
  }

  printCollectionReport(): void {
    this.printReport('Collections Report', this.buildCollectionReportHtml(), this.reportRangeLabel);
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
    const [from, to] = this.getCurrentRange();
    const buckets: MonthlyActivity[] = [];

    if (this.periodMode === 'monthly') {
      const labelFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' });
      const cursor = new Date(from);
      cursor.setHours(0, 0, 0, 0);
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);

      while (cursor.getTime() <= end.getTime()) {
        const periodStart = new Date(cursor);
        const periodKey = periodStart.toISOString().slice(0, 10);
        buckets.push({
          periodKey,
          periodStart,
          label: labelFormatter.format(periodStart),
          paymentsTotal: 0,
          contractsCreated: 0,
          paymentCount: 0,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
    } else {
      const year = from.getFullYear();
      const labelFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' });

      for (let month = 0; month < 12; month += 1) {
        const periodStart = new Date(year, month, 1);
        const periodKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        buckets.push({
          periodKey,
          periodStart,
          label: labelFormatter.format(periodStart),
          paymentsTotal: 0,
          contractsCreated: 0,
          paymentCount: 0,
        });
      }
    }

    const bucketLookup = new Map<string, MonthlyActivity>(buckets.map((bucket) => [bucket.periodKey, bucket]));

    contracts.forEach((contract) => {
      const contractDate = this.parseDate(contract.contractDate || contract.startOfTransaction);
      if (!contractDate) {
        return;
      }

      const periodKey = this.periodMode === 'monthly'
        ? contractDate.toISOString().slice(0, 10)
        : `${contractDate.getFullYear()}-${String(contractDate.getMonth() + 1).padStart(2, '0')}`;
      const bucket = bucketLookup.get(periodKey);
      if (bucket) {
        bucket.contractsCreated += 1;
      }
    });

    payments.forEach((payment) => {
      const paymentDate = this.parseDate(payment.dateIssued || payment.checkDate);
      if (!paymentDate) {
        return;
      }

      const periodKey = this.periodMode === 'monthly'
        ? paymentDate.toISOString().slice(0, 10)
        : `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
      const bucket = bucketLookup.get(periodKey);
      if (bucket) {
        bucket.paymentsTotal += Number(payment.amount) || 0;
        bucket.paymentCount += 1;
      }
    });

    return buckets;
  }

  private rebuildMonthlyTrendAnalytics(): void {
    const rows = this.monthlyActivity;
    this.trendTotalCollections = rows.reduce((sum, row) => sum + row.paymentsTotal, 0);
    this.trendTotalContracts = rows.reduce((sum, row) => sum + row.contractsCreated, 0);
    this.trendTotalPayments = rows.reduce((sum, row) => sum + row.paymentCount, 0);

    const peak = rows.reduce<MonthlyActivity | null>((winner, current) => {
      if (!winner || current.paymentsTotal > winner.paymentsTotal) {
        return current;
      }

      return winner;
    }, null);
    this.trendPeakPeriod = peak ? peak.label : 'N/A';

    this.monthlyTrendChartData = {
      labels: rows.map((row) => row.label),
      datasets: [
        {
          label: 'Collections Amount',
          data: rows.map((row) => row.paymentsTotal),
          borderColor: '#0f766e',
          backgroundColor: 'rgba(15, 118, 110, 0.14)',
          yAxisID: 'yAmount',
          fill: true,
          tension: 0.28,
          pointRadius: 2,
          pointHoverRadius: 4,
        },
        {
          label: 'Contracts Created',
          data: rows.map((row) => row.contractsCreated),
          borderColor: '#1d4ed8',
          backgroundColor: '#1d4ed8',
          yAxisID: 'yCount',
          fill: false,
          tension: 0.2,
          pointRadius: 2,
          pointHoverRadius: 4,
        },
      ],
    };

    this.monthlyTrendVolumeChartData = {
      labels: rows.map((row) => row.label),
      datasets: [
        {
          label: 'Payment Transactions',
          data: rows.map((row) => row.paymentCount),
          backgroundColor: '#0ea5a4',
          borderColor: '#0f766e',
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  }

  private buildPaymentChannelBreakdown(payments: FuneralPayment[]): PaymentChannelItem[] {
    const totals = new Map<string, PaymentChannelItem>();

    payments.forEach((payment) => {
      const label = this.cleanLabel(payment.paymentType || payment.description, 'Unspecified Channel');
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
        description: this.cleanLabel(payment.paymentType || payment.description, 'Unspecified payment'),
      }));
  }

  private buildBillingReportRows(contracts: FuneralContract[]): BillingReportItem[] {
    return [...contracts]
      .sort((left, right) => {
        const rightDue = this.parseDate(right.dueDate)?.getTime() || 0;
        const leftDue = this.parseDate(left.dueDate)?.getTime() || 0;
        return rightDue - leftDue;
      })
      .slice(0, 100)
      .map((contract) => {
        const totalDue = Math.max((Number(contract.price) || 0) - (Number(contract.discount) || 0), 0);
        return {
          contractNo: this.cleanLabel(contract.contractNo, 'Pending Number'),
          contractee: this.cleanLabel(contract.contractee, 'No contractee'),
          deceasedName: this.composeName(contract.firstName, contract.lastName),
          serviceType: this.cleanLabel(contract.type, 'Unspecified Service'),
          totalDue,
          dueDate: this.parseDate(contract.dueDate),
          status: contract.cleared ? 'Cleared' : this.isOverdue(contract) ? 'Overdue' : 'Open',
        };
      });
  }

  private buildCollectionReportRows(payments: FuneralPayment[]): CollectionReportItem[] {
    return [...payments]
      .sort((left, right) => {
        const rightDate = this.parseDate(right.dateIssued || right.checkDate)?.getTime() || 0;
        const leftDate = this.parseDate(left.dateIssued || left.checkDate)?.getTime() || 0;
        return rightDate - leftDate;
      })
      .slice(0, 150)
      .map((payment) => ({
        controlNumber: this.cleanLabel(payment.controlNumber, 'No control no'),
        dateIssued: this.parseDate(payment.dateIssued || payment.checkDate),
        checkDate: this.parseDate(payment.checkDate),
        accountNumber: this.cleanLabel(payment.accountNumber, 'No account'),
        paymentType: this.cleanLabel(payment.paymentType, 'Unspecified type'),
        amount: Number(payment.amount) || 0,
        issuedBy: this.cleanLabel(payment.issuedBy, 'Unknown'),
        description: this.cleanLabel(payment.description, 'Unspecified payment'),
        remarks: this.cleanLabel(payment.remarks, ''),
        checkCleared: !!payment.checkCleared,
      }));
  }

  private printReport(title: string, tableHtml: string, subtitle: string): void {
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { margin: 0 0 12px; }
            p { margin: 0 0 16px; color: #555; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f3f4f6; text-transform: uppercase; font-size: 11px; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>${subtitle}</p>
          <p>Generated ${new Date().toLocaleString()}</p>
          ${tableHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  private buildBillingReportHtml(): string {
    const rows = this.billingReportRows.map((item) => `
      <tr>
        <td>${item.contractNo}</td>
        <td>${item.contractee}</td>
        <td>${item.deceasedName}</td>
        <td>${item.serviceType}</td>
        <td>${item.totalDue.toLocaleString()}</td>
        <td>${item.dueDate ? item.dueDate.toLocaleDateString() : ''}</td>
        <td>${item.status}</td>
      </tr>
    `).join('');

    return `
      <table>
        <thead>
          <tr>
            <th>Contract No</th>
            <th>Contractee</th>
            <th>Deceased</th>
            <th>Service Type</th>
            <th>Total Due</th>
            <th>Due Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  private buildCollectionReportHtml(): string {
    const rows = this.collectionReportRows.map((item) => `
      <tr>
        <td>${item.controlNumber}</td>
        <td>${item.dateIssued ? item.dateIssued.toLocaleDateString() : ''}</td>
        <td>${item.checkDate ? item.checkDate.toLocaleDateString() : ''}</td>
        <td>${item.accountNumber}</td>
        <td>${item.paymentType}</td>
        <td>${item.amount.toLocaleString()}</td>
        <td>${item.issuedBy}</td>
        <td>${item.description}</td>
      </tr>
    `).join('');

    return `
      <table>
        <thead>
          <tr>
            <th>Control No</th>
            <th>Date Issued</th>
            <th>Check Date</th>
            <th>Account Number</th>
            <th>Payment Type</th>
            <th>Amount</th>
            <th>Issued By</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
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

  private formatInputDate(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private async loadSummaryReportMonthlyProgressive(): Promise<void> {
    const activeToken = ++this.reportLoadToken;
    this.reportLoading = true;
    this.yearlyChunksLoaded = 0;
    this.reportErrorMessage = '';
    this.reportRangeLabel = `From ${this.reportFromDate} to ${this.reportToDate}`;
    this.syncProgressDisplay();
    this.syncDataStatusBadge();

    const [rangeStart, rangeEnd] = this.getCurrentRange();
    const chunks = this.buildDateChunks(rangeStart, rangeEnd, 7);
    const mergedBilling = new Map<string, BillingReportItem>();
    const mergedCollections = new Map<string, CollectionReportItem>();
    let loadedChunks = 0;

    for (const chunk of chunks) {
      if (activeToken !== this.reportLoadToken) {
        return;
      }

      try {
        const report = await firstValueFrom(this.funeralContractService.getSummaryReport(chunk.from, chunk.to));
        if (activeToken !== this.reportLoadToken) {
          return;
        }

        const billingRows = this.mapContractSummaryRows(report.contractSummary);
        const collectionRows = this.mapPaymentSummaryRows(report.paymentSummary);

        billingRows.forEach((row) => {
          mergedBilling.set(this.getBillingRowKey(row), row);
        });

        collectionRows.forEach((row) => {
          mergedCollections.set(this.getCollectionRowKey(row), row);
        });

        loadedChunks += 1;
        this.scopeStatus = `Loading monthly report chunks (${loadedChunks}/${chunks.length})...`;
        this.billingReportRows = this.sortBillingRows(Array.from(mergedBilling.values()));
        this.collectionReportRows = this.sortCollectionRows(Array.from(mergedCollections.values()));
        this.rebuildBillingReportAnalytics();
        this.rebuildCollectionSummaryAnalytics();
        this.syncDataStatusBadge();
        this.cdr.markForCheck();
      } catch (error) {
        if (activeToken !== this.reportLoadToken) {
          return;
        }

        console.error('[DashboardComponent] Failed monthly chunk load:', error);
        this.reportErrorMessage = 'Some report chunks failed to load. Showing available data.';
      }
    }

    if (activeToken !== this.reportLoadToken) {
      return;
    }

    this.reportLoading = false;
    this.scopeStatus = this.reportErrorMessage
      ? 'Monthly report partially loaded'
      : 'Monthly report loaded';
    this.rebuildBillingReportAnalytics();
    this.rebuildCollectionSummaryAnalytics();
    this.syncDataStatusBadge();
    this.syncProgressDisplay();
    this.cdr.markForCheck();
  }

  private async loadSummaryReportYearlyProgressive(): Promise<void> {
    const activeToken = ++this.reportLoadToken;
    this.reportLoading = true;
    this.reportErrorMessage = '';
    this.scopeStatus = `Generating yearly report for ${this.periodCursor.getFullYear()}...`;
    this.yearlyChunksLoaded = 0;
    this.yearlyChunksTotal = 12;
    this.billingReportRows = [];
    this.collectionReportRows = [];
    this.syncProgressDisplay();
    this.syncDataStatusBadge();

    const months = Array.from({ length: 12 }, (_, month) => new Date(this.periodCursor.getFullYear(), month, 1));
    const mergedBilling = new Map<string, BillingReportItem>();
    const mergedCollections = new Map<string, CollectionReportItem>();

    for (const monthStart of months) {
      if (activeToken !== this.reportLoadToken) {
        return;
      }

      const from = this.formatInputDate(this.startOfMonth(monthStart));
      const to = this.formatInputDate(this.endOfMonth(monthStart));

      try {
        const summary = await firstValueFrom(this.funeralContractService.getSummaryReport(from, to));
        if (activeToken !== this.reportLoadToken) {
          return;
        }

        this.mapContractSummaryRows(summary.contractSummary).forEach((row) => {
          mergedBilling.set(this.getBillingRowKey(row), row);
        });
        this.mapPaymentSummaryRows(summary.paymentSummary).forEach((row) => {
          mergedCollections.set(this.getCollectionRowKey(row), row);
        });
        this.yearlyChunksLoaded += 1;
        this.billingReportRows = this.sortBillingRows(Array.from(mergedBilling.values()));
        this.collectionReportRows = this.sortCollectionRows(Array.from(mergedCollections.values()));
        this.rebuildBillingReportAnalytics();
        this.rebuildCollectionSummaryAnalytics();
        this.syncProgressDisplay();
        this.syncDataStatusBadge();
        this.cdr.markForCheck();
      } catch (error) {
        if (activeToken !== this.reportLoadToken) {
          return;
        }

        console.error('[DashboardComponent] Failed yearly chunk load:', error);
        this.reportErrorMessage = 'Some yearly chunks failed to load. Showing available data.';
      }
    }

    if (activeToken !== this.reportLoadToken) {
      return;
    }

    this.reportRangeLabel = this.scopeDateRangeLabel;
    this.scopeStatus = this.reportErrorMessage
      ? 'Yearly report partially loaded'
      : `Yearly report loaded (${this.yearlyChunksLoaded}/${this.yearlyChunksTotal})`;
    this.reportLoading = false;
    this.rebuildBillingReportAnalytics();
    this.rebuildCollectionSummaryAnalytics();
    this.syncProgressDisplay();
    this.syncDataStatusBadge();
    this.cdr.markForCheck();
  }

  private mapContractSummaryRows(rows: Record<string, unknown>[]): BillingReportItem[] {
    return rows.map((row) => ({
      contractNo: this.pickString(row, ['contractNo', 'contract_number', 'contractno'], 'Pending Number'),
      contractee: this.pickString(row, ['contractee', 'client', 'customerName'], 'No contractee'),
      deceasedName: this.pickString(row, ['deceasedName', 'deceased', 'deceased_name', 'name'], 'Unnamed Case'),
      serviceType: this.pickString(row, ['serviceType', 'type', 'service_type'], 'Unspecified Service'),
      totalDue: this.pickNumber(row, ['totalDue', 'balance', 'amount', 'total']),
      dueDate: this.pickDate(row, ['dueDate', 'due_date', 'dateDue']),
      status: this.pickString(row, ['status', 'state'], 'Open'),
    }));
  }

  private mapPaymentSummaryRows(rows: Record<string, unknown>[]): CollectionReportItem[] {
    return rows.map((row) => ({
      controlNumber: this.pickString(row, ['controlNumber', 'controlNo', 'orNumber', 'or_no'], 'No control no'),
      dateIssued: this.pickDate(row, ['dateIssued', 'date', 'paymentDate', 'issuedDate']),
      checkDate: this.pickDate(row, ['checkDate', 'check_date', 'datedCheck']),
      accountNumber: this.pickString(row, ['accountNumber', 'arNumber', 'account', 'ar_no'], 'No account'),
      paymentType: this.pickString(row, ['paymentType', 'payment_type', 'type'], 'Unspecified type'),
      amount: this.pickNumber(row, ['amount', 'total', 'paidAmount']),
      issuedBy: this.pickString(row, ['issuedBy', 'collector', 'receivedBy'], 'Unknown'),
      description: this.pickString(row, ['description', 'remarks', 'note'], 'Unspecified payment'),
      remarks: this.pickString(row, ['remarks', 'note', 'description'], ''),
      checkCleared: this.pickBoolean(row, ['checkCleared', 'cleared', 'isCleared']),
    }));
  }

  private pickBoolean(entry: Record<string, unknown>, keys: string[]): boolean {
    for (const key of keys) {
      const value = entry[key];
      if (typeof value === 'boolean') {
        return value;
      }

      if (value === 1 || value === '1' || value === 'true') {
        return true;
      }

      if (value === 0 || value === '0' || value === 'false') {
        return false;
      }
    }

    return false;
  }

  private pickString(entry: Record<string, unknown>, keys: string[], fallback: string): string {
    for (const key of keys) {
      const value = entry[key];
      const normalized = String(value ?? '').trim();
      if (normalized) {
        return normalized;
      }
    }

    return fallback;
  }

  private pickNumber(entry: Record<string, unknown>, keys: string[]): number {
    for (const key of keys) {
      const raw = entry[key];
      const parsed = Number(raw ?? 0);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }

    return 0;
  }

  private pickDate(entry: Record<string, unknown>, keys: string[]): Date | null {
    for (const key of keys) {
      const value = entry[key];
      const parsed = this.parseDate(value);
      if (parsed) {
        return parsed;
      }
    }

    return null;
  }

  private getReportRangeSuffix(): string {
    if (this.reportFromDate && this.reportToDate) {
      return `${this.reportFromDate}-to-${this.reportToDate}`;
    }

    return new Date().toISOString().slice(0, 10);
  }

  private buildDateChunks(from: Date, to: Date, chunkDays: number): Array<{ from: string; to: string }> {
    const chunks: Array<{ from: string; to: string }> = [];
    const cursor = new Date(from);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    while (cursor.getTime() <= end.getTime()) {
      const chunkStart = new Date(cursor);
      const chunkEnd = new Date(cursor);
      chunkEnd.setDate(chunkEnd.getDate() + Math.max(chunkDays - 1, 0));
      if (chunkEnd.getTime() > end.getTime()) {
        chunkEnd.setTime(end.getTime());
      }

      chunks.push({
        from: this.formatInputDate(chunkStart),
        to: this.formatInputDate(chunkEnd),
      });

      cursor.setDate(cursor.getDate() + Math.max(chunkDays, 1));
    }

    return chunks;
  }

  private getBillingRowKey(row: BillingReportItem): string {
    return [
      row.contractNo,
      row.contractee,
      row.deceasedName,
      row.serviceType,
      row.dueDate ? row.dueDate.toISOString().slice(0, 10) : '',
      row.totalDue,
      row.status,
    ].join('|');
  }

  private getCollectionRowKey(row: CollectionReportItem): string {
    return [
      row.controlNumber,
      row.accountNumber,
      row.paymentType,
      row.amount,
      row.dateIssued ? row.dateIssued.toISOString().slice(0, 10) : '',
      row.checkDate ? row.checkDate.toISOString().slice(0, 10) : '',
      row.issuedBy,
      row.description,
    ].join('|');
  }

  private sortBillingRows(rows: BillingReportItem[]): BillingReportItem[] {
    return [...rows]
      .sort((left, right) => {
        const rightDue = right.dueDate?.getTime() || 0;
        const leftDue = left.dueDate?.getTime() || 0;
        if (rightDue !== leftDue) {
          return rightDue - leftDue;
        }

        return left.contractNo.localeCompare(right.contractNo);
      });
  }

  private sortCollectionRows(rows: CollectionReportItem[]): CollectionReportItem[] {
    return [...rows]
      .sort((left, right) => {
        const rightDate = right.dateIssued?.getTime() || right.checkDate?.getTime() || 0;
        const leftDate = left.dateIssued?.getTime() || left.checkDate?.getTime() || 0;
        if (rightDate !== leftDate) {
          return rightDate - leftDate;
        }

        return left.controlNumber.localeCompare(right.controlNumber);
      });
  }

  private rebuildBillingReportAnalytics(): void {
    const rows = this.billingReportRows;
    this.billingTotalDue = rows.reduce((sum, row) => sum + (Number(row.totalDue) || 0), 0);
    this.billingOpenCount = rows.filter((row) => this.cleanLabel(row.status, 'Open') === 'Open').length;
    this.billingOverdueCount = rows.filter((row) => this.cleanLabel(row.status, 'Open') === 'Overdue').length;
    this.billingAverageDue = rows.length > 0 ? this.billingTotalDue / rows.length : 0;
    const serviceTotals = new Map<string, number>();
    const statusCounts = new Map<string, number>();

    rows.forEach((row) => {
      const serviceLabel = this.cleanLabel(row.serviceType, 'Unspecified Service');
      serviceTotals.set(serviceLabel, (serviceTotals.get(serviceLabel) || 0) + (Number(row.totalDue) || 0));

      const statusLabel = this.cleanLabel(row.status, 'Open');
      statusCounts.set(statusLabel, (statusCounts.get(statusLabel) || 0) + 1);
    });

    const topServiceTotals = Array.from(serviceTotals.entries())
      .map(([label, total]) => ({ label, total }))
      .sort((left, right) => right.total - left.total)
      .slice(0, 6);

    this.billingByServiceChartData = {
      labels: topServiceTotals.map((item) => item.label),
      datasets: [
        {
          label: 'Total Due',
          data: topServiceTotals.map((item) => item.total),
          backgroundColor: '#2563eb',
          borderColor: '#1d4ed8',
          borderWidth: 1,
          borderRadius: 8,
        },
      ],
    };

    const statusData = Array.from(statusCounts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count);

    this.billingStatusChartData = {
      labels: statusData.map((item) => item.label),
      datasets: [
        {
          data: statusData.map((item) => item.count),
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#14b8a6'],
          borderWidth: 1,
        },
      ],
    };
  }

  private rebuildServiceDistributionAnalytics(): void {
    const rows = this.serviceTypeBreakdown;
    this.serviceDistributionTotalCases = rows.reduce((sum, item) => sum + item.count, 0);
    this.serviceDistributionTopService = rows[0]?.label || 'N/A';

    this.serviceDistributionChartData = {
      labels: rows.map((item) => item.label),
      datasets: [
        {
          label: 'Cases',
          data: rows.map((item) => item.count),
          backgroundColor: '#1d4ed8',
          borderColor: '#1e40af',
          borderWidth: 1,
          borderRadius: 8,
        },
      ],
    };
  }

  private rebuildReceivablesAnalytics(): void {
    this.receivableHighRiskCount = this.receivableWatchlist.filter((item) => item.daysOverdue > 30).length;
    this.receivableMaxOverdueDays = this.receivableWatchlist.reduce(
      (max, item) => Math.max(max, item.daysOverdue),
      0,
    );

    this.agingDistributionChartData = {
      labels: this.agingBuckets.map((bucket) => bucket.label),
      datasets: [
        {
          label: 'Contracts',
          data: this.agingBuckets.map((bucket) => bucket.count),
          backgroundColor: ['#94a3b8', '#f59e0b', '#fb7185', '#a855f7'],
          borderWidth: 1,
          borderRadius: 8,
        },
      ],
    };
  }

  private rebuildUpcomingServicesAnalytics(): void {
    const rows = this.upcomingServiceBoard;
    this.upcomingBurialCount = rows.filter((item) => item.scheduleLabel === 'Burial').length;
    this.upcomingCremationCount = rows.filter((item) => item.scheduleLabel === 'Cremation').length;

    const locationCounts = new Map<string, number>();
    rows.forEach((item) => {
      const location = this.cleanLabel(item.location, 'Location pending');
      locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
    });
    this.upcomingPrimaryLocation = Array.from(locationCounts.entries())
      .sort((left, right) => right[1] - left[1])[0]?.[0] || 'N/A';

    const scheduleCounts = new Map<string, number>();
    rows.forEach((item) => {
      if (!item.scheduledFor) {
        return;
      }

      const key = item.scheduledFor.toISOString().slice(0, 10);
      scheduleCounts.set(key, (scheduleCounts.get(key) || 0) + 1);
    });

    const scheduleSeries = Array.from(scheduleCounts.entries())
      .map(([key, count]) => ({
        key,
        count,
        label: new Date(key).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
      }))
      .sort((left, right) => left.key.localeCompare(right.key));

    this.upcomingScheduleChartData = {
      labels: scheduleSeries.map((item) => item.label),
      datasets: [
        {
          label: 'Scheduled Services',
          data: scheduleSeries.map((item) => item.count),
          borderColor: '#0f766e',
          backgroundColor: 'rgba(15, 118, 110, 0.14)',
          fill: true,
          tension: 0.28,
          pointRadius: 3,
        },
      ],
    };
  }

  private rebuildCollectionSummaryAnalytics(): void {
    const rows = this.collectionReportRows;
    this.summaryTransactionCount = rows.length;
    this.summaryTotalCollection = rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
    this.summaryAverageCollection = this.summaryTransactionCount > 0
      ? this.summaryTotalCollection / this.summaryTransactionCount
      : 0;
    this.summaryClearedCount = rows.filter((row) => row.checkCleared).length;
    this.summaryPendingCount = Math.max(this.summaryTransactionCount - this.summaryClearedCount, 0);

    const channelBreakdown = this.buildCollectionBreakdown(rows, (row) => {
      const paymentType = this.cleanLabel(row.paymentType, '');
      if (paymentType && paymentType !== 'Unspecified type') {
        return paymentType;
      }

      return this.cleanLabel(row.description, 'Unspecified');
    });
    const accountBreakdown = this.buildCollectionBreakdown(rows, (row) => this.cleanLabel(row.accountNumber, 'No account'));
    const descriptionBreakdown = this.buildCollectionBreakdown(rows, (row) => this.cleanLabel(row.description, 'No description'));

    this.summaryTopChannel = channelBreakdown[0]?.label || 'Unspecified';
    this.summaryTopAccount = accountBreakdown[0]?.label || 'No account';
    this.summaryTopDescription = descriptionBreakdown[0]?.label || 'No description';

    this.collectionByChannelChartData = {
      labels: channelBreakdown.map((item) => item.label),
      datasets: [
        {
          label: 'Amount',
          data: channelBreakdown.map((item) => item.amount),
          backgroundColor: '#0ea5a4',
          borderColor: '#0f766e',
          borderWidth: 1,
          borderRadius: 8,
        },
      ],
    };

    this.collectionStatusChartData = {
      labels: ['Cleared', 'Pending'],
      datasets: [
        {
          data: [this.summaryClearedCount, this.summaryPendingCount],
          backgroundColor: ['#10b981', '#f59e0b'],
          hoverBackgroundColor: ['#059669', '#d97706'],
          borderWidth: 1,
        },
      ],
    };

    const dailyBreakdown = this.buildDailyCollectionBreakdown(rows);
    this.collectionDailyTrendChartData = {
      labels: dailyBreakdown.map((item) => item.label),
      datasets: [
        {
          label: 'Daily Collection',
          data: dailyBreakdown.map((item) => item.amount),
          borderColor: '#0f2f58',
          backgroundColor: 'rgba(15, 47, 88, 0.16)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
        },
      ],
    };
  }

  private buildCollectionBreakdown(
    rows: CollectionReportItem[],
    resolver: (row: CollectionReportItem) => string,
  ): Array<{ label: string; amount: number; count: number }> {
    const lookup = new Map<string, { label: string; amount: number; count: number }>();

    rows.forEach((row) => {
      const label = resolver(row);
      const current = lookup.get(label) || { label, amount: 0, count: 0 };
      current.amount += Number(row.amount) || 0;
      current.count += 1;
      lookup.set(label, current);
    });

    return Array.from(lookup.values())
      .sort((left, right) => right.amount - left.amount)
      .slice(0, 6);
  }

  private buildDailyCollectionBreakdown(rows: CollectionReportItem[]): Array<{ label: string; amount: number }> {
    const dayLookup = new Map<string, number>();

    rows.forEach((row) => {
      if (!row.dateIssued) {
        return;
      }

      const key = row.dateIssued.toISOString().slice(0, 10);
      dayLookup.set(key, (dayLookup.get(key) || 0) + (Number(row.amount) || 0));
    });

    return Array.from(dayLookup.entries())
      .map(([key, amount]) => ({
        key,
        amount,
        label: new Date(key).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
      }))
      .sort((left, right) => left.key.localeCompare(right.key))
      .slice(-10)
      .map(({ label, amount }) => ({ label, amount }));
  }

  private getCollectionByChannelChartOptions(): ChartOptions<'bar'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#334155',
          },
          grid: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: '#334155',
          },
          grid: {
            color: '#e2e8f0',
          },
        },
      },
    };
  }

  private getBillingByServiceChartOptions(): ChartOptions<'bar'> {
    return this.getCollectionByChannelChartOptions();
  }

  private getBillingStatusChartOptions(): ChartOptions<'doughnut'> {
    return this.getCollectionStatusChartOptions();
  }

  private getCollectionStatusChartOptions(): ChartOptions<'doughnut'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#334155',
            boxWidth: 14,
          },
        },
      },
      cutout: '62%',
    };
  }

  private getCollectionDailyTrendChartOptions(): ChartOptions<'line'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#334155',
          },
          grid: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: '#334155',
          },
          grid: {
            color: '#e2e8f0',
          },
        },
      },
    };
  }

  private getServiceDistributionChartOptions(): ChartOptions<'bar'> {
    return this.getCollectionByChannelChartOptions();
  }

  private getAgingDistributionChartOptions(): ChartOptions<'bar'> {
    return this.getCollectionByChannelChartOptions();
  }

  private getUpcomingScheduleChartOptions(): ChartOptions<'line'> {
    return this.getCollectionDailyTrendChartOptions();
  }

  private getMonthlyTrendChartOptions(): ChartOptions<'line'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#334155',
            boxWidth: 14,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#334155',
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: this.periodMode === 'monthly' ? 12 : 8,
          },
          grid: {
            display: false,
          },
        },
        yAmount: {
          type: 'linear',
          position: 'left',
          beginAtZero: true,
          ticks: {
            color: '#334155',
          },
          grid: {
            color: '#e2e8f0',
          },
        },
        yCount: {
          type: 'linear',
          position: 'right',
          beginAtZero: true,
          ticks: {
            color: '#334155',
            precision: 0,
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      },
    };
  }

  private getMonthlyTrendVolumeChartOptions(): ChartOptions<'bar'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#334155',
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: this.periodMode === 'monthly' ? 12 : 8,
          },
          grid: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: '#334155',
            precision: 0,
          },
          grid: {
            color: '#e2e8f0',
          },
        },
      },
    };
  }

  private updateProgressiveAnalytics(): void {
    const [from, to] = this.getCurrentRange();
    this.reportFromDate = this.formatInputDate(from);
    this.reportToDate = this.formatInputDate(to);

    const filteredContracts = this.filterContractsByRange(this.allContracts, from, to);
    const filteredPayments = this.filterPaymentsByRange(this.allPayments, from, to);
    this.buildAnalytics(filteredContracts, filteredPayments, this.allUsers);
    this.syncScopeLabels();
    this.syncDataStatusBadge();

    void this.refreshPeriodView();
  }

  private finalizeBaseLoadIfDone(): void {
    if (this.baseLoadFinalized || this.baseSourcesLoaded < this.baseSourcesTotal) {
      return;
    }

    this.baseLoadFinalized = true;
    this.loading = false;
    if (!this.allContracts.length && !this.allPayments.length && !this.allUsers.length) {
      this.errorMessage = 'Unable to load admin analytics right now.';
      this.scopeStatus = 'Base datasets unavailable';
      this.syncDataStatusBadge();
      this.cdr.markForCheck();
      return;
    }

    this.scopeStatus = 'Base datasets loaded';
    this.syncDataStatusBadge();
    this.cdr.markForCheck();
  }

  private handleSourceLoadError(_source: 'contracts' | 'payments' | 'users'): void {
    // Errors are handled per-source; we keep rendering available data from successful sources.
  }

  private getCurrentRange(): [Date, Date] {
    if (this.periodMode === 'monthly') {
      return [this.startOfMonth(this.periodCursor), this.endOfMonth(this.periodCursor)];
    }

    return [this.startOfYear(this.periodCursor), this.endOfYear(this.periodCursor)];
  }

  private filterContractsByRange(contracts: FuneralContract[], from: Date, to: Date): FuneralContract[] {
    const startTime = from.getTime();
    const endTime = to.getTime();
    return contracts.filter((contract) => {
      const date = this.parseDate(contract.contractDate || contract.startOfTransaction);
      if (!date) {
        return false;
      }

      const time = date.getTime();
      return time >= startTime && time <= endTime;
    });
  }

  private filterPaymentsByRange(payments: FuneralPayment[], from: Date, to: Date): FuneralPayment[] {
    const startTime = from.getTime();
    const endTime = to.getTime();
    return payments.filter((payment) => {
      const date = this.parseDate(payment.dateIssued || payment.checkDate);
      if (!date) {
        return false;
      }

      const time = date.getTime();
      return time >= startTime && time <= endTime;
    });
  }

  private startOfMonth(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), 1);
  }

  private endOfMonth(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth() + 1, 0);
  }

  private startOfYear(value: Date): Date {
    return new Date(value.getFullYear(), 0, 1);
  }

  private endOfYear(value: Date): Date {
    return new Date(value.getFullYear(), 11, 31);
  }

  private syncScopeLabels(): void {
    this.isYearlyMode = this.periodMode === 'yearly';
    if (this.periodMode === 'monthly') {
      this.scopeLabel = this.periodCursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const start = this.startOfMonth(this.periodCursor);
      const end = this.endOfMonth(this.periodCursor);
      this.scopeDateRangeLabel = `${start.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`;
      return;
    }

    this.scopeLabel = String(this.periodCursor.getFullYear());
    const start = this.startOfYear(this.periodCursor);
    const end = this.endOfYear(this.periodCursor);
    this.scopeDateRangeLabel = `${start.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`;
  }

  private syncProgressDisplay(): void {
    this.yearlyProgressPercent = this.yearlyChunksTotal
      ? Math.round((this.yearlyChunksLoaded / this.yearlyChunksTotal) * 100)
      : 0;
  }

  private syncDataStatusBadge(): void {
    if (this.loading) {
      this.dataStatusBadge = `Base data ${this.baseSourcesLoaded}/${this.baseSourcesTotal}`;
      return;
    }

    if (this.reportLoading && this.periodMode === 'yearly') {
      this.dataStatusBadge = `${this.yearlyChunksLoaded}/${this.yearlyChunksTotal} monthly chunks loaded`;
      return;
    }

    if (this.reportLoading) {
      this.dataStatusBadge = 'Refreshing report';
      return;
    }

    this.dataStatusBadge = 'Live data';
  }

  private syncHasAnyData(): void {
    this.hasAnyData = this.totalContracts > 0 || this.paymentCount > 0 || this.totalUsers > 0;
  }

  private syncMaxMetrics(): void {
    this.maxPaymentMonthTotal = Math.max(...this.monthlyActivity.map((item) => item.paymentsTotal), 0);
    this.maxContractMonthTotal = Math.max(...this.monthlyActivity.map((item) => item.contractsCreated), 0);
    this.maxServiceTypeCount = Math.max(...this.serviceTypeBreakdown.map((item) => item.count), 0);
    this.maxRoleCount = Math.max(...this.userRoleBreakdown.map((item) => item.count), 0);
    this.maxPaymentChannelTotal = Math.max(...this.paymentChannelBreakdown.map((item) => item.total), 0);
  }

}
