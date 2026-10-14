import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DataTableEmptyStateComponent, SoftIconComponent } from '@soft-mfe/shared-components';
import { getApiErrorMessage } from '@soft-mfe/shared-services';
import { ArticleListItem } from '@softsupport/models';
import { SoftSupportArticleService } from '@softsupport/service';
import {
  SoftSupportArticleCodeComponent,
  SoftSupportArticleDetailModalComponent,
  SoftSupportArticleOptionsComponent,
  SoftSupportArticleStatusComponent,
  SoftSupportPageHeaderComponent,
} from '@softsupport/ui';

/** « Ajoutés récemment » : les 20 derniers articles de la base. */
@Component({
  selector: 'softsupport-recent-articles-page',
  imports: [
    DatePipe,
    TranslatePipe,
    DataTableEmptyStateComponent,
    SoftIconComponent,
    SoftSupportArticleCodeComponent,
    SoftSupportArticleDetailModalComponent,
    SoftSupportArticleOptionsComponent,
    SoftSupportArticleStatusComponent,
    SoftSupportPageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-testid="softsupport-recent">
      <softsupport-page-header
        [heading]="'softsupport.recent.title' | translate"
        [subtitle]="'softsupport.recent.subtitle' | translate"
        [breadcrumb]="['softsupport.sidebar.articles' | translate, 'softsupport.sidebar.articlesRecent' | translate]"
      />

      @if (loading()) {
        <p class="py-10 text-center text-sm text-slate-500">{{ 'common.loading' | translate }}</p>
      } @else if (error()) {
        <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</p>
      } @else if (rows().length === 0) {
        <soft-data-table-empty-state [message]="'softsupport.articles.empty' | translate" [hasActiveFilters]="false" />
      } @else {
        <ol class="relative ml-3 border-l-2 border-cyan-100">
          @for (row of rows(); track row.articleId) {
            <li class="ss-reveal relative mb-3 pl-6" [style.--delay]="0.1 + $index * 0.04 + 's'">
              <span class="absolute -left-[9px] top-5 h-4 w-4 rounded-full border-2 border-white shadow" [class.bg-emerald-500]="row.isValidated" [class.bg-amber-400]="!row.isValidated"></span>
              <button
                type="button"
                class="group flex w-full flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md"
                (click)="detailId.set(row.articleId)"
              >
                <span class="w-24 shrink-0 text-xs font-semibold text-slate-400">{{ row.createdAt | date: 'dd MMM yyyy' }}</span>
                <softsupport-article-code [code]="row.code" />
                <span class="min-w-0 flex-1 truncate font-medium text-slate-900 group-hover:text-cyan-800">{{ row.title }}</span>
                <span class="hidden text-xs text-slate-500 lg:inline">{{ row.productName }}</span>
                <softsupport-article-options [options]="row.options" />
                <span class="inline-flex items-center gap-1 text-xs text-slate-500"><soft-icon name="eye" size="xs" />{{ row.viewNumber }}</span>
                <softsupport-article-status [validated]="row.isValidated" />
              </button>
            </li>
          }
        </ol>
      }
    </section>

    <softsupport-article-detail-modal [articleId]="detailId()" (closed)="detailId.set(null)" (changed)="load()" />
  `,
})
export class SoftSupportRecentArticlesPage implements OnInit {
  private readonly articlesApi = inject(SoftSupportArticleService);
  private readonly translate = inject(TranslateService);

  readonly rows = signal<ArticleListItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly detailId = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.articlesApi.getRecent().subscribe({
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
