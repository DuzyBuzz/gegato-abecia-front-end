import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PrintHeader } from "../print-header/print-header";
import { CommonModule, Location } from '@angular/common';
import { FuneralContract } from '../../models/funeral-contract.model';
import { ContractCharges } from '../../models/contract-charges.model';
import { FuneralContractService } from '../../services/funeral-contract.service';
import { FuneralChargesService } from '../../services/funeral-charges.service';
import { deceasedAgeAtDeath } from '../../utils/deceased-age.util';
import { AuthService } from '../../services/auth.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-funeral-service-contract-printing',
  imports: [PrintHeader, CommonModule],
  templateUrl: './funeral-service-contract-printing.html',
  styleUrl: '../print-header/print-header.scss',
})
export class FuneralServiceContractPrinting implements OnInit, OnDestroy {
  contractId: number | null = null;
  selectedContract: FuneralContract | null = null;
  isReady = false; // 🔥 control printing
  currentUser = {
    name: 'Officer in Charge',
    role: 'Biller'
  };

  contract = {
    time: new Date().toLocaleTimeString(),
    date: new Date().toLocaleDateString('en-US', { year: '2-digit', month: '2-digit', day: '2-digit' }),

    casket: 'N/A',
    casketDescription: 'N/A',
    price: 'N/A',

    deceasedName: 'N/A',
    dob: 'N/A',
    dod: 'N/A',
    age: 'N/A',

    address: 'N/A',
    placeOfDeath: 'N/A',

    wake: 'N/A',
    church: 'N/A',
    burialDate: 'N/A',
    cemetery: 'N/A',

    contractee: 'N/A',
    relationship: 'N/A',
    contactNo: 'N/A',
    deliveryDate: 'N/A',
    contractNo: 'N/A',
    officer: 'Officer in Charge'
  };

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private contractService: FuneralContractService,
    private chargesService: FuneralChargesService,
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
      this.loadPrintData(id);
    });
  }

  // ======================================================
  // 🔥 LOAD CONTRACT DATA
  // ======================================================
  private loadPrintData(id: number): void {
    forkJoin({
      contract: this.contractService.getFuneralService(id),
      charges: this.chargesService.getChargesByServiceId(id).pipe(
        catchError((err) => {
          console.warn('⚠️ Unable to load charges for print view, using contract fallback price.', err);
          return of([] as ContractCharges[]);
        })
      )
    }).subscribe({
      next: ({ contract, charges }) => {
        console.log('✅ PRINTING: Contract and charges loaded:', { contract, charges });

        this.selectedContract = contract;
        this.mapContract(contract, charges);

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
  private mapContract(contract: FuneralContract, charges: ContractCharges[] = []): void {
    const atDeath = deceasedAgeAtDeath(contract.dateOfBirth, contract.dateOfDeath);
    const ageValue = atDeath !== null ? atDeath.toString() : 'N/A';

    const burialOrCremationDate = contract.dateOfBurial || contract.cremationDate || null;
    const totalCharges = this.getTotalCharges(charges);
    const hasChargeLines = this.hasChargeLines(charges);

    this.contract = {
      time: new Date().toLocaleTimeString(),
      date: contract.contractDate 
        ? new Date(contract.contractDate).toLocaleDateString('en-US', { year: '2-digit', month: '2-digit', day: '2-digit' })
        : new Date().toLocaleDateString('en-US', { year: '2-digit', month: '2-digit', day: '2-digit' }),

      casket: contract.casket || 'N/A',
      casketDescription: contract.urnDescription || 'N/A',
      price: hasChargeLines
        ? `PHP ${this.formatCurrency(totalCharges)}`
        : this.formatLegacyPrice(contract.price),

      deceasedName: this.formatName(contract.firstName, contract.middleName, contract.lastName),
      dob: contract.dateOfBirth ? this.formatDate(contract.dateOfBirth) : 'N/A',
      dod: contract.dateOfDeath ? this.formatDate(contract.dateOfDeath) : 'N/A',
      age: ageValue,

      address: contract.addressLine1 || 'N/A',
      placeOfDeath: contract.placeOfDeath || 'N/A',

      wake: contract.transferAddress || 'N/A',
      church: contract.church || 'N/A',
      burialDate: burialOrCremationDate ? this.formatDate(burialOrCremationDate) : 'N/A',
      cemetery: contract.cementary || 'N/A',

      contractee: contract.contractee || 'N/A',
      relationship: contract.relationshipToDeceased || 'N/A',
      contactNo: contract.contactNo || 'N/A',
      deliveryDate: contract.deliveryDate ? this.formatDate(contract.deliveryDate) : 'N/A',
      contractNo: contract.contractNo || 'N/A',
      officer: this.currentUser.name
    };
  }

  private hasChargeLines(charges: ContractCharges[]): boolean {
    return charges.some((charge) => {
      return !!(
        charge.id ||
        (charge.description && charge.description.trim()) ||
        (charge.chargeType && charge.chargeType.trim()) ||
        Number(charge.quantity) ||
        Number(charge.unitPrice) ||
        Number(charge.discount)
      );
    });
  }

  private getTotalCharges(charges: ContractCharges[]): number {
    return charges.reduce((sum, charge) => sum + this.getChargeAmount(charge), 0);
  }

  private getChargeAmount(charge: ContractCharges): number {
    const qty = Number(charge.quantity) || 0;
    const price = Number(charge.unitPrice) || 0;
    const discount = Number(charge.discount) || 0;
    return (qty * price) - discount;
  }

  private formatLegacyPrice(amount?: number | null): string {
    return amount !== null && amount !== undefined
      ? `PHP ${this.formatCurrency(amount)}`
      : 'N/A';
  }

  // ======================================================
  // 🔥 FALLBACK DATA
  // ======================================================
  private setFallbackData(): void {
    console.warn('⚠️ No contract data found, using fallback');
    this.isReady = true;
    // contract object already has fallback values
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

  private formatCurrency(amount: number): string {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /* ================= AUTO PRINT ================= */

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
