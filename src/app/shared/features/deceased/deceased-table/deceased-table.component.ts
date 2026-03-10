import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableHelperComponent } from '../../../components/table-helper/table-helper.component';
import { TableHelperColumn } from '../../../components/table-helper/table-helper-column.model';
import { FuneralService } from '../../../../models/funeral-service.model';
import { FuneralServiceService } from '../../../../services/funeral-service.service';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-deceased-table',
  standalone: true,
  imports: [
    CommonModule,
    TableHelperComponent,
    ButtonModule,
    ToolbarModule
  ],
    templateUrl: './deceased-table.component.html',
  styleUrl: './deceased-table.component.scss',
})
export class DeceasedTableComponent implements OnInit {

  deceasedList: FuneralService[] = [];

  loading = false;

  selectedDeceased?: FuneralService;

  @Output() contractSelected = new EventEmitter<FuneralService>();

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
      field: 'lastName',
      header: 'Last Name',
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
    private funeralService: FuneralServiceService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadContracts();
  }

  loadContracts(): void {

    this.loading = true;

    this.funeralService.getFuneralServices(1, 50).subscribe({

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

  onRowSelected(row: FuneralService): void {

    this.selectedDeceased = row;

    console.log('Selected contract:', row);

    this.contractSelected.emit(row);

  }

  onSearch(searchValue: string): void {

    console.log('Search value:', searchValue);

  }

}