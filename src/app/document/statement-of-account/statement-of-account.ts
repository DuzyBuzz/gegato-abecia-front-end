import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { PrintHeader } from '../print-header/print-header';

import { FuneralContract } from '../../models/funeral-contract.model';
import { FuneralPayment } from '../../models/funeral-payment.model';
import { ContractCharges } from '../../models/contract-charges.model';

import { FuneralContractService } from '../../services/funeral-contract.service';
import { FuneralPaymentsService } from '../../services/funeral-payments.service';
import { FuneralChargesService } from '../../services/funeral-charges.service';

import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { deceasedAgeAtDeath } from '../../utils/deceased-age.util';
import { getRoleLabel } from '../../utils/role-access.util';

interface StatementItem {
  description: string;
  amount?: number;
  discount?: number;
  payment?: number;
  paymentDate?: string;
  kind?: 'contract' | 'charge' | 'payment';
}
interface DisplayUser {
  name: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

@Component({
  selector: 'app-statement-of-account',
  standalone: true,
  imports: [PrintHeader, CommonModule],
  templateUrl: './statement-of-account.html',
  styleUrl: '../print-header/print-header.scss',
})
export class StatementOfAccount implements OnInit, OnDestroy {

  private readonly originalDocumentTitle = document.title;

  contractId: number | null = null;
  selectedContract: FuneralContract | null = null;

  isReady = false; // 🔥 control printing

  contract = {
    dod: '',
    checkedBy: '',
    contractee: '',
    address: '',
    deceasedName: '',
    deceasedAge: '',
    contractNo: '',
    officer: 'Officer in Charge',
    releasedBy: ''
  };

  items: StatementItem[] = [];
dateNow: Date = new Date();
  currentUser: DisplayUser = {
    name: 'User',
    role: 'Biller'
  };

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private contractService: FuneralContractService,
    private paymentService: FuneralPaymentsService,
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
        name: fullName || authUser.username || 'User',
        role: getRoleLabel(authUser.roleAccess),
        firstName: authUser.firstName,
        lastName: authUser.lastName
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

      // 🔥 LOAD EVERYTHING TOGETHER
      this.loadAllData(id);
    });
  }

  // ======================================================
  // 🔥 LOAD ALL DATA (CONTRACT + CHARGES + PAYMENTS)
  // ======================================================
  private loadAllData(id: number): void {
    forkJoin({
      contract: this.contractService.getFuneralService(id),
      charges: this.chargesService.getChargesByServiceId(id),
      payments: this.paymentService.getFuneralPaymentByServiceId(id)
    }).subscribe({
      next: ({ contract, charges, payments }) => {
        console.log('✅ ALL DATA LOADED:', { contract, charges, payments });

        this.selectedContract = contract;
        this.mapContract(contract);

        const contractItem = this.buildContractItem(contract);
        if (contractItem) {
          this.items = [...this.items, contractItem];
        }

        // Add charges to items
        const chargesArray: ContractCharges[] = Array.isArray(charges) ? charges : (charges ? [charges] : []);
        const chargeItems: StatementItem[] = chargesArray.map(c => ({
          description: String(c.description || '').trim() || 'Package Enclosions - No description',
          amount: this.calculateChargeAmount(c),
          discount: Number(c.discount) || 0,
          kind: 'charge'
        }));

        this.items = [...this.items, ...chargeItems];

        // Add payments to items
        const paymentArray: FuneralPayment[] = Array.isArray(payments)
          ? payments
          : (payments ? [payments] : []);

        const paymentItems: StatementItem[] = paymentArray.map(p => ({
          description: `Payment - OR: ${p.orNumber} || "" | AR: ${p.arNumber}`,
          payment: Number(p.amount || 0),
          paymentDate: this.formatPaymentDate(p.dateIssued),
          kind: 'payment'
        }));

        this.items = [...this.items, ...paymentItems];

        // 🔥 FORCE CHANGE DETECTION 
        this.cdr.markForCheck();

        // 🔥 MARK READY
        this.isReady = true;

        console.log('✅ Ready to print. Contract:', this.contract, 'Items:', this.items);

        // 🔥 PRINT AFTER EVERYTHING IS RENDERED (increased timeout)
        setTimeout(() => {
          console.log('🖨️ Triggering print now');
          this.printDocument(true);
        }, 500);
      },
      error: (err) => {
        console.error('❌ Failed loading data', err);
        this.setFallbackData();

        setTimeout(() => {
          this.printDocument();
        }, 500);
      }
    });
  }

  // ======================================================
  // 🔥 MAP CONTRACT
  // ======================================================
  private mapContract(contract: FuneralContract): void {

    const fullName = `${contract.firstName || ''} ${contract.middleName || ''} ${contract.lastName || ''}`.trim();

    const address = String(contract.addressLine1 || '').trim() || [
      contract.baranggay,
      contract.municipality,
      contract.province
    ].filter(Boolean).join(', ');

    const atDeath = deceasedAgeAtDeath(contract.dateOfBirth, contract.dateOfDeath);

    this.contract = {
      dod: contract.dateOfDeath || '',
      checkedBy: contract.checkedBy || '',
      contractee: contract.contractee || '',
      address: address || '',
      deceasedName: fullName || '',
      deceasedAge: atDeath !== null ? String(atDeath) : '',
      contractNo: contract.contractNo || '',
      officer: contract.checkedBy || 'Officer in Charge',
      releasedBy: contract.releasedBy || ''
    };

    // Initialize items array (charges and payments will be added in loadAllData)
    this.items = [];
  }

  private buildContractItem(contract: FuneralContract): StatementItem | null {
    const amount = Number(contract.price) || 0;
    const discount = Number(contract.discount) || 0;

    if (amount <= 0 && discount <= 0) {
      return null;
    }

    const casket = String(contract.casket || '').trim();
    const urn = String(contract.urnType || contract.urnDescription || '').trim();
    const casketAvailability = String(contract.casketAvailable || '').trim();
    const serviceType = String(contract.type || '').trim() || 'Service type not specified';

    const itemLabel = casket ? '' : (urn ? '' : 'Package Enclosions');
    const itemValue = casket || urn || String(contract.type || '').trim() || 'Not specified';
    const availabilityText = casketAvailability ? ` -  ${casketAvailability}` : '';

    return {
      description: `${serviceType} - ${itemLabel}: ${itemValue}${availabilityText}`,
      amount,
      discount,
      kind: 'contract',
    };
  }

  // ======================================================
  // 🔥 CALCULATE CHARGE AMOUNT
  // ======================================================
  private calculateChargeAmount(charge: ContractCharges): number {
    const qty = Number(charge.quantity) || 0;
    const price = Number(charge.unitPrice) || 0;
    return qty * price;
  }

  // ======================================================
  // 🔥 FALLBACK
  // ======================================================
  private setFallbackData(): void {
    this.contract = {
      dod: '',
      checkedBy: '',
      contractee: '',
      address: '',
      deceasedName: '',
      deceasedAge: '',
      contractNo: '',
      officer: 'Officer in Charge',
      releasedBy: ''
    };

    this.items = [
      { description: 'No data available', amount: 0 }
    ];
  }

  // ======================================================
  // 🔥 TOTALS
  // ======================================================
  get totalAmount(): number {
    return this.items.reduce((sum, i) => sum + (i.amount || 0), 0);
  }

  get contractBaseAmount(): number {
    return this.items
      .filter((item) => item.kind === 'contract')
      .reduce((sum, item) => sum + (item.amount || 0), 0);
  }

  get contractBaseDiscount(): number {
    return this.items
      .filter((item) => item.kind === 'contract')
      .reduce((sum, item) => sum + (item.discount || 0), 0);
  }

  get additionalChargesAmount(): number {
    return this.items
      .filter((item) => item.kind === 'charge')
      .reduce((sum, item) => sum + (item.amount || 0), 0);
  }

  get additionalChargesDiscount(): number {
    return this.items
      .filter((item) => item.kind === 'charge')
      .reduce((sum, item) => sum + (item.discount || 0), 0);
  }

  get packageEnclosionsAmount(): number {
    return this.additionalChargesAmount;
  }

  get packageEnclosionsDiscount(): number {
    return this.additionalChargesDiscount;
  }

  get totalDiscount(): number {
    return this.items.reduce((sum, i) => sum + (i.discount || 0), 0);
  }

  get totalPayments(): number {
    return this.items.reduce((sum, i) => sum + (i.payment || 0), 0);
  }

  get subtotalBeforePayments(): number {
    return this.totalAmount - this.totalDiscount;
  }

  get balanceDue(): number {
    return this.totalAmount - this.totalDiscount - this.totalPayments;
  }

  // ======================================================
  // 🔥 CLEANUP
  // ======================================================
  ngOnDestroy(): void {
    document.title = this.originalDocumentTitle;
    window.onafterprint = null;
  }

  // ======================================================
  // 🔥 NAVIGATION
  // ======================================================
  private goBack(): void {
    this.location.back();
  }

  private formatPaymentDate(value: Date | string | null | undefined): string {
    if (!value) {
      return '';
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return typeof value === 'string' ? value : '';
    }

    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: '2-digit',
      year: 'numeric'
    });
  }

  print(): void {
    this.printDocument();
  }

  private printDocument(goBackAfterPrint = false): void {
    const previousTitle = document.title || this.originalDocumentTitle;
    document.title = '';

    window.onafterprint = () => {
      document.title = previousTitle;
      window.onafterprint = null;

      if (goBackAfterPrint) {
        this.goBack();
      }
    };

    window.print();
  }
}