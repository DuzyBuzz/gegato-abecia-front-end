import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { PrintHeader } from "../print-header/print-header";
import { FuneralContract } from '../../../models/funeral-contract.model';
import { FUNERAL_CONTRACTS_MOCK } from '../../../../assets/mock/funeral-contract.mock';
import { PrintDataService } from '../../../services/print-data.service';

@Component({
  selector: 'app-authority-to-cremate-remains-printing',
  imports: [PrintHeader, CommonModule],
  templateUrl: './authority-to-cremate-remains-printing.html',
  styleUrl: '../print-header/print-header.scss',
})
export class AuthorityToCremateRemainsPrinting implements OnInit, AfterViewInit, OnDestroy {

  contract: any = {};
  contractId: string | null = null;
  selectedContract: FuneralContract | null = null;

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
      console.log('[AuthorityToCremateRemainsPrinting] Using data from PrintDataService');
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
        console.warn('[AuthorityToCremateRemainsPrinting] Contract not found:', contractId);
        this.setFallbackData();
      }
    } catch (error) {
      console.error('[AuthorityToCremateRemainsPrinting] Error loading contract:', error);
      this.setFallbackData();
    }
  }

  private mapContractToDisplay(contract: FuneralContract): void {
    const { deceased, contractee, burial_schedule, header } = contract;

    this.contract = {
      time: new Date().toLocaleTimeString(),
      date: new Date().toLocaleDateString(),
      deceasedName: `${deceased?.first_name || ''} ${deceased?.middle_name || ''} ${deceased?.last_name || ''}`.trim(),
      dob: deceased?.date_of_birth || 'N/A',
      dod: deceased?.date_of_death || 'N/A',
      age: deceased?.age || 'N/A',
      authorizer: `${contractee?.full_name || 'N/A'}`,
      address: `${deceased?.address_of_deceased || 'N/A'}`,
      placeOfDeath: `${deceased?.place_of_death || 'N/A'}`,
      church: `${burial_schedule?.church || 'N/A'}`,
      burialDate: `${burial_schedule?.burial_date || 'N/A'}`,
      cemetery: `${burial_schedule?.cemetery || 'N/A'}`,
      relationship: `${contractee?.relationship || 'N/A'}`,
      contractNo: `${header?.contract_no || 'N/A'}`
    };
  }

  private setFallbackData(): void {
    this.contract = {
      time: new Date().toLocaleTimeString(),
      date: new Date().toLocaleDateString(),
      authorizer: 'N/A',
      deceasedName: 'N/A',
      dateOfDeath: 'N/A',
      placeOfDeath: 'N/A',
      dateOfCremation: 'N/A',
      address: 'N/A',
      relationship: 'N/A'
    };
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

  print(): void {
    window.print();
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
