import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';

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
    CheckboxModule
  ],
  providers: [MessageService],
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

    if (row.id) {
      this.funeralPaymentsService.delete(row.id).subscribe(() => {
        this.rows.splice(index, 1);
        this.computeTotals();
      });
    } else {
      this.rows.splice(index, 1);
      this.computeTotals();
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
          summary: 'Updated',
          detail: 'Contract updated successfully'
        });

        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update contract'
        });
      }
    });
  }

  cancelEdit(): void {
    this.editMode = false;
    this.editedContract = {};
  }
}