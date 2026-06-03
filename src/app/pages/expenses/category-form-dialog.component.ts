import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

import { ExpensesService } from '../../services/expenses.service';
import { ExpenseCategory, ExpenseCategorySub } from '../../models/expense.model';
import { TableHelperComponent } from '../../shared/components/table-helper/table-helper.component';
import { TableHelperColumn } from '../../shared/components/table-helper/table-helper-column.model';

@Component({
  selector: 'app-category-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, InputTextModule, ButtonModule, TableHelperComponent],
  templateUrl: './category-form-dialog.component.html',
  styleUrls: ['./category-form-dialog.component.scss'],
})
export class CategoryFormDialogComponent implements OnChanges {
  @Input() visible = false;
  @Input() categories: ExpenseCategory[] = [];
  @Input() category: ExpenseCategory | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  label = '';
  newSubcategory = '';
  subcategories: string[] = [];
  saving = false;

  readonly categoryTableColumns: TableHelperColumn[] = [
    { field: 'category', header: 'Category', sortable: true, filterable: true, filterType: 'text', width: '16rem' },
    { field: 'subCategories', header: 'Subcategories', sortable: true, filterable: true, filterType: 'text', width: '24rem' },
    { field: 'actions', header: 'Actions', template: 'actions', width: '11rem' },
  ];

  constructor(private expensesService: ExpensesService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['category'] || (changes['visible'] && this.visible)) {
      this.prefillCategoryForm(this.category);
    }

    if (changes['visible'] && !this.visible) {
      this.resetForm();
    }
  }

  addSubcategory(): void {
    const value = this.newSubcategory.trim();
    if (!value) {
      return;
    }

    if (!this.subcategories.includes(value)) {
      this.subcategories = [...this.subcategories, value];
    }

    this.newSubcategory = '';
  }

  removeSubcategory(index: number): void {
    this.subcategories = this.subcategories.filter((_, idx) => idx !== index);
  }

  onCategoryNameChange(): void {
    const lookup = this.label.trim().toLowerCase();
    if (!lookup) {
      return;
    }

    const existing = this.categories.find((item) => this.toStringValue(item['category']).toLowerCase() === lookup);

    const subItems = existing?.subCategories as ExpenseCategorySub[] | undefined;
    if (subItems?.length) {
      this.subcategories = subItems
        .map((item) => this.toStringValue(item.categorySub || item['label']))
        .filter((item): item is string => !!item);
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }

  editCategoryRow(category: ExpenseCategory): void {
    this.category = category;
    this.prefillCategoryForm(category);
  }

  get existingCategoryRows(): Array<{ id: number; category: string; subCategories: string; _row: ExpenseCategory }> {
    return (this.categories || []).map((item) => ({
      id: Number(item.id ?? 0),
      category: this.toStringValue(item['category'] || item['label']),
      subCategories: (item.subCategories || [])
        .map((sub) => this.toStringValue(sub['categorySub'] || sub['label']))
        .filter(Boolean)
        .join(', ') || '—',
      _row: item,
    }));
  }

  confirmDeleteCategoryRow(category: ExpenseCategory): void {
    const label = this.toStringValue(category['category'] || category['label']) || 'this category';
    if (!window.confirm(`Delete ${label}? This will remove the category and its subcategories.`)) {
      return;
    }

    this.deleteCategoryRow(category);
  }

  private deleteCategoryRow(category: ExpenseCategory): void {
    if (!category.id) {
      this.categories = this.categories.filter((item) => item !== category);
      this.saved.emit();
      return;
    }

    this.expensesService.deleteCategory(category.id).subscribe({
      next: () => {
        this.categories = this.categories.filter((item) => item.id !== category.id);
        this.saved.emit();
      },
      error: () => {
        window.alert('Failed to delete category.');
      },
    });
  }

  private prefillCategoryForm(category: ExpenseCategory | null): void {
    if (!category) {
      this.resetForm();
      return;
    }

    this.label = this.toStringValue(category['category'] || category['label']);
    this.subcategories = (category.subCategories || [])
      .map((item) => this.toStringValue(item['categorySub'] || item['label']))
      .filter((item): item is string => !!item);
  }

  private resetForm(): void {
    this.label = '';
    this.newSubcategory = '';
    this.subcategories = [];
    this.saving = false;
  }

  private toStringValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value).trim();
  }

  save(): void {
    const label = this.label.trim();
    if (!label) {
      return;
    }

    const currentId = this.category?.id ?? 0;
    const existingCategory = this.categories.find((item) => item.id === currentId) ??
      this.categories.find((item) => (item.category || '').toLowerCase() === label.toLowerCase());

    const existingSubs = (existingCategory?.subCategories || []) as ExpenseCategorySub[];
    const payload = {
      id: currentId || existingCategory?.id || 0,
      label,
      category: label,
      subCategories: (this.subcategories || [])
        .map((s) => s.trim())
        .filter((s) => !!s)
        .map((s) => {
          const matched = existingSubs.find((item) =>
            this.toStringValue(item['categorySub'] || item['label']).toLowerCase() === s.toLowerCase()
          );
          return {
            id: matched?.id ?? 0,
            categorySub: s,
            category: currentId || existingCategory?.id || 0,
          } as ExpenseCategorySub;
        }),
    };

    this.saving = true;
    this.expensesService.saveCategories([payload]).subscribe({
      next: () => {
        this.saving = false;
        this.resetForm();
        this.saved.emit();
      },
      error: () => {
        this.saving = false;
        this.saved.emit();
      },
    });
  }
}
