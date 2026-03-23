import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FuneralPayment } from '../../models/funeral-payment.model';
import { FuneralPaymentsService } from '../../services/funeral-payments.service';
import { FuneralContract } from '../../models/funeral-contract.model';

export interface PaymentRow extends FuneralPayment {
  isEditing?: boolean;
  FuneralContractId?: number;
}

@Component({
  selector: 'app-funeral-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './funeral-payment.component.html',
  styleUrl: './funeral-payment.component.scss',
})
export class FuneralPaymentComponent implements OnInit, OnChanges {
  @Input() serviceId: number = 0;
  @Input() FuneralContract: FuneralContract | null = null;
  @Output() paymentSaved = new EventEmitter<FuneralPayment>();
  @Output() closeDialog = new EventEmitter<void>();

  rows: PaymentRow[] = [];
  loading = false;

  // Header fields (readonly)
  contractNo: string = '';
  deceased: string = '';
  contractee: string = '';
  address: string = '';
  serviceType: string = '';

  // Bill information fields
  billAmount: number = 0;
  discount: number = 0;
  totalPaid: number = 0;
  balanceRemaining: number = 0;

  // Payment summary fields
  totalAmount: number = 0;
  totalChecks: number = 0;
  totalCash: number = 0;
  messageService: any;

  constructor(
    private funeralPaymentsService: FuneralPaymentsService,
  ) {}

  ngOnInit(): void {
    console.log('[FuneralPayment] ngOnInit - serviceId:', this.serviceId, 'FuneralContract:', !!this.FuneralContract);
    this.initializeComponent();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['serviceId'] || changes['FuneralContract']) {
      console.log('[FuneralPayment] ngOnChanges - serviceId:', this.serviceId, 'FuneralContract:', !!this.FuneralContract);
      this.initializeComponent();
    }
  }

  private initializeComponent(): void {
    this.populateHeaderFromService();
    this.loadPaymentData();
  }

  private populateHeaderFromService(): void {
    console.log('[FuneralPayment] populateHeaderFromService - FuneralContract:', !!this.FuneralContract);

    if (this.FuneralContract) {
      this.contractNo = this.FuneralContract.contractNo || '';
      const deceased = `${this.FuneralContract.firstName || ''} ${this.FuneralContract.lastName || ''}`.trim();
      this.deceased = deceased;
      this.contractee = this.FuneralContract.contractee || '';
      this.address = this.FuneralContract.addressLine1 || '';
      this.serviceType = this.FuneralContract.type || '';

      // Bill information
      this.billAmount = Number(this.FuneralContract.price) || 0;
      this.discount = Number(this.FuneralContract.discount) || 0;

      console.log('[FuneralPayment] Header populated from service:', {
        contractNo: this.contractNo,
        deceased: this.deceased,
        billAmount: this.billAmount,
        discount: this.discount,
        id: this.FuneralContract.id
      });
      this.computeBalance();
    } else {
      console.warn('[FuneralPayment] FuneralContract is null or undefined');
    }
  }

  private loadPaymentData(): void {
    const numericServiceId = Number(this.serviceId);
    
    console.log('[FuneralPayment] loadPaymentData called', {
      serviceId: this.serviceId,
      numericServiceId: numericServiceId,
      isValid: numericServiceId > 0
    });

    if (!numericServiceId || numericServiceId <= 0) {
      console.warn('[FuneralPayment] Invalid serviceId:', numericServiceId);
      this.rows = [];
      this.loading = false;
      return;
    }

    console.log('[FuneralPayment] Loading payment records for serviceId:', numericServiceId);
    this.loading = true;

    // Fetch existing payment(s) for this service from backend
    this.funeralPaymentsService.getFuneralPaymentByServiceId(numericServiceId).subscribe({
      next: (payment: FuneralPayment | FuneralPayment[] | null) => {
        this.loading = false;
        
        if (payment) {
          // Handle array response
          if (Array.isArray(payment)) {
            console.log('[FuneralPayment] Loaded payments (array):', payment);
            this.rows = payment.map(p => ({
              ...p,
              isEditing: false,
            } as PaymentRow));
          } else {
            // Handle single object response
            console.log('[FuneralPayment] Loaded payment (single):', payment);
            this.rows = [
              {
                ...payment,
                isEditing: false,
              } as PaymentRow,
            ];
          }
        } else {
          console.log('[FuneralPayment] No payment found for serviceId:', numericServiceId);
          this.rows = [];
        }

        this.computeTotals();
        this.computeBalance();
      },
      error: (err: any) => {
        this.loading = false;
        // No payment exists yet - initialize with empty rows (ready to add new payment)
        console.warn('[FuneralPayment] Error loading payment for serviceId:', numericServiceId, {
          status: err?.status,
          message: err?.message,
          error: err?.error
        });
        this.rows = [];
        this.computeBalance();
      },
    });
  }

  addRow(): void {
    const newRow: PaymentRow = {
      controlNumber: '',
      dateIssued: this.getTodayDate(),
      checkDate: this.getTodayDate(),
      issuedBy: '',
      bank: '',
      accountNumber: '',
      amount: 0,
      description: '',
      remarks: '',
      checkCleared: false,
      FuneralContractId: this.serviceId,
      isEditing: true,
    };
    this.rows.push(newRow);
    console.log('[FuneralPayment] Added new row for editing');
  }

  editRow(row: PaymentRow): void {
    row.isEditing = true;
    console.log('[FuneralPayment] Editing row:', row.id);
  }

  async saveRow(row: PaymentRow): Promise<void> {
    if (!row.controlNumber || !row.bank || !row.amount) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill in control number, bank, and amount',
        life: 3000,
      });
      return;
    }

    this.loading = true;
    const paymentData: FuneralPayment = {
      id: row.id,
      controlNumber: row.controlNumber,
      dateIssued: row.dateIssued,
      checkDate: row.checkDate,
      issuedBy: row.issuedBy,
      bank: row.bank,
      accountNumber: row.accountNumber,
      amount: row.amount,
      description: row.description,
      remarks: row.remarks,
      checkCleared: row.checkCleared,
    };

    console.log('[FuneralPayment] Saving row:', paymentData);

    this.funeralPaymentsService.save(paymentData).subscribe({
      next: (response: FuneralPayment) => {
        this.loading = false;
        row.id = response.id;
        row.isEditing = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Payment record saved successfully',
          life: 2000,
        });
        this.computeTotals();
        this.computeBalance();
        this.paymentSaved.emit(response);
        console.log('[FuneralPayment] Row saved successfully:', response);
      },
      error: (err: any) => {
        this.loading = false;
        const errorMessage = err?.error?.message || 'Failed to save payment record';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 3000,
        });
        console.error('[FuneralPayment] Error saving row:', err);
      },
    });
  }

  deleteRow(index: number): void {
    const row = this.rows[index];
    if (row.id) {
      console.log('[FuneralPayment] Deleting payment record:', row.id);
      this.funeralPaymentsService.delete(row.id).subscribe({
        next: () => {
          this.rows.splice(index, 1);
          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Payment record deleted successfully',
            life: 2000,
          });
          this.computeTotals();
          this.computeBalance();
          console.log('[FuneralPayment] Payment record deleted');
        },
        error: (err: any) => {
          const errorMessage = err?.error?.message || 'Failed to delete payment record';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage,
            life: 3000,
          });
          console.error('[FuneralPayment] Error deleting row:', err);
        },
      });
    } else {
      // New row not yet saved, just remove from display
      this.rows.splice(index, 1);
      this.computeTotals();
      this.computeBalance();
      console.log('[FuneralPayment] Removed unsaved row');
    }
  }

  private computeTotals(): void {
    this.totalAmount = 0;
    this.totalCash = 0;
    this.totalChecks = 0;

    this.rows.forEach(row => {
      if (row.amount) {
        const amount = Number(row.amount) || 0;
        this.totalAmount += amount;
      }
    });

    this.totalPaid = this.totalAmount;
    this.computeBalance();
  }

  private computeBalance(): void {
    const net = this.billAmount - (this.discount || 0);
    this.balanceRemaining = Math.max(0, net - this.totalPaid);
  }

  private getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
}
