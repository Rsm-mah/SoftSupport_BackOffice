import { Component, Input } from '@angular/core';

@Component({
  selector: 'soft-badge',
  standalone: true,
  imports: [],
  template: `
    <span [class]="'badge badge-' + variant" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">
      <ng-content></ng-content>
    </span>
  `,
})
export class SoftBadgeComponent {
  @Input() variant: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' | 'orange' | 'danger-dark' = 'primary';
}
