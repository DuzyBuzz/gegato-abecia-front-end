export interface BillingTransaction {
  id: number;

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
