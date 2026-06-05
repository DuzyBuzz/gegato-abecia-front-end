export type ContractStatus = 'ACTIVE' | 'PENDING' | 'PAID' | 'COMPLETED';

export interface ContractRecord {
  id: string;
  contractNo: string;
  client: string;
  status: ContractStatus;
  balance: number;
  totalPaid: number;
  grossAmount: number;
  branch: string;
  serviceType: string;
  deceasedName: string;
  contractDate: string;
  lastPaymentDate: string;
}

export interface ContractPaymentEntry {
  transNo: string;
  item: string;
  amount: number;
  discount: number;
  cash: number;
  check: number;
  orAmount: number;
  ar: string;
  orNo: string;
  plan: string;
  dswdGi: string;
  gm: string;
  date: string;
  auditName: string;
  auditTime: string;
}
