import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SoftIconComponent } from './soft-icon.component';
import { CardDashboardConfig } from '@soft-mfe/shared-models';
import { TranslatePipe } from '@ngx-translate/core';


@Component({
  selector: 'soft-card-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SoftIconComponent, TranslatePipe],
  template: `
  <div [class]="gridClasses()">

  @if (loading()) {

    @for (card of skeletonCards(); track card) {

      <div
        [class]="loadingCardClasses()">

        <div class="flex items-center gap-2 mb-3">
          <div class="w-4 h-4 bg-slate-200 rounded"></div>
          <div class="h-3 w-24 bg-slate-200 rounded"></div>
        </div>

        <div class="h-10 w-20 bg-slate-200 rounded mb-3"></div>

        <div class="h-3 w-28 bg-slate-200 rounded"></div>

      </div>

    }

  } @else {

      @for (card of cards(); track card.label) {
        <div
          [class]="cardClasses()"
          [style.border-left-color]="card.color"
          [class.blink]="isLate(card)">

          <div class="flex items-center gap-2 mb-2">
            @if (card.icon) {
              <soft-icon [name]="card.icon" size="sm" [style.color]="card.color"></soft-icon>
            }
            <p class="text-sm font-semibold uppercase" [style.color]="card.color">
              {{ card.label | translate }}
            </p>
          </div>

          <p class="text-4xl font-bold mb-2" [style.color]="card.color">
            {{ card.value }}
            @if (card.valueSuffix) {
              <span class="text-xl">{{ card.valueSuffix }}</span>
            } @else if (card.valueSuffixKey) {
              <span class="text-xl">{{ card.valueSuffixKey | translate }}</span>
            }
          </p>

          @if (card.displayValue) {
            <p class="text-xs text-gray-500">
               {{ card.displayValue | translate }}
            </p>
          }
        </div>
      }

  }

</div>
  `,
  styleUrl: './card-dashboard.component.css'
})
export class CardDashboardComponent {
  cards = input.required<CardDashboardConfig[]>();
  loading = input<boolean>(false);
  fitFiveCards = input<boolean>(false);

  gridClasses(): string {
    return this.fitFiveCards()
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6'
      : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6';
  }

  cardClasses(): string {
    return this.fitFiveCards()
      ? 'flex-1 min-w-0 rounded-lg p-4 bg-white border-l-4 shadow-sm hover:shadow-md transition'
      : 'flex-1 rounded-lg p-6 bg-white border-l-4 shadow-sm hover:shadow-md transition';
  }

  loadingCardClasses(): string {
    return this.fitFiveCards()
      ? 'rounded-lg p-4 bg-white border-l-4 border-slate-200 shadow-sm animate-pulse min-w-0'
      : 'rounded-lg p-4 md:p-6 bg-white border-l-4 border-slate-200 shadow-sm animate-pulse min-w-0';
  }

  skeletonCards(): CardDashboardConfig[] | number[] {
    if (this.cards().length) {
      return this.cards();
    }

    return this.fitFiveCards() ? [1, 2, 3, 4, 5] : [1, 2, 3, 4];
  }

  isLate(card: CardDashboardConfig): boolean {
    return (
      typeof card.value === 'number' &&
      card.value > 0 &&
      card.label === 'dashboard.pilotage.kpi.documentsLate'
    );
  }
}
