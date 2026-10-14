import { ConnectedPosition, Overlay, OverlayModule } from '@angular/cdk/overlay';
import {
  Component,
  signal,
  input,
  output,
  forwardRef,
  OnInit,
  ChangeDetectionStrategy,
  effect,
  computed,
  inject,
  ElementRef,
  HostListener,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectOption } from '@soft-mfe/shared-models';

const DEFAULT_SELECT_CLASS =
  'w-full appearance-none border border-gray-200 rounded-sm bg-white px-3 py-2 pr-8 text-sm text-gray-700 ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

@Component({
  selector: 'soft-select',
  standalone: true,
  imports: [OverlayModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SoftSelectComponent),
      multi: true,
    },
  ],
  styles: [
    `
      :host {
        display: block;
      }

      select {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        background-image: none;
      }

      select::-ms-expand {
        display: none;
      }
    `,
  ],
  template: `
    <div class="w-full">
      @if (label()) {
        <label [for]="internalId()" class="form-label">
          {{ label() }}
          @if (required()) {
            <span class="text-danger">*</span>
          }
        </label>
      }

      @if (searchable()) {
        <div class="relative" cdkOverlayOrigin #origin="cdkOverlayOrigin">
          <button
            type="button"
            [id]="internalId()"
            [disabled]="internalDisabled()"
            [class]="selectClass() + ' text-left'"
            [style]="resolvedStyles()"
            [attr.aria-expanded]="open()"
            [attr.aria-haspopup]="'listbox'"
            (click)="toggleDropdown()"
            (blur)="handleBlur()"
          >
            <span class="block truncate text-left pr-2">
              {{ selectedLabel() || placeholder() }}
            </span>
          </button>

          <span
            class="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400"
            aria-hidden="true"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </span>

          <ng-template
            cdkConnectedOverlay
            [cdkConnectedOverlayOrigin]="origin"
            [cdkConnectedOverlayOpen]="open()"
            [cdkConnectedOverlayPositions]="overlayPositions"
            [cdkConnectedOverlayWidth]="overlayWidth()"
            [cdkConnectedOverlayPush]="true"
            [cdkConnectedOverlayViewportMargin]="8"
            [cdkConnectedOverlayScrollStrategy]="scrollStrategy"
            [cdkConnectedOverlayHasBackdrop]="true"
            cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
            (backdropClick)="closeDropdown()"
            (detach)="closeDropdown()"
          >
            <div
              class="w-full border border-gray-300 rounded-lg bg-white shadow-lg max-h-64 overflow-y-auto"
              role="listbox"
            >
              <div class="sticky top-0 z-10 bg-white border-b border-gray-100 px-3 py-2">
                <input
                  type="text"
                  class="w-full rounded border border-gray-200 bg-gray-50 px-2 py-1.5 text-[12px] text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300"
                  [placeholder]="searchPlaceholder()"
                  [value]="searchQuery()"
                  (input)="onSearchInput($event)"
                  (click)="$event.stopPropagation()"
                  (keydown.escape)="closeDropdown(); $event.stopPropagation()"
                />
              </div>

              @if (filteredOptions().length === 0) {
                <div class="p-3 text-sm text-gray-500">{{ emptyFilterMessage() }}</div>
              } @else {
                @for (opt of filteredOptions(); track opt.value) {
                  <button
                    type="button"
                    role="option"
                    class="flex w-full items-center px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    [class.bg-blue-50]="isOptionSelected(opt.value)"
                    [disabled]="opt.disabled ?? false"
                    (click)="selectOption(opt)"
                  >
                    {{ opt.label }}
                  </button>
                }
              }
            </div>
          </ng-template>
        </div>
      } @else {
        <div class="relative">
          <select
            [id]="internalId()"
            [disabled]="internalDisabled()"
            [class]="selectClass()"
            [style]="resolvedStyles()"
            [value]="internalValue()"
            (change)="handleChange($event)"
            (blur)="handleBlur()"
            (focus)="_isFocused.set(true)"
          >
            @if (placeholder()) {
              <option value="" [selected]="isPlaceholderSelected()">{{ placeholder() }}</option>
            } @else if (!internalValue()) {
              <option value="" [selected]="true"></option>
            }
            @for (opt of options(); track $index) {
              <option
                [value]="opt.value"
                [disabled]="opt.disabled ?? false"
                [selected]="isOptionSelected(opt.value)"
              >
                {{ opt.label }}
              </option>
            }
          </select>

          <span
            class="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400"
            aria-hidden="true"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
      }

      @if (error()) {
        <div class="form-error" role="alert" aria-live="polite">{{ error() }}</div>
      }

      @if (hint() && !error()) {
        <div class="form-hint">{{ hint() }}</div>
      }
    </div>
  `,
})
export class SoftSelectComponent implements ControlValueAccessor, OnInit {
  private readonly overlay = inject(Overlay);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly label = input('');
  readonly placeholder = input('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly error = input('');
  readonly hint = input('');
  readonly options = input<SelectOption[]>([]);
  readonly value = input('');
  readonly inputId = input('');
  /** Liste filtrable (champ de recherche dans le menu). */
  readonly searchable = input(false);
  readonly searchPlaceholder = input('Rechercher...');
  readonly emptyFilterMessage = input('Aucun enregistrement');

  readonly selectClass = input(DEFAULT_SELECT_CLASS);

  readonly selectStyle = input<Record<string, string>>({});

  readonly valueChange = output<string>();

  private readonly _internalValue = signal('');
  private readonly _internalDisabled = signal(false);
  private readonly _internalId = signal('');
  readonly _isFocused = signal(false);
  readonly open = signal(false);
  readonly searchQuery = signal('');
  readonly overlayWidth = signal(0);

  readonly internalValue = this._internalValue.asReadonly();
  readonly internalDisabled = this._internalDisabled.asReadonly();
  readonly internalId = this._internalId.asReadonly();

  readonly scrollStrategy = this.overlay.scrollStrategies.reposition();
  readonly overlayPositions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
  ];

  readonly filteredOptions = computed(() => {
    const opts = this.options();
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) {
      return opts;
    }
    return opts.filter((opt) => opt.label.toLowerCase().includes(query));
  });

  readonly selectedLabel = computed(() => {
    const current = this.normalizeValue(this.internalValue());
    if (!current) {
      return '';
    }
    return this.options().find((opt) => this.normalizeValue(opt.value) === current)?.label ?? '';
  });

  readonly resolvedStyles = () => {
    const styles: Record<string, string> = {};
    if (this.error()) {
      styles['border-color'] = 'var(--color-danger)';
    }
    if (this._internalDisabled()) {
      styles['background-color'] = 'var(--color-surface-dark)';
    }
    return { ...styles, ...this.selectStyle() };
  };

  private _onChange: (v: string) => void = () => {};
  private _onTouched: () => void = () => {};
  private isCvaMode = false;

  constructor() {
    effect(() => {
      this._internalDisabled.set(this.disabled());
    });

    effect(() => {
      if (this.isCvaMode) {
        return;
      }
      const nextValue = this.value();
      this.options();
      this._internalValue.set(nextValue);
    });
  }

  ngOnInit(): void {
    this._internalId.set(
      this.inputId() || `soft-select-${Math.random().toString(36).slice(2, 9)}`
    );
    this._internalDisabled.set(this.disabled());
    this._internalValue.set(this.value());
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.open()) {
      this.closeDropdown();
    }
  }

  toggleDropdown(): void {
    if (this.internalDisabled()) {
      return;
    }
    if (!this.open()) {
      this.searchQuery.set('');
      this.overlayWidth.set(this.elementRef.nativeElement.getBoundingClientRect().width);
      this.open.set(true);
      this._isFocused.set(true);
      return;
    }
    this.closeDropdown();
  }

  closeDropdown(): void {
    if (!this.open()) {
      return;
    }
    this.open.set(false);
    this.searchQuery.set('');
    this._onTouched();
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  selectOption(opt: SelectOption): void {
    if (opt.disabled) {
      return;
    }
    this._internalValue.set(opt.value);
    this._onChange(opt.value);
    this.valueChange.emit(opt.value);
    this.closeDropdown();
  }

  handleChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this._internalValue.set(val);
    this._onChange(val);
    this.valueChange.emit(val);
  }

  handleBlur(): void {
    this._isFocused.set(false);
    this._onTouched();
  }

  protected isPlaceholderSelected(): boolean {
    return !this.normalizeValue(this.internalValue());
  }

  protected isOptionSelected(optionValue: string): boolean {
    const current = this.normalizeValue(this.internalValue());
    if (!current) {
      return false;
    }
    return current === this.normalizeValue(optionValue);
  }

  private normalizeValue(value: string): string {
    return value.trim().toLowerCase();
  }

  writeValue(val: string | null | undefined): void {
    this._internalValue.set(val ?? '');
  }

  registerOnChange(fn: (v: string) => void): void {
    this.isCvaMode = true;
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._internalDisabled.set(isDisabled);
  }
}
