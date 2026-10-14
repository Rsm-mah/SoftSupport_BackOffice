import { Component, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { ToastService } from '@soft-mfe/shared-services';
@Component({
  selector: 'soft-toast',
   imports: [NgClass],
  standalone: true,
  template: `
    <div class="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] space-y-2 pointer-events-none">
      @for (toast of toastService.currentMessages(); track toast.id) {
        <button
          type="button"
          class="block px-4 py-3 rounded-lg shadow-lg text-white font-medium transition-all duration-300 animate-fadeIn pointer-events-auto"
          [ngClass]="{
            'bg-green-500': toast.type === 'success',
            'bg-red-500': toast.type === 'error',
            'bg-blue-500': toast.type === 'info',
            'bg-amber-500': toast.type === 'warning'
          }"
          (click)="toastService.remove(toast.id)"
        >
          {{ toast.message }}
        </button>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateX(20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    .animate-fadeIn {
      animation: fadeIn 0.3s ease-out;
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
}



