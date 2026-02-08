import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableHelperComponent } from '../../../components/table-helper/table-helper.component';
import { TableHelperColumn } from '../../../components/table-helper/table-helper-column.model';
import { Deceased } from '../../../../models/funeral-contract.model';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { FUNERAL_CONTRACTS_MOCK } from '../../../../../assets/mock/funeral-contract.mock';

@Component({
  selector: 'app-deceased-table',
  standalone: true,
  imports: [CommonModule, TableHelperComponent, ButtonModule, ToolbarModule],
  templateUrl: './deceased-table.component.html',
  styleUrl: './deceased-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeceasedTableComponent implements OnInit {
  
  // Deceased data from mock funeral contracts
  deceasedList: Deceased[] = FUNERAL_CONTRACTS_MOCK.map(contract => contract.deceased);

  // Table columns configuration
  columns: TableHelperColumn[] = [
    {
      field: 'contract_no',
      header: 'Contract #',
      sortable: true,
      filterable: true,
      filterType: 'text',
      width: '12rem'
    },
    {
      field: 'first_name',
      header: 'First Name',
      sortable: true,
      filterable: true,
      filterType: 'text',
      width: '12rem'
    },
    {
      field: 'middle_name',
      header: 'Middle Name',
      sortable: true,
      filterable: true,
      filterType: 'text',
      width: '12rem'
    },
    {
      field: 'last_name',
      header: 'Last Name',
      sortable: true,
      filterable: true,
      filterType: 'text',
      width: '12rem'
    },
    {
      field: 'date_of_death',
      header: 'Date of Death',
      sortable: true,
      filterable: true,
      filterType: 'date',
      template: 'date',
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
      field: 'type_of_service',
      header: 'Service Type',
      sortable: true,
      filterable: true,
      filterType: 'select',
      width: '12rem'
    },
    {
      field: 'casket',
      header: 'Casket',
      sortable: true,
      filterable: true,
      filterType: 'text',
      width: '10rem'
    },
    {
      field: 'office',
      header: 'Office',
      sortable: true,
      filterable: true,
      filterType: 'text',
      width: '12rem'
    },
    {
      field: 'deliviered_by',
      header: 'Delivered By',
      sortable: true,
      filterable: true,
      filterType: 'text',
      width: '12rem'
    }
  ];

  selectedDeceased: Deceased[] = [];
  loading = false;

  ngOnInit() {
    // Load deceased data from service
    // In a real application, you would call a service here
  }

  /**
   * Handle deceased selection
   */
  onDeceasedSelected(deceased: Deceased[]) {
    this.selectedDeceased = deceased;
    console.log('Selected deceased:', this.selectedDeceased);
  }

  /**
   * Handle row selection
   */
  onRowSelected(deceased: Deceased) {
    console.log('Row selected:', deceased);
    // Navigate to deceased details, edit, or perform other actions
  }

  /**
   * Search handler
   */
  onSearch(searchValue: string) {
    console.log('Search value:', searchValue);
    // Filter data based on search value
    // In a real application, this would call a service
  }
}
