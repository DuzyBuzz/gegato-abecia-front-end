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
