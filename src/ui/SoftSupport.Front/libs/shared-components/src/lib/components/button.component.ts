import { Component, ElementRef, Input, Output, EventEmitter, inject } from '@angular/core';

@Component({
  selector: 'soft-button',
  standalone: true,
  template: `
    <button
      [disabled]="disabled || isLoading"
      [class]="getClasses()"
      (click)="onClick.emit($event)"
      [type]="type"
      [attr.title]="title"
      [attr.aria-label]="ariaLabel"
      [attr.aria-expanded]="ariaExpanded">
      
      @if (isLoading) {
        <span class="inline-block mr-1.5 animate-spin">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0110 10"/>
          </svg>
        </span>
      }
      
      <ng-content></ng-content>
    </button>
  `,
  styles: [
    `
      :host {
        display: contents;
        background: transparent !important;
        border: none !important;
        padding: 0 !important;
        margin: 0 !important;
      }
    `,
  ],
})
export class SoftButtonComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  private get hostClass(): string {
    return (this.host.nativeElement.getAttribute('class') ?? '').trim();
  }

  @Input() variant: 'primary' | 'secondary' | 'accent' | 'danger' | 'danger-dark' | 'success' | 'indigo' | 'teal' | 'ghost' | 'icon-orange' | 'icon-red' | 'raw' | 'chip' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() isLoading = false;
  @Input() title?: string;
  @Input('aria-label') ariaLabel?: string;
  @Input('aria-expanded') ariaExpanded?: boolean;
  @Input() fullWidth = false;

  static ngAcceptInputType_fullWidth: boolean | '' | undefined;
  @Input() active = false;
  @Output() onClick = new EventEmitter<MouseEvent>();

  getClasses(): string {
    if (this.variant === 'raw') {
      const widthClass = this.fullWidth ? 'w-full' : '';
      return `${this.hostClass} ${widthClass}`.trim();
    }

    if (this.variant === 'chip') {
      const base = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none';
      const state = this.active
        ? 'bg-violet-600 text-white border-violet-600'
        : 'bg-white text-gray-700 border-gray-300 hover:border-violet-400 hover:text-violet-700';
      return `${base} ${state}`;
    }

    const sizeClass = `btn-${this.size}`;
    const variantClass = `btn-${this.variant}`;
    const widthClass = this.fullWidth ? 'w-full' : '';
    
    return `btn ${variantClass} ${sizeClass} ${widthClass} ${this.hostClass}`.trim();
  }
}
