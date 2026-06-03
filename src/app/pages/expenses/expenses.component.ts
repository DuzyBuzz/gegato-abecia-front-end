import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { ExpensesService } from '../../services/expenses.service';
import { ExpenseCategory, ExpenseRecord } from '../../models/expense.model';
import { RoleAccess } from '../../utils/role-access.util';
import { ComboboxFirestoreService } from '../../services/combobox-firestore.service';
import { AutoCompleteFirestoreService } from '../../services/auto-complete-firestore.service';
import { TableHelperComponent } from '../../shared/components/table-helper/table-helper.component';
import { TableHelperColumn } from '../../shared/components/table-helper/table-helper-column.model';
import { ExpensesFormDialogComponent } from './expenses-form-dialog.component';
import { CategoryFormDialogComponent } from './category-form-dialog.component';

interface SupplierDraft {
  supplierIdNo: string;
  supplierNo: string;
  supplier: string;
  businessAddress: string;
  contactPerson: string;
  businessPhone: string;
  mobilePhone: string;
  tinNo: string;
  tinType: string;
  accountName: string;
  accountNo: string;
  email: string;
  notes: string;
}

interface CashExpenseLine {
  id?: number;
  uiKey: string;
  entryDate: string;
  receiptDate: string;
  fundSource: string;
  fundSourceId?: number | null;
  particular: string;
  mainCategory: string;
  mainCategoryId?: number | null;
  subCategory: string;
  subCategoryId?: number | null;
  taxType: string;
  taxTypeId?: number | null;
  receiptType: string;
  receiptTypeId?: number | null;
  receiptNo: string;
  cashAmount: number;
  checkAmount: number;
  remarks: string;
}

@Component({
  selector: 'app-expenses',
  imports: [
    CommonModule,
    FormsModule,
    ToastModule,
    CardModule,
    ButtonModule,
    DialogModule,
    ConfirmDialogModule,
    InputTextModule,
    InputNumberModule,
    TableHelperComponent,
    ExpensesFormDialogComponent,
    CategoryFormDialogComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss',
})
export class ExpensesComponent implements OnInit {
  categories: ExpenseCategory[] = [];
  rows: CashExpenseLine[] = [];
  supplierDraft: SupplierDraft = this.createSupplierDraft();

  fundSourceOptions: string[] = [];
  taxTypeOptions: string[] = [];
  receiptTypeOptions: string[] = [];
  supplierOptions: string[] = [];
  loading = false;
  categoriesLoading = false;
  savingTransaction = false;
  printDialogVisible = false;
  expenseDialogVisible = false;
  categoryDialogVisible = false;
  editingExpense: ExpenseRecord | null = null;
  editingCategory: ExpenseCategory | null = null;
  printMode: 'monthly' | 'yearly' = 'monthly';
  tableSearch = '';

  selectedPrintYear = new Date().getFullYear();
  selectedPrintMonth = new Date().getMonth() + 1;

  filterReceiptStart = '';
  filterReceiptEnd = '';
  filterEntryStart = '';
  filterEntryEnd = '';
  filterCategory = '';
  filterCategorySub = '';
  filterParticular = '';
  filterSubCategoryOptions: string[] = [];
  activeFilterChips: string[] = [];
  hasAdvancedFilters = false;

  categoryDraft = '';
  selectedCategoryForSubId: number | null = null;
  subCategoryDraft = '';
  canUpsertSubCategory = false;
  savingCategory = false;

  readonly ledgerGlobalFields = ['receiptDate', 'entryDate', 'category', 'categorySub', 'particular', 'fundSource', 'taxType', 'typeOfReceipt', 'receiptNo', 'remarks', 'amount'];
  readonly ledgerColumns: TableHelperColumn[] = [
    {
      field: 'receiptDate',
      header: 'Receipt Date',
      sortable: true,
      filterable: true,
      filterType: 'date',
      template: 'date',
      width: '10rem',
    },
    {
      field: 'entryDate',
      header: 'Entry Date',
      sortable: true,
      filterable: true,
      filterType: 'date',
      template: 'date',
      width: '10rem',
    },
    {
      field: 'category',
      header: 'Category',
      sortable: true,
      filterable: true,
      filterType: 'text',
      width: '11rem',
    },
    {
      field: 'categorySub',
      header: 'Sub Category',
      sortable: true,
      filterable: true,
      filterType: 'text',
      width: '12rem',
    },
    {
      field: 'particular',
      header: 'Particular',
      sortable: true,
      filterable: true,
      filterType: 'text',
      width: '16rem',
    },
    {
      field: 'fundSource',
      header: 'Fund Source',
      sortable: true,
      filterable: true,
      filterType: 'text',
      width: '10rem',
    },
    {
      field: 'taxType',
      header: 'Tax Type',
      sortable: true,
      filterable: true,
      filterType: 'text',
      width: '10rem',
    },
    {
      field: 'typeOfReceipt',
      header: 'Type of Receipt',
      sortable: true,
      filterable: true,
      filterType: 'text',
      width: '12rem',
    },
    {
      field: 'receiptNo',
      header: 'Receipt No.',
      sortable: true,
      filterable: true,
      filterType: 'text',
      width: '10rem',
    },
    {
      field: 'remarks',
      header: 'Notes',
      sortable: true,
      filterable: true,
      filterType: 'text',
      width: '14rem',
    },
    {
      field: 'amount',
      header: 'Amount',
      sortable: true,
      filterable: true,
      filterType: 'numeric',
      template: 'currency',
      currencyCode: 'PHP',
      width: '10rem',
    },
    {
      field: 'actions',
      header: 'Actions',
      template: 'actions',
      width: '12rem',
    },
  ];

  private supplierRawValue: unknown = null;
  private supplierInitialLabel = '';

  constructor(
    private expensesService: ExpensesService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private comboboxService: ComboboxFirestoreService,
    private autoCompleteService: AutoCompleteFirestoreService,
  ) {}

  ngOnInit(): void {
    this.syncFilterFlags();
    this.syncUpsertFlags();
    setTimeout(() => this.loadInitialData());
  }

  openNewExpenseDialog(): void {
    this.editingExpense = null;
    this.expenseDialogVisible = true;
  }

  openEditExpenseDialog(expense: ExpenseRecord): void {
    this.editingExpense = expense;
    this.expenseDialogVisible = true;
  }

  confirmDeleteExpense(expense: ExpenseRecord): void {
    if (!expense?.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Cannot delete an unsaved expense.',
      });
      return;
    }

    this.confirmationService.confirm({
      header: 'Delete Expense',
      message: `Delete expense "${expense.particular || 'this item'}"? This action cannot be undone.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      accept: () => this.deleteExpense(expense),
    });
  }

  deleteExpense(expense: ExpenseRecord): void {
    if (!expense.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Cannot delete expense without an ID.',
      });
      return;
    }

    this.expensesService.deleteExpense(expense.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Expense deleted successfully.',
        });
        this.loadExistingRows();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete expense.',
        });
      },
    });
  }

  onExpenseDialogSaved(): void {
    this.expenseDialogVisible = false;
    this.loadExistingRows();
  }

  onExpenseDialogCancelled(): void {
    this.expenseDialogVisible = false;
  }

  openNewCategoryDialog(): void {
    this.editingCategory = null;
    this.categoryDialogVisible = true;
  }

  openEditCategoryDialog(category: ExpenseCategory): void {
    this.editingCategory = category;
    this.categoryDialogVisible = true;
  }

  confirmDeleteCategory(category: ExpenseCategory): void {
    this.confirmationService.confirm({
      header: 'Delete Category',
      message: `Delete category "${category['category'] || category['label']}"? This will remove the category and its subcategories from the list.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      accept: () => this.deleteCategory(category),
    });
  }

  deleteCategory(category: ExpenseCategory): void {
    if (!category.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Cannot delete category without an ID.',
      });
      return;
    }

    this.expensesService.deleteCategory(category.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Category deleted successfully.',
        });
        this.loadCategories();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete category.',
        });
      },
    });
  }

  onCategoryDialogSaved(): void {
    this.categoryDialogVisible = false;
    this.editingCategory = null;
    this.loadCategories();
  }

  onCategoryDialogCancelled(): void {
    this.categoryDialogVisible = false;
    this.editingCategory = null;
  }

  get canViewExpenses(): boolean {
    return this.auth.hasRoleAccess([RoleAccess.Accounting, RoleAccess.Admin]);
  }

  get rowCount(): number {
    return this.rows.length;
  }

  get cashTotal(): number {
    return this.rows.reduce((sum, row) => sum + (Number(row.cashAmount) || 0), 0);
  }

  get checkTotal(): number {
    return this.rows.reduce((sum, row) => sum + (Number(row.checkAmount) || 0), 0);
  }

  get grandTotal(): number {
    return this.cashTotal + this.checkTotal;
  }

  get ledgerTableRows(): ExpenseRecord[] {
    const mapped = this.rows
      .filter((row) => this.hasLineContent(row))
      .map((row, index) => ({
        id: row.id ?? index + 1,
        receiptDate: row.receiptDate,
        entryDate: row.entryDate,
        category: row.mainCategory,
        categorySub: row.subCategory,
        particular: row.particular,
        fundSource: row.fundSource,
        taxType: row.taxType,
        typeOfReceipt: row.receiptType,
        receiptNo: row.receiptNo,
        remarks: row.remarks,
        amount: (Number(row.cashAmount) || 0) + (Number(row.checkAmount) || 0),
        uiKey: row.uiKey,
      }));

    const query = this.tableSearch.trim().toLowerCase();
    if (!query) {
      return mapped;
    }

    return mapped.filter((item) => {
      const searchText = [
        item.receiptDate,
        item.entryDate,
        item.category,
        item.categorySub,
        item.particular,
        item.fundSource,
        item.taxType,
        item.typeOfReceipt,
        item.receiptNo,
        item.remarks,
        item.amount,
      ]
        .map((value) => String(value ?? '').toLowerCase())
        .join(' ');

      return searchText.includes(query);
    });
  }

  trackByUiKey(_index: number, row: CashExpenseLine): string {
    return row.uiKey;
  }

  onFilterInputChange(): void {
    this.syncFilterFlags();
    this.syncActiveFilterChips();
  }

  loadInitialData(): void {
    this.loadCategories();
    void this.loadReferenceLookups();
    this.loadExistingRows();
  }

  loadExistingRows(): void {
    this.loading = true;

    this.expensesService.getExpenses(1, 500).subscribe({
      next: (expenses) => {
        setTimeout(() => {
          this.rows = expenses.map((item) => this.mapRecordToLine(item));
          if (this.rows.length === 0) {
            this.rows = [this.createLineDraft()];
          }

          const latestSupplier = expenses.find((item) => this.toStringValue(item['supplier']));
          if (latestSupplier) {
            this.supplierRawValue = latestSupplier['supplier'];
            this.supplierDraft.supplier = this.resolveSupplierLabel(latestSupplier['supplier']);
            this.supplierInitialLabel = this.supplierDraft.supplier;
            this.supplierDraft.supplierNo = this.toStringValue(latestSupplier['supplierNo']);
            this.supplierDraft.supplierIdNo = this.toStringValue(latestSupplier['supplierIdNo']);
          }

          this.applyReadableValuesToRows();
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.rows = [this.createLineDraft()];
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Unable to load existing cash expenses.',
        });
      },
    });
  }

  loadCategories(): void {
    this.categoriesLoading = true;

    this.expensesService.getCategories().subscribe({
      next: (categories) => {
        setTimeout(() => {
          this.categories = categories;
          this.filterSubCategoryOptions = this.filterCategory ? this.getSubCategoryOptions(this.filterCategory) : [];
          this.syncUpsertFlags();
          this.categoriesLoading = false;
          this.applyReadableValuesToRows();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.categoriesLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Unable to load expense categories.',
        });
      },
    });
  }

  addRow(): void {
    this.rows = [...this.rows, this.createLineDraft()];
  }

  confirmRemoveRow(index: number): void {
    const row = this.rows[index];
    if (!row) {
      return;
    }

    this.confirmationService.confirm({
      header: 'Remove Line Item',
      message: 'Do you want to remove this expense line item?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Remove',
      rejectLabel: 'Cancel',
      accept: () => this.removeRow(index),
    });
  }

  removeRow(index: number): void {
    this.rows = this.rows.filter((_, rowIndex) => rowIndex !== index);
    if (this.rows.length === 0) {
      this.rows = [this.createLineDraft()];
    }
  }

  onMainCategoryChange(row: CashExpenseLine): void {
    row.mainCategoryId = null;
    row.subCategoryId = null;

    const availableSubCategories = this.getSubCategoryOptions(row.mainCategory);
    if (availableSubCategories.length === 0) {
      row.subCategory = '';
      return;
    }

    if (!availableSubCategories.includes(row.subCategory)) {
      row.subCategory = availableSubCategories[0];
    }
  }

  onSubCategoryChange(row: CashExpenseLine): void {
    row.subCategoryId = null;
  }

  onFundSourceChange(row: CashExpenseLine): void {
    row.fundSourceId = null;
  }

  onTaxTypeChange(row: CashExpenseLine): void {
    row.taxTypeId = null;
  }

  onReceiptTypeChange(row: CashExpenseLine): void {
    row.receiptTypeId = null;
  }

  onSupplierChange(value: string): void {
    if ((value || '').trim() !== (this.supplierInitialLabel || '').trim()) {
      this.supplierRawValue = null;
    }
  }

  onTableSearch(value: string): void {
    this.tableSearch = value || '';
  }

  onFilterCategoryChange(): void {
    this.filterSubCategoryOptions = this.filterCategory ? this.getSubCategoryOptions(this.filterCategory) : [];

    if (!this.filterCategory) {
      this.filterCategorySub = '';
      this.syncFilterFlags();
      this.syncActiveFilterChips();
      return;
    }

    if (!this.filterSubCategoryOptions.includes(this.filterCategorySub)) {
      this.filterCategorySub = '';
    }

    this.syncFilterFlags();
    this.syncActiveFilterChips();
  }

  onCategoryUpsertInputChange(): void {
    this.syncUpsertFlags();
  }

  applyAdvancedFilters(): void {
    const validationError = this.validateAdvancedFilterInput();
    if (validationError) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: validationError,
      });
      return;
    }

    if (!this.hasAdvancedFilters) {
      this.loadExistingRows();
      return;
    }

    this.loading = true;
    void this.searchByAdvancedFilters();
  }

  clearAdvancedFilters(): void {
    this.filterReceiptStart = '';
    this.filterReceiptEnd = '';
    this.filterEntryStart = '';
    this.filterEntryEnd = '';
    this.filterCategory = '';
    this.filterCategorySub = '';
    this.filterParticular = '';
    this.filterSubCategoryOptions = [];
    this.syncFilterFlags();
    this.syncActiveFilterChips();
    this.loadExistingRows();
  }

  onTableEdit(expense: ExpenseRecord): void {
    const index = this.getRowIndexFromTableRecord(expense);
    if (index < 0) {
      return;
    }

    const selected = this.rows[index];
    this.rows = [selected, ...this.rows.filter((_, i) => i !== index)];
    this.messageService.add({
      severity: 'info',
      summary: 'Edit Row',
      detail: 'Selected row moved to top for editing.',
    });
  }

  onTableDelete(expense: ExpenseRecord): void {
    const index = this.getRowIndexFromTableRecord(expense);
    if (index < 0) {
      return;
    }

    this.confirmRemoveRow(index);
  }

  getSubCategoryOptions(mainCategory: string): string[] {
    const matched = this.categories.find((item) => (item.category || '').toLowerCase() === (mainCategory || '').toLowerCase());
    if (!matched || !matched.subCategories) {
      return [];
    }

    return matched.subCategories
      .map((item) => item.categorySub || '')
      .map((item) => item.trim())
      .filter((item) => !!item);
  }

  saveAndNew(): void {
    this.confirmUpsertExpenses({ resetAfterSave: true, closeAfterSave: false });
  }

  saveAndClose(): void {
    this.confirmUpsertExpenses({ resetAfterSave: false, closeAfterSave: true });
  }

  confirmUpsertCategory(): void {
    const label = this.categoryDraft.trim();
    if (!label) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Category name is required.',
      });
      return;
    }

    this.confirmationService.confirm({
      header: 'Confirm Category Upsert',
      message: `Create or update category "${label}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Upsert Category',
      rejectLabel: 'Cancel',
      accept: () => this.upsertCategory(label),
    });
  }

  confirmUpsertSubCategory(): void {
    if (!this.canUpsertSubCategory) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Select a category and enter subcategory name.',
      });
      return;
    }

    const targetCategory = this.categories.find((item) => item.id === this.selectedCategoryForSubId);
    const targetCategoryLabel = targetCategory?.category || 'Selected Category';
    const subCategoryLabel = this.subCategoryDraft.trim();

    this.confirmationService.confirm({
      header: 'Confirm Subcategory Upsert',
      message: `Add or update subcategory "${subCategoryLabel}" under "${targetCategoryLabel}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Upsert Subcategory',
      rejectLabel: 'Cancel',
      accept: () => this.upsertSubCategory(subCategoryLabel),
    });
  }

  goBackToMain(): void {
    this.router.navigateByUrl(`${this.auth.getOperationsBaseRoute()}/deceased`);
  }

  setPettyCashToday(): void {
    this.applyFundSourceToRows('PETTY CASH TODAY');
  }

  setPettyCashYesterday(): void {
    this.applyFundSourceToRows('PETTY CASH YESTERDAY');
  }

  setCheckExpense(): void {
    this.rows.forEach((row) => {
      row.receiptType = 'CHECK';
      row.receiptTypeId = null;

      if (!row.checkAmount && row.cashAmount) {
        row.checkAmount = row.cashAmount;
        row.cashAmount = 0;
      }
    });
  }

  inputPettyCash(): void {
    const row = this.createLineDraft();
    row.fundSource = 'PETTY CASH';
    this.rows = [...this.rows, row];
  }

  markExpensesEditable(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Edit Mode',
      detail: 'All rows are editable directly in the cash expenses table.',
    });
  }

  openMonthlyPrintDialog(): void {
    this.printMode = 'monthly';
    this.selectedPrintYear = new Date().getFullYear();
    this.selectedPrintMonth = new Date().getMonth() + 1;
    this.printDialogVisible = true;
  }

  openYearlyPrintDialog(): void {
    this.printMode = 'yearly';
    this.selectedPrintYear = new Date().getFullYear();
    this.printDialogVisible = true;
  }

  printExpensesReport(): void {
    const year = Number(this.selectedPrintYear);
    if (!Number.isInteger(year) || year < 1900) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please enter a valid year.',
      });
      return;
    }

    const returnTo = `${this.auth.getOperationsBaseRoute()}/expenses`;

    if (this.printMode === 'monthly') {
      const month = Number(this.selectedPrintMonth);
      if (!Number.isInteger(month) || month < 1 || month > 12) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Validation',
          detail: 'Please enter a valid month.',
        });
        return;
      }

      this.router.navigate(['/print/expenses-monthly', year, month], {
        queryParams: { returnTo },
      });
      this.printDialogVisible = false;
      return;
    }

    this.router.navigate(['/print/expenses-yearly', year], {
      queryParams: { returnTo },
    });
    this.printDialogVisible = false;
  }

  private async searchByAdvancedFilters(): Promise<void> {
    try {
      const expenseSets: ExpenseRecord[][] = [];

      const receiptRange = this.resolveDateRange(this.filterReceiptStart, this.filterReceiptEnd);
      if (receiptRange) {
        expenseSets.push(await firstValueFrom(
          this.expensesService.searchByReceiptDate(receiptRange.start, receiptRange.end),
        ));
      }

      const entryRange = this.resolveDateRange(this.filterEntryStart, this.filterEntryEnd);
      if (entryRange) {
        expenseSets.push(await firstValueFrom(
          this.expensesService.searchByEntryDate(entryRange.start, entryRange.end),
        ));
      }

      if (this.filterCategory) {
        expenseSets.push(await firstValueFrom(this.expensesService.searchByCategory(this.filterCategory)));
      }

      if (this.filterCategorySub) {
        expenseSets.push(await firstValueFrom(this.expensesService.searchByCategorySub(this.filterCategorySub)));
      }

      if (this.filterParticular.trim()) {
        expenseSets.push(await firstValueFrom(this.expensesService.searchByParticular(this.filterParticular.trim())));
      }

      const filteredExpenses = this.intersectExpenseSets(expenseSets);
      this.rows = filteredExpenses.map((item) => this.mapRecordToLine(item));

      if (this.rows.length === 0) {
        this.rows = [this.createLineDraft()];
      }

      this.applyReadableValuesToRows();
      this.applyReadableSupplierValue();

      this.messageService.add({
        severity: 'success',
        summary: 'Filters Applied',
        detail: `${filteredExpenses.length} matching expense record${filteredExpenses.length === 1 ? '' : 's'} found.`,
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to apply advanced filters at the moment.',
      });
    } finally {
      this.loading = false;
    }
  }

  private saveTransaction(options: { resetAfterSave: boolean; closeAfterSave: boolean }): void {
    const validationError = this.validateTransaction();
    if (validationError) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: validationError,
      });
      return;
    }

    this.savingTransaction = true;
    const payload = this.buildExpensePayload();

    this.expensesService.saveExpenses(payload).subscribe({
      next: () => {
        this.savingTransaction = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Cash expenses saved successfully.',
        });

        if (options.resetAfterSave) {
          this.resetTransactionDraft();
        } else {
          this.loadExistingRows();
        }

        if (options.closeAfterSave) {
          this.goBackToMain();
        }
      },
      error: () => {
        this.savingTransaction = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save cash expenses.',
        });
      },
    });
  }

  private confirmUpsertExpenses(options: { resetAfterSave: boolean; closeAfterSave: boolean }): void {
    const lineCount = this.rows.filter((row) => this.hasLineContent(row)).length;

    this.confirmationService.confirm({
      header: 'Confirm Expense Upsert',
      message: `Proceed to upsert ${lineCount} expense line${lineCount === 1 ? '' : 's'}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Upsert Expenses',
      rejectLabel: 'Cancel',
      accept: () => this.saveTransaction(options),
    });
  }

  private upsertCategory(label: string): void {
    const existing = this.categories.find((item) => (item.category || '').toLowerCase() === label.toLowerCase());
    const payload: ExpenseCategory = {
      id: existing?.id ?? 0,
      category: label,
      label,
      subCategories: existing?.subCategories || [],
    };

    this.savingCategory = true;
    this.expensesService.saveCategories([payload]).subscribe({
      next: (categories) => {
        this.categories = categories;
        this.filterSubCategoryOptions = this.filterCategory ? this.getSubCategoryOptions(this.filterCategory) : [];
        this.categoryDraft = '';
        this.syncUpsertFlags();
        this.savingCategory = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Category upsert successful.',
        });
      },
      error: () => {
        this.savingCategory = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to upsert category.',
        });
      },
    });
  }

  private upsertSubCategory(label: string): void {
    const targetCategory = this.categories.find((item) => item.id === this.selectedCategoryForSubId);
    if (!targetCategory || !targetCategory.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Selected category is invalid.',
      });
      return;
    }

    const existingSubCategories = targetCategory.subCategories || [];
    const existing = existingSubCategories.find((item) => (item.categorySub || '').toLowerCase() === label.toLowerCase());

    const updatedSubCategories = existing
      ? existingSubCategories
      : [
          ...existingSubCategories,
          {
            id: 0,
            categorySub: label,
            label,
            category: targetCategory.id,
          },
        ];

    const payload: ExpenseCategory = {
      id: targetCategory.id,
      category: targetCategory.category,
      label: targetCategory['label'] || targetCategory.category,
      subCategories: updatedSubCategories,
    };

    this.savingCategory = true;
    this.expensesService.saveCategories([payload]).subscribe({
      next: (categories) => {
        this.categories = categories;
        this.filterSubCategoryOptions = this.filterCategory ? this.getSubCategoryOptions(this.filterCategory) : [];
        this.subCategoryDraft = '';
        this.syncUpsertFlags();
        this.savingCategory = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Subcategory upsert successful.',
        });
      },
      error: () => {
        this.savingCategory = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to upsert subcategory.',
        });
      },
    });
  }

  private buildExpensePayload(): unknown[] {
    return this.rows
      .filter((row) => this.hasLineContent(row))
      .map((row) => ({
        id: row.id ?? 0,
        dateOfReceipt: row.receiptDate,
        dateOfEntry: row.entryDate,
        category: this.toLookupPayloadValue(row.mainCategoryId, row.mainCategory),
        categorySub: this.toLookupPayloadValue(row.subCategoryId, row.subCategory),
        particular: row.particular.trim(),
        amount: (Number(row.cashAmount) || 0) + (Number(row.checkAmount) || 0),
        fundSource: this.toLookupPayloadValue(row.fundSourceId, row.fundSource),
        taxType: this.toLookupPayloadValue(row.taxTypeId, row.taxType),
        typeOfReceipt: this.toLookupPayloadValue(row.receiptTypeId, row.receiptType),
        receiptNo: row.receiptNo,
        cashAmount: Number(row.cashAmount) || 0,
        checkAmount: Number(row.checkAmount) || 0,
        remarks: row.remarks,
        supplier: this.toLookupPayloadValue(this.parseLookupId(this.supplierRawValue), this.supplierDraft.supplier),
        supplierNo: this.supplierDraft.supplierNo,
        supplierIdNo: this.supplierDraft.supplierIdNo,
        tinNo: this.supplierDraft.tinNo,
        tinType: this.supplierDraft.tinType,
        accountName: this.supplierDraft.accountName,
        accountNo: this.supplierDraft.accountNo,
        businessAddress: this.supplierDraft.businessAddress,
        contactPerson: this.supplierDraft.contactPerson,
        businessPhone: this.supplierDraft.businessPhone,
        mobilePhone: this.supplierDraft.mobilePhone,
        email: this.supplierDraft.email,
        notes: this.supplierDraft.notes,
      }));
  }

  private intersectExpenseSets(expenseSets: ExpenseRecord[][]): ExpenseRecord[] {
    if (!expenseSets.length) {
      return [];
    }

    let result = expenseSets[0];

    for (let index = 1; index < expenseSets.length; index += 1) {
      const lookup = new Set(expenseSets[index].map((item) => this.toExpenseMatchKey(item)));
      result = result.filter((item) => lookup.has(this.toExpenseMatchKey(item)));
    }

    return result;
  }

  private toExpenseMatchKey(expense: ExpenseRecord): string {
    if (typeof expense.id === 'number') {
      return `id:${expense.id}`;
    }

    const category = this.toStringValue(expense.category).toLowerCase();
    const subCategory = this.toStringValue(expense.categorySub).toLowerCase();
    const particular = this.toStringValue(expense.particular).toLowerCase();
    const entryDate = this.toStringValue(expense.entryDate);
    const receiptDate = this.toStringValue(expense.receiptDate);
    const amount = this.toNumberValue(expense.amount);

    return `${entryDate}|${receiptDate}|${category}|${subCategory}|${particular}|${amount}`;
  }

  private validateAdvancedFilterInput(): string | null {
    const dateError = this.validateDateRangeInput('Receipt date', this.filterReceiptStart, this.filterReceiptEnd)
      || this.validateDateRangeInput('Entry date', this.filterEntryStart, this.filterEntryEnd);
    if (dateError) {
      return dateError;
    }

    if (this.filterCategorySub && !this.filterCategory) {
      return 'Choose a category before selecting subcategory.';
    }

    return null;
  }

  private validateDateRangeInput(label: string, startDate: string, endDate: string): string | null {
    if (!startDate && !endDate) {
      return null;
    }

    const firstDate = startDate || endDate;
    const secondDate = endDate || startDate;

    if (!this.isValidIsoDate(firstDate) || !this.isValidIsoDate(secondDate)) {
      return `${label} must use YYYY-mm-dd format.`;
    }

    if (firstDate > secondDate) {
      return `${label} start date must be earlier than or equal to end date.`;
    }

    return null;
  }

  private resolveDateRange(startDate: string, endDate: string): { start: string; end: string } | null {
    if (!startDate && !endDate) {
      return null;
    }

    return {
      start: startDate || endDate,
      end: endDate || startDate,
    };
  }

  private syncActiveFilterChips(): void {
    const chips: string[] = [];

    const receiptRange = this.resolveDateRange(this.filterReceiptStart, this.filterReceiptEnd);
    if (receiptRange) {
      chips.push(`Receipt: ${receiptRange.start} to ${receiptRange.end}`);
    }

    const entryRange = this.resolveDateRange(this.filterEntryStart, this.filterEntryEnd);
    if (entryRange) {
      chips.push(`Entry: ${entryRange.start} to ${entryRange.end}`);
    }

    if (this.filterCategory) {
      chips.push(`Category: ${this.filterCategory}`);
    }

    if (this.filterCategorySub) {
      chips.push(`Subcategory: ${this.filterCategorySub}`);
    }

    if (this.filterParticular.trim()) {
      chips.push(`Particular: ${this.filterParticular.trim()}`);
    }

    this.activeFilterChips = chips;
  }

  private syncFilterFlags(): void {
    this.hasAdvancedFilters = !!(
      this.filterReceiptStart ||
      this.filterReceiptEnd ||
      this.filterEntryStart ||
      this.filterEntryEnd ||
      this.filterCategory ||
      this.filterCategorySub ||
      this.filterParticular.trim()
    );
  }

  private syncUpsertFlags(): void {
    this.canUpsertSubCategory = this.selectedCategoryForSubId !== null && !!this.subCategoryDraft.trim();
  }

  private isValidIsoDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const [yearText, monthText, dayText] = value.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const parsed = new Date(Date.UTC(year, month - 1, day));

    return parsed.getUTCFullYear() === year && (parsed.getUTCMonth() + 1) === month && parsed.getUTCDate() === day;
  }

  private validateTransaction(): string | null {
    if (!this.supplierDraft.supplier.trim()) {
      return 'Supplier is required.';
    }

    const activeRows = this.rows.filter((row) => this.hasLineContent(row));
    if (activeRows.length === 0) {
      return 'Add at least one expense line item.';
    }

    const invalidRow = activeRows.find((row) => !row.entryDate || !row.particular.trim());
    if (invalidRow) {
      return 'Each used line item requires date of entry and particular.';
    }

    return null;
  }

  private hasLineContent(row: CashExpenseLine): boolean {
    return !!(
      row.particular.trim() ||
      row.mainCategory.trim() ||
      row.subCategory.trim() ||
      row.fundSource.trim() ||
      row.receiptNo.trim() ||
      Number(row.cashAmount) ||
      Number(row.checkAmount)
    );
  }

  private resetTransactionDraft(): void {
    this.supplierDraft = this.createSupplierDraft();
    this.supplierRawValue = null;
    this.supplierInitialLabel = '';
    this.rows = [this.createLineDraft()];
  }

  private applyFundSourceToRows(fundSource: string): void {
    this.rows.forEach((row) => {
      row.fundSource = fundSource;
      row.fundSourceId = null;
    });
  }

  private mapRecordToLine(record: ExpenseRecord): CashExpenseLine {
    const raw = record as Record<string, unknown>;
    const amount = Number(record.amount) || 0;
    const cashAmount = this.toNumberValue(raw['cashAmount']);
    const checkAmount = this.toNumberValue(raw['checkAmount']);

    const entryDateRaw = raw['entryDate'] ?? raw['dateOfEntry'];
    const receiptDateRaw = raw['receiptDate'] ?? raw['dateOfReceipt'];

    const mainCategoryRaw = raw['category'] ?? record.category;
    const subCategoryRaw = raw['categorySub'] ?? record.categorySub;
    const fundSourceRaw = raw['fundSource'];
    const taxTypeRaw = raw['taxType'];
    const receiptTypeRaw = raw['receiptType'] ?? raw['typeOfReceipt'];

    const mainCategoryId = this.parseLookupId(mainCategoryRaw);
    const subCategoryId = this.parseLookupId(subCategoryRaw);
    const fundSourceId = this.parseLookupId(fundSourceRaw);
    const taxTypeId = this.parseLookupId(taxTypeRaw);
    const receiptTypeId = this.parseLookupId(receiptTypeRaw);

    return {
      id: record.id,
      uiKey: this.createUiKey(),
      entryDate: this.toDateStringValue(entryDateRaw),
      receiptDate: this.toDateStringValue(receiptDateRaw || entryDateRaw),
      fundSource: this.resolveLookupLabel(fundSourceRaw, this.fundSourceOptions),
      fundSourceId,
      particular: this.toStringValue(raw['particular'] ?? record.particular),
      mainCategory: this.resolveCategoryLabel(mainCategoryRaw),
      mainCategoryId,
      subCategory: this.resolveSubCategoryLabel(subCategoryRaw),
      subCategoryId,
      taxType: this.resolveLookupLabel(taxTypeRaw, this.taxTypeOptions),
      taxTypeId,
      receiptType: this.resolveLookupLabel(receiptTypeRaw, this.receiptTypeOptions),
      receiptTypeId,
      receiptNo: this.toStringValue(raw['receiptNo']),
      cashAmount: cashAmount > 0 || checkAmount > 0 ? cashAmount : amount,
      checkAmount: cashAmount > 0 || checkAmount > 0 ? checkAmount : 0,
      remarks: this.toStringValue(raw['remarks']),
    };
  }

  private createLineDraft(): CashExpenseLine {
    const today = this.toDateInputValue(new Date());
    return {
      uiKey: this.createUiKey(),
      entryDate: today,
      receiptDate: today,
      fundSource: '',
      fundSourceId: null,
      particular: '',
      mainCategory: '',
      mainCategoryId: null,
      subCategory: '',
      subCategoryId: null,
      taxType: '',
      taxTypeId: null,
      receiptType: '',
      receiptTypeId: null,
      receiptNo: '',
      cashAmount: 0,
      checkAmount: 0,
      remarks: '',
    };
  }

  private createSupplierDraft(): SupplierDraft {
    return {
      supplierIdNo: '',
      supplierNo: '',
      supplier: '',
      businessAddress: '',
      contactPerson: '',
      businessPhone: '',
      mobilePhone: '',
      tinNo: '',
      tinType: '',
      accountName: '',
      accountNo: '',
      email: '',
      notes: '',
    };
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private createUiKey(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private async loadReferenceLookups(): Promise<void> {
    try {
      const [fundSourceData, taxTypeData, receiptTypeData, supplierData] = await Promise.all([
        this.comboboxService.getCombobox('expenseFundSource').catch(() => ({ items: [], default: '' })),
        this.comboboxService.getCombobox('expenseTaxType').catch(() => ({ items: [], default: '' })),
        this.comboboxService.getCombobox('expenseReceiptType').catch(() => ({ items: [], default: '' })),
        this.autoCompleteService.getList('supplier').catch(() => ({ items: [] })),
      ]);

      this.fundSourceOptions = fundSourceData.items || [];
      this.taxTypeOptions = taxTypeData.items || [];
      this.receiptTypeOptions = receiptTypeData.items || [];
      this.supplierOptions = supplierData.items || [];

      this.applyReadableValuesToRows();
      this.applyReadableSupplierValue();
    } catch {
      this.fundSourceOptions = [];
      this.taxTypeOptions = [];
      this.receiptTypeOptions = [];
      this.supplierOptions = [];
    }
  }

  private applyReadableValuesToRows(): void {
    if (!this.rows.length) {
      return;
    }

    this.rows = this.rows.map((row) => ({
      ...row,
      mainCategory: row.mainCategoryId !== null && row.mainCategoryId !== undefined
        ? this.resolveCategoryLabel(row.mainCategoryId)
        : row.mainCategory,
      subCategory: row.subCategoryId !== null && row.subCategoryId !== undefined
        ? this.resolveSubCategoryLabel(row.subCategoryId)
        : row.subCategory,
      fundSource: row.fundSourceId !== null && row.fundSourceId !== undefined
        ? this.resolveLookupLabel(row.fundSourceId, this.fundSourceOptions)
        : row.fundSource,
      taxType: row.taxTypeId !== null && row.taxTypeId !== undefined
        ? this.resolveLookupLabel(row.taxTypeId, this.taxTypeOptions)
        : row.taxType,
      receiptType: row.receiptTypeId !== null && row.receiptTypeId !== undefined
        ? this.resolveLookupLabel(row.receiptTypeId, this.receiptTypeOptions)
        : row.receiptType,
    }));
  }

  private applyReadableSupplierValue(): void {
    if (this.supplierRawValue === null || this.supplierRawValue === undefined || this.supplierRawValue === '') {
      return;
    }

    this.supplierDraft.supplier = this.resolveSupplierLabel(this.supplierRawValue);
    this.supplierInitialLabel = this.supplierDraft.supplier;
  }

  private resolveCategoryLabel(value: unknown): string {
    const id = this.parseLookupId(value);
    if (id === null) {
      return this.toStringValue(value);
    }

    const found = this.categories.find((item) => this.parseLookupId(item.id) === id);
    if (found?.category) {
      return found.category;
    }

    return this.buildUnknownValueLabel(id);
  }

  private resolveSubCategoryLabel(value: unknown): string {
    const id = this.parseLookupId(value);
    if (id === null) {
      return this.toStringValue(value);
    }

    for (const category of this.categories) {
      const found = (category.subCategories || []).find((item) => this.parseLookupId(item.id) === id);
      if (found?.categorySub) {
        return found.categorySub;
      }
    }

    return this.buildUnknownValueLabel(id);
  }

  private resolveLookupLabel(value: unknown, options: string[]): string {
    const id = this.parseLookupId(value);
    if (id === null) {
      return this.toStringValue(value);
    }

    const resolved = this.resolveByIndexedOptions(id, options);
    if (resolved) {
      return resolved;
    }

    return this.buildUnknownValueLabel(id);
  }

  private resolveSupplierLabel(value: unknown): string {
    const id = this.parseLookupId(value);
    if (id === null) {
      return this.toStringValue(value);
    }

    const resolved = this.resolveByIndexedOptions(id, this.supplierOptions);
    if (resolved) {
      return resolved;
    }

    return this.buildUnknownValueLabel(id);
  }

  private resolveByIndexedOptions(id: number, options: string[]): string {
    if (!options.length) {
      return '';
    }

    if (id === 0 && options[0]) {
      return options[0];
    }

    if (id > 0 && id < options.length && options[id]) {
      return options[id];
    }

    if (id > 0 && id <= options.length && options[id - 1]) {
      return options[id - 1];
    }

    return '';
  }

  private parseLookupId(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value === 'number' && Number.isInteger(value)) {
      return value;
    }

    const text = String(value).trim();
    if (!/^\d+$/.test(text)) {
      return null;
    }

    const parsed = Number(text);
    return Number.isInteger(parsed) ? parsed : null;
  }

  private buildUnknownValueLabel(id: number): string {
    return `Unknown (ID: ${id})`;
  }

  private toLookupPayloadValue(id: number | null | undefined, displayValue: string): unknown {
    if (id !== null && id !== undefined) {
      return id;
    }

    return (displayValue || '').trim();
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

  private toDateStringValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    if (typeof value === 'string') {
      return value.slice(0, 10);
    }

    const numberValue = Number(value);
    if (!Number.isFinite(numberValue) || numberValue <= 0) {
      return String(value);
    }

    return new Date(numberValue).toISOString().slice(0, 10);
  }

  private getRowIndexFromTableRecord(expense: ExpenseRecord): number {
    const uiKey = this.toStringValue(expense['uiKey']);
    if (uiKey) {
      const byUiKey = this.rows.findIndex((row) => row.uiKey === uiKey);
      if (byUiKey >= 0) {
        return byUiKey;
      }
    }

    if (typeof expense.id === 'number') {
      return this.rows.findIndex((row) => row.id === expense.id);
    }

    return this.rows.findIndex((row) => (
      row.entryDate === this.toStringValue(expense.entryDate) &&
      row.particular === this.toStringValue(expense.particular)
    ));
  }
}
