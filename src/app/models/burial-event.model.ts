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

export interface BurialEventChargeLine {
  label: string;
  quantity?: number | null;
  unitPrice?: number | null;
  discount?: number | null;
  amount: number;
}

/**
 * BurialEventDetails contains detailed information about a burial event
 */
export interface BurialEventDetails {
  contractNo: string;
  deceasedName: string;
  contractee?: string;
  serviceType?: string;
  burialDate?: string;
  wakeLocation?: string;
  cemetery: string;
  church?: string;
  driver?: string;
  contactNo?: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  amount?: number | null;
  chargeCount?: number;
  chargeItems?: BurialEventChargeLine[];
  deliveryRemarks?: string | null;
  remarks?: string | null;
  billingRemarks?: string | null;
  contractId?: number;
}

/**
 * CalendarDateRange for filtering events
 */
export interface CalendarDateRange {
  startDate: string;
  endDate: string;
}
