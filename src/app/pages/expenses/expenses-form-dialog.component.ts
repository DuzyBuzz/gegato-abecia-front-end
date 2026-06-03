import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { ExpensesService } from '../../services/expenses.service';
import { ExpenseCategory, ExpenseCategorySub, ExpenseRecord } from '../../models/expense.model';
import { SelectHelperComponent } from '../../shared/components/select-helper/select-helper.component';
@Component({
  selector: 'app-expenses-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, SelectModule, InputTextModule, InputNumberModule, ButtonModule, SelectHelperComponent],
  templateUrl: './expenses-form-dialog.component.html',
  styleUrls: ['./expenses-form-dialog.component.scss'],
})
export class ExpensesFormDialogComponent implements OnChanges {
  @Input() visible = false;
  @Input() expense: ExpenseRecord | null = null;
  @Input() categories: ExpenseCategory[] = [];
  @Input() fundSourceOptions: string[] = [];
  @Input() taxTypeOptions: string[] = [];
  @Input() receiptTypeOptions: string[] = [];
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  model: ExpenseRecord = this.createEmpty();
  availableSubCategories: string[] = [];
  saving = false;

  constructor(private expensesService: ExpensesService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['expense']) {
      this.model = this.expense ? { ...this.expense } : this.createEmpty();
      if (!this.model.entryDate) {
        this.model.entryDate = this.todayValue();
      }
      if (!this.model.receiptDate) {
        this.model.receiptDate = this.model.entryDate;
      }
    }

    if (changes['expense'] || changes['categories']) {
      this.availableSubCategories = this.getSubCategoryOptions(this.model.category || '');
    }
  }

  onCategorySelectionChange(): void {
    this.availableSubCategories = this.getSubCategoryOptions(this.model.category || '');
    if (!this.availableSubCategories.includes(this.model.categorySub || '')) {
      this.model.categorySub = '';
    }
  }

  getSubCategoryOptions(category: string): string[] {
    const matched = this.categories.find(
      (item) => (item.category || '').toLowerCase() === (category || '').toLowerCase(),
    );

    const subItems = matched?.subCategories as ExpenseCategorySub[] | undefined;
    if (!subItems || !subItems.length) {
      return [];
    }

    return subItems
      .map((item) => this.toStringValue(item.categorySub || item['label']))
      .filter((item): item is string => !!item);
  }

  createEmpty(): ExpenseRecord {
    const today = this.todayValue();
    return {
      id: 0,
      receiptDate: today,
      entryDate: today,
      category: '',
      categorySub: '',
      fundSource: '',
      taxType: '',
      typeOfReceipt: '',
      receiptNo: '',
      particular: '',
      amount: 0,
      remarks: '',
      notes: '',
    };
  }

  private todayValue(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private toStringValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value).trim();
  }

  private resolveLookupId(label: unknown, options: string[]): number {
    const text = this.toStringValue(label);
    if (!text) {
      return 0;
    }

    const index = options.findIndex((item) => item.toLowerCase() === text.toLowerCase());
    return index >= 0 ? index + 1 : 0;
  }

  private resolveCategoryId(categoryLabel: unknown): number {
    const label = this.toStringValue(categoryLabel);
    if (!label) {
      return 0;
    }

    const matched = this.categories.find((item) => this.toStringValue(item['category'] || item['label']).toLowerCase() === label.toLowerCase());
    return Number(matched?.id ?? 0);
  }

  private resolveSubCategoryId(categoryLabel: unknown, subCategoryLabel: unknown): number {
    const categoryId = this.resolveCategoryId(categoryLabel);
    const label = this.toStringValue(subCategoryLabel);
    if (!categoryId || !label) {
      return 0;
    }

    const matchedCategory = this.categories.find((item) => Number(item.id) === categoryId);
    const matchedSubCategory = (matchedCategory?.subCategories || []).find(
      (item) => this.toStringValue(item['categorySub'] || item['label']).toLowerCase() === label.toLowerCase(),
    );

    return Number(matchedSubCategory?.id ?? 0);
  }

  save(): void {
    this.saving = true;

    const entryDate = this.toStringValue(this.model.entryDate) || this.todayValue();
    const receiptDate = this.toStringValue(this.model.receiptDate) || entryDate;

    const payload = {
      ...this.model,
      id: Number(this.model.id ?? 0),
      entryDate,
      receiptDate,
      amount: Number(this.model.amount ?? 0),
      category: this.resolveCategoryId(this.model.category),
      categorySub: this.resolveSubCategoryId(this.model.category, this.model.categorySub),
      fundSource: this.resolveLookupId(this.model.fundSource, this.fundSourceOptions),
      taxType: this.resolveLookupId(this.model.taxType, this.taxTypeOptions),
      typeOfReceipt: this.resolveLookupId(this.model.typeOfReceipt, this.receiptTypeOptions),
      receiptNo: this.model.receiptNo || '',
      remarks: this.model.remarks || this.model.notes || '',
      notes: this.model.remarks || this.model.notes || '',
    };

    this.expensesService.saveExpense(payload).subscribe({
      next: () => {
        this.saving = false;
        this.saved.emit();
      },
      error: () => {
        this.saving = false;
        this.saved.emit();
      },
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
