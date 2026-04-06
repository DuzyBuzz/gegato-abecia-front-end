import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  forwardRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { AutoCompleteFirestoreService } from '../../../services/auto-complete-firestore.service';

@Component({
  selector: 'app-auto-complete-helper',
  standalone: true,
  imports: [CommonModule, FormsModule, AutoCompleteModule, DialogModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutoCompleteHelperComponent),
      multi: true,
    },
  ],
  template: `
<div class="flex items-center gap-2 w-full" #acElement tabindex="0">
  <p-autoComplete
    [(ngModel)]="selectedValue"
    [suggestions]="filteredOptions"
    [dropdown]="true"
    [forceSelection]="false"
    [minLength]="0"
    [ngClass]="{'ng-invalid ng-touched': isInvalid}"
    [placeholder]="placeholder"
    [disabled]="isLoading"
    (completeMethod)="filter($event)"
    (ngModelChange)="onValueChange($event)"
    (onBlur)="onBlur()"
  >
    <ng-template pTemplate="footer">
      <div class="px-3 py-1">
        <p-button
          label="Edit List"
          fluid
          severity="secondary"
          text
          size="small"
          icon="pi pi-pencil"
          (onClick)="open()"
        ></p-button>
      </div>
    </ng-template>
  </p-autoComplete>
</div>

<p-dialog
  [(visible)]="modalOpen"
  modal="true"
  appendTo="body"
  [style]="{width: '420px'}"
  (onHide)="onDialogHide()"
  [dismissableMask]="true"
>
  <ng-template pTemplate="header">
    <div class="font-semibold">Edit List Items</div>
  </ng-template>

  <div class="p-4">
    <label class="text-xs text-gray-700">Type each item on a separate line:</label>

    <textarea
      rows="8"
      [(ngModel)]="editorText"
      class="w-full border mt-2 p-2 text-sm font-mono"
    ></textarea>
  </div>

  <ng-template pTemplate="footer">
    <div class="flex justify-end gap-2">
      <p-button
        label="Cancel"
        (onClick)="cancel()"
        styleClass="px-3 py-1 p-button-danger p-button-outlined"
      ></p-button>

      <p-button
        label="OK"
        (onClick)="save()"
        styleClass="px-3 py-1 p-button-success"
      ></p-button>
    </div>
  </ng-template>
</p-dialog>
`,
})
export class AutoCompleteHelperComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @ViewChild('acElement', { read: ElementRef }) acElement?: ElementRef<HTMLElement>;

  @Input() isInvalid = false;
  @Input() placeholder = 'Type or select';

  private _listName = '';
  private _hasLoaded = false;
  private _isLoading = false;
  private _pendingValue: any = null;
  private unsub?: () => void;

  isLoading = false;
  options: string[] = [];
  filteredOptions: string[] = [];
  selectedValue: string | null = null;

  modalOpen = false;
  editorText = '';

  private onChange: (v: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private ac: AutoCompleteFirestoreService,
    private cdr: ChangeDetectorRef
  ) {}

  @Input() set comboboxName(name: string) {
    if (name && name !== this._listName) {
      this._listName = name;
      this._hasLoaded = false;
      this._isLoading = false;

      if (this.unsub) {
        this.unsub();
        this.unsub = undefined;
      }

      this.options = [];
      this.filteredOptions = [];
      this.selectedValue = null;
      this.tryLoadImmediately();
    }
  }

  get comboboxName(): string {
    return this._listName;
  }

  ngOnInit(): void {
    if (this._listName && !this._hasLoaded) {
      this.tryLoadImmediately();
    }
  }

  ngOnDestroy(): void {
    if (this.unsub) this.unsub();
  }

  writeValue(obj: any): void {
    if (!this._hasLoaded) {
      this._pendingValue = obj;
    } else {
      this.selectedValue = obj;
    }
    this.cdr.markForCheck();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isLoading = isDisabled;
    this.cdr.markForCheck();
  }

  onValueChange(value: any): void {
    this.selectedValue = value;
    this.onChange(this.selectedValue);
  }

  onBlur(): void {
    this.onTouched();
  }

  filter(event: { query: string }): void {
    const query = (event?.query || '').toLowerCase();
    if (!query) {
      this.filteredOptions = [...this.options];
    } else {
      this.filteredOptions = this.options.filter((o) => o.toLowerCase().includes(query));
    }
    this.cdr.markForCheck();
  }

  open(): void {
    this.editorText = this.options.join('\n');
    this.modalOpen = true;
  }

  cancel(): void {
    this.modalOpen = false;
  }

  onDialogHide(): void {
    setTimeout(() => this.acElement?.nativeElement?.focus());
  }

  async save(): Promise<void> {
    if (!this._listName) return;

    try {
      await this.ac.updateList(this._listName, this.editorText);
      this.options = this.editorOptions;
      this.filteredOptions = [...this.options];

      // keep user-typed value, but if it became invalid (blank), normalize to null
      if (this.selectedValue != null && String(this.selectedValue).trim() === '') {
        this.selectedValue = null;
        this.onChange(null);
      }

      this.modalOpen = false;
      this.cdr.markForCheck();
    } catch (err) {
      console.error('Failed saving autocomplete list:', err);
      alert((err && (err as Error).message) || 'Save failed');
    }
  }

  private get editorOptions(): string[] {
    return Array.from(
      new Set(
        (this.editorText || '')
          .split(/\r?\n/)
          .map((v) => v.trim())
          .filter((v) => v.length > 0)
      )
    );
  }

  private tryLoadImmediately(): void {
    if (!this._listName || this._hasLoaded || this._isLoading) return;
    void this.loadList();
  }

  private async loadList(): Promise<void> {
    if (this._isLoading || this._hasLoaded) return;

    this._isLoading = true;
    this.isLoading = true;
    this._hasLoaded = true;

    try {
      const data = await this.ac.getList(this._listName);
      this.options = data.items || [];
      this.filteredOptions = [...this.options];

      if (this._pendingValue !== null && this._pendingValue !== undefined) {
        this.selectedValue = this._pendingValue;
        this._pendingValue = null;
        this.onChange(this.selectedValue);
      }
    } catch (err) {
      console.error(`[AutoCompleteHelper] Failed to load: ${this._listName}`, err);
      this.options = [];
      this.filteredOptions = [];
    }

    this._isLoading = false;
    this.isLoading = false;
    this.cdr.markForCheck();

    try {
      this.unsub = this.ac.watchList(this._listName, (d) => {
        this.options = d.items || [];
        this.filteredOptions = [...this.options];

        this.cdr.markForCheck();
      });
    } catch (err) {
      console.error(`[AutoCompleteHelper] Failed to watch: ${this._listName}`, err);
    }
  }
}
