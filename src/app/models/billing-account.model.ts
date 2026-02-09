export interface BillingAccount {
  billing_account_id: number;
  funeral_contract_id: number;

  // Header Info
  contract_no: string;
  start_date: string;
  deceased_name: string;
  contractee: string;
  contractee_phone: string;
  address: string;
  service_type: string;
  cremation_type?: string;
  casket: string;
  casket_description: string;

  // Age & Documents
  age: number;
  disc_id_no?: string;
  issued_at?: string;
  issued_on?: string;
  city_docs?: string;
  submitted?: string;
  barangay?: string;
  chairman?: string;
  financial_asst?: string;
  date_submitted?: string;
  received_by?: string;

  // Dates
  date_of_delivery?: string;
  cremation_date?: string;
  promissory_date: string;
  date_of_burial?: string;
  ash_released?: string;
  released_by?: string;

  // Billing
  guarantor: string;
  billing_remarks: string;
  total_amount: number;
  total_discount: number;
  amount_due: number;
  plan_amount: number;
  balance: number;
  is_paid: boolean;

  created_at: string;
  updated_at: string;
}

export interface BillingTransaction {
  billing_transaction_id: number;
  billing_account_id: number;

  transaction_no: string;
  item: string;

  amount: number;
  discount: number;

  cash: number;
  check_amount: number;

  official_receipt_amount: number;
  acknowledgement_receipt: string;
  official_receipt_no: string;

  plan_amount: number;
  dswd_amount: number;
  gm_amount: number;

  transaction_date: string;
  encoded_by: string;
}

