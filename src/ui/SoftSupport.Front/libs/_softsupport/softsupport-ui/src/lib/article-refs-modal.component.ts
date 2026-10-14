import { ChangeDetectionStrategy, Component, effect, input, output, signal, untracked } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DataTableEmptyStateComponent, SoftButtonComponent, SoftIconComponent, SoftModalComponent } from '@soft-mfe/shared-components';
import { getApiErrorMessage } from '@soft-mfe/shared-services';
import { ArticleRef } from '@softsupport/models';
import { Observable } from 'rxjs';
import { SoftSupportArticleCodeComponent } from './softsupport-badges.component';
import { SoftSupportArticleDetailModalComponent } from './article-detail-modal.component';

@Component({
  selector: 'softsupport-article-refs-modal',
  imports: [
    TranslatePipe,
    SoftModalComponent,
    SoftButtonComponent,
    SoftIconComponent,
    DataTableEmptyStateComponent,
    SoftSupportArticleCodeComponent,
    SoftSupportArticleDetailModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <soft-modal [open]="source() !== null" size="xl" (close)="closed.emit()" [ariaLabel]="heading()">
      <div modal-header class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">{{ heading() }}</h2>
          <p class="mt-0.5 text-sm text-slate-500">{{ 'softsupport.common.linkedArticles' | translate: { count: articles().length } }}</p>
        </div>
        <button type="button" class="text-slate-400 hover:text-slate-600" (click)="closed.emit()" [attr.aria-label]="'common.actions.close' | translate">
          <soft-icon name="x" size="md" />
        </button>
      </div>
      <div modal-body>
        @if (loading()) {
          <p class="py-8 text-center text-sm text-slate-500">{{ 'common.loading' | translate }}</p>
        } @else if (error()) {
          <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</p>
        } @else if (articles().length === 0) {
          <soft-data-table-empty-state [message]="'softsupport.common.noLinkedArticles' | translate" [hasActiveFilters]="false" />
        } @else {
          <ul class="max-h-[420px] divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
            @for (item of articles(); track item.articleId) {
              <li
                class="ss-row flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50"
                [style.--i]="$index"
                tabindex="0"
                role="button"
                (click)="detailId.set(item.articleId)"
                (keydown.enter)="detailId.set(item.articleId)"
              >
                <softsupport-article-code [code]="item.code" />
                <span class="min-w-0 flex-1 truncate text-slate-800">{{ item.title }}</span>
                <soft-icon name="chevron-right" size="sm" class="text-slate-300" />
              </li>
            }
          </ul>
        }
      </div>
      <div modal-footer class="flex justify-end">
        <soft-button variant="secondary" (onClick)="closed.emit()">{{ 'common.actions.close' | translate }}</soft-button>
      </div>
    </soft-modal>

    <softsupport-article-detail-modal [articleId]="detailId()" (closed)="detailId.set(null)" />
  `,
})
export class SoftSupportArticleRefsModalComponent {
  readonly source = input<Observable<ArticleRef[]> | null>(null);
  readonly heading = input('');
  readonly closed = output<void>();

  readonly articles = signal<ArticleRef[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly detailId = signal<number | null>(null);

  constructor() {
    effect(() => {
      const source = this.source();
      untracked(() => {
        this.articles.set([]);
        this.error.set(null);
        if (!source) {
          return;
        }
        this.loading.set(true);
        source.subscribe({
          next: articles => {
            this.articles.set(articles);
            this.loading.set(false);
          },
          error: error => {
            this.loading.set(false);
            this.error.set(getApiErrorMessage(error) ?? 'Erreur');
          },
        });
      });
    });
  }
}
