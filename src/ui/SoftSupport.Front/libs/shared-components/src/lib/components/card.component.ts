import { Component, Input } from '@angular/core';

@Component({
  selector: 'soft-card',
  standalone: true,
  imports: [],
  template: `
    <div [class]="getClasses()">
      <ng-content></ng-content>
    </div>
  `
})
export class SoftCardComponent {
  @Input() variant: 'default' | 'bordered' | 'elevated' | 'interactive' = 'default';
  @Input() padding: 'sm' | 'md' | 'lg' = 'md';
  @Input() rounded: 'md' | 'lg' | 'xl' = 'lg';
  /** When true, the card fills its container's height and lays out its content as a column (useful in equal-height grids). */
  @Input() fullHeight = false;

  getClasses(): string {
    const paddingClasses = {
      sm: 'p-3',
      md: 'p-6',
      lg: 'p-8',
    };

    const roundedClasses = {
      md: 'rounded-lg',
      lg: 'rounded-xl',
      xl: 'rounded-2xl',
    };

    const variantClass = this.variant !== 'default' ? this.variant : '';
    const fullHeightClass = this.fullHeight ? 'h-full flex flex-col' : '';

    return `card ${variantClass} ${paddingClasses[this.padding]} ${roundedClasses[this.rounded]} ${fullHeightClass}`.trim();
  }
}
