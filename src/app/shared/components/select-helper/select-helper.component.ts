import {
  Component,
  Input,
  forwardRef,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import { ComboboxFirestoreService } from '../../../services/combobox-firestore.service';

@Component({
  selector: 'app-select-helper',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, ButtonModule, SelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectHelperComponent),
      multi: true
    }
  ],
  template: `
<div class="flex items-center gap-2 w-full" #selectElement tabindex="0">
  <p-select
    [(ngModel)]="selectedValue"
    [options]="dropdownOptions"
    optionLabel="label"
    optionValue="value"
    styleClass="w-full"
    [ngClass]="{'ng-invalid ng-touched': isInvalid}"
    placeholder="Select"
    [filter]="searchable"
    filterBy="label"
    filterPlaceholder="Search items..."
    resetFilterOnHide="true"
    (ngModelChange)="onSelectionChange($event)"
    [disabled]="isLoading"
    [virtualScroll]="dropdownOptions.length > 100"
    [virtualScrollItemSize]="40">

    <ng-template #footer>
      <div class="px-3 py-1">
        <p-button label="Add New" fluid severity="secondary" text size="small" icon="pi pi-plus" (onClick)="open()"></p-button>
      </div>
    </ng-template>

  </p-select>
</div>

<p-dialog [(visible)]="modalOpen" modal="true" appendTo="body" [style]="{width: '420px'}" (onHide)="onDialogHide()" [dismissableMask]="true">

  <ng-template pTemplate="header">
    <div class="font-semibold">Edit List Items</div>
  </ng-template>

  <div class="p-4">
    <label class="text-xs text-gray-700">Type each item on a separate line:</label>

    <textarea
      rows="8"
      [(ngModel)]="editorText"
      class="w-full border mt-2 p-2 text-sm font-mono">
    </textarea>

    <div class="mt-3">
      <label class="text-xs text-gray-700">Default Value</label>

      <select [(ngModel)]="editorDefault" class="w-full border p-1 mt-1 text-sm">
        <option *ngFor="let o of editorOptions" [value]="o">{{ o }}</option>
      </select>
    </div>
  </div>

  <ng-template pTemplate="footer">
    <div class="flex justify-end gap-2">

      <p-button
        label="Cancel"
        (onClick)="cancel()"
        styleClass="px-3 py-1 p-button-danger p-button-outlined">
      </p-button>

      <p-button
        label="OK"
        (onClick)="save()"
        styleClass="px-3 py-1 p-button-success">
      </p-button>

    </div>
  </ng-template>

</p-dialog>
`
})
export class SelectHelperComponent implements ControlValueAccessor, OnInit, OnDestroy {

  @ViewChild('selectElement', { read: ElementRef }) selectElement?: ElementRef<HTMLElement>;
  @Input() allowDefaultSelection = false;
  @Input() searchable = true;
  @Input() isInvalid = false;
  private _comboboxName = '';
  private _hasLoaded = false;
  private _isLoading = false;
  private _modalJustClosed = false;
  private _pendingValue: any = null;

  isLoading = false;

  options: string[] = [];
  selectedValue: string | null = null;

  dropdownOptions: Array<{ label: string; value: string }> = [];

  modalOpen = false;
  editorText = '';
  editorDefault = '';

  // editor-only stored default
  private storedDefault = '';

  private unsub?: () => void;

  private onChange: (v: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private combo: ComboboxFirestoreService,
    private cdr: ChangeDetectorRef
  ) {}

  @Input() set comboboxName(name: string) {
    if (name && name !== this._comboboxName) {

      this._comboboxName = name;
      this._hasLoaded = false;
      this._isLoading = false;

      if (this.unsub) {
        this.unsub();
        this.unsub = undefined;
      }

      this.options = [];
      this.dropdownOptions = [];
      this.selectedValue = null;

      this.tryLoadImmediately();
    }
  }

  get comboboxName(): string {
    return this._comboboxName;
  }

  ngOnInit(): void {
    if (this._comboboxName && !this._hasLoaded) {
      this.tryLoadImmediately();
    }
  }

  private tryLoadImmediately(): void {
    if (!this._comboboxName || this._hasLoaded || this._isLoading) return;
    this.loadCombobox();
  }

  private async loadCombobox(): Promise<void> {

    if (this._isLoading || this._hasLoaded) return;

    this._isLoading = true;
    this.isLoading = true;
    this._hasLoaded = true;

    try {

      const data = await this.combo.getCombobox(this._comboboxName);

      this.options = data.items || [];
      this.storedDefault = data.default || '';

      this.dropdownOptions = this.options.map(o => ({ label: o, value: o }));

      console.log(`[SelectHelper:${this._comboboxName}] ✅ Options loaded:`, this.options);

      // Apply pending value if it exists
      if (this._pendingValue !== null && this._pendingValue !== undefined) {
        this.selectedValue = this._pendingValue;
        console.log(`[SelectHelper:${this._comboboxName}] ✅ Applied pending value:`, this._pendingValue);
        this._pendingValue = null;
        this.onChange(this.selectedValue);
      } else if (this.selectedValue) {
        // Keep current selection
        console.log(`[SelectHelper:${this._comboboxName}] ✅ Kept current selection:`, this.selectedValue);
      } else if (this.allowDefaultSelection && this.storedDefault) {
        this.selectedValue = this.storedDefault;
        console.log(`[SelectHelper:${this._comboboxName}] ✅ Applied default:`, this.storedDefault);
        this.onChange(this.selectedValue);
      } else {
        this.selectedValue = null;
        console.log(`[SelectHelper:${this._comboboxName}] ✅ No value set (none pending, selected, or default)`);
      }

    } catch (err) {

      console.error(`[SelectHelper] Failed to load: ${this._comboboxName}`, err);
      this.options = [];
      this.dropdownOptions = [];

    }

    this._isLoading = false;
    this.isLoading = false;

    this.cdr.markForCheck();

    try {

      this.unsub = this.combo.watchCombobox(
        this._comboboxName,
        (d: { items: string[]; default: string }) => {

          this.options = d.items || [];
          this.storedDefault = d.default || '';

          this.dropdownOptions = this.options.map(o => ({ label: o, value: o }));

          if (this.selectedValue && !this.options.includes(this.selectedValue)) {
            this.selectedValue = null;
            this.onChange(null);
          }

          this.cdr.markForCheck();
        }
      );

    } catch (err) {

      console.error(`[SelectHelper] Failed to watch: ${this._comboboxName}`, err);

    }
  }

  ngOnDestroy(): void {
    if (this.unsub) this.unsub();
  }

  writeValue(obj: any): void {
    // If options not loaded yet, store the value to apply after loading
    if (!this._hasLoaded) {
      this._pendingValue = obj;
      console.log(`[SelectHelper:${this._comboboxName}] writeValue stored pending:`, obj);
    } else {
      // If options are already loaded, set the value immediately
      if (obj != null && !this.options.includes(obj)) {
        console.warn(`[SelectHelper:${this._comboboxName}] Value "${obj}" not in options:`, this.options);
      }
      this.selectedValue = obj;
      console.log(`[SelectHelper:${this._comboboxName}] writeValue set immediately:`, obj);
    }
    this.cdr.markForCheck();
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }

  onSelectionChange(selection: any): void {
    this.selectedValue = selection;
    this.onChange(this.selectedValue);
    this.onTouched();
  }

  open(): void {

    this.editorText = this.options.join('\n');
    this.editorDefault = this.storedDefault || '';

    this.modalOpen = true;

  }

  close(): void {
    this.modalOpen = false;
  }

  cancel(): void {
    this.close();
  }

  onDialogHide(): void {

    this._modalJustClosed = true;

    setTimeout(() => {
      this.selectElement?.nativeElement?.focus();
    });

  }

  get editorOptions(): string[] {

    return Array.from(new Set(
      (this.editorText || '')
        .split(/\r?\n/)
        .map(v => v.trim())
        .filter(v => v.length > 0)
    ));

  }

  async save(): Promise<void> {

    if (!this._comboboxName) return;

    try {

      await this.combo.updateCombobox(
        this._comboboxName,
        this.editorText,
        this.editorDefault
      );

      this.options = this.editorOptions;
      this.dropdownOptions = this.options.map(o => ({ label: o, value: o }));

      // store default only for editor reference
      this.storedDefault = this.editorDefault || '';

      // force no automatic selection
      this.selectedValue = null;
      this.onChange(null);

      this.cdr.markForCheck();

      this.close();

    } catch (err) {

      console.error('Failed saving combobox:', err);
      alert((err && (err as Error).message) || 'Save failed');

    }

  }

}

