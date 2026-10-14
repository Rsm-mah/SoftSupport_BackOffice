import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DataTableEmptyStateComponent, SoftBadgeComponent, SoftInputComponent, SoftSelectComponent } from '@soft-mfe/shared-components';
import { PageSize, SelectOption } from '@soft-mfe/shared-models';
import { getApiErrorMessage } from '@soft-mfe/shared-services';
import { ContractHistoryItem, ContractHistoryType, SOFTSUPPORT_DEFAULT_PAGE_SIZE } from '@softsupport/models';
import { SoftSupportCompanyService } from '@softsupport/service';
import { SoftSupportListPaginationComponent, SoftSupportPageHeaderComponent } from '@softsupport/ui';

const TYPE_VARIANT: Record<ContractHistoryType, 'success' | 'info' | 'danger' | 'primary'> = {
  Creation: 'success',
  Modification: 'info',
  Suppression: 'danger',
  Renouvellement: 'primary',
};

/** Historique des contrats clients : création, modification, suppression et renouvellement. */
@Component({
  selector: 'softsupport-history-page',
  imports: [
    DatePipe,
    TranslatePipe,
    DataTableEmptyStateComponent,
    SoftBadgeComponent,
    SoftInputComponent,
    SoftSelectComponent,
    SoftSupportListPaginationComponent,
    SoftSupportPageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-testid="softsupport-history">
      <softsupport-page-header
        [heading]="'softsupport.history.title' | translate"
        [subtitle]="'softsupport.history.subtitle' | translate"
        [breadcrumb]="['softsupport.sidebar.history' | translate]"
      />

      <div class="ss-reveal grid w-full max-w-3xl grid-cols-1 gap-3 md:grid-cols-2" style="--delay: 0.15s">
        <soft-input [label]="'softsupport.common.search' | translate" [placeholder]="'softsupport.history.searchPlaceholder' | translate" name="filter-history" autocomplete="off" [value]="search()" (valueChange)="onSearch($event)" />
        <soft-select [label]="'softsupport.history.type' | translate" [placeholder]="'softsupport.common.all' | translate" [options]="typeOptions()" [value]="type()" (valueChange)="type.set($event); reload()" />
      </div>

      <div class="ss-reveal mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white" style="--delay: 0.25s">
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-blue-50 text-xs uppercase tracking-wide text-blue-700">
              <tr>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.history.date' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.companies.fields.name' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.history.type' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.articles.fields.product' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.contracts.fields.start' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.contracts.fields.end' | translate }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @if (loading() && rows().length === 0) {
                <tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">{{ 'common.loading' | translate }}</td></tr>
              } @else if (error()) {
                <tr><td colspan="6" class="px-4 py-8 text-center text-red-600">{{ error() }}</td></tr>
              } @else if (rows().length === 0) {
                <tr><td colspan="6" class="px-4 py-10"><soft-data-table-empty-state [message]="'softsupport.history.empty' | translate" [hasActiveFilters]="search().trim() !== '' || type() !== ''" (clearFilters)="clear()" /></td></tr>
              } @else {
                @for (row of rows(); track row.historyId) {
                  <tr class="ss-row hover:bg-slate-50" [class.opacity-60]="loading()" [style.--i]="$index">
                    <td class="whitespace-nowrap px-4 py-3 text-slate-500">{{ row.createdAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                    <td class="px-4 py-3 font-medium text-slate-900">{{ row.companyName }}</td>
                    <td class="px-4 py-3"><soft-badge [variant]="variant(row)">{{ 'softsupport.history.types.' + row.type | translate }}</soft-badge></td>
                    <td class="px-4 py-3 text-slate-700">{{ row.productName || '—' }}</td>
                    <td class="whitespace-nowrap px-4 py-3 text-slate-700">{{ row.startDate | date: 'dd/MM/yyyy' }}</td>
                    <td class="whitespace-nowrap px-4 py-3 text-slate-700">{{ row.endDate | date: 'dd/MM/yyyy' }}</td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
        @if (!error() && totalCount() > 0) {
          <softsupport-list-pagination [page]="page()" [pageSize]="pageSize()" [totalCount]="totalCount()" (pageChange)="page.set($event); load()" (pageSizeChange)="pageSize.set($event); reload()" />
        }
      </div>
    </section>
  `,
})
export class SoftSupportHistoryPage implements OnInit, OnDestroy {
  private readonly companiesApi = inject(SoftSupportCompanyService);
  private readonly translate = inject(TranslateService);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  readonly rows = signal<ContractHistoryItem[]>([]);
  readonly totalCount = signal(0);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly search = signal('');
  readonly type = signal('');
  readonly page = signal(1);
  readonly pageSize = signal<PageSize>(SOFTSUPPORT_DEFAULT_PAGE_SIZE as PageSize);

  readonly typeOptions = computed<SelectOption[]>(() => [
    { value: '', label: this.translate.instant('softsupport.common.all') },
    ...(Object.keys(TYPE_VARIANT) as ContractHistoryType[]).map(type => ({
      value: type,
      label: this.translate.instant(`softsupport.history.types.${type}`),
    })),
  ]);

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  }

  variant(row: ContractHistoryItem): 'success' | 'info' | 'danger' | 'primary' {
    return TYPE_VARIANT[row.type] ?? 'info';
  }

  onSearch(value: string): void {
    this.search.set(value);
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => this.reload(), 350);
  }

  clear(): void {
    this.search.set('');
    this.type.set('');
    this.reload();
  }

  reload(): void {
    this.page.set(1);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.companiesApi
      .getHistory({ page: this.page(), pageSize: this.pageSize(), search: this.search(), type: this.type() || null })
      .subscribe({
        next: result => {
          this.rows.set(result.items);
          this.totalCount.set(result.totalCount);
          this.loading.set(false);
        },
        error: error => {
          this.loading.set(false);
          this.error.set(getApiErrorMessage(error) ?? this.translate.instant('common.errors.generic'));
        },
      });
  }
}
