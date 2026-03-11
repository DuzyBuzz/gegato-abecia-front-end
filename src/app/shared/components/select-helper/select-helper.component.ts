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
import { CascadeSelectModule } from 'primeng/cascadeselect';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import { ComboboxFirestoreService } from '../../../services/combobox-firestore.service';

@Component({
  selector: 'app-select-helper',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, ButtonModule, CascadeSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectHelperComponent),
      multi: true
    }
  ],
  template: `

<div class="flex items-center gap-2 w-full" #selectElement tabindex="0" (focus)="onSelectFocus()" (click)="onSelectClick()">
  <p-cascadeselect
    [(ngModel)]="selectedCascade"
    [options]="cascadeOptions"
    optionLabel="cname"
    styleClass="w-full"
    placeholder="Select an item"
    (ngModelChange)="onCascadeChange($event)"
    [disabled]="isLoading">

    <ng-template #footer>
      <div class="px-3 py-1">
        <p-button label="Add New" fluid severity="secondary" text size="small" icon="pi pi-plus" (onClick)="open()"></p-button>
      </div>
    </ng-template>

  </p-cascadeselect>
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
  private _comboboxName = '';
  private _hasLoaded = false;
  private _isLoading = false;
  private _modalJustClosed = false;

  isLoading = false;

  options: string[] = [];
  value: string | null = null;

  selectedCascade: any = null;

  private cascadeOptionsList: Array<{ cname: string; code: string }> = [];

  get cascadeOptions(): any[] {
    return this.cascadeOptionsList;
  }

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
      this.cascadeOptionsList = [];
      this.selectedCascade = null;

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

  onSelectFocus(): void {
    if (this._modalJustClosed) {
      this._modalJustClosed = false;
      return;
    }

    if (!this._hasLoaded) {
      this.loadCombobox();
    }
  }

  onSelectClick(): void {
    if (this._modalJustClosed) {
      this._modalJustClosed = false;
      return;
    }

    if (!this._hasLoaded) {
      this.loadCombobox();
    }
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

      this.cascadeOptionsList = this.options.map(o => ({ cname: o, code: o }));
if (this.value) {
  this.selectedCascade = this.cascadeOptionsList.find(x => x.cname === this.value) || null;
}
else if (this.allowDefaultSelection && this.storedDefault) {
  this.value = this.storedDefault;
  this.selectedCascade = this.cascadeOptionsList.find(x => x.cname === this.storedDefault) || null;
  this.onChange(this.value);
}
else {
  this.selectedCascade = null;
}

    } catch (err) {

      console.error(`[SelectHelper] Failed to load: ${this._comboboxName}`, err);
      this.options = [];

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

          this.cascadeOptionsList = this.options.map(o => ({ cname: o, code: o }));

          if (this.value && !this.options.includes(this.value)) {
            this.value = null;
            this.selectedCascade = null;
            this.onChange(null);
          }

          if (this.value) {
            this.selectedCascade =
              this.cascadeOptionsList.find(x => x.cname === this.value) || null;
          } else {
            this.selectedCascade = null;
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

    this.value = obj;

    if (this.value) {
      this.selectedCascade =
        this.cascadeOptionsList.find(x => x.cname === this.value) || null;
    } else {
      this.selectedCascade = null;
    }

  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }

  onCascadeChange(selection: any): void {

    if (!selection) {
      this.value = null;
    } else {
      this.value = selection.cname;
    }

    this.onChange(this.value);
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
      this.cascadeOptionsList = this.options.map(o => ({ cname: o, code: o }));

      // store default only for editor reference
      this.storedDefault = this.editorDefault || '';

      // force no automatic selection
      this.value = null;
      this.selectedCascade = null;
      this.onChange(null);

      this.cdr.markForCheck();

      this.close();

    } catch (err) {

      console.error('Failed saving combobox:', err);
      alert((err && (err as Error).message) || 'Save failed');

    }

  }

}
