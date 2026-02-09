import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BillingAccount, BillingTransaction } from '../../../models/billing-account.model';
import { BILLING_ACCOUNTS_MOCK, BILLING_TRANSACTIONS_MOCK } from '../../../../assets/mock/billing-account.mock';

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

export interface BillingRow extends BillingTransaction {
  isEditing?: boolean;
}

@Component({
  selector: 'app-billing-entry',
  imports: [CommonModule, FormsModule],
  templateUrl: './billing-entry.html',
  styleUrl: './billing-entry.scss',
})
export class BillingEntry implements OnInit {
  rows: BillingRow[] = [];
  contractId: string | null = null;
  billingAccount: BillingAccount | null = null;

  // ===== HEADER DATA =====
  contractNo: string = '';
  startDate: string = '';
  deceased: string = '';
  contractee: string = '';
  contracteePhone: string = '';
  address: string = '';
  serviceType: string = '';
  cremationType: string = '';
  casket: string = '';
  casketDesc: string = '';

  // ===== AGE & DOCUMENTS =====
  age: number = 0;
  discIdNo: string = '';
  issuedAt: string = '';
  issuedOn: string = '';
  cityDocs: string = '';
  submitted: string = '';
  barangay: string = '';
  chairman: string = '';
  financialAsst: string = '';
  dateSubmitted: string = '';
  receivedBy: string = '';

  // ===== DATES =====
  dateDelivery: string = '';
  cremationDate: string = '';
  promissoryDate: string = '';
  dateBurial: string = '';
  ashReleased: string = '';
  releasedBy: string = '';

  // ===== BILLING =====
  guarantor: string = '';
  billingRemarks: string = '';
  totalAmount: number = 0;
  totalDiscount: number = 0;
  amountDue: number = 0;
  planAmount: number = 0;
  balance: number = 0;
  isPaid: boolean = false;

  // ===== DEPRECATED - FOR COMPATIBILITY IF NEEDED =====
  billingItems: BillingItem[] = [];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Get contract ID from route parameters (contractId from funeral-contract-entry)
    this.route.paramMap.subscribe(params => {
      const contractId = params.get('contractId');
      if (contractId) {
        this.contractId = contractId;
        console.log('[BillingEntry] Received contractId from route:', this.contractId);
        this.loadContractBillingData(contractId);
      } else {
        // Fallback: Load first mock account for development
        console.log('[BillingEntry] No contractId in route, loading first mock account');
        this.loadFirstMockData();
      }
    });
  }

  /**
   * Load contract billing data based on contract ID
   * In production, this would call the API
   */
  private loadContractBillingData(contractId: string): void {
    console.log('[BillingEntry] Loading billing data for contractId:', contractId);
    
    // For now, try to find matching billing account in mock data
    // Contract ID from funeral-contract-entry might not directly match billing_account_id
    // So we load the first available billing account
    this.loadFirstMockData();
    
    // TODO: In production, call API:
    // this.billingService.getBillingAccount(contractId).subscribe(...)
  }

  /**
   * Load first mock billing account and associated transactions
   */
  private loadFirstMockData(): void {
    if (BILLING_ACCOUNTS_MOCK.length === 0) {
      console.error('[BillingEntry] No mock billing accounts available');
      return;
    }

    const account = BILLING_ACCOUNTS_MOCK[0];
    this.billingAccount = account;

    // Map header data
    this.contractNo = account.contract_no;
    this.startDate = account.start_date;
    this.deceased = account.deceased_name;
    this.contractee = `${account.contractee} / ${account.contractee_phone}`;
    this.contracteePhone = account.contractee_phone;
    this.address = account.address;
    this.serviceType = account.service_type;
    this.cremationType = account.cremation_type || '';
    this.casket = account.casket;
    this.casketDesc = account.casket_description;

    // Map document/age data
    this.age = account.age;
    this.discIdNo = account.disc_id_no || '';
    this.issuedAt = account.issued_at || '';
    this.issuedOn = account.issued_on || '';
    this.cityDocs = account.city_docs || '';
    this.submitted = account.submitted || '';
    this.barangay = account.barangay || '';
    this.chairman = account.chairman || '';
    this.financialAsst = account.financial_asst || '';
    this.dateSubmitted = account.date_submitted || '';
    this.receivedBy = account.received_by || '';

    // Map date fields
    this.dateDelivery = account.date_of_delivery || '';
    this.cremationDate = account.cremation_date || '';
    this.promissoryDate = account.promissory_date;
    this.dateBurial = account.date_of_burial || '';
    this.ashReleased = account.ash_released || '';
    this.releasedBy = account.released_by || '';

    // Map billing fields
    this.guarantor = account.guarantor;
    this.billingRemarks = account.billing_remarks;
    this.totalAmount = account.total_amount;
    this.totalDiscount = account.total_discount;
    this.amountDue = account.amount_due;
    this.planAmount = account.plan_amount;
    this.balance = account.balance;
    this.isPaid = account.is_paid;

    // Load transactions for this billing account
    this.loadBillingTransactions(account.billing_account_id);

    console.log('[BillingEntry] Loaded billing account:', account.contract_no);
  }

  /**
   * Load and display billing transactions for this account
   */
  private loadBillingTransactions(billingAccountId: number): void {
    // Filter transactions by billing_account_id
    const transactions = BILLING_TRANSACTIONS_MOCK.filter(
      (tx) => tx.billing_account_id === billingAccountId
    );

    // Convert transactions to BillingRow with isEditing flag
    this.rows = transactions.map((tx) => ({
      ...tx,
      isEditing: false
    }));

    console.log(`[BillingEntry] Loaded ${this.rows.length} transactions for account ${billingAccountId}`);
  }

  /** Add empty editable row */
  addRow(): void {
    const newRow: BillingRow = {
      billing_transaction_id: 0, // Will be assigned by backend
      billing_account_id: this.billingAccount?.billing_account_id || 0,
      transaction_no: '',
      item: '',
      amount: 0,
      discount: 0,
      cash: 0,
      check_amount: 0,
      official_receipt_amount: 0,
      acknowledgement_receipt: '',
      official_receipt_no: '',
      plan_amount: 0,
      dswd_amount: 0,
      gm_amount: 0,
      transaction_date: new Date().toISOString(),
      encoded_by: '',
      isEditing: true
    };
    this.rows.push(newRow);
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

  // ===== COMPUTED TOTALS =====
  get computedTotalAmount(): number {
    return this.rows.reduce((sum, row) => sum + (row.amount || 0), 0);
  }

  get computedTotalDiscount(): number {
    return this.rows.reduce((sum, row) => sum + (row.discount || 0), 0);
  }

  get computedAmountDue(): number {
    return this.computedTotalAmount - this.computedTotalDiscount;
  }

  get computedPlanAmount(): number {
    return this.rows.reduce((sum, row) => sum + (row.plan_amount || 0), 0);
  }

  get computedBalance(): number {
    return this.computedAmountDue - this.computedPlanAmount;
  }
}
