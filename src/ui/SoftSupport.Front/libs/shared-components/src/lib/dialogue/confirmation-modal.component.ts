import { Component, inject, input, output, signal, viewChild, ElementRef } from "@angular/core";
import { attachHostToBody } from '../modal/body-portal';
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [],
  template: `
    @if (isOpen()) {
      <div
        #modalOverlay
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2100]"
        (keydown)="onKeydown($event)"
        tabindex="0"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">
          <div [class]="'text-white px-6 py-4 rounded-t-2xl flex items-center gap-3 ' + headerClass()">
            <h2 id="confirmation-modal-title" class="text-lg font-bold">{{ title() }}</h2>
            <button
              type="button"
              (click)="cancel()"
              class="ml-auto text-white hover:text-gray-200"
              aria-label="{{ cancelLabel() }}"
              title="{{ cancelLabel() }}"
            >
              ✕
            </button>
          </div>

          <div class="p-6">
            <p class="text-gray-800 font-medium">{{ message() }}</p>
            @if (additionalInfo()) {
              @if (additionalInfoAsHtml()) {
                <div class="text-gray-600 text-sm mt-2" [innerHTML]="additionalInfoHtml()"></div>
              } @else {
                <div class="text-gray-600 text-sm mt-2">{{ additionalInfo() }}</div>
              }
            }
            <ng-content select="[additional-info]" />
          </div>

          <div class="bg-gray-50 px-6 py-4 flex justify-center gap-4 rounded-b-2xl">
            <button
              (click)="cancel()"
              class="px-8 py-2 text-gray-700 font-semibold rounded-full border-2 border-gray-300 hover:bg-gray-100 transition"
            >
              {{ cancelLabel() }}
            </button>
            <button
              (click)="confirm()"
              [class]="'px-8 py-2 text-white font-semibold rounded-full transition ' + confirmButtonClass()"
            >
              {{ confirmLabel() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmationModalComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly modalOverlay = viewChild<ElementRef>('modalOverlay');

  readonly title = input<string>('Confirmation');
  readonly message = input<string>('Are you sure?');
  readonly additionalInfo = input<string | null>(null);
  readonly additionalInfoAsHtml = input<boolean>(false);
  readonly cancelLabel = input<string>('Cancel');
  readonly confirmLabel = input<string>('Confirm');
  readonly icon = input<string>('⚠️');
  readonly headerClass = input<string>('bg-red-500');
  readonly confirmButtonClass = input<string>('bg-red-500 hover:bg-red-600');
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  isOpen = signal(false);

  constructor() {
    attachHostToBody();
  }

  additionalInfoHtml(): SafeHtml | null {
    const info = this.additionalInfo();
    if (!info || !this.additionalInfoAsHtml()) {
      return null;
    }
    return this.sanitizer.bypassSecurityTrustHtml(info);
  }

  open() {
    this.isOpen.set(true);
    setTimeout(() => {
      this.modalOverlay()?.nativeElement?.focus();
    }, 0);
  }

  confirm() {
    this.confirmed.emit();
    this.close();
  }

  cancel() {
    this.cancelled.emit();
    this.close();
  }

  close() {
    this.isOpen.set(false);
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancel();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.confirm();
    }
  }
}
