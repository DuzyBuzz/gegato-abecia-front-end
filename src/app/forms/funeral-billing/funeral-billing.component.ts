import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputNumberModule } from 'primeng/inputnumber';

import { ContractCharges } from '../../models/contract-charges.model';
import { FuneralContract } from '../../models/funeral-contract.model';
import { FuneralPayment } from '../../models/funeral-payment.model';
import { FuneralChargesService } from '../../services/funeral-charges.service';
import { FuneralContractService } from '../../services/funeral-contract.service';
import { FuneralPaymentsService } from '../../services/funeral-payments.service';
import { AuthService } from '../../services/auth.service';
import { SelectHelperComponent } from '../../shared/components/select-helper/select-helper.component';

interface ChargeRow extends ContractCharges {
  uiKey?: string;
  isEditing?: boolean;
  _backup?: Partial<ChargeRow>;
}

interface PricingDraft {
  price: number;
  discount: number;
}

interface ServiceDetailsDraft {
  type: string;
  casket: string;
  casketAvailable: string;
  uniform: string;
  urnType: string;
  urnDescription: string;
}

@Component({
  selector: 'app-funeral-billing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToastModule,
    ButtonModule,
    ConfirmDialogModule,
    InputNumberModule,
    SelectHelperComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './funeral-billing.component.html',
  styleUrl: './funeral-billing.component.scss',
})
export class FuneralBillingComponent implements OnInit {
  serviceId = 0;
  FuneralContract: FuneralContract | null = null;
  editedContract: Partial<FuneralContract> = {};
  charges: ChargeRow[] = [];
  payments: FuneralPayment[] = [];

  editMode = false;
  pricingEditMode = false;
  serviceDetailsEditMode = false;
  isChargesSectionVisible = true;
  isPaymentsSectionVisible = false;
  loading = false;
  totalPaid = 0;
  balanceRemaining = 0;
  pricingDraft: PricingDraft = this.createPricingDraft();
  serviceDetailsDraft: ServiceDetailsDraft = this.createServiceDetailsDraft();

  private chargeKeyCounter = 0;

  constructor(
    private funeralChargesService: FuneralChargesService,
    private funeralContractService: FuneralContractService,
    private funeralPaymentsService: FuneralPaymentsService,
    private auth: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('contractId'));

      if (!id || id <= 0) {
        console.error('Invalid contractId');
        return;
      }

      if (this.auth.isAccounting()) {
        void this.router.navigateByUrl(this.auth.getContractPaymentsRoute(id));
        return;
      }

      if (!this.canViewBilling) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Access denied',
          detail: 'You do not have access to this billing record.',
        });
        void this.router.navigateByUrl(this.auth.getHomeRoute());
        return;
      }

      this.serviceId = id;

      this.funeralContractService.getFuneralService(id).subscribe({
        next: (contract) => {
          this.FuneralContract = contract;
          this.cdr.markForCheck();
          this.loadChargesData();
          this.loadPaymentsSummary();
        },
        error: (err) => {
          console.error('Failed to load contract', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load contract billing details.',
          });
        },
      });
    });
  }

  private loadChargesData(): void {
    if (!this.serviceId) {
      this.charges = [];
      this.computeBalance();
      return;
    }

    this.funeralChargesService.getChargesByServiceId(this.serviceId).subscribe({
      next: (res) => this.applyChargesResponse(res),
      error: () => {
        this.charges = this.canEditCharges ? [this.buildNewChargeRow()] : [];
        this.refreshChargeTable();
      },
    });
  }

  private loadPaymentsSummary(): void {
    if (!this.serviceId) {
      this.payments = [];
      this.computeBalance();
      return;
    }

    this.funeralPaymentsService.getFuneralPaymentByServiceId(this.serviceId).subscribe({
      next: (res) => {
        this.payments = this.toPaymentArray(res).sort((left, right) => {
          const leftTime = this.getPaymentTime(left);
          const rightTime = this.getPaymentTime(right);
          return rightTime - leftTime;
        });
        this.computeTotals();
      },
      error: () => {
        this.payments = [];
        this.computeTotals();
      },
    });
  }

  addCharge(): void {
    if (!this.canEditCharges) {
      this.showChargeAccessDenied();
      return;
    }

    this.charges = [...this.charges, this.buildNewChargeRow()];
    this.refreshChargeTable();
  }

  editCharge(charge: ChargeRow): void {
    if (!this.canEditCharges) {
      this.showChargeAccessDenied();
      return;
    }

    charge._backup = { ...charge };
    charge.isEditing = true;
  }

  saveCharge(charge: ChargeRow): void {
    if (!this.canEditCharges) {
      this.showChargeAccessDenied();
      return;
    }

    const isNew = !charge.id;
    this.confirmationService.confirm({
      header: isNew ? 'Save New Charge' : 'Save Charge Changes',
      message: isNew
        ? 'Do you want to save this new charge?'
        : 'Do you want to save changes to this charge?',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Save',
      rejectLabel: 'Cancel',
      accept: () => this.persistCharge(charge),
    });
  }

  private persistCharge(charge: ChargeRow): void {
    this.loading = true;

    const payload: ContractCharges = {
      ...charge,
      funeralContractId: this.serviceId,
    };

    this.funeralChargesService.save(payload).subscribe({
      next: (res) => {
        this.loading = false;
        Object.assign(charge, this.mapChargeRow(res, charge));
        charge.isEditing = false;
        charge._backup = undefined;
        this.refreshChargeTable();
        this.syncChargesSilently();

        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Charge saved',
        });
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Save failed',
        });
      },
    });
  }

  deleteCharge(index: number): void {
    if (!this.canEditCharges) {
      this.showChargeAccessDenied();
      return;
    }

    const charge = this.charges[index];
    const label = charge?.description || `#${index + 1}`;

    this.confirmationService.confirm({
      header: 'Delete Charge',
      message: `Are you sure you want to delete charge ${label}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      accept: () => this.performDeleteCharge(index),
    });
  }

  private performDeleteCharge(index: number): void {
    const charge = this.charges[index];

    if (charge.id) {
      this.loading = true;
      this.funeralChargesService.delete(charge.id).subscribe({
        next: () => {
          this.loading = false;
          this.charges = this.charges.filter((_, currentIndex) => currentIndex !== index);
          this.refreshChargeTable();
          this.syncChargesSilently();
          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Charge deleted successfully',
          });
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Delete Failed',
            detail: 'Unable to delete charge. Please try again.',
          });
          this.refreshChargeTable();
        },
      });
      return;
    }

    this.charges = this.charges.filter((_, currentIndex) => currentIndex !== index);
    this.refreshChargeTable();
    this.messageService.add({
      severity: 'success',
      summary: 'Removed',
      detail: 'Unsaved charge row removed',
    });
  }

  cancelCharge(charge: ChargeRow): void {
    if (!this.canEditCharges) {
      this.showChargeAccessDenied();
      return;
    }

    if (!charge.id && !charge._backup) {
      this.charges = this.charges.filter((currentCharge) => currentCharge !== charge);
      this.refreshChargeTable();
      return;
    }

    Object.assign(charge, charge._backup);
    charge.isEditing = false;
    this.refreshChargeTable();
  }

  getChargeAmount(charge: ChargeRow): number {
    const quantity = Number(charge.quantity) || 0;
    const unitPrice = Number(charge.unitPrice) || 0;
    const discount = Number(charge.discount) || 0;
    return (quantity * unitPrice) - discount;
  }

  getTotalCharges(): number {
    return this.charges.reduce((sum, charge) => sum + this.getChargeAmount(charge), 0);
  }

  getContractPrice(): number {
    return Number(this.FuneralContract?.price) || 0;
  }

  getContractDiscount(): number {
    return Number(this.FuneralContract?.discount) || 0;
  }

  getNetContractBase(): number {
    const price = this.billingSetupEditMode ? Number(this.pricingDraft.price) || 0 : this.getContractPrice();
    const discount = this.billingSetupEditMode ? Number(this.pricingDraft.discount) || 0 : this.getContractDiscount();
    return price - discount;
  }

  getGrandTotal(): number {
    return this.getContractPrice() - this.getContractDiscount() + this.getTotalCharges();
  }

  get latestPayment(): FuneralPayment | null {
    return this.payments[0] || null;
  }

  get recentPayments(): FuneralPayment[] {
    return this.payments.slice(0, 5);
  }

  get paymentCount(): number {
    return this.payments.length;
  }

  printStatement(): void {
    if (!this.serviceId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Contract ID not found',
      });
      return;
    }

    this.router.navigate(['/print/statement-of-account', this.serviceId]);
  }

  openContract(): void {
    if (!this.serviceId) {
      return;
    }

    this.router.navigate([`${this.auth.getOperationsBaseRoute()}/forms/contracts/funeral-contract/${this.serviceId}`]);
  }

  openPayments(): void {
    if (!this.serviceId) {
      return;
    }

    this.router.navigateByUrl(this.auth.getContractPaymentsRoute(this.serviceId));
  }

  startPricingEdit(): void {
    this.startBillingSetupEdit();
  }

  startBillingSetupEdit(): void {
    if (!this.canEditPricing) {
      this.showChargeAccessDenied();
      return;
    }

    this.pricingDraft = this.createPricingDraft(this.FuneralContract);
    this.serviceDetailsDraft = this.createServiceDetailsDraft(this.FuneralContract);
    this.pricingEditMode = true;
    this.serviceDetailsEditMode = true;
  }

  savePricingEdit(): void {
    this.saveBillingSetupEdit();
  }

  saveBillingSetupEdit(): void {
    if (!this.canEditPricing) {
      this.showChargeAccessDenied();
      return;
    }

    this.confirmationService.confirm({
      header: 'Save Billing Setup',
      message: 'Do you want to save pricing and service details?',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Save',
      rejectLabel: 'Cancel',
      accept: () => this.persistBillingSetupEdit(),
    });
  }

  private persistBillingSetupEdit(): void {
    this.persistContractUpdate(
      {
        price: Number(this.pricingDraft.price) || 0,
        discount: Number(this.pricingDraft.discount) || 0,
        type: this.serviceDetailsDraft.type || null,
        casket: this.serviceDetailsDraft.casket || null,
        casketAvailable: this.serviceDetailsDraft.casketAvailable || null,
        uniform: this.serviceDetailsDraft.uniform || null,
        urnType: this.serviceDetailsDraft.urnType || null,
        urnDescription: this.serviceDetailsDraft.urnDescription || null,
      },
      'Billing setup saved successfully',
      () => {
        this.pricingEditMode = false;
        this.serviceDetailsEditMode = false;
        this.pricingDraft = this.createPricingDraft(this.FuneralContract);
        this.serviceDetailsDraft = this.createServiceDetailsDraft(this.FuneralContract);
      }
    );
  }

  private persistPricingEdit(): void {
    this.persistContractUpdate(
      {
        price: Number(this.pricingDraft.price) || 0,
        discount: Number(this.pricingDraft.discount) || 0,
      },
      'Contract pricing saved successfully',
      () => {
        this.pricingEditMode = false;
        this.pricingDraft = this.createPricingDraft(this.FuneralContract);
      }
    );
  }

  cancelPricingEdit(): void {
    this.cancelBillingSetupEdit();
  }

  cancelBillingSetupEdit(): void {
    this.pricingEditMode = false;
    this.serviceDetailsEditMode = false;
    this.pricingDraft = this.createPricingDraft(this.FuneralContract);
    this.serviceDetailsDraft = this.createServiceDetailsDraft(this.FuneralContract);
  }

  startServiceDetailsEdit(): void {
    if (!this.canEditServiceDetails) {
      this.showChargeAccessDenied();
      return;
    }

    this.serviceDetailsDraft = this.createServiceDetailsDraft(this.FuneralContract);
    this.serviceDetailsEditMode = true;
  }

  saveServiceDetailsEdit(): void {
    if (!this.canEditServiceDetails) {
      this.showChargeAccessDenied();
      return;
    }

    this.confirmationService.confirm({
      header: 'Save Service Details',
      message: 'Do you want to save the service and casket/urn details?',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Save',
      rejectLabel: 'Cancel',
      accept: () => this.persistServiceDetailsEdit(),
    });
  }

  private persistServiceDetailsEdit(): void {
    this.persistContractUpdate(
      {
        type: this.serviceDetailsDraft.type || null,
        casket: this.serviceDetailsDraft.casket || null,
        casketAvailable: this.serviceDetailsDraft.casketAvailable || null,
        uniform: this.serviceDetailsDraft.uniform || null,
        urnType: this.serviceDetailsDraft.urnType || null,
        urnDescription: this.serviceDetailsDraft.urnDescription || null,
      },
      'Service and casket/urn details saved successfully',
      () => {
        this.serviceDetailsEditMode = false;
        this.serviceDetailsDraft = this.createServiceDetailsDraft(this.FuneralContract);
      }
    );
  }

  cancelServiceDetailsEdit(): void {
    this.serviceDetailsEditMode = false;
    this.serviceDetailsDraft = this.createServiceDetailsDraft(this.FuneralContract);
  }

  startEdit(): void {
    if (!this.canEditRemarks) {
      this.showChargeAccessDenied();
      return;
    }

    if (!this.FuneralContract) {
      return;
    }

    this.editedContract = {
      billingRemarks: this.FuneralContract.billingRemarks || '',
    };
    this.editMode = true;
  }

  saveEdit(): void {
    if (!this.canEditRemarks) {
      this.showChargeAccessDenied();
      return;
    }

    if (!this.editedContract) {
      return;
    }

    this.confirmationService.confirm({
      header: 'Save Contract Remarks',
      message: 'Do you want to save your billing remarks changes?',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Save',
      rejectLabel: 'Cancel',
      accept: () => this.persistContractEdit(),
    });
  }

  private persistContractEdit(): void {
    this.persistContractUpdate(
      {
        billingRemarks: this.editedContract.billingRemarks || '',
      },
      'Billing remarks saved successfully',
      () => {
        this.editMode = false;
        this.editedContract = {};
      }
    );
  }

  cancelEdit(): void {
    this.editMode = false;
    this.editedContract = {};
  }

  get canViewBilling(): boolean {
    return this.auth.canManageCharges();
  }

  get canEditCharges(): boolean {
    return this.auth.canManageCharges();
  }

  get canEditPricing(): boolean {
    return this.auth.canManageFuneralContracts();
  }

  get canEditServiceDetails(): boolean {
    return this.auth.canManageFuneralContracts();
  }

  get canEditRemarks(): boolean {
    return this.auth.canManageFuneralContracts();
  }

  get canOpenPayments(): boolean {
    return this.auth.canManagePayments();
  }

  get billingSetupEditMode(): boolean {
    return this.pricingEditMode || this.serviceDetailsEditMode;
  }

  trackByChargeRow = (_index: number, charge: ChargeRow): string | number => {
    return charge.uiKey || charge.id || _index;
  };

  trackByPaymentRow = (_index: number, row: FuneralPayment): number | string => {
    return row.id || `${row.controlNumber || 'payment'}-${_index}`;
  };

  private computeTotals(): void {
    this.totalPaid = this.payments.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
    this.computeBalance();
    this.cdr.markForCheck();
  }

  private computeBalance(): void {
    const totalDue = this.getGrandTotal();
    this.balanceRemaining = Math.max(0, totalDue - this.totalPaid);
  }

  private buildNewChargeRow(): ChargeRow {
    return {
      uiKey: this.nextChargeKey(),
      funeralContractId: this.serviceId,
      chargeType: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      createdBy: '',
      updatedBy: '',
      isEditing: true,
    };
  }

  private mapChargeRow(charge: ContractCharges, existing?: ChargeRow): ChargeRow {
    return {
      uiKey: existing?.uiKey || this.nextChargeKey(),
      id: charge.id,
      funeralContractId: this.serviceId,
      chargeType: charge.chargeType || '',
      description: charge.description || '',
      quantity: charge.quantity || 0,
      unitPrice: charge.unitPrice || 0,
      discount: charge.discount || 0,
      createdBy: charge.createdBy || '',
      updatedBy: charge.updatedBy || '',
      createdOn: charge.createdOn,
      createdAt: charge.createdAt,
      isEditing: false,
    };
  }

  private applyChargesResponse(res: ContractCharges[] | ContractCharges): void {
    const existingById = new Map(
      this.charges
        .filter((charge): charge is ChargeRow & { id: number } => typeof charge.id === 'number')
        .map((charge) => [charge.id, charge])
    );

    const editingChargesById = new Map(
      this.charges
        .filter((charge): charge is ChargeRow & { id: number } => charge.isEditing === true && typeof charge.id === 'number')
        .map((charge) => [charge.id, charge])
    );

    const draftCharges = this.charges.filter((charge) => charge.isEditing && !charge.id);
    const mappedCharges = this.toChargeArray(res).map((charge) => {
      if (typeof charge.id === 'number' && editingChargesById.has(charge.id)) {
        return editingChargesById.get(charge.id)!;
      }

      return this.mapChargeRow(
        charge,
        typeof charge.id === 'number' ? existingById.get(charge.id) : undefined
      );
    });

    this.charges = mappedCharges.length > 0
      ? [...mappedCharges, ...draftCharges]
      : (draftCharges.length > 0 ? draftCharges : (this.canEditCharges ? [this.buildNewChargeRow()] : []));

    this.refreshChargeTable();
  }

  private refreshChargeTable(): void {
    this.charges = [...this.charges];
    this.computeBalance();
    this.cdr.markForCheck();
  }

  private persistContractUpdate(
    updates: Partial<FuneralContract>,
    successDetail: string,
    onSuccess: () => void
  ): void {
    if (!this.FuneralContract) {
      return;
    }

    this.loading = true;

    const payload: FuneralContract = {
      ...this.FuneralContract,
      ...updates,
    };

    this.funeralContractService.save(payload).subscribe({
      next: (res: FuneralContract) => {
        this.loading = false;
        this.FuneralContract = res;
        onSuccess();
        this.computeBalance();
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: successDetail,
        });
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save contract billing details',
        });
      },
    });
  }

  private syncChargesSilently(): void {
    if (!this.serviceId) {
      return;
    }

    this.funeralChargesService.getChargesByServiceId(this.serviceId).subscribe({
      next: (res) => this.applyChargesResponse(res),
      error: (err) => console.warn('[FuneralBilling] Silent charge sync failed', err),
    });
  }

  private toChargeArray(res: ContractCharges[] | ContractCharges | null | undefined): ContractCharges[] {
    if (!res) {
      return [];
    }

    return (Array.isArray(res) ? res : [res]).filter((charge): charge is ContractCharges => !!charge);
  }

  private toPaymentArray(res: FuneralPayment | FuneralPayment[] | null | undefined): FuneralPayment[] {
    if (!res) {
      return [];
    }

    return (Array.isArray(res) ? res : [res]).filter((payment): payment is FuneralPayment => !!payment);
  }

  private getPaymentTime(payment: FuneralPayment): number {
    const candidate = payment.dateIssued || payment.checkDate;
    if (!candidate) {
      return 0;
    }

    return new Date(candidate).getTime() || 0;
  }

  private nextChargeKey(): string {
    this.chargeKeyCounter += 1;
    return `charge-${this.chargeKeyCounter}`;
  }

  private createPricingDraft(contract?: FuneralContract | null): PricingDraft {
    return {
      price: Number(contract?.price) || 0,
      discount: Number(contract?.discount) || 0,
    };
  }

  private createServiceDetailsDraft(contract?: FuneralContract | null): ServiceDetailsDraft {
    return {
      type: contract?.type || '',
      casket: contract?.casket || '',
      casketAvailable: contract?.casketAvailable || '',
      uniform: contract?.uniform || '',
      urnType: contract?.urnType || '',
      urnDescription: contract?.urnDescription || '',
    };
  }

  private showChargeAccessDenied(): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Read only',
      detail: 'Billing updates are limited to Biller and Admin users.',
    });
  }

}
