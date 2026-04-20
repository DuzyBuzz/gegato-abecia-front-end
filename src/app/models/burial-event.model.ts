/**
 * BurialEvent represents a scheduled burial in the calendar
 */
export interface BurialEvent {
  id: string | number;
  title: string;
  start: string; // ISO format date
  end?: string; // ISO format date
  extendedProps: BurialEventDetails;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
}

/**
 * BurialEventDetails contains detailed information about a burial event
 */
export interface BurialEventDetails {
  contractNo: string;
  deceasedName: string;
  cemetery: string;
  driver?: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  amount?: number | null;
  remarks?: string | null;
  contractId?: number;
}

/**
 * CalendarDateRange for filtering events
 */
export interface CalendarDateRange {
  startDate: string;
  endDate: string;
}
