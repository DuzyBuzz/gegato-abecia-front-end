import { Component, Input, Output, EventEmitter, ViewChild, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressBarModule } from 'primeng/progressbar';
import { SliderModule } from 'primeng/slider';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { TableHelperColumn } from './table-helper-column.model';

@Component({
  selector: 'app-table-helper',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SelectModule,
    IconFieldModule,
    InputIconModule,
    MultiSelectModule,
    ProgressBarModule,
    SliderModule,
    TableModule,
    TagModule,
    InputTextModule
  ],
  templateUrl: './table-helper.component.html',
  styleUrls: ['./table-helper.component.scss']
})
export class TableHelperComponent {

  @ViewChild('dt') table!: Table;

  @Input() value: any[] = [];
  @Input() columns: TableHelperColumn[] = [];
  @Input() loading = false;
  @Input() rows = 10;
  @Input() rowsPerPageOptions = [10, 25, 50];
  @Input() showRowHover = true;
  @Input() dataKey = 'id';
  @Input() globalFilterFields: string[] = [];

  @Input() showGlobalFilter = true;
  @Input() showClearButton = true;
  @Input() showPrintButton = true;
  @Input() showExportButton = true;

  @Input() exportFileName = 'table-export';
  @Input() printTitle = 'Table Print';

  @Output() rowSelect = new EventEmitter<any>();
  @Output() onSearch = new EventEmitter<string>();

  selectedRow: any = null;

  searchValue = '';

  onSearchInput(searchValue: string) {

    this.onSearch.emit(searchValue);

    if (this.table) {
      this.table.filterGlobal(searchValue, 'contains');
    }

  }

  clear() {

    this.searchValue = '';

    if (this.table) {
      this.table.reset();
    }

  }

  onRowSelect(event: any) {

    const row = event.data;

    this.rowSelect.emit(row);

  }

  onRowClick(row: any) {

    this.selectedRow = row;

    this.rowSelect.emit(row);

  }

  exportToExcel() {

    import('xlsx').then(({ utils, writeFile }) => {

      const data = this.table?.filteredValue || this.value;

      const worksheet = utils.json_to_sheet(data);

      const workbook = utils.book_new();

      utils.book_append_sheet(workbook, worksheet, 'Sheet1');

      writeFile(workbook, `${this.exportFileName}-${Date.now()}.xlsx`);

    });

  }
printTable() {

  const source = this.table?.filteredValue || this.value;

  const start = this.table?.first ?? 0;
  const rows = this.table?.rows ?? this.rows;

  const visibleData = source.slice(start, start + rows);

  const headers = this.columns
    .map(c => `<th>${c.header}</th>`)
    .join('');

  const bodyRows = visibleData
    .map(row =>
      `<tr>${this.columns
        .map(c => `<td>${row[c.field] ?? ''}</td>`)
        .join('')}</tr>`
    )
    .join('');

  const html = `
  <html>
    <head>
      <title>${this.printTitle}</title>
      <style>
        body{font-family:Arial}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #ccc;padding:6px;text-align:left}
        th{background:#f3f4f6}
      </style>
    </head>
    <body>

      <h2>${this.printTitle}</h2>

      <table>
        <thead>
          <tr>${headers}</tr>
        </thead>
        <tbody>
          ${bodyRows}
        </tbody>
      </table>

    </body>
  </html>
  `;

  const win = window.open('', '_blank');

  if (!win) return;

  win.document.write(html);
  win.document.close();

  setTimeout(() => {
    win.print();
    win.close();
  }, 300);

}
}