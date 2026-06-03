import { CommonModule, Location } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ExpensesService } from '../../services/expenses.service';
import { ExpenseRecord } from '../../models/expense.model';

interface PurchaseReportRow {
  expenseType: string;
  date: string;
  supplier: string;
  description: string;
  receiptType: string;
  cash: number;
  check: number;
}

interface PurchaseReportGroup {
  expenseType: string;
  rows: PurchaseReportRow[];
  cashTotal: number;
  checkTotal: number;
}

@Component({
  selector: 'app-expenses-yearly-report-print',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expenses-yearly-report-print.component.html',
  styleUrl: './expenses-yearly-report-print.component.scss',
})
export class ExpensesYearlyReportPrintComponent implements OnInit, OnDestroy {
  private readonly originalDocumentTitle = document.title;

  isReady = false;
  year = new Date().getFullYear();
  returnTo = '/accounting/expenses';
  groupedRows: PurchaseReportGroup[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private cdr: ChangeDetectorRef,
    private expensesService: ExpensesService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.year = Number(params.get('year')) || this.year;
      this.route.queryParamMap.subscribe((queryParams) => {
        this.returnTo = queryParams.get('returnTo') || '/accounting/expenses';
        this.loadRows();
      });
    });
  }

  ngOnDestroy(): void {
    document.title = this.originalDocumentTitle;
    window.onafterprint = null;
  }

  get reportLabel(): string {
    return String(this.year);
  }

  get rowCount(): number {
    return this.groupedRows.reduce((sum, group) => sum + group.rows.length, 0);
  }

  get totalCash(): number {
    return this.groupedRows.reduce((sum, group) => sum + group.cashTotal, 0);
  }

  get totalCheck(): number {
    return this.groupedRows.reduce((sum, group) => sum + group.checkTotal, 0);
  }

  get grandTotal(): number {
    return this.totalCash + this.totalCheck;
  }

  private loadRows(): void {
    const startDate = `${this.year}-01-01`;
    const endDate = `${this.year}-12-31`;
    this.isReady = false;

    this.expensesService.searchByEntryDate(startDate, endDate).subscribe({
      next: (records) => {
        const rows = records
          .map((record) => this.toRow(record))
          .sort((a, b) => a.expenseType.localeCompare(b.expenseType) || a.date.localeCompare(b.date) || a.description.localeCompare(b.description));

        this.groupedRows = this.toGroups(rows);
        this.finalizeAndPrint();
      },
      error: () => {
        this.groupedRows = [];
        this.finalizeAndPrint();
      },
    });
  }

  private finalizeAndPrint(): void {
    this.isReady = true;
    this.cdr.markForCheck();
    setTimeout(() => this.printDocument(), 500);
  }

  private printDocument(): void {
    const previousTitle = document.title || this.originalDocumentTitle;
    document.title = '';

    window.onafterprint = () => {
      document.title = previousTitle;
      window.onafterprint = null;

      if (this.returnTo) {
        this.router.navigateByUrl(this.returnTo);
        return;
      }

      this.location.back();
    };

    window.print();
  }

  private toRow(record: ExpenseRecord): PurchaseReportRow {
    const raw = record as Record<string, unknown>;
    const category = this.toStringValue(raw['expenseType']) || record.category || '-';
    const supplier = this.toStringValue(raw['supplier']) || this.toStringValue(raw['supplierName']) || '-';
    const receiptType = (this.toStringValue(raw['receiptType']) || '').toUpperCase();
    const amount = Number(record.amount) || 0;
    const cashAmount = this.toNumberValue(raw['cashAmount']);
    const checkAmount = this.toNumberValue(raw['checkAmount']);

    let cash = cashAmount;
    let check = checkAmount;

    if (!(cashAmount > 0 || checkAmount > 0)) {
      if (receiptType.includes('CHECK')) {
        check = amount;
      } else {
        cash = amount;
      }
    }

    return {
      expenseType: category,
      date: this.formatReadableDate(record.entryDate || record.receiptDate),
      supplier,
      description: record.particular || '-',
      receiptType: receiptType || (check > 0 ? 'CHECK' : 'CASH'),
      cash,
      check,
    };
  }

  private toGroups(rows: PurchaseReportRow[]): PurchaseReportGroup[] {
    const groups = new Map<string, PurchaseReportGroup>();

    rows.forEach((row) => {
      const key = row.expenseType || '-';
      const existing = groups.get(key);

      if (existing) {
        existing.rows.push(row);
        existing.cashTotal += row.cash;
        existing.checkTotal += row.check;
        return;
      }

      groups.set(key, {
        expenseType: key,
        rows: [row],
        cashTotal: row.cash,
        checkTotal: row.check,
      });
    });

    return Array.from(groups.values()).sort((a, b) => a.expenseType.localeCompare(b.expenseType));
  }

  private formatReadableDate(value?: string | null): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  }

  private toStringValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value).trim();
  }

  private toNumberValue(value: unknown): number {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : 0;
  }
}
