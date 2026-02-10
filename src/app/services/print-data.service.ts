import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FuneralContract } from '../models/funeral-contract.model';
import { BillingAccount } from '../models/billing-account.model';

export interface PrintDataContext {
  contract: FuneralContract | null;
  billingAccount: BillingAccount | null;
  contractId: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class PrintDataService {
  
  private printDataSubject = new BehaviorSubject<PrintDataContext>({
    contract: null,
    billingAccount: null,
    contractId: null
  });

  public printData$: Observable<PrintDataContext> = this.printDataSubject.asObservable();

  constructor() {}

  /**
   * Set the data context for printing
   * This is called when user initiates print from funeral contract entry
   */
  setPrintData(contract: FuneralContract, billingAccount?: BillingAccount): void {
    if (!contract) {
      console.warn('[PrintDataService] Attempted to set null contract');
      return;
    }

    this.printDataSubject.next({
      contract,
      billingAccount: billingAccount || null,
      contractId: contract.contract_id
    });

    console.log('[PrintDataService] Print data set for contract:', contract.contract_id);
  }

  /**
   * Get current print data synchronously
   */
  getCurrentPrintData(): PrintDataContext {
    return this.printDataSubject.getValue();
  }

  /**
   * Clear print data after printing
   */
  clearPrintData(): void {
    this.printDataSubject.next({
      contract: null,
      billingAccount: null,
      contractId: null
    });
    console.log('[PrintDataService] Print data cleared');
  }

  /**
   * Check if print data is available
   */
  hasPrintData(): boolean {
    return this.printDataSubject.getValue().contract !== null;
  }
}
