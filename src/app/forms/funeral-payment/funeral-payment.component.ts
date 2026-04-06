import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { FuneralPayment } from '../../models/funeral-payment.model';
import { FuneralPaymentsService } from '../../services/funeral-payments.service';
import { FuneralContract } from '../../models/funeral-contract.model';
import { FuneralContractService } from '../../services/funeral-contract.service';

export interface PaymentRow extends FuneralPayment {
  isEditing?: boolean;
  FuneralContractId?: number;
  _backup?: Partial<PaymentRow>;
}

@Component({
  selector: 'app-funeral-payment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToastModule,
    TableModule,
    CardModule,
    TagModule,
    ButtonModule,
    TooltipModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './funeral-payment.component.html',
  styleUrl: './funeral-payment.component.scss'
})
export class FuneralPaymentComponent implements OnInit {

  serviceId: number = 0;
  FuneralContract: FuneralContract | null = null;
  editMode: boolean = false;
  editedContract: Partial<FuneralContract> = {};

  rows: PaymentRow[] = [];
  loading = false;

  // Computed values only (NO duplicated state)
  totalPaid = 0;
  balanceRemaining = 0;



  constructor(
    private funeralPaymentsService: FuneralPaymentsService,
    private funeralContractService: FuneralContractService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  // ================= INIT =================
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('contractId'));

      if (!id || id <= 0) {
        console.error('Invalid contractId');
        return;
      }

      this.serviceId = id;

      // 🔥 LOAD CONTRACT FIRST
      this.funeralContractService.getFuneralService(id).subscribe({
        next: (contract) => {
          this.cdr.markForCheck(); // ✅ Trigger change detection
          this.FuneralContract = contract;

          // 🔥 LOAD PAYMENTS AFTER CONTRACT
          this.loadPaymentData();
        },
        error: (err) => {
          console.error('Failed to load contract', err);
        }
      });
    });
  }

  // ================= LOAD PAYMENTS =================
  private loadPaymentData(): void {
    if (!this.serviceId) {
      this.rows = [];
      return;
    }

    this.loading = true;

    this.funeralPaymentsService.getFuneralPaymentByServiceId(this.serviceId).subscribe({
      next: (res) => {
        this.loading = false;

this.rows = (Array.isArray(res) ? res : [res]).map(p => ({
  controlNumber: p.controlNumber || '',
  dateIssued: p.dateIssued || '',
  bank: p.bank || '',
  amount: p.amount || 0,
  description: p.description || '',
  remarks: p.remarks || '',
  checkCleared: p.checkCleared || false,
  id: p.id,
  FuneralContractId: this.serviceId,
  isEditing: false
}));

        this.cdr.markForCheck(); // ✅ Trigger change detection
        this.computeTotals();
      },
      error: () => {
        this.loading = false;
        this.rows = [];
      }
    });
  }
cancelRow(row: PaymentRow): void {
  Object.assign(row, row._backup);
  row.isEditing = false;
}
  // ================= CRUD =================
  addRow(): void {
    this.confirmationService.confirm({
      header: 'Add New Payment',
      message: 'Do you want to add a new payment row?',
      icon: 'pi pi-question-circle',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      accept: () => this.createNewRow()
    });
  }

  private createNewRow(): void {
    this.rows.push({
      controlNumber: '',
      dateIssued: this.getToday(),
      checkDate: this.getToday(),
      issuedBy: '',
      bank: '',
      accountNumber: '',
      amount: 0,
      description: '',
      remarks: '',
      checkCleared: false,
      FuneralContractId: this.serviceId,
      isEditing: true
    });
  }

editRow(row: PaymentRow): void {
  row._backup = { ...row }; // clone original
  row.isEditing = true;
}

  saveRow(row: PaymentRow): void {
    const isNew = !row.id;
    this.confirmationService.confirm({
      header: isNew ? 'Save New Payment' : 'Save Payment Changes',
      message: isNew
        ? 'Do you want to save this new payment?'
        : 'Do you want to save changes to this payment?',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Save',
      rejectLabel: 'Cancel',
      accept: () => this.persistRow(row)
    });
  }

  private persistRow(row: PaymentRow): void {
    if (!row.controlNumber || !row.bank || !row.amount) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation',
        detail: 'Control No, Bank, and Amount are required'
      });
      return;
    }

    this.loading = true;

    const payload: FuneralPayment = {
      ...row,
      funeralServiceId: this.serviceId
    };

    this.funeralPaymentsService.save(payload).subscribe({
      next: (res) => {
        this.loading = false;

        Object.assign(row, res);
        row.isEditing = false;

        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Payment saved'
        });

        this.computeTotals();
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Save failed'
        });
      }
    });
  }

  deleteRow(index: number): void {
    const row = this.rows[index];
    const label = row?.controlNumber || `#${index + 1}`;

    this.confirmationService.confirm({
      header: 'Delete Payment',
      message: `Are you sure you want to delete payment ${label}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      accept: () => this.performDelete(index)
    });
  }

  private performDelete(index: number): void {
    const row = this.rows[index];

    if (row.id) {
      this.loading = true;
      this.funeralPaymentsService.delete(row.id).subscribe({
        next: () => {
          this.loading = false;
          this.rows.splice(index, 1);
          this.computeTotals();
          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Payment deleted successfully'
          });
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Delete Failed',
            detail: 'Unable to delete payment. Please try again.'
          });
          this.cdr.markForCheck();
        }
      });
    } else {
      this.rows.splice(index, 1);
      this.computeTotals();
      this.messageService.add({
        severity: 'success',
        summary: 'Removed',
        detail: 'Unsaved payment row removed'
      });
      this.cdr.markForCheck();
    }
  }
get netAmount(): number {
  const price = Number(this.FuneralContract?.price) || 0;
  const discount = Number(this.FuneralContract?.discount) || 0;
  return price - discount;
}
  // ================= COMPUTATION =================
  private computeTotals(): void {
    this.totalPaid = this.rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    this.computeBalance();
  }

  private computeBalance(): void {
    const price = Number(this.FuneralContract?.price) || 0;
    const discount = Number(this.FuneralContract?.discount) || 0;

    const net = price - discount;
    this.balanceRemaining = Math.max(0, net - this.totalPaid);
  }

  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  // ================= PRINTING =================
  printStatement(): void {
    if (!this.serviceId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Contract ID not found'
      });
      return;
    }

    this.router.navigate(['/print/statement-of-account', this.serviceId]);
  }

  // ================= CONTRACT EDIT MODE =================
  startEdit(): void {
    this.editedContract = { ...this.FuneralContract };
    this.editMode = true;
  }

  saveEdit(): void {
    if (!this.editedContract) return;

    this.confirmationService.confirm({
      header: 'Save Contract Remarks',
      message: 'Do you want to save your billing remarks changes?',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Save',
      rejectLabel: 'Cancel',
      accept: () => this.persistContractEdit()
    });
  }

  private persistContractEdit(): void {
    if (!this.editedContract) return;

    this.loading = true;

    const payload: FuneralContract = {
      ...this.FuneralContract,
      ...this.editedContract
    };

    this.funeralContractService.save(payload).subscribe({
      next: (res: FuneralContract) => {
        this.loading = false;
        this.FuneralContract = res;
        this.editMode = false;
        this.editedContract = {};

        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Billing remarks saved successfully'
        });

        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save billing remarks'
        });
      }
    });
  }

  cancelEdit(): void {
    this.editMode = false;
    this.editedContract = {};
  }
}