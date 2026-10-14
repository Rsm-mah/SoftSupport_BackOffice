
import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { attachHostToBody } from './body-portal';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

@Component({
  selector: 'soft-modal',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open) {
      <div
        class="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
        [class.p-4]="!fullscreen"
        [class.p-0]="fullscreen"
        role="presentation"
        (click)="onBackdropClick($event)"
      >
        <div
          #dialog
          class="flex w-full flex-col border border-slate-200/60 bg-white shadow-2xl shadow-slate-900/20"
          [class.rounded-2xl]="!fullscreen"
          [class.rounded-none]="fullscreen"
          [class.max-h-[90vh]]="!fullscreen"
          [class.h-screen]="fullscreen"
          [class.max-h-screen]="fullscreen"
          [ngClass]="fullscreen ? 'max-w-none' : sizeClass"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="ariaLabel"
          tabindex="-1"
        >
          <div
            class="flex-shrink-0 border-b border-slate-100"
            [class.px-8]="!fullscreen"
            [class.py-6]="!fullscreen"
            [class.px-6]="fullscreen"
            [class.py-4]="fullscreen"
          >
            <ng-content select="[modal-header]"></ng-content>
          </div>
          <div
            class="flex min-h-0 flex-1 flex-col"
            [class.overflow-y-auto]="!fullscreen"
            [class.overflow-hidden]="fullscreen"
            [class.px-8]="!fullscreen"
            [class.py-6]="!fullscreen"
            [class.px-4]="fullscreen"
            [class.py-4]="fullscreen"
          >
            <ng-content select="[modal-body]"></ng-content>
          </div>
          <div
            class="flex-shrink-0 border-t border-slate-100 bg-slate-50/50"
            [class.px-8]="!fullscreen"
            [class.py-5]="!fullscreen"
            [class.rounded-b-2xl]="!fullscreen"
            [class.px-6]="fullscreen"
            [class.py-4]="fullscreen"
          >
            <ng-content select="[modal-footer]"></ng-content>
          </div>
        </div>
      </div>
    }
  `,
})
export class SoftModalComponent implements AfterViewChecked, OnDestroy {
  @Input() closeOnBackdrop = true;
  @Input() closeOnEsc = true;
  @Input() fullscreen = false;
  @Input() size: ModalSize = 'lg';
  @Input() ariaLabel = 'Dialogue';

  @Output() readonly openChange = new EventEmitter<boolean>();
  @Output() readonly openedChange = new EventEmitter<boolean>();
  @Output() readonly close = new EventEmitter<void>();

  private _open = false;
  private focusPending = false;
  private restoreFocusTo: HTMLElement | null = null;

  @ViewChild('dialog') private dialog?: ElementRef<HTMLElement>;

  constructor() {
    attachHostToBody();
  }

  @Input()
  set open(value: boolean) {
    const nextValue = Boolean(value);
    if (this._open === nextValue) {
      return;
    }

    if (nextValue) {
      this.restoreFocusTo =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      this.focusPending = true;
    }
    this._open = nextValue;
    if (!nextValue) {
      this.restoreFocus();
    }
    this.openedChange.emit(nextValue);
  }

  get open(): boolean {
    return this._open;
  }

  get sizeClass(): string {
    switch (this.size) {
      case 'sm':
        return 'max-w-sm';
      case 'md':
        return 'max-w-md';
      case 'lg':
        return 'max-w-[560px]';
      case 'xl':
        return 'max-w-3xl';
      case '2xl':
        return 'max-w-5xl';
      case '3xl':
        return 'max-w-7xl';
      default:
        return 'max-w-[560px]';
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.open && this.closeOnEsc) {
      this.requestClose();
    }
  }

  @HostListener('document:keydown.tab', ['$event'])
  onTabKey(event: Event): void {
    const dialog = this.dialog?.nativeElement;
    if (!(event instanceof KeyboardEvent) || !this.open || !dialog) {
      return;
    }
    const focusable = this.focusableElements(dialog);
    if (!focusable.length) {
      event.preventDefault();
      dialog.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) {
      return;
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  ngAfterViewChecked(): void {
    if (!this.open || !this.focusPending || !this.dialog) {
      return;
    }
    this.focusPending = false;
    const first = this.focusableElements(this.dialog.nativeElement)[0];
    (first ?? this.dialog.nativeElement).focus();
  }

  ngOnDestroy(): void {
    this.restoreFocus();
  }

  onBackdropClick(event: MouseEvent): void {
    if (!this.closeOnBackdrop) {
      return;
    }

    if (event.target === event.currentTarget) {
      this.requestClose();
    }
  }

  requestClose(): void {
    if (!this.open) {
      return;
    }

    this._open = false;
    this.restoreFocus();
    this.openChange.emit(false);
    this.openedChange.emit(false);
    this.close.emit();
  }

  private focusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), '
      + 'select:not([disabled]), textarea:not([disabled]), '
      + 'a[href], [tabindex]:not([tabindex="-1"])',
    )).filter(element => !element.hasAttribute('hidden'));
  }

  private restoreFocus(): void {
    if (this.restoreFocusTo?.isConnected) {
      this.restoreFocusTo.focus();
    }
    this.restoreFocusTo = null;
  }
}
