import { Injectable } from '@angular/core';
import { ContractPaymentEntry, ContractRecord } from '../models/contract.model';

@Injectable({ providedIn: 'root' })
export class ContractService {
  readonly contracts: ContractRecord[] = [
    {
      id: 'CTR-2026-0001',
      contractNo: 'CTR-2026-0001',
      client: 'Juan Dela Cruz',
      status: 'ACTIVE',
      balance: 30000,
      totalPaid: 45000,
      grossAmount: 75000,
      branch: 'Main Branch',
      serviceType: 'Traditional',
      deceasedName: 'Juan Dela Cruz Sr.',
      contractDate: '2026-05-18',
      lastPaymentDate: '2026-06-05',
    },
    {
      id: 'CTR-2026-0002',
      contractNo: 'CTR-2026-0002',
      client: 'Maria Santos',
      status: 'PENDING',
      balance: 12500,
      totalPaid: 15000,
      grossAmount: 27500,
      branch: 'Main Branch',
      serviceType: 'Cremation',
      deceasedName: 'Maria Santos Sr.',
      contractDate: '2026-05-21',
      lastPaymentDate: '2026-06-02',
    },
    {
      id: 'CTR-2026-0003',
      contractNo: 'CTR-2026-0003',
      client: 'Ramon Cruz',
      status: 'PAID',
      balance: 0,
      totalPaid: 54000,
      grossAmount: 54000,
      branch: 'North Branch',
      serviceType: 'Traditional',
      deceasedName: 'Ramon Cruz Sr.',
      contractDate: '2026-05-25',
      lastPaymentDate: '2026-06-01',
    },
  ];

  readonly payments: ContractPaymentEntry[] = [
    { transNo: '32449', item: 'JRHALF GLASS - WOOD', amount: 45000, discount: 0, cash: 3000, check: 0, orAmount: 3000, ar: '7022', orNo: 'OR-1001', plan: 'PLAN A', dswdGi: 'N', gm: '07-Oct-20', date: '2026-06-05', auditName: 'Rizalina Panes', auditTime: '9:48:08 AM 9/17/2020' },
    { transNo: '33414', item: 'DSWD GL P15,000 / OCTOBER 6, 2020', amount: 15000, discount: 0, cash: 15000, check: 0, orAmount: 15000, ar: '', orNo: 'OR-1002', plan: '', dswdGi: 'Y', gm: '06-Oct-20', date: '2026-06-02', auditName: 'Rizalina Panes', auditTime: '4:50:19 pm 6/10/20' },
  ];

  getContracts(): ContractRecord[] {
    return this.contracts;
  }

  getContract(id: string): ContractRecord | undefined {
    return this.contracts.find((entry) => entry.id === id);
  }

  getPayments(): ContractPaymentEntry[] {
    return this.payments;
  }
}
