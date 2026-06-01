import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { SelectHelperComponent } from '../../shared/components/select-helper/select-helper.component';

interface PackageChargeDraft {
  chargeType: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

type DiscountMode = 'amount' | 'percentage';

interface EnclosionPackageDraft {
  id: string;
  name: string;
  notes: string;
  isActive: boolean;
  price: number;
  discount: number;
  discountMode: DiscountMode;
  discountPercent: number;
  type: string;
  casket: string;
  casketAvailable: string;
  financialAssitance: string;
  urnType: string;
  urnDescription: string;
  charges: PackageChargeDraft[];
}

@Component({
  selector: 'app-enclosions',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule, SelectHelperComponent],
  providers: [MessageService],
  templateUrl: './enclosions.component.html',
  styleUrl: './enclosions.component.scss',
})
export class EnclosionsComponent implements OnInit {
  private readonly collectionName = 'enclosionsPackages';

  packages: EnclosionPackageDraft[] = [];
  activePackageId = '';
  draft: EnclosionPackageDraft = this.createEmptyPackage();
  isLoading = false;
  isSaving = false;
  search = '';

  constructor(private messageService: MessageService) {}

  ngOnInit(): void {
    void this.loadPackages();
  }

  get filteredPackages(): EnclosionPackageDraft[] {
    const keyword = this.search.trim().toLowerCase();
    if (!keyword) {
      return this.packages;
    }

    return this.packages.filter((item) => {
      return item.name.toLowerCase().includes(keyword) || item.type.toLowerCase().includes(keyword);
    });
  }

  get draftNetBase(): number {
    return (Number(this.draft.price) || 0) - (Number(this.draft.discount) || 0);
  }

  onDiscountModeChange(): void {
    if (this.draft.discountMode === 'percentage') {
      this.syncDiscountAmountFromPercent();
      return;
    }

    this.syncDiscountPercentFromAmount();
  }

  onDraftPriceChange(): void {
    this.draft.price = this.toNonNegativeNumber(this.draft.price);

    if (this.draft.discountMode === 'percentage') {
      this.syncDiscountAmountFromPercent();
      return;
    }

    this.syncDiscountPercentFromAmount();
  }

  onDiscountAmountInputChange(): void {
    this.draft.discount = this.toNonNegativeNumber(this.draft.discount);
    this.syncDiscountPercentFromAmount();
  }

  onDiscountPercentInputChange(): void {
    this.draft.discountPercent = this.clampPercent(this.draft.discountPercent);
    this.syncDiscountAmountFromPercent();
  }

  async loadPackages(): Promise<void> {
    this.isLoading = true;

    try {
      const ref = collection(db, this.collectionName);
      const snapshot = await getDocs(query(ref, orderBy('name', 'asc')));
      this.packages = snapshot.docs.map((item: any) => this.fromDoc(item.id, item.data()));

      if (this.activePackageId) {
        const selected = this.packages.find((item) => item.id === this.activePackageId);
        if (selected) {
          this.draft = this.clonePackage(selected);
        }
      }
    } catch (error) {
      console.error('[Enclosions] Failed to load packages', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Load failed',
        detail: 'Unable to load package presets.',
      });
    } finally {
      this.isLoading = false;
    }
  }

  newPackage(): void {
    this.activePackageId = '';
    this.draft = this.createEmptyPackage();
  }

  selectPackage(id: string): void {
    const found = this.packages.find((item) => item.id === id);
    if (!found) {
      return;
    }

    this.activePackageId = id;
    this.draft = this.normalizeDraftDiscountFields(this.clonePackage(found));
  }

  addCharge(): void {
    this.draft.charges = [...this.draft.charges, this.createEmptyCharge()];
  }

  removeCharge(index: number): void {
    this.draft.charges = this.draft.charges.filter((_, currentIndex) => currentIndex !== index);
    if (this.draft.charges.length === 0) {
      this.draft.charges = [this.createEmptyCharge()];
    }
  }

  async savePackage(): Promise<void> {
    this.syncDiscountFieldsByMode();

    const validated = this.validateDraft(this.draft);
    if (!validated.ok) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: validated.message });
      return;
    }

    this.isSaving = true;

    try {
      const id = this.draft.id || doc(collection(db, this.collectionName)).id;
      const payload = this.toPayload({ ...this.draft, id });

      await setDoc(doc(db, this.collectionName, id), payload, { merge: true });

      this.activePackageId = id;
      this.draft.id = id;
      await this.loadPackages();

      this.messageService.add({
        severity: 'success',
        summary: 'Saved',
        detail: 'Package preset saved successfully.',
      });
    } catch (error) {
      console.error('[Enclosions] Failed to save package', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Save failed',
        detail: 'Unable to save package preset.',
      });
    } finally {
      this.isSaving = false;
    }
  }

  async deletePackage(): Promise<void> {
    if (!this.activePackageId) {
      return;
    }

    const confirmed = window.confirm('Delete this package preset?');
    if (!confirmed) {
      return;
    }

    try {
      await deleteDoc(doc(db, this.collectionName, this.activePackageId));
      this.messageService.add({
        severity: 'success',
        summary: 'Deleted',
        detail: 'Package preset removed.',
      });

      this.newPackage();
      await this.loadPackages();
    } catch (error) {
      console.error('[Enclosions] Failed to delete package', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Delete failed',
        detail: 'Unable to delete package preset.',
      });
    }
  }

  private validateDraft(value: EnclosionPackageDraft): { ok: true } | { ok: false; message: string } {
    if (!value.name.trim()) {
      return { ok: false, message: 'Package name is required.' };
    }

    if (!value.type.trim()) {
      return { ok: false, message: 'Type of service is required.' };
    }

    if ((Number(value.price) || 0) <= 0) {
      return { ok: false, message: 'Contract price must be greater than zero.' };
    }

    const hasValidCharge = value.charges.some((item) => item.description.trim().length > 0);
    if (!hasValidCharge) {
      return { ok: false, message: 'Add at least one package enclosion description.' };
    }

    return { ok: true };
  }

  private createEmptyPackage(): EnclosionPackageDraft {
    return {
      id: '',
      name: '',
      notes: '',
      isActive: true,
      price: 0,
      discount: 0,
      discountMode: 'amount',
      discountPercent: 0,
      type: '',
      casket: '',
      casketAvailable: '',
      financialAssitance: '',
      urnType: '',
      urnDescription: '',
      charges: [this.createEmptyCharge()],
    };
  }

  private createEmptyCharge(): PackageChargeDraft {
    return {
      chargeType: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
    };
  }

  private clonePackage(value: EnclosionPackageDraft): EnclosionPackageDraft {
    return {
      ...value,
      charges: value.charges.map((item) => ({ ...item })),
    };
  }

  private syncDiscountFieldsByMode(): void {
    if (this.draft.discountMode === 'percentage') {
      this.syncDiscountAmountFromPercent();
      return;
    }

    this.syncDiscountPercentFromAmount();
  }

  private syncDiscountAmountFromPercent(): void {
    const price = this.toNonNegativeNumber(this.draft.price);
    const percent = this.clampPercent(this.draft.discountPercent);

    this.draft.price = price;
    this.draft.discountPercent = percent;
    this.draft.discount = this.roundTo2(price * (percent / 100));
  }

  private syncDiscountPercentFromAmount(): void {
    const price = this.toNonNegativeNumber(this.draft.price);
    const amount = this.toNonNegativeNumber(this.draft.discount);

    this.draft.price = price;
    this.draft.discount = amount;

    if (price <= 0) {
      this.draft.discountPercent = 0;
      return;
    }

    this.draft.discountPercent = this.roundTo2((amount / price) * 100);
  }

  private normalizeDraftDiscountFields(value: EnclosionPackageDraft): EnclosionPackageDraft {
    const normalized: EnclosionPackageDraft = {
      ...value,
      discountMode: value.discountMode === 'percentage' ? 'percentage' : 'amount',
      discount: this.toNonNegativeNumber(value.discount),
      discountPercent: this.clampPercent(value.discountPercent),
      price: this.toNonNegativeNumber(value.price),
    };

    if (normalized.discountMode === 'percentage') {
      normalized.discount = this.roundTo2(normalized.price * (normalized.discountPercent / 100));
      return normalized;
    }

    if (normalized.price > 0) {
      normalized.discountPercent = this.roundTo2((normalized.discount / normalized.price) * 100);
      return normalized;
    }

    normalized.discountPercent = 0;
    return normalized;
  }

  private toNonNegativeNumber(value: unknown): number {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) {
      return 0;
    }

    return this.roundTo2(numeric);
  }

  private clampPercent(value: unknown): number {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return 0;
    }

    if (numeric < 0) {
      return 0;
    }

    if (numeric > 100) {
      return 100;
    }

    return this.roundTo2(numeric);
  }

  private roundTo2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private fromDoc(id: string, raw: any): EnclosionPackageDraft {
    const charges = Array.isArray(raw?.charges)
      ? raw.charges.map((item: any) => ({
          chargeType: String(item?.chargeType || ''),
          description: String(item?.description || ''),
          quantity: Number(item?.quantity) || 0,
          unitPrice: Number(item?.unitPrice) || 0,
          discount: Number(item?.discount) || 0,
        }))
      : [this.createEmptyCharge()];

    const price = Number(raw?.price) || 0;
    const discount = Number(raw?.discount) || 0;
    const discountMode: DiscountMode = raw?.discountMode === 'percentage' ? 'percentage' : 'amount';
    const discountPercent = Number(raw?.discountPercent);
    const normalizedPercent = Number.isFinite(discountPercent)
      ? this.clampPercent(discountPercent)
      : (price > 0 ? this.roundTo2((discount / price) * 100) : 0);

    return {
      id,
      name: String(raw?.name || ''),
      notes: String(raw?.notes || ''),
      isActive: raw?.isActive !== false,
      price,
      discount,
      discountMode,
      discountPercent: normalizedPercent,
      type: String(raw?.type || ''),
      casket: String(raw?.casket || ''),
      casketAvailable: String(raw?.casketAvailable || ''),
      financialAssitance: String(raw?.financialAssitance || ''),
      urnType: String(raw?.urnType || ''),
      urnDescription: String(raw?.urnDescription || ''),
      charges,
    };
  }

  private toPayload(value: EnclosionPackageDraft): Record<string, unknown> {
    const now = serverTimestamp();

    const normalizedValue = this.normalizeDraftDiscountFields(value);

    return {
      name: normalizedValue.name.trim(),
      notes: normalizedValue.notes.trim(),
      isActive: normalizedValue.isActive,
      price: Number(normalizedValue.price) || 0,
      discount: Number(normalizedValue.discount) || 0,
      discountMode: normalizedValue.discountMode,
      discountPercent: Number(normalizedValue.discountPercent) || 0,
      type: normalizedValue.type.trim(),
      casket: normalizedValue.casket.trim(),
      casketAvailable: normalizedValue.casketAvailable.trim(),
      financialAssitance: normalizedValue.financialAssitance.trim(),
      urnType: normalizedValue.urnType.trim(),
      urnDescription: normalizedValue.urnDescription.trim(),
      charges: normalizedValue.charges
        .filter((item) => item.description.trim().length > 0)
        .map((item) => ({
          chargeType: item.chargeType.trim(),
          description: item.description.trim(),
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unitPrice) || 0,
          discount: Number(item.discount) || 0,
        })),
      updatedAt: now,
      ...(value.id ? {} : { createdAt: now }),
    };
  }

}
