export interface ExpenseRecord {
  id?: number;
  receiptDate?: string;
  entryDate?: string;
  category?: string;
  categorySub?: string;
  particular?: string;
  amount?: number;
  fundSource?: string;
  taxType?: string;
  typeOfReceipt?: string;
  receiptNo?: string;
  remarks?: string;
  notes?: string;
  [key: string]: unknown;
}

export interface ExpenseCategorySub {
  id?: number;
  categorySub?: string;
  [key: string]: unknown;
}

export interface ExpenseCategory {
  id?: number;
  category?: string;
  subCategories?: ExpenseCategorySub[];
  [key: string]: unknown;
}
