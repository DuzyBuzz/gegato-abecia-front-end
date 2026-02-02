

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface BillingItem {
  transNo: string;
  item: string;
  amount: number;
  discount: number;
  cash: number;
  check: number;
  plan: number;
  dswd: number;
  gm: number;
  date?: string;
  user?: string;
}
export interface BillingRow {
  transNo: string;
  item: string;
  amount: number;
  discount: number;
  cash: number;
  check: number;
  or: number;
  ar: string;
  orNo: string;
  plan: number;
  dswd: number;
  gm: number;
  date: string;
  user: string;
  isEditing?: boolean;
}


@Component({
  selector: 'app-billing-entry',
  imports: [CommonModule, FormsModule],
  templateUrl: './billing-entry.html',
  styleUrl: './billing-entry.scss',
})
export class BillingEntry {
    rows: BillingRow[] = [];

  /** Add empty editable row */
  addRow(): void {
    this.rows.push({
      transNo: '',
      item: '',
      amount: 0,
      discount: 0,
      cash: 0,
      check: 0,
      or: 0,
      ar: '',
      orNo: '',
      plan: 0,
      dswd: 0,
      gm: 0,
      date: '',
      user: '',
      isEditing: true
    });
  }

  /** Enable edit mode */
  editRow(row: BillingRow): void {
    row.isEditing = true;
  }

  /** Save row (UI only) */
  saveRow(row: BillingRow): void {
    row.isEditing = false;
  }

  /** Delete row */
  deleteRow(index: number): void {
    this.rows.splice(index, 1);
  }
  // ===== HEADER DATA =====
  contractNo = '12-013950-25';
  startDate = '12/31/2025';

  deceased = 'HELEN D. DORIN';
  contractee = 'ALAIN DORIN / 0961-424-6939';
  address = 'MANDURRIAO, ILOILO CITY';

  serviceType = 'Traditional';
  casket = 'SR FLEXI METAL';
  casketDesc = 'ALL WHITE / ROSE HAN';

  dateDelivery = '02-Jan-26';
  dateBurial = '07-Jan-26';

  // ===== BILLING TABLE =====
  billingItems: BillingItem[] = [
    {
      transNo: '127656',
      item: 'SR FLEXI METAL CASKET',
      amount: 150000,
      discount: 0,
      cash: 0,
      check: 0,
      plan: 0,
      dswd: 0,
      gm: 0
    },
    {
      transNo: '127654',
      item: 'PLAN PAYMENT DEPOSIT @ EASTWEST BANK',
      amount: 0,
      discount: 0,
      cash: 0,
      check: 0,
      plan: 10000,
      dswd: 0,
      gm: 0
    },
    {
      transNo: '127653',
      item: 'CHAPEL SET UP',
      amount: 0,
      discount: 0,
      cash: 0,
      check: 0,
      plan: 30000,
      dswd: 0,
      gm: 0
    }
  ];

  // ===== COMPUTED TOTALS =====
  get totalAmount(): number {
    return this.billingItems.reduce((sum, i) => sum + i.amount, 0);
  }

  get totalPlan(): number {
    return this.billingItems.reduce((sum, i) => sum + i.plan, 0);
  }

  get balance(): number {
    return this.totalAmount - this.totalPlan;
  }
}
