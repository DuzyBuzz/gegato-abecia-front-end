import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ExpenseCategory, ExpenseCategorySub, ExpenseRecord } from '../models/expense.model';

@Injectable({
  providedIn: 'root',
})
export class ExpensesService {
  private readonly api = `${environment.api}/expenses`;

  constructor(private http: HttpClient) {}

  getExpenses(page = 1, recordsPerPage = 500): Observable<ExpenseRecord[]> {
    return this.http.get<unknown>(`${this.api}/find/${page}/${recordsPerPage}`).pipe(
      map((response) => this.normalizeExpenses(response)),
    );
  }

  getExpenseById(id: number): Observable<ExpenseRecord | null> {
    return this.http.get<unknown>(`${this.api}/find_record/${id}`).pipe(
      map((response) => this.normalizeExpense(response)),
    );
  }

  searchByReceiptDate(startDate: string, endDate: string): Observable<ExpenseRecord[]> {
    return this.http.get<unknown>(`${this.api}/find_by_receipt_date/${startDate}/${endDate}`).pipe(
      map((response) => this.normalizeExpenses(response)),
    );
  }

  searchByEntryDate(startDate: string, endDate: string): Observable<ExpenseRecord[]> {
    return this.http.get<unknown>(`${this.api}/find_by_entry_date/${startDate}/${endDate}`).pipe(
      map((response) => this.normalizeExpenses(response)),
    );
  }

  searchByCategory(category: string): Observable<ExpenseRecord[]> {
    return this.http.get<unknown>(`${this.api}/find_by_category/${encodeURIComponent(category)}`).pipe(
      map((response) => this.normalizeExpenses(response)),
    );
  }

  searchByCategorySub(categorySub: string): Observable<ExpenseRecord[]> {
    return this.http.get<unknown>(`${this.api}/find_by_category_sub/${encodeURIComponent(categorySub)}`).pipe(
      map((response) => this.normalizeExpenses(response)),
    );
  }

  searchByParticular(particular: string): Observable<ExpenseRecord[]> {
    return this.http.get<unknown>(`${this.api}/find_by_particular/${encodeURIComponent(particular)}`).pipe(
      map((response) => this.normalizeExpenses(response)),
    );
  }

  saveExpenses(expenses: unknown[]): Observable<ExpenseRecord[]> {
    const payload = expenses.map((exp) => this.convertExpenseToPayload(exp));
    return this.http.post<unknown>(`${this.api}/save`, payload).pipe(
      map((response) => this.normalizeExpenses(response)),
    );
  }

  private convertExpenseToPayload(expense: unknown): unknown {
    if (!expense || typeof expense !== 'object') {
      return expense;
    }
    const item = expense as Record<string, unknown>;
    return {
      ...item,
      dateOfEntry: this.toEpochMs(item['entryDate'] ?? item['dateOfEntry']),
      dateOfReceipt: this.toEpochMs(item['receiptDate'] ?? item['dateOfReceipt']),
    };
  }

  private convertCategoryToPayload(category: unknown): unknown {
    if (!category || typeof category !== 'object') {
      return category;
    }

    const item = category as Record<string, unknown>;
    const subs = this.toArray(item['subCategories']).map((sub) => {
      if (typeof sub !== 'object' || !sub) return sub;
      const subItem = sub as Record<string, unknown>;
      return {
        ...subItem,
        label: this.toStringValue(subItem['label'] ?? subItem['categorySub']),
        category: this.toNumber(subItem['category']) ?? 0,
      };
    });

    return {
      ...item,
      label: this.toStringValue(item['label'] ?? item['category']),
      subCategories: subs,
    };
  }

  private toEpochMs(value: unknown): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    const parsed = Date.parse(String(value));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  saveExpense(expense: unknown): Observable<ExpenseRecord[]> {
    return this.saveExpenses([expense]);
  }

  deleteExpense(id: number): Observable<void> {
    return this.http.post<void>(`${this.api}/delete/${id}`, [{}]);
  }

  getCategories(): Observable<ExpenseCategory[]> {
    return this.http.get<unknown>(`${this.api}/categories/find/0`).pipe(
      map((response) => this.normalizeCategories(response)),
    );
  }

  getCategoryById(id: number): Observable<ExpenseCategory | null> {
    return this.http.get<unknown>(`${this.api}/categories/find/${id}`).pipe(
      map((response) => this.normalizeCategory(response)),
    );
  }

  saveCategories(categories: ExpenseCategory[]): Observable<ExpenseCategory[]> {
    const payload = this.toArray(categories).map((category) => this.convertCategoryToPayload(category));
    return this.http.post<unknown>(`${this.api}/categories/save_categories`, payload).pipe(
      map((response) => this.normalizeCategories(response)),
    );
  }

  saveCategory(category: ExpenseCategory): Observable<ExpenseCategory[]> {
    return this.saveCategories([category]);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.post<void>(`${this.api}/categories/delete_category/${id}`, {});
  }

  private normalizeExpenses(response: unknown): ExpenseRecord[] {
    return this.toArray(response)
      .map((item) => this.normalizeExpense(item))
      .filter((item): item is ExpenseRecord => !!item);
  }

  private normalizeExpense(response: unknown): ExpenseRecord | null {
    if (!response || typeof response !== 'object') {
      return null;
    }

    const item = response as Record<string, unknown>;

    return {
      ...item,
      id: this.toNumber(item['id']),
      receiptDate: this.toDateString(item['receiptDate'] ?? item['dateOfReceipt']),
      entryDate: this.toDateString(item['entryDate'] ?? item['dateOfEntry']),
      category: this.toStringValue(item['category']),
      categorySub: this.toStringValue(item['categorySub']),
      particular: this.toStringValue(item['particular']),
      amount: this.toNumber(item['amount']),
    };
  }

  private normalizeCategories(response: unknown): ExpenseCategory[] {
    return this.toArray(response)
      .map((item) => this.normalizeCategory(item))
      .filter((item): item is ExpenseCategory => !!item);
  }

  private normalizeCategory(response: unknown): ExpenseCategory | null {
    if (!response || typeof response !== 'object') {
      return null;
    }

    const item = response as Record<string, unknown>;
    const subCategories = this.toArray(item['subCategories'])
      .map((subCategory) => this.normalizeCategorySub(subCategory))
      .filter((subCategory): subCategory is ExpenseCategorySub => !!subCategory);

    return {
      ...item,
      id: this.toNumber(item['id']),
      category: this.toStringValue(item['category'] ?? item['label']),
      label: this.toStringValue(item['label'] ?? item['category']),
      subCategories,
    };
  }

  private normalizeCategorySub(response: unknown): ExpenseCategorySub | null {
    if (!response || typeof response !== 'object') {
      return null;
    }

    const item = response as Record<string, unknown>;

    return {
      ...item,
      id: this.toNumber(item['id']),
      categorySub: this.toStringValue(item['categorySub'] ?? item['label']),
      label: this.toStringValue(item['label'] ?? item['categorySub']),
      category: this.toNumber(item['category']) ?? this.toStringValue(item['category']),
    };
  }

  private toArray(response: unknown): unknown[] {
    if (!response) {
      return [];
    }

    return Array.isArray(response) ? response : [response];
  }

  private toStringValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value).trim();
  }

  private toNumber(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : undefined;
  }

  private toDateString(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    if (typeof value === 'string') {
      return value.slice(0, 10);
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return String(value);
    }

    return new Date(numericValue).toISOString().slice(0, 10);
  }
}
