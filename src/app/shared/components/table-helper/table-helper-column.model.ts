import { FilterMatchMode } from 'primeng/api';

export interface TableHelperColumn {
  field: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  filterMatchMode?: FilterMatchMode;
  filterType?: 'text' | 'numeric' | 'date' | 'select';
  currencyCode?: string;
  width?: string;
  template?: 'text' | 'date' | 'currency' | 'status' | 'progress' | 'tag' | 'actions';
}