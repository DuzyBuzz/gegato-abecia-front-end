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
import { SmartTableColumn } from './smart-table-column.model';

@Component({
  selector: 'app-smart-table',
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
  templateUrl: './smart-table.component.html',
  styleUrl: './smart-table.component.scss'
})
export class SmartTableComponent {
  @ViewChild('dt') table!: Table;

  @Input() value: any[] = [];
  @Input() columns: SmartTableColumn[] = [];
  @Input() loading = false;
  @Input() rows = 10;
  @Input() rowsPerPageOptions = [10, 25, 50];
  @Input() showRowHover = true;
  @Input() selectionMode: 'single' | 'multiple' | null = 'multiple';
  @Input() dataKey = 'id';
  @Input() globalFilterFields: string[] = [];
  @Input() showGlobalFilter = true;
  @Input() showClearButton = true;
  @Input() showPrintButton = true;
  @Input() showExportButton = true;
  @Input() exportFileName = 'table-export';
  @Input() printTitle = 'Table Print';

  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() rowSelect = new EventEmitter<any>();

  // Custom template for body rows
  @ContentChild('bodyTemplate') bodyTemplate!: TemplateRef<any>;
  @ContentChild('emptyMessageTemplate') emptyMessageTemplate!: TemplateRef<any>;

  selectedRows: any[] = [];
  searchValue = '';
  activityValues: number[] = [0, 100];

  // Getter for selected rows
  get selection(): any[] {
    return this.selectedRows;
  }

  set selection(value: any[]) {
    this.selectedRows = value;
    this.selectionChange.emit(value);
  }

  onSelectionChange() {
    this.selectionChange.emit(this.selectedRows);
  }

  clear(dt: Table) {
    this.searchValue = '';
    dt.reset();
  }

  getSeverity(status: string): any {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'approved':
      case 'success':
      case 'qualified':
        return 'success';
      case 'inactive':
      case 'pending':
      case 'warn':
      case 'warning':
        return 'warn';
      case 'error':
      case 'failed':
      case 'danger':
      case 'unqualified':
        return 'danger';
      case 'info':
      case 'new':
        return 'info';
      default:
        return 'secondary';
    }
  }

  onRowSelect(event: any) {
    this.rowSelect.emit(event.data);
  }

  /**
   * Export table data to Excel
   * Uses the filtered/current table data
   */
  exportToExcel() {
    try {
      // Dynamically import xlsx to reduce bundle size
      // @ts-ignore - xlsx is an optional dependency
      import('xlsx').then(({ utils, writeFile }) => {
        const filteredData = this.getFilteredTableData();
        const worksheet = utils.json_to_sheet(filteredData);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        writeFile(workbook, `${this.exportFileName}-${this.getTimestamp()}.xlsx`);
      }).catch(() => {
        console.error('Failed to export to Excel. Fallback to CSV.');
        this.exportToCSV();
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      this.exportToCSV();
    }
  }

  /**
   * Fallback: Export to CSV if xlsx is not available
   */
  private exportToCSV() {
    const filteredData = this.getFilteredTableData();
    const headers = this.columns.map(col => col.header).join(',');
    const rows = filteredData.map(row =>
      this.columns.map(col => {
        let value = row[col.field] || '';
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && value.includes(',')) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    ).join('\n');

    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${this.exportFileName}-${this.getTimestamp()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Print the currently filtered table
   */
  printTable() {
    const printWindow = window.open('', '', 'height=600,width=900');
    if (!printWindow) {
      alert('Please disable popup blockers to print the table.');
      return;
    }

    const filteredData = this.getFilteredTableData();
    const html = this.generatePrintHTML(filteredData);
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  /**
   * Get the currently filtered table data from PrimeNG table
   */
  private getFilteredTableData(): any[] {
    // Get the value from the table (which is the filtered data)
    return this.table.value || this.value;
  }

  /**
   * Generate HTML for printing
   */
  private generatePrintHTML(data: any[]): string {
    const columnHeaders = this.columns
      .map(col => `<th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">${col.header}</th>`)
      .join('');

    const rows = data
      .map(row => {
        const cells = this.columns
          .map(col => {
            let cellValue = row[col.field] || '';
            
            // Format based on template type
            if (col.template === 'date' && cellValue) {
              cellValue = new Date(cellValue).toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              });
            } else if (col.template === 'currency' && cellValue) {
              cellValue = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(cellValue);
            }
            
            return `<td style="border: 1px solid #ddd; padding: 8px;">${cellValue}</td>`;
          })
          .join('');
        
        return `<tr>${cells}</tr>`;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${this.printTitle}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            h1 {
              text-align: center;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              font-weight: bold;
            }
            .footer {
              margin-top: 30px;
              text-align: right;
              font-size: 12px;
              color: #666;
            }
            @media print {
              body {
                margin: 0;
              }
              table {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>${columnHeaders}</tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <div class="footer">
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>Total Records: ${data.length}</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Get current timestamp for file naming
   */
  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString().split('T')[0] + '_' + now.getTime();
  }
}
