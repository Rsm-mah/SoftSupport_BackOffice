import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'soft-data-table-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center gap-3">
      <!-- Empty State Icon -->
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
        <rect x="4" y="12" width="48" height="32" rx="4" fill="#f1f5f9" stroke="#dee2e6" stroke-width="1.5"/>
        <rect x="4" y="12" width="48" height="9" rx="4" fill="#e2e8f0"/>
        <line x1="12" y1="30" x2="26" y2="30" stroke="#dee2e6" stroke-width="2" stroke-linecap="round"/>
        <line x1="12" y1="37" x2="22" y2="37" stroke="#dee2e6" stroke-width="2" stroke-linecap="round"/>
        <circle cx="42" cy="37" r="7" fill="white" stroke="#dee2e6" stroke-width="1.5"/>
        <line x1="39.5" y1="37" x2="44.5" y2="37" stroke="#6c757d" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="42" y1="34.5" x2="42" y2="39.5" stroke="#6c757d" stroke-width="1.5" stroke-linecap="round"/>
      </svg>

      <!-- Message -->
      <p [class]="messageClass()">{{ message() }}</p>

      <!-- Clear Filters Button (if applicable) -->
      @if (hasActiveFilters()) {
        <button
          type="button"
          class="text-xs underline focus-visible:ring-2 rounded"
          [style.color]="headerColor()"
          (click)="clearFilters.emit()"
        >
          Effacer les filtres
        </button>
      }
    </div>
  `,
})
export class DataTableEmptyStateComponent {
  readonly message = input('Aucun résultat');
  readonly headerColor = input<string>();
  readonly hasActiveFilters = input.required<boolean>();
  readonly messageClass = input('text-sm font-medium text-[#212529]');

  readonly clearFilters = output<void>();
}
