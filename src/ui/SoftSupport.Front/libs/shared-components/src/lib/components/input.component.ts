import { Component, signal, input, output, forwardRef, OnInit, ChangeDetectionStrategy, effect, ViewChild, ElementRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'soft-input',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SoftInputComponent),
      multi: true,
    }
  ],
  template: `
    <div class="w-full">
      @if (label()) {
        <label [for]="internalInputId()" class="form-label">
          {{ label() }}
          @if (required()) {
            <span class="text-danger">*</span>
          }
        </label>
      }

      @if (type() === 'checkbox') {
        <input
          [id]="internalInputId()"
          type="checkbox"
          [checked]="isCheckboxChecked()"
          [disabled]="internalDisabled()"
          (change)="onCheckboxChange($event)"
          [class]="inputClass() || 'w-4 h-4 rounded border-gray-300 accent-violet-600 cursor-pointer flex-shrink-0'"
        />
      } @else if (type() === 'file') {
        <input
          #fileInput
          [id]="internalInputId()"
          type="file"
          [accept]="accept()"
          [multiple]="multiple()"
          [disabled]="internalDisabled()"
          (change)="onFileChange($event)"
          [class]="inputClass() || 'hidden'"
        />
      } @else {
      <input
        [id]="internalInputId()"
        #input
        [type]="type()"
        [name]="name() || null"
        [attr.autocomplete]="autocomplete() || null"
        [placeholder]="placeholder()"
        [disabled]="internalDisabled()"
        [value]="internalValue()"
        [attr.min]="min()"
        [attr.max]="max()"
        (input)="onInput($event)"
        (blur)="handleBlur()"
        (focus)="handleFocus()"
        class="form-input"
        [class]="inputClass()"
        [class.error]="error()"
        [style]="getInputStyles()"/>
      }

      @if (error()) {
        <div class="form-error">{{ error() }}</div>
      }

      @if (hint() && !error()) {
        <div class="form-hint">{{ hint() }}</div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class SoftInputComponent implements ControlValueAccessor, OnInit {
  readonly label = input('');
  readonly placeholder = input('');
  // `datetime-local` ajoute par le lot L9 de SofRecruit : le champ rendez-vous du pipeline porte
  // une heure, et « le 24/06 » ne convoque personne. Ajout purement additif au type union — le
  // gabarit passe deja `[type]` tel quel a l'element natif, et aucun appelant existant ne change.
  readonly type = input<'text' | 'email' | 'password' | 'number' | 'date' | 'datetime-local' | 'checkbox' | 'file'>('text');
  readonly accept = input('');
  readonly multiple = input(false);
  readonly required = input(false);
  readonly disabled = input(false);
  readonly error = input('');
  readonly hint = input('');
  readonly value = input('');
  readonly inputId = input('');
  /** Attribut HTML name — utile pour éviter l'autofill navigateur sur les filtres. */
  readonly name = input('');
  /** Attribut HTML autocomplete (ex. off, search, username). */
  readonly autocomplete = input('');
  readonly inputClass = input('');
  readonly min = input<string | number | null>(null);
  readonly max = input<string | number | null>(null);
  readonly inputStyle = input<{ [key: string]: string }>({});
  readonly valueChange = output<string>();
  readonly filesChange = output<File[]>();
  readonly onFocus = output<void>();
  readonly onBlur = output<void>();

  @ViewChild('fileInput') private fileInputRef?: ElementRef<HTMLInputElement>;

  isFocused = false;

  private readonly _internalDisabled = signal(this.disabled());
  private readonly _internalValue = signal(this.value());
  private readonly _internalInputId = signal(this.inputId());

  readonly internalInputId = this._internalInputId.asReadonly();
  readonly internalDisabled = this._internalDisabled.asReadonly();
  readonly internalValue = this._internalValue.asReadonly();

  onChange: (value: string | boolean) => void = () => {};
  onTouched: () => void = () => {};
  private isCvaMode = false;

  constructor() {
    effect(() => {
      if (this.isCvaMode) {
        return;
      }
      const externalValue = this.value();
      if (!this.isFocused) {
        this._internalValue.set(externalValue);
      }
    });

    effect(() => {
      // Une fois piloté par les Reactive Forms (writeValue appelé au moins une fois), l'état
      // désactivé doit venir exclusivement de setDisabledState (form.disable()/enable()) — sinon
      // ce effect, qui se déclenche de façon asynchrone après la création du composant, écrase la
      // valeur posée par setDisabledState avec l'@Input `disabled` resté à sa valeur par défaut
      // (souvent `false`, faute de binding explicite), rendant un champ visuellement/interactivement
      // modifiable alors que le FormControl associé est bien désactivé.
      if (this.isCvaMode) {
        return;
      }
      this._internalDisabled.set(this.disabled());
    });
  }

  ngOnInit(): void {
    if (!this.inputId()) {
      const generatedId = `soft-input-${Math.random().toString(36).substr(2, 9)}`;
      this._internalInputId.set(generatedId);
    } else {
      this._internalInputId.set(this.inputId());
    }

    this._internalDisabled.set(this.disabled());
  }

  getInputStyles(): { [key: string]: string } {
    let borderColor = 'var(--color-border)';
    let bgColor = 'var(--color-surface)';
    let boxShadow = 'none';

    if (this.error()) {
      borderColor = 'var(--color-danger)';
    } else if (this.isFocused) {
      borderColor = 'var(--color-brand)';
      boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
    }

    if (this._internalDisabled()) {
      bgColor = 'var(--color-surface-dark)';
    }

    return {
      'border-color': borderColor,
      'background-color': bgColor,
      'box-shadow': boxShadow,
      ...this.inputStyle(),
    };
  }

  onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this._internalValue.set(raw);
    const emitted = this.type() === 'number' && raw !== '' ? Number(raw) as unknown as string : raw;
    this.onChange(emitted);
    this.valueChange.emit(raw);
  }

  handleFocus(): void {
    this.isFocused = true;
    this.onFocus.emit();
  }

  handleBlur(): void {
    this.isFocused = false;
    this.onBlur.emit();
    this.onTouched();
  }

  isCheckboxChecked(): boolean {
    return this._internalValue() === 'true';
  }

  onCheckboxChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const stringValue = checked ? 'true' : 'false';
    this._internalValue.set(stringValue);
    this.onChange(checked);
    this.valueChange.emit(stringValue);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files?.length) {
      this.filesChange.emit(Array.from(files));
    }
    input.value = '';
  }

  openFilePicker(): void {
    this.fileInputRef?.nativeElement.click();
  }

  resetFilePicker(): void {
    const input = this.fileInputRef?.nativeElement;
    if (input) {
      input.value = '';
    }
  }

  writeValue(val: string | number | boolean | null | undefined): void {
    this.isCvaMode = true;
    if (this.type() === 'checkbox') {
      const checked = val === true || val === 'true';
      this._internalValue.set(checked ? 'true' : 'false');
      return;
    }
    this._internalValue.set(val != null ? String(val) : '');
  }

  registerOnChange(fn: (value: string | boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._internalDisabled.set(isDisabled);
  }
}
