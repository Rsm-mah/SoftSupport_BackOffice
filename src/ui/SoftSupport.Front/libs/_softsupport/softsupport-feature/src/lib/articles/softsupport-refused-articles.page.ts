import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DataTableEmptyStateComponent, SoftButtonComponent, SoftIconComponent } from '@soft-mfe/shared-components';
import { getApiErrorMessage } from '@soft-mfe/shared-services';
import { RefusedArticle } from '@softsupport/models';
import { SoftSupportArticleService } from '@softsupport/service';
import { SoftSupportArticleCodeComponent, SoftSupportArticleFormModalComponent, SoftSupportPageHeaderComponent } from '@softsupport/ui';

/** « Non validés » : articles refusés de l'utilisateur, avec le motif, à corriger et resoumettre. */
@Component({
  selector: 'softsupport-refused-articles-page',
  imports: [
    DatePipe,
    TranslatePipe,
    DataTableEmptyStateComponent,
    SoftButtonComponent,
    SoftIconComponent,
    SoftSupportArticleCodeComponent,
    SoftSupportArticleFormModalComponent,
    SoftSupportPageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-testid="softsupport-refused">
      <softsupport-page-header
        [heading]="'softsupport.refused.title' | translate"
        [subtitle]="'softsupport.refused.subtitle' | translate"
        [breadcrumb]="['softsupport.sidebar.articles' | translate, 'softsupport.sidebar.articlesRefused' | translate]"
      />

      @if (loading()) {
        <p class="py-10 text-center text-sm text-slate-500">{{ 'common.loading' | translate }}</p>
      } @else if (error()) {
        <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</p>
      } @else if (rows().length === 0) {
        <div class="ss-reveal rounded-xl border border-slate-200 bg-white p-10">
          <soft-data-table-empty-state [message]="'softsupport.refused.empty' | translate" [hasActiveFilters]="false" />
        </div>
      } @else {
        <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
          @for (row of rows(); track row.articleId) {
            <article class="ss-reveal flex flex-col rounded-xl border border-slate-200 border-l-4 border-l-red-400 bg-white p-5" [style.--delay]="0.1 + $index * 0.05 + 's'">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <softsupport-article-code [code]="row.code" />
                  <h2 class="mt-1 truncate text-base font-semibold text-slate-900">{{ row.title }}</h2>
                  <p class="mt-0.5 text-xs text-slate-500">{{ row.productName || '—' }} · {{ row.createdAt | date: 'dd/MM/yyyy' }}</p>
                </div>
                <soft-button variant="primary" size="sm" (onClick)="editedId.set(row.articleId)">
                  <soft-icon name="edit" size="sm" class="mr-1" />{{ 'softsupport.refused.fix' | translate }}
                </soft-button>
              </div>
              <div class="mt-4 rounded-lg bg-red-50/70 px-4 py-3 text-sm text-slate-700">
                <p class="text-xs font-semibold uppercase tracking-wide text-red-600">{{ 'softsupport.refused.reason' | translate }}</p>
                <p class="mt-1 whitespace-pre-wrap">{{ row.comment || ('softsupport.refused.noReason' | translate) }}</p>
              </div>
            </article>
          }
        </div>
      }
    </section>

    <softsupport-article-form-modal [open]="editedId() !== null" [articleId]="editedId()" mode="author" (closed)="editedId.set(null)" (saved)="onSaved()" />
  `,
})
export class SoftSupportRefusedArticlesPage implements OnInit {
  private readonly articlesApi = inject(SoftSupportArticleService);
  private readonly translate = inject(TranslateService);

  readonly rows = signal<RefusedArticle[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly editedId = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
  }

  onSaved(): void {
    this.editedId.set(null);
    this.load();
  }

  load(): void {
    this.articlesApi.getRefused().subscribe({
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
