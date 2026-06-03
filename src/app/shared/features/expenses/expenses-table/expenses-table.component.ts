import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

import { ExpenseRecord } from '../../../../models/expense.model';
import { TableHelperComponent } from '../../../components/table-helper/table-helper.component';
import { TableHelperColumn } from '../../../components/table-helper/table-helper-column.model';

@Component({
  selector: 'app-expenses-table',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TableHelperComponent,
  ],
  templateUrl: './expenses-table.component.html',
  styleUrl: './expenses-table.component.scss',
})
export class ExpensesTableComponent {
  @Input() expenses: ExpenseRecord[] = [];
  @Input() loading = false;

  @Output() editExpense = new EventEmitter<ExpenseRecord>();
  @Output() deleteExpense = new EventEmitter<ExpenseRecord>();
  @Output() search = new EventEmitter<string>();

  readonly globalFilterFields = ['receiptDate', 'entryDate', 'category', 'categorySub', 'particular', 'amount'];

  readonly columns: TableHelperColumn[] = [
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

  onSearch(value: string): void {
    this.search.emit(value);
  }

  onEdit(expense: ExpenseRecord): void {
    this.editExpense.emit(expense);
  }

  onDelete(expense: ExpenseRecord): void {
    this.deleteExpense.emit(expense);
  }

}
