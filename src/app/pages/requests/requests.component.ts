import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';

import { ServiceRequest, ServiceRequestStatus, SERVICE_REQUEST_TYPE_LABELS } from '../../models/service-request.model';
import { ServiceRequestService } from '../../services/service-request.service';
import { FuneralContractService } from '../../services/funeral-contract.service';
import { FuneralChargesService } from '../../services/funeral-charges.service';
import { FuneralPaymentsService } from '../../services/funeral-payments.service';
import { AuthService } from '../../services/auth.service';

type FilterTab = 'pending' | 'all';

interface ValuePreviewEntry {
  key: string;
  label: string;
  value: string;
}

interface RequestRowViewModel {
  id: string;
  request: ServiceRequest;
  typeLabel: string;
  requestedAtText: string;
  reviewedAtText: string;
  oldValueText: string;
  newValueText: string;
  oldEntries: ValuePreviewEntry[];
  newEntries: ValuePreviewEntry[];
  statusUpper: string;
  statusSeverity: 'warn' | 'success' | 'danger' | 'secondary';
}

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToastModule,
    DialogModule,
    TagModule,
    TextareaModule,
  ],
  providers: [MessageService],
  templateUrl: './requests.component.html',
  styleUrl: './requests.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestsComponent implements OnInit, OnDestroy {
  requests: ServiceRequest[] = [];
  filteredRows: RequestRowViewModel[] = [];
  activeTab: FilterTab = 'pending';
  loading = false;
  dateFrom = '';
  dateTo = '';

  totalCount = 0;
  pendingCount = 0;
  approvedCount = 0;
  rejectedCount = 0;

  reviewDialogVisible = false;
  selectedRequest: ServiceRequest | null = null;
  adminNotes = '';
  reviewAction: 'approve' | 'reject' | null = null;
  applyingAction = false;
  reviewOldEntries: ValuePreviewEntry[] = [];
  reviewNewEntries: ValuePreviewEntry[] = [];
  reviewOldValueText = '—';
  reviewNewValueText = '—';
  reviewOldIsObject = false;
  reviewNewIsObject = false;
  reviewRequestedAtText = '—';

  readonly typeLabels = SERVICE_REQUEST_TYPE_LABELS;

  private sub: Subscription | null = null;

  constructor(
    private requestService: ServiceRequestService,
    private contractService: FuneralContractService,
    private chargesService: FuneralChargesService,
    private paymentsService: FuneralPaymentsService,
    private auth: AuthService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.sub = this.requestService.getAllRequests().subscribe({
      next: (items) => {
        this.requests = items;
        this.updateCounters();
        this.applyFilter();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load requests.' });
        this.cdr.markForCheck();
      },
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  setTab(tab: FilterTab): void {
    this.activeTab = tab;
    this.applyFilter();
  }

  get hasDateFilter(): boolean {
    return !!this.dateFrom || !!this.dateTo;
  }

  openReview(row: RequestRowViewModel, action: 'approve' | 'reject'): void {
    this.selectedRequest = row.request;
    this.reviewOldEntries = row.oldEntries;
    this.reviewNewEntries = row.newEntries;
    this.reviewOldValueText = row.oldValueText;
    this.reviewNewValueText = row.newValueText;
    this.reviewOldIsObject = row.oldEntries.length > 0;
    this.reviewNewIsObject = row.newEntries.length > 0;
    this.reviewRequestedAtText = row.requestedAtText;
    this.adminNotes = '';
    this.reviewAction = action;
    this.reviewDialogVisible = true;
  }

  closeReview(): void {
    this.reviewDialogVisible = false;
    this.selectedRequest = null;
    this.reviewAction = null;
    this.adminNotes = '';
    this.reviewOldEntries = [];
    this.reviewNewEntries = [];
    this.reviewOldValueText = '—';
    this.reviewNewValueText = '—';
    this.reviewOldIsObject = false;
    this.reviewNewIsObject = false;
    this.reviewRequestedAtText = '—';
  }

  async confirmReview(): Promise<void> {
    if (!this.selectedRequest?.id || !this.reviewAction) {
      return;
    }

    this.applyingAction = true;
    const u = this.auth.currentUser;
    const reviewer = u ? `${u.firstName} ${u.lastName}`.trim() || u.username : 'Admin';

    try {
      if (this.reviewAction === 'approve') {
        await this.applyChange(this.selectedRequest);
        await this.requestService.approveRequest(this.selectedRequest.id, this.adminNotes, reviewer);
        this.messageService.add({ severity: 'success', summary: 'Approved', detail: 'Request approved and change applied.' });
      } else {
        await this.requestService.rejectRequest(this.selectedRequest.id, this.adminNotes, reviewer);
        this.messageService.add({ severity: 'info', summary: 'Rejected', detail: 'Request has been rejected.' });
      }
    } catch {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Action failed. Please try again.' });
    } finally {
      this.applyingAction = false;
      this.closeReview();
      this.cdr.markForCheck();
    }
  }

  getStatusSeverity(status: ServiceRequestStatus): 'warn' | 'success' | 'danger' | 'secondary' {
    if (status === 'pending') return 'warn';
    if (status === 'approved') return 'success';
    if (status === 'rejected') return 'danger';
    return 'secondary';
  }

  trackByRequest = (_i: number, row: RequestRowViewModel): string => row.id;

  trackByValueEntry = (_i: number, item: ValuePreviewEntry): string => item.key;

  private formatTimestamp(ts: unknown): string {
    if (!ts) return '—';
    if (ts instanceof Date) return ts.toLocaleDateString();
    if (typeof ts === 'object' && ts !== null && 'seconds' in ts) {
      return new Date((ts as { seconds: number }).seconds * 1000).toLocaleString();
    }
    return String(ts);
  }

  private formatValue(value: unknown): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'number') return value.toLocaleString('en-PH', { minimumFractionDigits: 2 });
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return 'Object';
      }
    }
    return String(value);
  }

  private isObjectValue(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  private valueEntries(value: unknown): ValuePreviewEntry[] {
    if (!this.isObjectValue(value)) {
      return [];
    }

    return Object.entries(value).map(([key, entryValue]) => ({
      key,
      label: this.toLabel(key),
      value: this.formatValue(entryValue),
    }));
  }

  private toLabel(key: string): string {
    return key
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (match) => match.toUpperCase());
  }

  clearDateFilter(): void {
    this.dateFrom = '';
    this.dateTo = '';
    this.applyFilter();
  }

  printFilteredRequests(): void {
    if (!this.filteredRows.length) {
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1200,height=850');
    if (!printWindow) {
      return;
    }

    const generatedAt = new Date().toLocaleString();
    const rangeLabel = this.getDateRangeLabel();
    const rowsHtml = this.filteredRows.map((row, index) => {
      const request = row.request;
      const notes = this.escapeHtml(request.notes || '');

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${this.escapeHtml(this.typeLabels[request.type] || request.type)}</td>
          <td>${this.escapeHtml(request.contractNo || '')}</td>
          <td>${this.escapeHtml(request.fieldLabel || '')}</td>
          <td>${this.escapeHtml(row.oldValueText)}</td>
          <td>${this.escapeHtml(row.newValueText)}</td>
          <td>${this.escapeHtml(request.requestedBy || '')}</td>
          <td>${this.escapeHtml(row.requestedAtText)}</td>
          <td>${this.escapeHtml(row.statusUpper)}</td>
          <td>${notes}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Change Requests Evidence Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { margin: 0 0 8px; font-size: 24px; }
            .meta { margin: 0 0 6px; color: #4b5563; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 11px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; vertical-align: top; text-align: left; }
            th { background: #f3f4f6; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: .03em; }
            .badge { display: inline-block; padding: 2px 8px; border: 1px solid #9ca3af; border-radius: 999px; font-size: 10px; }
          </style>
        </head>
        <body>
          <h1>Change Requests Evidence Report</h1>
          <p class="meta">Generated: ${this.escapeHtml(generatedAt)}</p>
          <p class="meta">Date Filter: ${this.escapeHtml(rangeLabel)}</p>
          <p class="meta">Status Scope: ${this.escapeHtml(this.activeTab === 'pending' ? 'Pending Requests' : 'All Requests')}</p>
          <p class="meta"><span class="badge">Total Records: ${this.filteredRows.length}</span></p>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Type</th>
                <th>Contract</th>
                <th>Field</th>
                <th>Old Value</th>
                <th>New Value</th>
                <th>Submitted By</th>
                <th>Submitted At</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  applyFilter(): void {
    const dayStart = this.dateFrom ? new Date(`${this.dateFrom}T00:00:00`) : null;
    const dayEnd = this.dateTo ? new Date(`${this.dateTo}T23:59:59.999`) : null;

    const tabFiltered = this.activeTab === 'pending'
      ? this.requests.filter((request) => request.status === 'pending')
      : [...this.requests];

    this.filteredRows = tabFiltered
      .filter((request) => this.matchesDateRange(request, dayStart, dayEnd))
      .map((request, index) => this.toRowViewModel(request, index));
    this.cdr.markForCheck();
  }

  private matchesDateRange(request: ServiceRequest, dayStart: Date | null, dayEnd: Date | null): boolean {
    const requestedAt = this.toDate(request.requestedAt);
    if (!requestedAt) {
      return !this.dateFrom && !this.dateTo;
    }

    if (dayStart && requestedAt < dayStart) {
      return false;
    }

    if (dayEnd && requestedAt > dayEnd) {
      return false;
    }

    return true;
  }

  private toRowViewModel(request: ServiceRequest, index: number): RequestRowViewModel {
    const oldEntries = this.valueEntries(request.oldValue);
    const newEntries = this.valueEntries(request.newValue);

    return {
      id: request.id ?? `row-${index}`,
      request,
      typeLabel: this.typeLabels[request.type] || request.type,
      requestedAtText: this.formatTimestamp(request.requestedAt),
      reviewedAtText: this.formatTimestamp(request.reviewedAt),
      oldValueText: oldEntries.length ? this.formatEntriesSummary(oldEntries) : this.formatValue(request.oldValue),
      newValueText: newEntries.length ? this.formatEntriesSummary(newEntries) : this.formatValue(request.newValue),
      oldEntries,
      newEntries,
      statusUpper: (request.status || '').toUpperCase(),
      statusSeverity: this.getStatusSeverity(request.status),
    };
  }

  private formatEntriesSummary(entries: ValuePreviewEntry[]): string {
    return entries.map((entry) => `${entry.label}: ${entry.value}`).join(', ');
  }

  private updateCounters(): void {
    this.totalCount = this.requests.length;
    this.pendingCount = 0;
    this.approvedCount = 0;
    this.rejectedCount = 0;

    for (const request of this.requests) {
      if (request.status === 'pending') {
        this.pendingCount += 1;
      } else if (request.status === 'approved') {
        this.approvedCount += 1;
      } else if (request.status === 'rejected') {
        this.rejectedCount += 1;
      }
    }
  }

  private toDate(value: unknown): Date | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === 'object' && value !== null && 'seconds' in value) {
      const seconds = Number((value as { seconds: number }).seconds);
      const fromSeconds = new Date(seconds * 1000);
      return Number.isNaN(fromSeconds.getTime()) ? null : fromSeconds;
    }

    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private getDateRangeLabel(): string {
    if (this.dateFrom && this.dateTo) {
      return `${this.dateFrom} to ${this.dateTo}`;
    }

    if (this.dateFrom) {
      return `From ${this.dateFrom}`;
    }

    if (this.dateTo) {
      return `Up to ${this.dateTo}`;
    }

    return 'No date filter (all dates)';
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private async applyChange(request: ServiceRequest): Promise<void> {
    switch (request.type) {
      case 'price-change':
      case 'discount-change':
      case 'billing-remarks-change':
      case 'contract-correction':
        await this.applyContractChange(request);
        break;
      case 'charge-update':
        await this.applyChargeUpdate(request);
        break;
      case 'charge-delete':
        await this.applyChargeDelete(request);
        break;
      case 'payment-update':
        await this.applyPaymentUpdate(request);
        break;
      case 'payment-delete':
        await this.applyPaymentDelete(request);
        break;
    }
  }

  private async applyContractChange(request: ServiceRequest): Promise<void> {
    if (!request.contractId || !request.fieldKey) {
      throw new Error('Missing contractId or fieldKey for contract change');
    }
    const contract = await this.contractService.getFuneralService(request.contractId).toPromise();
    if (!contract) {
      throw new Error('Contract not found');
    }
    const patch: Record<string, unknown> = {};
    patch[request.fieldKey] = request.newValue;
    Object.assign(contract, patch);
    await this.contractService.save(contract).toPromise();
  }

  private async applyChargeUpdate(request: ServiceRequest): Promise<void> {
    if (!request.chargeData) {
      throw new Error('Missing charge data');
    }
    await this.chargesService.save(request.chargeData as any).toPromise();
  }

  private async applyChargeDelete(request: ServiceRequest): Promise<void> {
    const chargeId = request.targetId ?? Number(request.newValue);
    if (!chargeId) {
      throw new Error('Missing charge ID for deletion');
    }
    await this.chargesService.delete(chargeId).toPromise();
  }

  private async applyPaymentUpdate(request: ServiceRequest): Promise<void> {
    if (!request.paymentData) {
      throw new Error('Missing payment data');
    }

    await this.paymentsService.save(request.paymentData as any).toPromise();
  }

  private async applyPaymentDelete(request: ServiceRequest): Promise<void> {
    const paymentId = request.targetId ?? Number(request.newValue);
    if (!paymentId) {
      throw new Error('Missing payment ID for deletion');
    }

    await this.paymentsService.delete(paymentId).toPromise();
  }
}
