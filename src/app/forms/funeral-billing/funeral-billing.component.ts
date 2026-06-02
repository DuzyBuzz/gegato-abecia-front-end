import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { SelectHelperComponent } from '../../shared/components/select-helper/select-helper.component';
import { firstValueFrom } from 'rxjs';

import { ContractCharges } from '../../models/contract-charges.model';
import { FuneralContract } from '../../models/funeral-contract.model';
import { FuneralPayment } from '../../models/funeral-payment.model';
import { ServiceRequestType } from '../../models/service-request.model';
import { FuneralChargesService } from '../../services/funeral-charges.service';
import { FuneralContractService } from '../../services/funeral-contract.service';
import { FuneralPaymentsService } from '../../services/funeral-payments.service';
import { ServiceRequestService } from '../../services/service-request.service';
import { AuthService } from '../../services/auth.service';

interface ChargeRow extends ContractCharges {
  uiKey?: string;
  isEditing?: boolean;
  isDeleted?: boolean;
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
  financialAssitance: string;
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
    DialogModule,
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

  // Request Change dialog
  requestDialogVisible = false;
  submittingRequest = false;
  requestDraft: { type: ServiceRequestType | ''; newValue: unknown; notes: string } = {
    type: '',
    newValue: null,
    notes: '',
  };

  private chargeKeyCounter = 0;
  private chargeOriginalById = new Map<number, ContractCharges>();

  constructor(
    private funeralChargesService: FuneralChargesService,
    private funeralContractService: FuneralContractService,
    private funeralPaymentsService: FuneralPaymentsService,
    private serviceRequestService: ServiceRequestService,
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
          this.pricingDraft = this.createPricingDraft(contract);
          this.serviceDetailsDraft = this.createServiceDetailsDraft(contract);
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
        this.charges = [];
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
      this.openRequestForBlockedBillingAction('charge-update');
      this.showChargeAccessDenied();
      return;
    }

    this.charges = [...this.charges.filter((row) => !this.isChargeRowEmpty(row)), this.buildNewChargeRow()];
    this.ensureTrailingEmptyChargeRow();
    this.refreshChargeTable();
  }

  saveBilling(): void {
    if (!this.hasPendingBillingChanges) {
      this.messageService.add({
        severity: 'info',
        summary: 'No changes',
        detail: 'There are no billing changes to save.',
      });
      return;
    }

    this.confirmationService.confirm({
      header: 'Save Billing',
      message: 'Do you want to save and finalize all billing changes?',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Save Billing',
      rejectLabel: 'Cancel',
      accept: () => void this.persistBillingChanges(),
    });
  }

  onChargeRowFocus(index: number): void {
    if (!this.canEditCharges) {
      return;
    }

    if (index === this.charges.length - 1 && this.isChargeRowEmpty(this.charges[index])) {
      this.charges = [...this.charges, this.buildNewChargeRow()];
      this.refreshChargeTable();
    }
  }

  onChargeRowInput(index: number): void {
    if (!this.canEditCharges) {
      return;
    }

    if (index === this.charges.length - 1 && !this.isChargeRowEmpty(this.charges[index])) {
      this.charges = [...this.charges, this.buildNewChargeRow()];
    }

    this.refreshChargeTable();
  }

  async saveAllCharges(): Promise<void> {
    await this.persistAllCharges();
  }

  private async persistBillingChanges(): Promise<void> {
    if (!this.FuneralContract) {
      return;
    }

    this.loading = true;

    try {
      await this.persistBillingSetupChanges();
      await this.persistAllCharges(false, false);

      this.messageService.add({
        severity: 'success',
        summary: 'Saved',
        detail: 'Billing changes saved successfully.',
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save billing changes.',
      });
    } finally {
      this.loading = false;
    }
  }

  private async persistBillingSetupChanges(): Promise<void> {
    const updates: Partial<FuneralContract> = {
      price: Number(this.pricingDraft.price) || 0,
      discount: Number(this.pricingDraft.discount) || 0,
      type: this.serviceDetailsDraft.type || null,
      casket: this.serviceDetailsDraft.casket || null,
      casketAvailable: this.serviceDetailsDraft.casketAvailable || null,
      financialAssitance: this.serviceDetailsDraft.financialAssitance || null,
      urnType: this.serviceDetailsDraft.urnType || null,
      urnDescription: this.serviceDetailsDraft.urnDescription || null,
    };

    const hasSetupChanges = (Object.keys(updates) as Array<keyof FuneralContract>).some((fieldKey) => {
      const currentValue = this.FuneralContract?.[fieldKey];
      return this.hasFieldChanged(currentValue, updates[fieldKey]);
    });

    if (!hasSetupChanges) {
      return;
    }

    if (!this.FuneralContract) {
      return;
    }

    if (this.auth.isAdmin()) {
      const savedContract = await this.persistContractUpdateAsync(updates);
      this.FuneralContract = savedContract;
      this.resetBillingSetupEditState();
      return;
    }

    const directUpdates: Partial<FuneralContract> = {};
    const requestChanges: Array<{ fieldKey: keyof FuneralContract; label: string; oldValue: unknown; newValue: unknown }> = [];

    const fieldLabelMap: Record<string, string> = {
      price: 'Contract Price',
      discount: 'Contract Discount',
      type: 'Type of Service',
      casket: 'Casket',
      casketAvailable: 'Casket Availability',
      financialAssitance: 'Financial Assistance',
      urnType: 'Urn Type',
      urnDescription: 'Urn Description',
    };

    (Object.keys(updates) as Array<keyof FuneralContract>).forEach((fieldKey) => {
      const newValue = updates[fieldKey];
      const oldValue = this.FuneralContract?.[fieldKey];

      if (!this.hasFieldChanged(oldValue, newValue)) {
        return;
      }

      if (this.isContractFieldInitialized(fieldKey, oldValue)) {
        requestChanges.push({
          fieldKey,
          label: fieldLabelMap[String(fieldKey)] || String(fieldKey),
          oldValue,
          newValue,
        });
        return;
      }

      (directUpdates as Record<string, unknown>)[String(fieldKey)] = newValue;
    });

    if (Object.keys(directUpdates).length > 0) {
      const savedContract = await this.persistContractUpdateAsync(directUpdates);
      this.FuneralContract = savedContract;
    }

    if (requestChanges.length > 0) {
      await this.submitContractFieldRequests(requestChanges, false);
    }

    this.resetBillingSetupEditState();
  }

  private async persistContractUpdateAsync(updates: Partial<FuneralContract>): Promise<FuneralContract> {
    if (!this.FuneralContract) {
      throw new Error('Missing contract');
    }

    const payload: FuneralContract = {
      ...this.FuneralContract,
      ...updates,
    };

    return await firstValueFrom(this.funeralContractService.save(payload));
  }

  private async persistAllCharges(showSuccessMessage = true, manageLoading = true): Promise<void> {
    if (!this.hasPendingChargeChanges) {
      if (showSuccessMessage) {
        this.messageService.add({
          severity: 'info',
          summary: 'No changes',
          detail: 'There are no enclosions changes to save.',
        });
      }
      return;
    }

    if (manageLoading) {
      this.loading = true;
    }

    const pendingRows = this.charges.filter((row) => this.isChargeRowDirty(row));
    if (pendingRows.length === 0) {
      if (manageLoading) {
        this.loading = false;
      }
      return;
    }

    try {
      for (const row of pendingRows) {
        if (row.isDeleted) {
          await this.deleteChargeOnce(row);

          this.charges = this.charges.filter((candidate) => candidate !== row);
          continue;
        }

        if (this.auth.isBiller() && this.isBillingInitialized && !!row.id) {
          await this.submitChargeUpdateRequest(row, false);
          continue;
        }

        await this.persistChargeOnce(row);
      }

      if (showSuccessMessage) {
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Enclosions changes processed successfully.',
        });
      }

      this.syncChargesSilently();
    } catch {
      if (showSuccessMessage) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save some enclosions changes.',
        });
      }
      throw new Error('Failed to persist charges');
    } finally {
      if (manageLoading) {
        this.loading = false;
      }
    }
  }

  private async deleteChargeOnce(charge: ChargeRow): Promise<void> {
    if (!charge.id) {
      return;
    }

    await firstValueFrom(this.funeralChargesService.delete(charge.id));
  }

  private async persistChargeOnce(charge: ChargeRow): Promise<void> {
    const payload: ContractCharges = {
      ...charge,
      funeralContractId: this.serviceId,
    };

    const res = await firstValueFrom(this.funeralChargesService.save(payload));
    Object.assign(charge, this.mapChargeRow(res, charge));
    charge.isEditing = false;
    charge._backup = undefined;
    this.refreshChargeTable();
  }

  editCharge(charge: ChargeRow): void {
    if (!this.canEditCharges) {
      this.openRequestForBlockedBillingAction('charge-update');
      this.showChargeAccessDenied();
      return;
    }

    charge._backup = { ...charge };
    charge.isEditing = true;
  }

  saveCharge(charge: ChargeRow): void {
    if (!this.canEditCharges) {
      this.openRequestForBlockedBillingAction('charge-update');
      this.showChargeAccessDenied();
      return;
    }

    if (this.auth.isBiller() && this.isBillingInitialized && !!charge.id) {
      this.confirmationService.confirm({
        header: 'Submit Charge Update Request',
        message: 'This charge is already initialized. Submit update for admin approval?',
        icon: 'pi pi-send',
        acceptLabel: 'Submit Request',
        rejectLabel: 'Cancel',
        accept: () => void this.submitChargeUpdateRequest(charge),
      });
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
      this.openRequestForBlockedBillingAction('charge-delete');
      this.showChargeAccessDenied();
      return;
    }

    const charge = this.charges[index];
    if (!charge) {
      return;
    }

    charge.isDeleted = !charge.isDeleted;
    charge.isEditing = false;
    charge._backup = undefined;

    this.refreshChargeTable();
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
    if (charge.isDeleted) {
      return 0;
    }

    const quantity = Number(charge.quantity) || 0;
    const unitPrice = Number(charge.unitPrice) || 0;
    const discount = Number(charge.discount) || 0;
    return (quantity * unitPrice) - discount;
  }

  getTotalCharges(): number {
    return this.charges.reduce((sum, charge) => sum + this.getChargeAmount(charge), 0);
  }

  getEnclosionsGrossTotal(): number {
    return this.charges.reduce((sum, charge) => {
      if (charge.isDeleted) {
        return sum;
      }

      const quantity = Number(charge.quantity) || 0;
      const unitPrice = Number(charge.unitPrice) || 0;
      return sum + (quantity * unitPrice);
    }, 0);
  }

  getBilledBaseTotal(): number {
    return this.getContractPrice() + this.getEnclosionsGrossTotal();
  }

  getContractPrice(): number {
    return Number(this.FuneralContract?.price) || 0;
  }

  getContractDiscount(): number {
    return Number(this.FuneralContract?.discount) || 0;
  }

  getTotalDiscount(): number {
    const chargeDiscount = this.charges.reduce((sum, charge) => sum + (charge.isDeleted ? 0 : (Number(charge.discount) || 0)), 0);
    return this.getContractDiscount() + chargeDiscount;
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
      this.openRequestForBlockedBillingAction('price-change');
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
    this.persistBillingSetupEdit();
  }

  private persistBillingSetupEdit(): void {
    const updates: Partial<FuneralContract> = {
      price: Number(this.pricingDraft.price) || 0,
      discount: Number(this.pricingDraft.discount) || 0,
      type: this.serviceDetailsDraft.type || null,
      casket: this.serviceDetailsDraft.casket || null,
      casketAvailable: this.serviceDetailsDraft.casketAvailable || null,
      financialAssitance: this.serviceDetailsDraft.financialAssitance || null,
      urnType: this.serviceDetailsDraft.urnType || null,
      urnDescription: this.serviceDetailsDraft.urnDescription || null,
    };

    if (!this.FuneralContract || this.auth.isAdmin()) {
      this.persistContractUpdate(
        updates,
        'Billing setup saved successfully',
        () => this.resetBillingSetupEditState()
      );
      return;
    }

    const directUpdates: Partial<FuneralContract> = {};
    const requestChanges: Array<{ fieldKey: keyof FuneralContract; label: string; oldValue: unknown; newValue: unknown }> = [];

    const fieldLabelMap: Record<string, string> = {
      price: 'Contract Price',
      discount: 'Contract Discount',
      type: 'Type of Service',
      casket: 'Casket',
      casketAvailable: 'Casket Availability',
      financialAssitance: 'Financial Assistance',
      urnType: 'Urn Type',
      urnDescription: 'Urn Description',
    };

    (Object.keys(updates) as Array<keyof FuneralContract>).forEach((fieldKey) => {
      const newValue = updates[fieldKey];
      const oldValue = this.FuneralContract?.[fieldKey];

      if (!this.hasFieldChanged(oldValue, newValue)) {
        return;
      }

      if (this.isContractFieldInitialized(fieldKey, oldValue)) {
        requestChanges.push({
          fieldKey,
          label: fieldLabelMap[String(fieldKey)] || String(fieldKey),
          oldValue,
          newValue,
        });
        return;
      }

      (directUpdates as Record<string, unknown>)[String(fieldKey)] = newValue;
    });

    if (Object.keys(directUpdates).length > 0) {
      this.persistContractUpdate(
        directUpdates,
        requestChanges.length > 0
          ? 'Some billing fields were initialized. Existing initialized fields were submitted for admin approval.'
          : 'Billing setup saved successfully',
        () => this.resetBillingSetupEditState()
      );
    } else {
      this.resetBillingSetupEditState();
    }

    if (requestChanges.length > 0) {
      void this.submitContractFieldRequests(requestChanges);
    }
  }

  startServiceDetailsEdit(): void {
    if (!this.canEditServiceDetails) {
      this.openRequestForBlockedBillingAction('contract-correction');
      this.showChargeAccessDenied();
      return;
    }

    this.serviceDetailsDraft = this.createServiceDetailsDraft(this.FuneralContract);
    this.serviceDetailsEditMode = true;
  }

  saveServiceDetailsEdit(): void {
    if (!this.canEditServiceDetails) {
      this.openRequestForBlockedBillingAction('contract-correction');
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
        financialAssitance: this.serviceDetailsDraft.financialAssitance || null,
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
    return this.auth.isAdmin() || this.auth.isBiller();
  }

  get canEditPricing(): boolean {
    return this.auth.isAdmin() || this.auth.isBiller();
  }

  get canEditServiceDetails(): boolean {
    return this.auth.isAdmin() || this.auth.isBiller();
  }

  get canEditRemarks(): boolean {
    return this.auth.isAdmin() || this.auth.isBiller();
  }

  get canRequestAdminChangeForBilling(): boolean {
    return this.auth.isBiller() && this.isBillingInitialized;
  }

  get hasPendingBillingChanges(): boolean {
    if (!this.FuneralContract) {
      return false;
    }

    const hasPricingChanges =
      this.hasFieldChanged(this.FuneralContract.price, this.pricingDraft.price)
      || this.hasFieldChanged(this.FuneralContract.discount, this.pricingDraft.discount);

    const hasServiceChanges = [
      'type',
      'casket',
      'casketAvailable',
      'financialAssitance',
      'urnType',
      'urnDescription',
    ].some((fieldKey) => {
      const currentValue = this.FuneralContract?.[fieldKey as keyof FuneralContract];
      const draftValue = this.serviceDetailsDraft[fieldKey as keyof typeof this.serviceDetailsDraft];
      return this.hasFieldChanged(currentValue, draftValue);
    });

    const hasChargeChanges = this.charges.some((row) => !this.isChargeRowEmpty(row) && this.isChargeRowDirty(row));

    return hasPricingChanges || hasServiceChanges || hasChargeChanges;
  }

  get hasPendingChargeChanges(): boolean {
    return this.charges.some((row) => !this.isChargeRowEmpty(row) && this.isChargeRowDirty(row));
  }

  get isBillingInitialized(): boolean {
    const hasPricing = this.getContractPrice() > 0 || this.getContractDiscount() > 0;
    const hasPersistedCharges = this.charges.some((charge) => !!charge.id);
    return hasPricing || hasPersistedCharges;
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
      quantity: 0,
      unitPrice: 0,
      discount: 0,
      createdBy: '',
      updatedBy: '',
      isEditing: true,
      isDeleted: false,
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
      isDeleted: existing?.isDeleted || false,
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

    const draftCharges = this.charges.filter((charge) => !charge.id && !this.isChargeRowEmpty(charge));
    const mappedCharges = this.toChargeArray(res).map((charge) => {
      if (typeof charge.id === 'number' && editingChargesById.has(charge.id)) {
        return editingChargesById.get(charge.id)!;
      }

      return this.mapChargeRow(
        charge,
        typeof charge.id === 'number' ? existingById.get(charge.id) : undefined
      );
    });

    this.chargeOriginalById = new Map(
      mappedCharges
        .filter((charge): charge is ChargeRow & { id: number } => typeof charge.id === 'number')
        .map((charge) => [charge.id, this.toRequestChargePayload(charge)])
    );

    this.charges = mappedCharges.length > 0
      ? [...mappedCharges, ...draftCharges]
      : (draftCharges.length > 0 ? draftCharges : []);

    this.ensureTrailingEmptyChargeRow();

    this.refreshChargeTable();
  }

  // ── Request Change Dialog ──────────────────────────────────────────

  openRequestChangeDialog(defaultType: ServiceRequestType | '' = ''): void {
    this.requestDraft = { type: defaultType, newValue: null, notes: '' };
    this.requestDialogVisible = true;
  }

  closeRequestDialog(): void {
    this.requestDialogVisible = false;
  }

  getCurrentValueForRequest(): string {
    switch (this.requestDraft.type) {
      case 'price-change':
        return `₱${this.getContractPrice().toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
      case 'discount-change':
        return `₱${this.getContractDiscount().toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
      case 'charge-update':
      case 'charge-delete':
        return `₱${this.getTotalCharges().toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
      default:
        return '—';
    }
  }

  async submitChangeRequest(): Promise<void> {
    if (!this.requestDraft.type || !this.serviceId) {
      return;
    }

    this.submittingRequest = true;
    const u = this.auth.currentUser;
    const requestedBy = u ? `${u.firstName} ${u.lastName}`.trim() || u.username : 'Unknown';

    const fieldKeyMap: Record<string, string> = {
      'price-change': 'price',
      'discount-change': 'discount',
      'billing-remarks-change': 'billingRemarks',
      'charge-update': 'additionalCharges',
      'charge-delete': 'additionalCharges',
      'contract-correction': 'remarks',
    };

    const fieldLabelMap: Record<string, string> = {
      'price-change': 'Contract Price',
      'discount-change': 'Contract Discount',
      'billing-remarks-change': 'Billing Remarks',
      'charge-update': 'Enclosions',
      'charge-delete': 'Enclosions',
      'contract-correction': 'Contract Data',
    };

    try {
      await this.serviceRequestService.submitRequest({
        type: this.requestDraft.type,
        contractId: this.serviceId,
        contractNo: this.FuneralContract?.contractNo || String(this.serviceId),
        deceasedName: this.FuneralContract
          ? `${this.FuneralContract.firstName || ''} ${this.FuneralContract.lastName || ''}`.trim()
          : undefined,
        requestedBy,
        requestedByUid: u?.id ? String(u.id) : undefined,
        fieldLabel: fieldLabelMap[this.requestDraft.type] || this.requestDraft.type,
        fieldKey: fieldKeyMap[this.requestDraft.type],
        oldValue: this.getCurrentValueForRequest(),
        newValue: this.requestDraft.newValue,
        notes: this.requestDraft.notes || undefined,
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Request Submitted',
        detail: 'Your change request has been sent for admin review.',
      });
      this.closeRequestDialog();
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to submit request. Please try again.',
      });
    } finally {
      this.submittingRequest = false;
    }
  }

  private refreshChargeTable(): void {
    this.ensureTrailingEmptyChargeRow();
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
      financialAssitance: contract?.financialAssitance || '',
      urnType: contract?.urnType || '',
      urnDescription: contract?.urnDescription || '',
    };
  }

  private resetBillingSetupEditState(): void {
    this.pricingEditMode = false;
    this.serviceDetailsEditMode = false;
    this.pricingDraft = this.createPricingDraft(this.FuneralContract);
    this.serviceDetailsDraft = this.createServiceDetailsDraft(this.FuneralContract);
  }

  private hasFieldChanged(oldValue: unknown, newValue: unknown): boolean {
    const oldNormalized = this.normalizeComparableValue(oldValue);
    const newNormalized = this.normalizeComparableValue(newValue);
    return oldNormalized !== newNormalized;
  }

  private normalizeComparableValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'number') {
      return String(Number.isFinite(value) ? value : 0);
    }

    return String(value).trim();
  }

  private isContractFieldInitialized(fieldKey: keyof FuneralContract, value: unknown): boolean {
    if (fieldKey === 'price' || fieldKey === 'discount') {
      return (Number(value) || 0) > 0;
    }

    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    if (typeof value === 'number') {
      return value !== 0;
    }

    return true;
  }

  private async submitContractFieldRequests(
    changes: Array<{ fieldKey: keyof FuneralContract; label: string; oldValue: unknown; newValue: unknown }>,
    showSuccessMessage = true
  ): Promise<void> {
    for (const change of changes) {
      await this.serviceRequestService.submitRequest({
        type: change.fieldKey === 'price'
          ? 'price-change'
          : change.fieldKey === 'discount'
            ? 'discount-change'
            : 'contract-correction',
        contractId: this.serviceId,
        contractNo: this.FuneralContract?.contractNo || String(this.serviceId),
        deceasedName: this.FuneralContract
          ? `${this.FuneralContract.firstName || ''} ${this.FuneralContract.lastName || ''}`.trim()
          : undefined,
        requestedBy: this.getCurrentUserDisplayName(),
        requestedByUid: this.auth.currentUser?.id ? String(this.auth.currentUser.id) : undefined,
        fieldLabel: change.label,
        fieldKey: String(change.fieldKey),
        oldValue: change.oldValue,
        newValue: change.newValue,
      });
    }

    if (showSuccessMessage) {
      this.messageService.add({
        severity: 'success',
        summary: 'Request Submitted',
        detail: 'Initialized fields were submitted for admin approval.',
      });
    }
  }

  private async submitChargeUpdateRequest(charge: ChargeRow, showSuccessMessage = true): Promise<void> {
    if (!charge.id || !this.serviceId) {
      return;
    }

    const oldPayload = this.chargeOriginalById.get(charge.id) || this.toRequestChargePayload(charge);
    const newPayload = this.toRequestChargePayload(charge);

    this.loading = true;

    try {
      await this.serviceRequestService.submitRequest({
        type: 'charge-update',
        contractId: this.serviceId,
        contractNo: this.FuneralContract?.contractNo || String(this.serviceId),
        deceasedName: this.FuneralContract
          ? `${this.FuneralContract.firstName || ''} ${this.FuneralContract.lastName || ''}`.trim()
          : undefined,
        requestedBy: this.getCurrentUserDisplayName(),
        requestedByUid: this.auth.currentUser?.id ? String(this.auth.currentUser.id) : undefined,
        fieldLabel: 'Enclosions',
        fieldKey: 'charge',
        targetId: charge.id,
        oldValue: oldPayload,
        newValue: newPayload,
        chargeData: newPayload,
      });

      this.syncChargesSilently();
      charge.isEditing = false;
      charge._backup = undefined;

      if (showSuccessMessage) {
        this.messageService.add({
          severity: 'success',
          summary: 'Request Submitted',
          detail: 'Enclosions update submitted for admin approval.',
        });
      }
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to submit charge update request.',
      });
    } finally {
      this.loading = false;
    }
  }

  private async submitChargeDeleteRequest(charge: ChargeRow): Promise<void> {
    if (!charge.id || !this.serviceId) {
      return;
    }

    this.loading = true;

    try {
      await this.serviceRequestService.submitRequest({
        type: 'charge-delete',
        contractId: this.serviceId,
        contractNo: this.FuneralContract?.contractNo || String(this.serviceId),
        deceasedName: this.FuneralContract
          ? `${this.FuneralContract.firstName || ''} ${this.FuneralContract.lastName || ''}`.trim()
          : undefined,
        requestedBy: this.getCurrentUserDisplayName(),
        requestedByUid: this.auth.currentUser?.id ? String(this.auth.currentUser.id) : undefined,
        fieldLabel: 'Enclosions',
        fieldKey: 'charge',
        targetId: charge.id,
        oldValue: this.toRequestChargePayload(charge),
        newValue: `Delete charge #${charge.id}`,
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Request Submitted',
        detail: 'Enclosions deletion submitted for admin approval.',
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to submit charge deletion request.',
      });
    } finally {
      this.loading = false;
    }
  }

  private toRequestChargePayload(charge: Partial<ChargeRow>): ContractCharges {
    return {
      id: charge.id,
      funeralContractId: this.serviceId,
      chargeType: charge.chargeType || '',
      description: charge.description || '',
      quantity: Number(charge.quantity) || 0,
      unitPrice: Number(charge.unitPrice) || 0,
      discount: Number(charge.discount) || 0,
      createdBy: charge.createdBy || '',
      updatedBy: charge.updatedBy || '',
    };
  }

  private getCurrentUserDisplayName(): string {
    const user = this.auth.currentUser;
    if (!user) {
      return 'Unknown';
    }

    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return fullName || user.username || user.accountNumber || 'Unknown';
  }

  private showChargeAccessDenied(): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Read only',
      detail: this.canRequestAdminChangeForBilling
        ? 'Billing is already initialized. Submit a request for admin approval to apply changes.'
        : 'Only biller can initialize pricing and charges. After initialization, only admin can modify.',
    });
  }

  private openRequestForBlockedBillingAction(type: ServiceRequestType): void {
    if (!this.canRequestAdminChangeForBilling) {
      return;
    }

    this.openRequestChangeDialog(type);
  }

  isChargeRowEmpty(row: Partial<ChargeRow> | null | undefined): boolean {
    if (!row) {
      return true;
    }

    const description = String(row.description || '').trim();
    const chargeType = String(row.chargeType || '').trim();
    const quantity = Number(row.quantity) || 0;
    const unitPrice = Number(row.unitPrice) || 0;
    const discount = Number(row.discount) || 0;

    return description.length === 0
      && chargeType.length === 0
      && quantity === 0
      && unitPrice === 0
      && discount === 0;
  }

  private ensureTrailingEmptyChargeRow(): void {
    if (!this.canEditCharges) {
      return;
    }

    const nonEmptyRows = this.charges.filter((row) => row.isDeleted || !this.isChargeRowEmpty(row));
    this.charges = [...nonEmptyRows, this.buildNewChargeRow()];
  }

  private isChargeRowDirty(row: ChargeRow): boolean {
    if (row.isDeleted) {
      return true;
    }

    if (!row.id) {
      return !this.isChargeRowEmpty(row);
    }

    const original = this.chargeOriginalById.get(row.id);
    if (!original) {
      return true;
    }

    const currentPayload = this.toRequestChargePayload(row);
    return this.serializeChargePayload(original) !== this.serializeChargePayload(currentPayload);
  }

  private serializeChargePayload(charge: ContractCharges): string {
    return [
      String(charge.chargeType || '').trim(),
      String(charge.description || '').trim(),
      Number(charge.quantity) || 0,
      Number(charge.unitPrice) || 0,
      Number(charge.discount) || 0,
    ].join('|');
  }

  get activeChargeCount(): number {
    return this.charges.filter((row) => !row.isDeleted && !this.isChargeRowEmpty(row)).length;
  }

}
