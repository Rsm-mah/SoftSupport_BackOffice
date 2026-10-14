import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SoftButtonComponent, SoftIconComponent, SoftModalComponent, SoftToggleComponent } from '@soft-mfe/shared-components';
import { getApiErrorMessage, ToastService } from '@soft-mfe/shared-services';
import { ArticleDetail, isAdministrator, isClient, isInterne } from '@softsupport/models';
import { SoftSupportArticleService, SoftSupportSessionService } from '@softsupport/service';
import {
  SoftSupportArticleCodeComponent,
  SoftSupportArticleOptionsComponent,
  SoftSupportArticleStatusComponent,
} from './softsupport-badges.component';

type ArticleTab = 'problem' | 'solution';

/**
 * Fiche d'un article : s'ouvre dès que `articleId` est renseigné (chaque ouverture compte une vue).
 * L'administrateur y règle la diffusion d'un article validé ou le renvoie en validation.
 */
@Component({
  selector: 'softsupport-article-detail-modal',
  imports: [
    DatePipe,
    TranslatePipe,
    SoftModalComponent,
    SoftButtonComponent,
    SoftIconComponent,
    SoftToggleComponent,
    SoftSupportArticleCodeComponent,
    SoftSupportArticleOptionsComponent,
    SoftSupportArticleStatusComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <soft-modal [open]="articleId() !== null" size="2xl" (close)="closed.emit()" [ariaLabel]="'softsupport.articles.detail.title' | translate">
      <div modal-header class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          @if (article(); as a) {
            <softsupport-article-code [code]="a.code" />
            <h2 class="mt-1 text-lg font-semibold leading-snug text-slate-900">{{ a.title }}</h2>
          } @else {
            <h2 class="text-lg font-semibold text-slate-900">{{ 'softsupport.articles.detail.title' | translate }}</h2>
          }
        </div>
        <button type="button" class="shrink-0 text-slate-400 hover:text-slate-600" (click)="closed.emit()" [attr.aria-label]="'common.actions.close' | translate">
          <soft-icon name="x" size="md" />
        </button>
      </div>

      <div modal-body>
        @if (loading()) {
          <p class="py-10 text-center text-sm text-slate-500">{{ 'common.loading' | translate }}</p>
        } @else if (error()) {
          <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</p>
        } @else if (article(); as a) {
          <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <aside class="space-y-4">
              <dl class="divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
                <div class="flex items-center justify-between gap-3 px-4 py-2.5">
                  <dt class="font-semibold text-slate-500">{{ 'softsupport.articles.columns.status' | translate }}</dt>
                  <dd><softsupport-article-status [validated]="a.isValidated" [enabled]="a.isEnabled" /></dd>
                </div>
                <div class="px-4 py-2.5">
                  <dt class="font-semibold text-slate-500">{{ 'softsupport.articles.fields.product' | translate }}</dt>
                  <dd class="mt-0.5 text-slate-800">{{ a.productName || '—' }}</dd>
                </div>
                <div class="grid grid-cols-2 gap-3 px-4 py-2.5">
                  <div>
                    <dt class="font-semibold text-slate-500">{{ 'softsupport.articles.fields.version' | translate }}</dt>
                    <dd class="mt-0.5 text-slate-800">{{ a.versionName || '—' }}</dd>
                  </div>
                  <div>
                    <dt class="font-semibold text-slate-500">{{ 'softsupport.articles.fields.theme' | translate }}</dt>
                    <dd class="mt-0.5 text-slate-800">{{ a.themeName || '—' }}</dd>
                  </div>
                </div>
                <div class="px-4 py-2.5">
                  <dt class="font-semibold text-slate-500">{{ 'softsupport.articles.detail.author' | translate }}</dt>
                  <dd class="mt-0.5 text-slate-800">
                    {{ a.authorName || '—' }}
                    @if (a.inCrm) {
                      <span class="ml-1 rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-violet-700">CRM</span>
                    }
                  </dd>
                </div>
                <div class="grid grid-cols-2 gap-3 px-4 py-2.5">
                  <div>
                    <dt class="font-semibold text-slate-500">{{ 'softsupport.articles.columns.createdAt' | translate }}</dt>
                    <dd class="mt-0.5 text-slate-800">{{ a.createdAt | date: 'dd/MM/yyyy' }}</dd>
                  </div>
                  <div>
                    <dt class="font-semibold text-slate-500">{{ 'softsupport.articles.detail.lastUpdate' | translate }}</dt>
                    <dd class="mt-0.5 text-slate-800">{{ a.lastUpdate ? (a.lastUpdate | date: 'dd/MM/yyyy') : '—' }}</dd>
                  </div>
                </div>
                @if (a.ticketNumber || a.requestNumber) {
                  <div class="grid grid-cols-2 gap-3 px-4 py-2.5">
                    <div>
                      <dt class="font-semibold text-slate-500">{{ 'softsupport.articles.fields.ticketNumber' | translate }}</dt>
                      <dd class="mt-0.5 font-mono text-xs text-slate-800">{{ a.ticketNumber || '—' }}</dd>
                    </div>
                    <div>
                      <dt class="font-semibold text-slate-500">{{ 'softsupport.articles.fields.requestNumber' | translate }}</dt>
                      <dd class="mt-0.5 font-mono text-xs text-slate-800">{{ a.requestNumber || '—' }}</dd>
                    </div>
                  </div>
                }
                <div class="flex items-center justify-between gap-3 px-4 py-2.5">
                  <dt class="font-semibold text-slate-500">{{ 'softsupport.articles.columns.views' | translate }}</dt>
                  <dd class="inline-flex items-center gap-1 text-slate-800"><soft-icon name="eye" size="sm" class="text-slate-400" />{{ a.viewNumber }}</dd>
                </div>
              </dl>

              <div class="rounded-xl border border-slate-200 p-4">
                <p class="text-sm font-semibold text-slate-500">{{ 'softsupport.articles.columns.diffusion' | translate }}</p>
                @if (canManage()) {
                  <div class="mt-3 space-y-2.5 text-sm">
                    <label class="flex items-center justify-between gap-3">
                      <span>{{ 'softsupport.articles.options.interne' | translate }}</span>
                      <soft-toggle activeColor="#0e7490" [checked]="interne()" (checkedChange)="setInterne($event)" [ariaLabel]="'softsupport.articles.options.interne' | translate" />
                    </label>
                    <label class="flex items-center justify-between gap-3">
                      <span>{{ 'softsupport.articles.options.client' | translate }}</span>
                      <soft-toggle activeColor="#0e7490" [checked]="client()" (checkedChange)="setClient($event)" [ariaLabel]="'softsupport.articles.options.client' | translate" />
                    </label>
                    <p class="text-xs text-slate-400">{{ 'softsupport.articles.options.hint' | translate }}</p>
                    <div class="flex flex-wrap gap-2 pt-1">
                      <soft-button variant="primary" size="sm" [isLoading]="saving()" (onClick)="saveOptions()">{{ 'common.actions.save' | translate }}</soft-button>
                      <soft-button variant="secondary" size="sm" [disabled]="saving()" (onClick)="sendBack()">{{ 'softsupport.articles.detail.sendBack' | translate }}</soft-button>
                    </div>
                  </div>
                } @else {
                  <div class="mt-2"><softsupport-article-options [options]="a.options" /></div>
                }
              </div>
            </aside>

            <section class="lg:col-span-2">
              <div class="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5" role="tablist">
                @for (item of tabs; track item) {
                  <button
                    type="button"
                    role="tab"
                    class="rounded-md px-3 py-1.5 text-xs font-semibold transition"
                    [class.bg-white]="tab() === item"
                    [class.text-cyan-700]="tab() === item"
                    [class.shadow-sm]="tab() === item"
                    [class.text-slate-500]="tab() !== item"
                    [attr.aria-selected]="tab() === item"
                    (click)="tab.set(item)"
                  >
                    {{ 'softsupport.articles.fields.' + item | translate }}
                  </button>
                }
              </div>
              <div class="ss-article-content mt-3 min-h-[260px] rounded-xl border border-slate-200 bg-white p-5" [innerHTML]="tab() === 'problem' ? a.problem : a.solution"></div>
            </section>
          </div>
        }
      </div>

      <div modal-footer class="flex justify-end">
        <soft-button variant="secondary" (onClick)="closed.emit()">{{ 'common.actions.close' | translate }}</soft-button>
      </div>
    </soft-modal>
  `,
})
export class SoftSupportArticleDetailModalComponent {
  private readonly articlesApi = inject(SoftSupportArticleService);
  private readonly session = inject(SoftSupportSessionService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly articleId = input<number | null>(null);
  readonly closed = output<void>();
  readonly changed = output<void>();

  readonly tabs: readonly ArticleTab[] = ['problem', 'solution'];
  readonly tab = signal<ArticleTab>('problem');
  readonly article = signal<ArticleDetail | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly interne = signal(false);
  readonly client = signal(false);

  readonly canManage = computed(() => isAdministrator(this.session.roleName()) && !!this.article()?.isValidated);

  constructor() {
    effect(() => {
      const id = this.articleId();
      untracked(() => (id === null ? this.article.set(null) : this.load(id)));
    });
  }

  setInterne(value: boolean): void {
    this.interne.set(value || this.client());
  }

  /** Un article ouvert aux clients l'est aussi en interne. */
  setClient(value: boolean): void {
    this.client.set(value);
    if (value) {
      this.interne.set(true);
    }
  }

  saveOptions(): void {
    const article = this.article();
    if (!article) {
      return;
    }
    this.saving.set(true);
    this.articlesApi.changeOptions(article.articleId, this.interne(), this.client()).subscribe({
      next: message => {
        this.saving.set(false);
        this.toast.success(message);
        this.changed.emit();
      },
      error: error => this.fail(error),
    });
  }

  sendBack(): void {
    const article = this.article();
    if (!article) {
      return;
    }
    this.saving.set(true);
    this.articlesApi.sendBackToValidation(article.articleId).subscribe({
      next: message => {
        this.saving.set(false);
        this.toast.success(message);
        this.changed.emit();
        this.closed.emit();
      },
      error: error => this.fail(error),
    });
  }

  private load(articleId: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.tab.set('problem');
    this.articlesApi.open(articleId).subscribe({
      next: article => {
        this.article.set(article);
        this.interne.set(isInterne(article.options));
        this.client.set(isClient(article.options));
        this.loading.set(false);
      },
      error: error => {
        this.loading.set(false);
        this.error.set(getApiErrorMessage(error) ?? this.translate.instant('common.errors.generic'));
      },
    });
  }

  private fail(error: unknown): void {
    this.saving.set(false);
    this.toast.error(getApiErrorMessage(error) ?? this.translate.instant('common.errors.generic'));
  }
}
