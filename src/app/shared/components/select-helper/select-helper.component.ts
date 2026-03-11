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
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import { ComboboxFirestoreService } from '../../../services/combobox-firestore.service';

@Component({
  selector: 'app-select-helper',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectHelperComponent),
      multi: true
    }
  ],
  template: `

<div class="flex items-center gap-2">

<select
#selectElement
class="border rounded px-2 py-1 w-full"
[disabled]="isLoading"
[(ngModel)]="value"
(ngModelChange)="select($event)"
(focus)="onSelectFocus()"
(click)="onSelectClick()"
>
<option value="">{{ isLoading ? 'Loading...' : (options.length === 0 ? 'No items' : '-- Select --') }}</option>
<option *ngFor="let o of options" [value]="o">{{ o }}</option>
</select>

  <button type="button" (click)="open()" aria-placeholder="Edit List" class="border px-2 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed">
   ⋮✏️
  </button>

</div>

<!-- Modal -->
<div *ngIf="modalOpen" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" (click)="closeIfBackdrop($event)">
  <div class="bg-white rounded shadow w-[420px]" (click)="$event.stopPropagation()">

    <div class="border-b px-4 py-2 flex justify-between items-center">
      <div class="font-semibold">Edit List Items</div>
      <button (click)="close()" class="text-gray-600">✕</button>
    </div>

    <div class="p-4">
      <label class="text-xs text-gray-700">Type each item on a separate line:</label>
      <textarea
        name="editorText"
        rows="8"
        [(ngModel)]="editorText"
        class="w-full border mt-2 p-2 text-sm font-mono"></textarea>

      <div class="mt-3">
        <label class="text-xs text-gray-700">Default Value</label>
        <select name="editorDefault" [(ngModel)]="editorDefault" class="w-full border p-1 mt-1 text-sm">
          <option *ngFor="let o of editorOptions" [value]="o">{{ o }}</option>
        </select>
      </div>
    </div>

    <div class="border-t px-4 py-3 flex justify-end gap-2">
      <button class="px-3 py-1 border" (click)="cancel()">Cancel</button>
      <button class="px-3 py-1 bg-blue-600 text-white" (click)="save()">OK</button>
    </div>

  </div>
</div>
`
})
export class SelectHelperComponent implements ControlValueAccessor, OnInit, OnDestroy {

  @ViewChild('selectElement') selectElement?: ElementRef<HTMLSelectElement>;

  private _comboboxName = '';
  private _hasLoaded = false;
  private _isLoading = false;
  private _modalJustClosed = false;
  isLoading = false;

  options: string[] = [];
  value: string | null = null;

  // modal editor state
  modalOpen = false;
  editorText = '';
  editorDefault = '';

  // keep latest default for the component's initial editor default
  defaultValue = '';

  private unsub?: () => void;

  private onChange: (v: any) => void = () => {};
  private onTouched: () => void = () => {};

  @Input() set comboboxName(name: string) {
    if (name && name !== this._comboboxName) {
      this._comboboxName = name;
      this._hasLoaded = false;
      this._isLoading = false;
      // Reset when combobox name changes
      this.options = [];
      this.isLoading = false;
      this.cdr.markForCheck();
      
      // Immediately try to load if parent preloaded
      this.tryLoadImmediately();
    }
  }

  get comboboxName(): string {
    return this._comboboxName;
  }

  constructor(
    private combo: ComboboxFirestoreService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Try to load immediately if combobox name is already set
    if (this._comboboxName && !this._hasLoaded) {
      this.tryLoadImmediately();
    }
  }

  // Try to load data immediately (will be fast if parent preloaded)
  private tryLoadImmediately(): void {
    if (!this._comboboxName || this._hasLoaded || this._isLoading) return;
    
    this.loadCombobox();
  }

  // Load data when select is focused
  onSelectFocus(): void {
    if (this._modalJustClosed) {
      this._modalJustClosed = false;
      return;
    }
    
    if (this._isLoading) return;
    if (!this._hasLoaded && this._comboboxName) {
      this.loadCombobox();
    }
  }

  // Load data when select is clicked
  onSelectClick(): void {
    if (this._modalJustClosed) {
      this._modalJustClosed = false;
      return;
    }
    
    if (this._isLoading) return;
    if (!this._hasLoaded && this._comboboxName) {
      this.loadCombobox();
    }
  }

  private async loadCombobox(): Promise<void> {
    if (this._isLoading || this._hasLoaded) return;

    this._isLoading = true;
    this.isLoading = true;
    this._hasLoaded = true;
    this.cdr.markForCheck();

    if (!this._comboboxName) {
      this._isLoading = false;
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }

    try {
      // Get from cache or Firestore (cached if parent preloaded)
      const data = await this.combo.getCombobox(this._comboboxName);
      
      this.options = data.items || [];
      this.defaultValue = data.default || '';

      // ensure value is valid after options load
      if (!this.value && this.defaultValue) {
        this.value = this.defaultValue;
        this.onChange(this.value);
      }

      this._isLoading = false;
      this.isLoading = false;
      this.cdr.markForCheck();
    } catch (err) {
      console.error(`[SelectHelper] Failed to load: ${this._comboboxName}`, err);
      this.options = [];
      this._isLoading = false;
      this.isLoading = false;
      this.cdr.markForCheck();
    }

    // subscribe to realtime updates (async in background)
    try {
      this.unsub = this.combo.watchCombobox(
        this._comboboxName,
        (d: { items: string[]; default: string }) => {
          this.options = d.items || [];
          this.defaultValue = d.default || '';

          // keep selection valid
          if (!this.value && this.defaultValue) {
            this.value = this.defaultValue;
            this.onChange(this.value);
          }

          // if current selected value is no longer available, adjust it
          if (this.value && !this.options.includes(this.value)) {
            this.value = this.options[0] ?? null;
            this.onChange(this.value);
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

  // ControlValueAccessor
  writeValue(obj: any): void {
    this.value = obj;
  }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState?(isDisabled: boolean): void {
    // not implemented; add disabled handling if required
  }

  // user selects from dropdown
  select(v: string): void {
    this.value = v;
    this.onChange(v);
    this.onTouched();
    this.cdr.markForCheck();
  }

  // modal controls
  open(): void {
    // prefill editor from current options
    this.editorText = this.options.join('\n');
    this.editorDefault = this.defaultValue || (this.options[0] ?? '');
    this.modalOpen = true;
    this.cdr.markForCheck();
  }

  close(): void {
    this.modalOpen = false;
    this._modalJustClosed = true;
    this.cdr.markForCheck();
    
    // Return focus to select after modal closes
    setTimeout(() => {
      this.selectElement?.nativeElement?.focus();
    }, 0);
  }

  closeIfBackdrop(event: MouseEvent): void {
    // Only close if clicking on the backdrop, not the modal content
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  cancel(): void {
    this.close();
  }

  get editorOptions(): string[] {
    // derive options live from editorText (cleaned & deduped)
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
      await this.combo.updateCombobox(this._comboboxName, this.editorText, this.editorDefault);
      // close modal (watcher will update options/default)
      this.close();
    } catch (err) {
      console.error('Failed saving combobox:', err);
      // quick user feedback — replace with your toast/UX
      alert((err && (err as Error).message) || 'Save failed');
    }
  }
}