import { Component, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PrintHeader } from '../print-header/print-header';
import { CommonModule, Location } from '@angular/common';
import { FuneralContract } from '../../../models/funeral-contract.model';
import { FUNERAL_CONTRACTS_MOCK } from '../../../../assets/mock/funeral-contract.mock';
import { BILLING_ACCOUNTS_MOCK } from '../../../../assets/mock/billing-account.mock';
import { PrintDataService } from '../../../services/print-data.service';

interface StatementItem {
  description: string;
  amount?: number;
  discount?: number;
  payment?: number;
  paymentDate?: string;
}

@Component({
  selector: 'app-statement-of-account',
  standalone: true,
  imports: [PrintHeader, CommonModule],
  templateUrl: './statement-of-account.html',
  styleUrl: '../print-header/print-header.scss',
})
export class StatementOfAccount implements OnInit, AfterViewInit, OnDestroy {

  contractId: string | null = null;
  selectedContract: FuneralContract | null = null;

  /* ================= HEADER ================= */

  header = {
    dateAsOf: new Date().toLocaleDateString(),
    billedTo: 'N/A',
    address: 'N/A',
    deceased: 'N/A',
    contractNo: 'N/A'
  };

  /* ================= CONTRACT ================= */

  contract = {
    dod: 'N/A',
    contractee: 'N/A',
    address: 'N/A',
    deceasedName: 'N/A',
    contractNo: 'N/A',
    officer: 'Officer in Charge'
  };

  /* ================= ITEMS ================= */

  items: StatementItem[] = [];

  constructor(
    private location: Location,
    private activatedRoute: ActivatedRoute,
    private printDataService: PrintDataService
  ) {}

  ngOnInit(): void {
    // First, try to get data from PrintDataService (passed from funeral-contract-entry)
    const printData = this.printDataService.getCurrentPrintData();
    
    if (printData.contract) {
      // Use data passed from funeral contract entry
      this.selectedContract = printData.contract;
      this.mapContractToDisplay(printData.contract);
      console.log('[StatementOfAccount] Using data from PrintDataService');
    } else {
      // Fallback: Load from route parameter
      this.contractId = this.activatedRoute.snapshot.paramMap.get('contractId');
      if (this.contractId) {
        this.loadContractData(this.contractId);
      }
    }
  }

  private loadContractData(contractId: string): void {
    try {
      const numericId = parseInt(contractId, 10);
      const foundContract = FUNERAL_CONTRACTS_MOCK.find(c => c.contract_id === numericId);

      if (foundContract) {
        this.selectedContract = foundContract;
        this.mapContractToDisplay(foundContract);
      } else {
        console.warn('[StatementOfAccount] Contract not found:', contractId);
        this.setFallbackData();
      }
    } catch (error) {
      console.error('[StatementOfAccount] Error loading contract:', error);
      this.setFallbackData();
    }
  }

  private mapContractToDisplay(contract: FuneralContract): void {
    const { deceased, contractee, header } = contract;

    this.header = {
      dateAsOf: new Date().toLocaleDateString(),
      billedTo: `${contractee?.full_name || 'N/A'}`,
      address: `${contractee?.city || 'N/A'}`,
      deceased: `${deceased?.first_name || ''} ${deceased?.middle_name || ''} ${deceased?.last_name || ''}`.trim() || 'N/A',
      contractNo: `${header?.contract_no || 'N/A'}`
    };

    this.contract = {
      dod: deceased?.date_of_death || 'N/A',
      contractee: `${contractee?.full_name || 'N/A'}`,
      address: `${contractee?.address || 'N/A'}`,
      deceasedName: `${deceased?.first_name || ''} ${deceased?.middle_name || ''} ${deceased?.last_name || ''}`.trim() || 'N/A',
      contractNo: `${header?.contract_no || 'N/A'}`,
      officer: 'Officer in Charge'
    };

    // Load billing account from mock data using funeral_contract_id
    const billingAccount = BILLING_ACCOUNTS_MOCK.find(b => b.funeral_contract_id === contract.contract_id);
    if (billingAccount) {
      this.items = [
        { description: billingAccount.casket, amount: billingAccount.total_amount },
        { description: `Discount`, discount: billingAccount.total_discount },
        { description: `Services - ${billingAccount.service_type}` },
        { description: `Financial Assistance: ${billingAccount.financial_asst}` },
        { description: `Subtotal`, amount: billingAccount.amount_due },
        { description: `Payment Plan`, payment: billingAccount.plan_amount },
        { description: `Balance Due`, amount: billingAccount.balance }
      ];
    } else {
      this.setDefaultItems();
    }
  }

  private setDefaultItems(): void {
    this.items = [
      { description: 'Service Charges', amount: 0 },
      { description: 'Casket/Urn', amount: 0 }
    ];
  }

  private setFallbackData(): void {
    this.header = {
      dateAsOf: new Date().toLocaleDateString(),
      billedTo: 'N/A',
      address: 'N/A',
      deceased: 'N/A',
      contractNo: 'N/A'
    };
    this.contract = {
      dod: 'N/A',
      contractee: 'N/A',
      address: 'N/A',
      deceasedName: 'N/A',
      contractNo: 'N/A',
      officer: 'Officer in Charge'
    };
    this.setDefaultItems();
  }


  /* ================= TOTALS ================= */

  get totalAmount(): number {
    return this.items.reduce((sum, i) => sum + (i.amount || 0), 0);
  }

  get totalPayments(): number {
    return this.items.reduce((sum, i) => sum + (i.payment || 0), 0);
  }

  get balanceDue(): number {
    return this.totalAmount - this.totalPayments;
  }

  /* ================= AUTO PRINT ================= */

  ngAfterViewInit(): void {
    // Register handler BEFORE printing
    window.onafterprint = () => {
      this.goBack();
    };

    // Delay ensures layout + fonts are ready
    setTimeout(() => {
      window.print();
    }, 300);
  }

  /* ================= CLEANUP ================= */

  ngOnDestroy(): void {
    // Prevent memory leaks
    window.onafterprint = null;
  }

  /* ================= NAVIGATION ================= */

  private goBack(): void {
    // Uses browser history (best UX)
    this.location.back();
  }
}