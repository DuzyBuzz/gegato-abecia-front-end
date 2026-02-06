export interface BillingAccount {
  billing_account_id: number;

  funeral_contract_id: number;

  guarantor: string;
  billing_remarks: string;

  total_amount: number;
  total_discount: number;
  amount_due: number;
  plan_amount: number;
  balance: number;

  is_paid: boolean;

  promissory_date: string;

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
