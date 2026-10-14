import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DataTableEmptyStateComponent, SoftButtonComponent, SoftIconComponent } from '@soft-mfe/shared-components';
import { getApiErrorMessage, ToastService } from '@soft-mfe/shared-services';
import { PendingArticle } from '@softsupport/models';
import { SoftSupportValidationService } from '@softsupport/service';
import { SoftSupportArticleCodeComponent, SoftSupportArticleFormModalComponent, SoftSupportPageHeaderComponent } from '@softsupport/ui';

@Component({
  selector: 'softsupport-validation-page',
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
    <section data-testid="softsupport-validation">
      <softsupport-page-header
        [heading]="'softsupport.validation.title' | translate"
        [subtitle]="'softsupport.validation.subtitle' | translate"
        [breadcrumb]="['softsupport.sidebar.articles' | translate, 'softsupport.sidebar.articlesPending' | translate]"
      >
        <soft-button variant="secondary" [isLoading]="importing()" (onClick)="importFromCrm()">
          <soft-icon name="refresh" size="sm" class="mr-1.5" />{{ 'softsupport.validation.importCrm' | translate }}
        </soft-button>
      </softsupport-page-header>

      <div class="ss-reveal overflow-hidden rounded-xl border border-slate-200 bg-white" style="--delay: 0.2s">
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-blue-50 text-xs uppercase tracking-wide text-blue-700">
              <tr>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.articles.columns.code' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.articles.columns.title' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.articles.fields.product' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.articles.detail.author' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.articles.columns.createdAt' | translate }}</th>
                <th class="px-4 py-3 text-right font-semibold">{{ 'softsupport.articles.columns.views' | translate }}</th>
                <th class="px-4 py-3 text-right font-semibold">{{ 'softsupport.common.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @if (loading() && rows().length === 0) {
                <tr><td colspan="7" class="px-4 py-8 text-center text-slate-500">{{ 'common.loading' | translate }}</td></tr>
              } @else if (error()) {
                <tr><td colspan="7" class="px-4 py-8 text-center text-red-600">{{ error() }}</td></tr>
              } @else if (rows().length === 0) {
                <tr><td colspan="7" class="px-4 py-10"><soft-data-table-empty-state [message]="'softsupport.validation.empty' | translate" [hasActiveFilters]="false" /></td></tr>
              } @else {
                @for (row of rows(); track row.articleId) {
                  <tr class="ss-row cursor-pointer hover:bg-slate-50" [style.--i]="$index" (click)="reviewedId.set(row.articleId)">
                    <td class="px-4 py-3">
                      <softsupport-article-code [code]="row.code" />
                      @if (row.inCrm) {
                        <span class="ml-1 rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-violet-700">CRM</span>
                      }
                    </td>
                    <td class="max-w-[24rem] truncate px-4 py-3 font-medium text-slate-900">{{ row.title }}</td>
                    <td class="max-w-[12rem] truncate px-4 py-3 text-slate-700">{{ row.productName || '—' }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ row.authorName || '—' }}</td>
                    <td class="whitespace-nowrap px-4 py-3 text-slate-700">{{ row.createdAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                    <td class="px-4 py-3 text-right text-slate-700">{{ row.viewNumber }}</td>
                    <td class="px-4 py-3 text-right" (click)="$event.stopPropagation()">
                      <soft-button variant="primary" size="sm" (onClick)="reviewedId.set(row.articleId)">{{ 'softsupport.validation.review' | translate }}</soft-button>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <softsupport-article-form-modal
      [open]="reviewedId() !== null"
      [articleId]="reviewedId()"
      mode="validation"
      (closed)="reviewedId.set(null)"
      (saved)="onSaved()"
    />
  `,
})
export class SoftSupportValidationPage implements OnInit {
  private readonly validationApi = inject(SoftSupportValidationService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly rows = signal<PendingArticle[]>([]);
  readonly loading = signal(true);
  readonly importing = signal(false);
  readonly error = signal<string | null>(null);
  readonly reviewedId = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
  }

  onSaved(): void {
    this.reviewedId.set(null);
    this.load();
  }

  importFromCrm(): void {
    this.importing.set(true);
    this.validationApi.importFromCrm().subscribe({
      next: message => {
        this.importing.set(false);
        this.toast.success(message);
        this.load();
      },
      error: error => {
        this.importing.set(false);
        this.toast.error(getApiErrorMessage(error) ?? this.translate.instant('common.errors.generic'));
      },
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.validationApi.getPending().subscribe({
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
