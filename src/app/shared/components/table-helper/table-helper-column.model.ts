// shared/components/smart-table/smart-table-column.model.ts
import { FilterMatchMode } from 'primeng/api';

export interface TableHelperColumn {
  field: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  filterMatchMode?: FilterMatchMode;
  filterType?: 'text' | 'numeric' | 'date' | 'select';
  width?: string;
  template?: 'text' | 'date' | 'currency' | 'status' | 'progress' | 'tag';
}

