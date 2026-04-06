import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { PrintHeader } from "../print-header/print-header";
import { FuneralContract } from '../../models/funeral-contract.model';
import { FuneralContractService } from '../../services/funeral-contract.service';
import { AuthService } from '../../services/auth.service';
import { deceasedAgeAtDeath } from '../../utils/deceased-age.util';

@Component({
  selector: 'app-authority-to-cremate-remains-printing',
  imports: [PrintHeader, CommonModule],
  templateUrl: './authority-to-cremate-remains-printing.html',
  styleUrl: '../print-header/print-header.scss',
})
export class AuthorityToCremateRemainsPrinting implements OnInit, OnDestroy {

  contract: any = {};
  contractId: number | null = null;
  selectedContract: FuneralContract | null = null;
  isReady = false; // 🔥 control printing
  currentUser = {
    name: 'Officer in Charge',
    role: 'Biller'
  };

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private contractService: FuneralContractService,
    private cdr: ChangeDetectorRef,
    private auth: AuthService
  ) {}

  // ======================================================
  // 🔥 INIT
  // ======================================================
  ngOnInit(): void {
    const authUser = this.auth.currentUser;
    if (authUser) {
      const firstName = authUser.firstName || '';
      const lastName = authUser.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();

      this.currentUser = {
        name: fullName || authUser.username || 'Officer in Charge',
        role: authUser.role || 'Biller'
      };
    }

    this.route.paramMap.subscribe(params => {
      const param = params.get('contractId');

      if (!param) {
        this.setFallbackData();
        return;
      }

      const id = +param;

      if (isNaN(id)) {
        this.setFallbackData();
        return;
      }

      this.contractId = id;

      // 🔥 LOAD CONTRACT DATA
      this.loadContractData(id);
    });
  }

  // ======================================================
  // 🔥 LOAD CONTRACT DATA
  // ======================================================
  private loadContractData(id: number): void {
    this.contractService.getFuneralService(id).subscribe({
      next: (contract) => {
        console.log('✅ PRINTING: Contract loaded:', contract);

        this.selectedContract = contract;
        this.mapContractToDisplay(contract);

        // 🔥 FORCE CHANGE DETECTION 
        this.cdr.markForCheck();

        // 🔥 MARK READY
        this.isReady = true;

        console.log('✅ Ready to print. Contract:', this.contract);

        // 🔥 PRINT AFTER EVERYTHING IS RENDERED
        setTimeout(() => {
          console.log('🖨️ Triggering print now');
          window.onafterprint = () => this.goBack();
          window.print();
        }, 500);
      },
      error: (err) => {
        console.error('❌ Error loading contract:', err);
        this.setFallbackData();
        this.isReady = true;
      }
    });
  }

  // ======================================================
  // 🔥 MAP CONTRACT DATA
  // ======================================================
  private mapContractToDisplay(contract: FuneralContract): void {
    const ageAtDeath = deceasedAgeAtDeath(contract.dateOfBirth, contract.dateOfDeath);

    this.contract = {
      time: new Date().toLocaleTimeString(),
      date: contract.contractDate 
        ? new Date(contract.contractDate).toLocaleDateString()
        : new Date().toLocaleDateString(),

      deceasedName: this.formatName(contract.firstName, contract.middleName, contract.lastName),
      dob: contract.dateOfBirth ? this.formatDate(contract.dateOfBirth) : 'N/A',
      dod: contract.dateOfDeath ? this.formatDate(contract.dateOfDeath) : 'N/A',
      age: ageAtDeath !== null ? ageAtDeath.toString() : 'N/A',

      authorizer: contract.contractee || 'N/A',
      address: contract.addressLine1 || 'N/A',
      placeOfDeath: contract.placeOfDeath || 'N/A',

      church: 'N/A', // Not directly in model
      burialDate: contract.dateOfBurial ? this.formatDate(contract.dateOfBurial) : 'N/A',
      cemetery: 'N/A', // Not directly in model
      relationship: contract.relationshipToDeceased || 'N/A',
      contractNo: contract.contractNo || 'N/A',
      officer: this.currentUser.name
    };
  }

  // ======================================================
  // 🔥 FALLBACK DATA
  // ======================================================
  private setFallbackData(): void {
    console.warn('⚠️ No contract data found, using fallback');
    this.contract = {
      time: new Date().toLocaleTimeString(),
      date: new Date().toLocaleDateString(),
      authorizer: 'N/A',
      deceasedName: 'N/A',
      dob: 'N/A',
      dod: 'N/A',
      age: 'N/A',
      placeOfDeath: 'N/A',
      address: 'N/A',
      church: 'N/A',
      burialDate: 'N/A',
      cemetery: 'N/A',
      relationship: 'N/A',
      contractNo: 'N/A',
      officer: this.currentUser.name
    };
    this.isReady = true;
  }

  // ======================================================
  // 🔥 HELPERS
  // ======================================================
  private formatName(first?: string | null, middle?: string | null, last?: string | null): string {
    const parts = [first, middle, last].filter(p => p && p.trim());
    return parts.length > 0 ? parts.join(' ').toUpperCase() : 'N/A';
  }

  private formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
    } catch {
      return dateStr;
    }
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

  print(): void {
    window.print();
  }

}

