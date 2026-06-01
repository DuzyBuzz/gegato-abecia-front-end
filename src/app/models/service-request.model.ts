export type ServiceRequestType =
  | 'price-change'
  | 'discount-change'
  | 'billing-remarks-change'
  | 'charge-update'
  | 'charge-delete'
  | 'payment-update'
  | 'payment-delete'
  | 'contract-correction';

export type ServiceRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ServiceRequest {
  id?: string;
  type: ServiceRequestType;
  contractId: number;
  contractNo: string;
  deceasedName?: string;
  requestedBy: string;
  requestedByUid?: string;
  requestedAt: Date | { seconds: number; nanoseconds: number } | string;
  status: ServiceRequestStatus;
  fieldLabel: string;
  fieldKey?: string;
  targetId?: number;
  oldValue?: unknown;
  newValue?: unknown;
  chargeData?: unknown;
  paymentData?: unknown;
  notes?: string;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date | { seconds: number; nanoseconds: number } | null;
}

export const SERVICE_REQUEST_TYPE_LABELS: Record<ServiceRequestType, string> = {
  'price-change': 'Contract Price Change',
  'discount-change': 'Contract Discount Change',
  'billing-remarks-change': 'Billing Remarks Update',
  'charge-update': 'Charge Record Update',
  'charge-delete': 'Charge Record Deletion',
  'payment-update': 'Payment Record Update',
  'payment-delete': 'Payment Record Deletion',
  'contract-correction': 'Contract Data Correction',
};
