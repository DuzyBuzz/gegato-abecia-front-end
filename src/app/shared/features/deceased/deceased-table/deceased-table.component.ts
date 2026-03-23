import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableHelperComponent } from '../../../components/table-helper/table-helper.component';
import { TableHelperColumn } from '../../../components/table-helper/table-helper-column.model';
import { FuneralContract } from '../../../../models/funeral-contract.model';
import { FuneralContractService } from '../../../../services/funeral-contract.service';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-deceased-table',
  standalone: true,
  imports: [
    CommonModule,
    TableHelperComponent,
  ],
    templateUrl: './deceased-table.component.html',
  styleUrl: './deceased-table.component.scss',
})
export class DeceasedTableComponent implements OnInit {

  deceasedList: FuneralContract[] = [];

  loading = false;

  selectedDeceased?: FuneralContract;

  @Output() contractSelected = new EventEmitter<FuneralContract>();

  columns: TableHelperColumn[] = [
    {
      field: 'contractNo',
      header: 'Contract #',
      sortable: true,
      filterable: true,
      filterType: 'text',
      width: '12rem'
    },
    {
      field: 'lastName',
      header: 'Last Name',
      sortable: true,
      filterable: true,
      filterType: 'text',
      width: '12rem'
    },

        {
      field: 'firstName',
      header: 'First Name',
      sortable: true,
      filterable: true,
      filterType: 'text',
      width: '12rem'
    },
    {
      field: 'middleName',
      header: 'Middle Name',
      sortable: true,
      filterable: true,
      filterType: 'text',
      width: '12rem'
    },
    {
      field: 'religion',
      header: 'Religion',
      sortable: true,
      filterable: true,
      filterType: 'text',
      width: '10rem'
    },
    {
      field: 'municipality',
      header: 'Municipality',
      sortable: true,
      filterable: true,
      filterType: 'text',
      width: '12rem'
    },
    {
      field: 'type',
      header: 'Service Type',
      sortable: true,
      filterable: true,
      filterType: 'text',
      width: '12rem'
    },
    {
      field: 'startOfTransaction',
      header: 'Start Date',
      sortable: true,
      filterable: true,
      filterType: 'date',
      template: 'date',
      width: '12rem'
    }
  ];

  constructor(
    private funeralService: FuneralContractService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadContracts();
  }

  loadContracts(): void {

    this.loading = true;

    this.funeralService.getFuneralServices(1, 100).subscribe({

      next: (res) => {

        console.log('API RESPONSE:', res);

        this.deceasedList = res;

        this.loading = false;

        this.cdr.detectChanges();

      },

      error: (err) => {

        console.error('API ERROR:', err);

        this.loading = false;

      }

    });

  }

onRowSelected(row: FuneralContract): void {
  if (!row?.id) {
    console.error('No contract ID found in row');
    return;
  }

  this.router.navigate([
    '/billing/forms/contracts/funeral-contract',
    row.id
  ]);
}
onSearch(searchValue: string): void {

  if (!searchValue?.trim()) {
    this.loadContracts();
    return;
  }

  this.loading = true;

  this.funeralService.searchFuneralServices(searchValue)
    .subscribe({
      next: (res) => {

        // schedule on next macrotask to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.deceasedList = res;
          this.loading = false;
          this.cdr.markForCheck?.();
        }, 0);

      },
      error: () => {
        this.loading = false;
      }
    });

}
}

