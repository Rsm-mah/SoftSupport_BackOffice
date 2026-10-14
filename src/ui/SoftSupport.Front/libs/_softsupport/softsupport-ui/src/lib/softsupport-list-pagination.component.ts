import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SoftIconComponent } from '@soft-mfe/shared-components';
import { PAGE_SIZES, PageSize } from '@soft-mfe/shared-models';
import { paginationPageNumbers, paginationRange, paginationTotalPages } from '@softsupport/models';

/** Pied de tableau paginé, identique à celui des listes SoftFunds. */
@Component({
  selector: 'softsupport-list-pagination',
  imports: [TranslatePipe, SoftIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3">
      <div class="flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <label class="flex items-center gap-1.5">
          {{ 'common.pagination.pageSize' | translate }}
          <select
            class="cursor-pointer rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
            [value]="pageSize()"
            (change)="onPageSizeChange($event)"
          >
            @for (size of pageSizes; track size) {
              <option [value]="size" [selected]="size === pageSize()">{{ size }}</option>
            }
          </select>
        </label>
        <span>{{ 'common.pagination.showing' | translate: { from: range().from, to: range().to, total: totalCount() } }}</span>
      </div>

      <nav class="flex items-center gap-1" [attr.aria-label]="'common.pagination.navLabel' | translate">
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition enabled:hover:bg-slate-100 enabled:hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          [disabled]="page() <= 1"
          (click)="pageChange.emit(page() - 1)"
          [attr.aria-label]="'common.pagination.previous' | translate"
        >
          <soft-icon name="chevron-left" size="sm" />
        </button>

        @for (item of pageNumbers(); track $index) {
          @if (item === '...') {
            <span class="flex h-7 w-7 items-center justify-center text-sm text-slate-400">…</span>
          } @else {
            <button
              type="button"
              class="min-w-7 rounded-md px-2 py-1 text-sm font-medium transition"
              [class]="item === page() ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-100'"
              [attr.aria-current]="item === page() ? 'page' : null"
              (click)="pageChange.emit(item)"
            >
              {{ item }}
            </button>
          }
        }

        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition enabled:hover:bg-slate-100 enabled:hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          [disabled]="page() >= totalPages()"
          (click)="pageChange.emit(page() + 1)"
          [attr.aria-label]="'common.pagination.next' | translate"
        >
          <soft-icon name="chevron-right" size="sm" />
        </button>
      </nav>
    </div>
  `,
})
export class SoftSupportListPaginationComponent {
  readonly page = input.required<number>();
  readonly pageSize = input.required<PageSize>();
  readonly totalCount = input.required<number>();

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<PageSize>();

  protected readonly pageSizes = PAGE_SIZES;
  protected readonly totalPages = computed(() => paginationTotalPages(this.totalCount(), this.pageSize()));
  protected readonly range = computed(() => paginationRange(this.page(), this.pageSize(), this.totalCount()));
  protected readonly pageNumbers = computed(() => paginationPageNumbers(this.page(), this.totalPages()));

  protected onPageSizeChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if (PAGE_SIZES.includes(value as PageSize)) {
      this.pageSizeChange.emit(value as PageSize);
    }
  }
}
