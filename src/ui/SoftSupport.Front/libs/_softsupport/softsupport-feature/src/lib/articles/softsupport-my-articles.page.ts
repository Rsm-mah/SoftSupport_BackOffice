import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  ConfirmationModalComponent,
  DataTableEmptyStateComponent,
  SoftButtonComponent,
  SoftIconComponent,
  SoftInputComponent,
} from '@soft-mfe/shared-components';
import { PageSize } from '@soft-mfe/shared-models';
import { getApiErrorMessage, ToastService } from '@soft-mfe/shared-services';
import { MyArticle, SOFTSUPPORT_DEFAULT_PAGE_SIZE } from '@softsupport/models';
import { SoftSupportArticleService } from '@softsupport/service';
import {
  SoftSupportArticleCodeComponent,
  SoftSupportArticleDetailModalComponent,
  SoftSupportArticleFormModalComponent,
  SoftSupportArticleStatusComponent,
  SoftSupportListPaginationComponent,
  SoftSupportPageHeaderComponent,
} from '@softsupport/ui';

/** « Mes articles » : rédaction, modification et suppression des articles de l'utilisateur. */
@Component({
  selector: 'softsupport-my-articles-page',
  imports: [
    DatePipe,
    TranslatePipe,
    ConfirmationModalComponent,
    DataTableEmptyStateComponent,
    SoftButtonComponent,
    SoftIconComponent,
    SoftInputComponent,
    SoftSupportArticleCodeComponent,
    SoftSupportArticleDetailModalComponent,
    SoftSupportArticleFormModalComponent,
    SoftSupportArticleStatusComponent,
    SoftSupportListPaginationComponent,
    SoftSupportPageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-testid="softsupport-my-articles">
      <softsupport-page-header
        [heading]="'softsupport.mine.title' | translate"
        [subtitle]="'softsupport.mine.subtitle' | translate"
        [breadcrumb]="['softsupport.sidebar.articles' | translate, 'softsupport.sidebar.articlesMine' | translate]"
      >
        <soft-button variant="primary" (onClick)="openForm(null)">
          <soft-icon name="plus" size="sm" class="mr-1.5" />{{ 'softsupport.mine.add' | translate }}
        </soft-button>
      </softsupport-page-header>

      <div class="ss-reveal flex w-full max-w-xl items-end gap-2" style="--delay: 0.15s">
        <div class="flex-1">
          <soft-input
            [label]="'softsupport.common.search' | translate"
            [placeholder]="'softsupport.articles.searchPlaceholder' | translate"
            name="filter-mine"
            autocomplete="off"
            [value]="search()"
            (valueChange)="onSearch($event)"
          />
        </div>
      </div>

      <div class="ss-reveal mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white" style="--delay: 0.25s">
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-blue-50 text-xs uppercase tracking-wide text-blue-700">
              <tr>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.articles.columns.code' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.articles.columns.title' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.articles.fields.product' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.articles.fields.ticketNumber' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.articles.columns.createdAt' | translate }}</th>
                <th class="px-4 py-3 text-right font-semibold">{{ 'softsupport.articles.columns.views' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.articles.columns.status' | translate }}</th>
                <th class="px-4 py-3 text-right font-semibold">{{ 'softsupport.common.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @if (loading() && rows().length === 0) {
                <tr><td colspan="8" class="px-4 py-8 text-center text-slate-500">{{ 'common.loading' | translate }}</td></tr>
              } @else if (error()) {
                <tr><td colspan="8" class="px-4 py-8 text-center text-red-600">{{ error() }}</td></tr>
              } @else if (visible().length === 0) {
                <tr>
                  <td colspan="8" class="px-4 py-10">
                    <soft-data-table-empty-state [message]="'softsupport.mine.empty' | translate" [hasActiveFilters]="search().trim() !== ''" (clearFilters)="onSearch('')" />
                  </td>
                </tr>
              } @else {
                @for (row of visible(); track row.articleId) {
                  <tr class="ss-row cursor-pointer hover:bg-slate-50" [style.--i]="$index" (click)="detailId.set(row.articleId)">
                    <td class="px-4 py-3"><softsupport-article-code [code]="row.code" /></td>
                    <td class="max-w-[24rem] truncate px-4 py-3 font-medium text-slate-900">{{ row.title }}</td>
                    <td class="max-w-[12rem] truncate px-4 py-3 text-slate-700">{{ row.productName || '—' }}</td>
                    <td class="px-4 py-3 font-mono text-xs text-slate-600">{{ row.ticketNumber || '—' }}</td>
                    <td class="whitespace-nowrap px-4 py-3 text-slate-700">{{ row.createdAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                    <td class="px-4 py-3 text-right text-slate-700">{{ row.viewNumber }}</td>
                    <td class="px-4 py-3"><softsupport-article-status [validated]="row.isValidated" /></td>
                    <td class="px-4 py-3" (click)="$event.stopPropagation()">
                      <div class="flex justify-end gap-1">
                        <button type="button" class="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700" [title]="'common.actions.edit' | translate" (click)="openForm(row.articleId)">
                          <soft-icon name="edit" size="sm" />
                        </button>
                        <button type="button" class="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" [title]="'common.actions.delete' | translate" (click)="askDelete(row)">
                          <soft-icon name="trash" size="sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
        @if (!error() && filtered().length > 0) {
          <softsupport-list-pagination
            [page]="page()"
            [pageSize]="pageSize()"
            [totalCount]="filtered().length"
            (pageChange)="page.set($event)"
            (pageSizeChange)="onPageSizeChange($event)"
          />
        }
      </div>
    </section>

    <softsupport-article-form-modal [open]="formOpen()" [articleId]="editedId()" mode="author" (closed)="formOpen.set(false)" (saved)="onSaved()" />
    <softsupport-article-detail-modal [articleId]="detailId()" (closed)="detailId.set(null)" (changed)="load()" />

    <app-confirmation-modal
      #deleteModal
      [title]="'softsupport.mine.delete.title' | translate"
      [message]="'softsupport.mine.delete.message' | translate: { code: toDelete()?.code ?? '' }"
      [cancelLabel]="'common.actions.cancel' | translate"
      [confirmLabel]="'common.actions.delete' | translate"
      (confirmed)="confirmDelete()"
    />
  `,
})
export class SoftSupportMyArticlesPage implements OnInit {
  private readonly articlesApi = inject(SoftSupportArticleService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly deleteModal = viewChild<ConfirmationModalComponent>('deleteModal');

  readonly rows = signal<MyArticle[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly search = signal('');
  readonly page = signal(1);
  readonly pageSize = signal<PageSize>(SOFTSUPPORT_DEFAULT_PAGE_SIZE as PageSize);
  readonly formOpen = signal(false);
  readonly editedId = signal<number | null>(null);
  readonly detailId = signal<number | null>(null);
  readonly toDelete = signal<MyArticle | null>(null);

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    return term
      ? this.rows().filter(row => `${row.code ?? ''} ${row.title} ${row.productName ?? ''}`.toLowerCase().includes(term))
      : this.rows();
  });

  readonly visible = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.load();
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  onPageSizeChange(size: PageSize): void {
    this.pageSize.set(size);
    this.page.set(1);
  }

  openForm(articleId: number | null): void {
    this.editedId.set(articleId);
    this.formOpen.set(true);
  }

  onSaved(): void {
    this.formOpen.set(false);
    this.load();
  }

  askDelete(row: MyArticle): void {
    this.toDelete.set(row);
    this.deleteModal()?.open();
  }

  confirmDelete(): void {
    const row = this.toDelete();
    if (!row) {
      return;
    }
    this.articlesApi.delete(row.articleId).subscribe({
      next: message => {
        this.toast.success(message);
        this.load();
      },
      error: error => this.toast.error(getApiErrorMessage(error) ?? this.translate.instant('common.errors.generic')),
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.articlesApi.getMine().subscribe({
      next: rows => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: error => {
        this.loading.set(false);
        this.error.set(getApiErrorMessage(error) ?? this.translate.instant('common.errors.generic'));
      },
    });
  }
}
