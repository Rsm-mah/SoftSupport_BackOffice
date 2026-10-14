import { Component, Input, Output, EventEmitter, forwardRef, signal, ChangeDetectionStrategy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'soft-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SoftToggleComponent),
      multi: true,
    },
  ],
  template: `
    <button
      type="button"
      role="switch"
      [attr.aria-checked]="checkedState()"
      class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      [style.background-color]="checkedState() ? activeColor : '#d1d5db'"
      [disabled]="_isDisabled()"
      (click)="toggle()"
      [attr.aria-label]="ariaLabel"
    >
      <span
        class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
        [class.translate-x-6]="checkedState()"
        [class.translate-x-1]="!checkedState()"
      ></span>
    </button>
  `,
})
export class SoftToggleComponent implements ControlValueAccessor {
  @Input() activeColor = '#2563eb';
  @Input() ariaLabel = 'Toggle';
  @Input() set checked(value: boolean) {
    this.checkedState.set(!!value);
  }
  @Output() checkedChange = new EventEmitter<boolean>();

  readonly checkedState = signal(false);
  readonly _isDisabled = signal(false);

  private _onChange: (v: boolean) => void = () => {};
  private _onTouched: () => void = () => {};

  toggle(): void {
    if (this._isDisabled()) return;
    const next = !this.checkedState();
    this.checkedState.set(next);
    this.checkedChange.emit(next);
    this._onChange(next);
    this._onTouched();
  }

  writeValue(val: boolean): void {
    this.checkedState.set(!!val);
  }

  registerOnChange(fn: (v: boolean) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._isDisabled.set(isDisabled);
  }
}
