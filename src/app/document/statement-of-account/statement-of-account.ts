import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { PrintHeader } from '../print-header/print-header';

import { FuneralContract } from '../../models/funeral-contract.model';
import { FuneralPayment } from '../../models/funeral-payment.model';

import { FuneralContractService } from '../../services/funeral-contract.service';
import { FuneralPaymentsService } from '../../services/funeral-payments.service';

import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { deceasedAgeAtDeath } from '../../utils/deceased-age.util';

interface StatementItem {
  description: string;
  amount?: number;
  discount?: number;
  payment?: number;
  paymentDate?: string;
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

  contractId: number | null = null;
  selectedContract: FuneralContract | null = null;

  isReady = false; // 🔥 control printing

  contract = {
    dod: 'N/A',
    checkedBy: 'N/A',
    contractee: 'N/A',
    address: 'N/A',
    deceasedName: 'N/A',
    deceasedAge: 'N/A',
    contractNo: 'N/A',
    officer: 'Officer in Charge',
    releasedBy: 'N/A'
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
        role: authUser.role || 'Biller',
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
  // 🔥 LOAD ALL DATA (CONTRACT + PAYMENTS)
  // ======================================================
  private loadAllData(id: number): void {
    forkJoin({
      contract: this.contractService.getFuneralService(id),
      payments: this.paymentService.getFuneralPaymentByServiceId(id)
    }).subscribe({
      next: ({ contract, payments }) => {
        console.log('✅ ALL DATA LOADED:', { contract, payments });

        this.selectedContract = contract;
        this.mapContract(contract);

        const paymentArray: FuneralPayment[] = Array.isArray(payments)
          ? payments
          : [payments];

        const paymentItems: StatementItem[] = paymentArray.map(p => ({
          description: p.description  || '',
          payment: Number(p.amount || 0),
          paymentDate: typeof p.dateIssued === 'string'
            ? p.dateIssued
            : (p.dateIssued?.toString() || '')
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
          window.onafterprint = () => this.goBack();
          window.print();
        }, 500);
      },
      error: (err) => {
        console.error('❌ Failed loading data', err);
        this.setFallbackData();

        setTimeout(() => {
          window.print();
        }, 500);
      }
    });
  }

  // ======================================================
  // 🔥 MAP CONTRACT
  // ======================================================
  private mapContract(contract: FuneralContract): void {

    const fullName = `${contract.firstName || ''} ${contract.middleName || ''} ${contract.lastName || ''}`.trim();

    const address = [
      contract.baranggay,
      contract.municipality,
      contract.province
    ].filter(Boolean).join(', ');

    const atDeath = deceasedAgeAtDeath(contract.dateOfBirth, contract.dateOfDeath);

    this.contract = {
      dod: contract.dateOfDeath || 'N/A',
      checkedBy: contract.checkedBy || 'N/A',
      contractee: contract.contractee || 'N/A',
      address: address || 'N/A',
      deceasedName: fullName || 'N/A',
      deceasedAge: atDeath !== null ? String(atDeath) : 'N/A',
      contractNo: contract.contractNo || 'N/A',
      officer: contract.checkedBy || 'Officer in Charge',
      releasedBy: contract.releasedBy || 'N/A'
    };

    this.items = [];

    this.items.push({
      description: `Funeral Service - ${contract.type || ''}`,
      amount: Number(contract.price || 0)
    });

    if (contract.discount && Number(contract.discount) > 0) {
      this.items.push({
        description: 'Discount',
        discount: Number(contract.discount)
      });
    }
  }

  // ======================================================
  // 🔥 FALLBACK
  // ======================================================
  private setFallbackData(): void {
    this.contract = {
      dod: 'N/A',
      checkedBy: 'N/A',
      contractee: 'N/A',
      address: 'N/A',
      deceasedName: 'N/A',
      deceasedAge: 'N/A',
      contractNo: 'N/A',
      officer: 'Officer in Charge',
      releasedBy: 'N/A'
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

  get totalDiscount(): number {
    return this.items.reduce((sum, i) => sum + (i.discount || 0), 0);
  }

  get totalPayments(): number {
    return this.items.reduce((sum, i) => sum + (i.payment || 0), 0);
  }

  get balanceDue(): number {
    return this.totalAmount - this.totalDiscount - this.totalPayments;
  }

  // ======================================================
  // 🔥 CLEANUP
  // ======================================================
  ngOnDestroy(): void {
    window.onafterprint = null;
  }

  // ======================================================
  // 🔥 NAVIGATION
  // ======================================================
  private goBack(): void {
    this.location.back();
  }
}