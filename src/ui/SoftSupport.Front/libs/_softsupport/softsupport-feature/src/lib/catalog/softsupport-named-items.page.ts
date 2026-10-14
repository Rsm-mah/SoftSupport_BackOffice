import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  ConfirmationModalComponent,
  DataTableEmptyStateComponent,
  SoftButtonComponent,
  SoftIconComponent,
  SoftInputComponent,
  SoftModalComponent,
} from '@soft-mfe/shared-components';
import { PageSize } from '@soft-mfe/shared-models';
import { getApiErrorMessage, ToastService } from '@soft-mfe/shared-services';
import { ArticleRef, NamedItem, SOFTSUPPORT_DEFAULT_PAGE_SIZE } from '@softsupport/models';
import { NamedResource, SoftSupportArticleService, SoftSupportNamedItemService } from '@softsupport/service';
import { SoftSupportArticleRefsModalComponent, SoftSupportListPaginationComponent, SoftSupportPageHeaderComponent } from '@softsupport/ui';
import { Observable } from 'rxjs';

/**
 * Versions et thèmes : même écran, la ressource vient de la route (`data.resource`).
 * Seules les versions se synchronisent avec le CRM.
 */
@Component({
  selector: 'softsupport-named-items-page',
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    ConfirmationModalComponent,
    DataTableEmptyStateComponent,
    SoftButtonComponent,
    SoftIconComponent,
    SoftInputComponent,
    SoftModalComponent,
    SoftSupportArticleRefsModalComponent,
    SoftSupportListPaginationComponent,
    SoftSupportPageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [attr.data-testid]="'softsupport-' + resource()">
      <softsupport-page-header
        [heading]="key('title') | translate"
        [subtitle]="key('subtitle') | translate"
        [breadcrumb]="['softsupport.sidebar.catalog' | translate, 'softsupport.sidebar.' + resource() | translate]"
      >
        @if (resource() === 'versions') {
          <soft-button variant="secondary" [isLoading]="importing()" (onClick)="importFromCrm()">
            <soft-icon name="refresh" size="sm" class="mr-1.5" />{{ 'softsupport.common.importCrm' | translate }}
          </soft-button>
        }
        <soft-button variant="primary" (onClick)="openForm(null)">
          <soft-icon name="plus" size="sm" class="mr-1.5" />{{ key('add') | translate }}
        </soft-button>
      </softsupport-page-header>

      <div class="ss-reveal w-full max-w-xl" style="--delay: 0.15s">
        <soft-input [label]="'softsupport.common.search' | translate" name="filter-named" autocomplete="off" [value]="search()" (valueChange)="search.set($event); page.set(1)" />
      </div>

      <div class="ss-reveal mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white" style="--delay: 0.25s">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-blue-50 text-xs uppercase tracking-wide text-blue-700">
            <tr>
              <th class="px-4 py-3 font-semibold">{{ key('name') | translate }}</th>
              <th class="px-4 py-3 text-right font-semibold">{{ 'softsupport.common.articles' | translate }}</th>
              <th class="px-4 py-3 text-right font-semibold">{{ 'softsupport.common.actions' | translate }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @if (loading() && rows().length === 0) {
              <tr><td colspan="3" class="px-4 py-8 text-center text-slate-500">{{ 'common.loading' | translate }}</td></tr>
            } @else if (error()) {
              <tr><td colspan="3" class="px-4 py-8 text-center text-red-600">{{ error() }}</td></tr>
            } @else if (visible().length === 0) {
              <tr><td colspan="3" class="px-4 py-10"><soft-data-table-empty-state [message]="key('empty') | translate" [hasActiveFilters]="search().trim() !== ''" (clearFilters)="search.set('')" /></td></tr>
            } @else {
              @for (row of visible(); track row.id) {
                <tr class="ss-row cursor-pointer hover:bg-slate-50" [style.--i]="$index" (click)="showArticles(row)">
                  <td class="px-4 py-3 font-medium text-slate-900">{{ row.name }}</td>
                  <td class="px-4 py-3 text-right">
                    <span class="rounded-full px-2 py-0.5 text-xs font-semibold" [class]="row.articleCount > 0 ? 'bg-cyan-50 text-cyan-700' : 'bg-slate-100 text-slate-400'">{{ row.articleCount }}</span>
                  </td>
                  <td class="px-4 py-3" (click)="$event.stopPropagation()">
                    <div class="flex justify-end gap-1">
                      <button type="button" class="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700" [title]="'common.actions.edit' | translate" (click)="openForm(row)">
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
        @if (!error() && filtered().length > 0) {
          <softsupport-list-pagination [page]="page()" [pageSize]="pageSize()" [totalCount]="filtered().length" (pageChange)="page.set($event)" (pageSizeChange)="pageSize.set($event); page.set(1)" />
        }
      </div>
      @if (resource() === 'versions') {
        <p class="mt-3 text-xs text-slate-500">{{ 'softsupport.versions.importHint' | translate }}</p>
      }
    </section>

    <soft-modal [open]="formOpen()" size="md" (close)="formOpen.set(false)" [ariaLabel]="key(edited() ? 'editTitle' : 'createTitle') | translate">
      <div modal-header class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-slate-900">{{ key(edited() ? 'editTitle' : 'createTitle') | translate }}</h2>
        <button type="button" class="text-slate-400 hover:text-slate-600" (click)="formOpen.set(false)" [attr.aria-label]="'common.actions.close' | translate"><soft-icon name="x" size="md" /></button>
      </div>
      <div modal-body>
        <form [formGroup]="form" (ngSubmit)="save()">
          <soft-input
            [label]="key('name') | translate"
            [required]="true"
            formControlName="name"
            [error]="form.controls.name.invalid && form.controls.name.touched ? ('softsupport.common.nameRequired' | translate) : ''"
          />
        </form>
      </div>
      <div modal-footer class="flex justify-end gap-2">
        <soft-button variant="secondary" (onClick)="formOpen.set(false)">{{ 'common.actions.cancel' | translate }}</soft-button>
        <soft-button variant="primary" [isLoading]="saving()" [disabled]="form.invalid" (onClick)="save()">{{ (edited() ? 'common.actions.update' : 'common.actions.create') | translate }}</soft-button>
      </div>
    </soft-modal>

    <softsupport-article-refs-modal [source]="articlesSource()" [heading]="articlesHeading()" (closed)="articlesSource.set(null)" />

    <app-confirmation-modal
      #deleteModal
      [title]="key('deleteTitle') | translate"
      [message]="'softsupport.common.deleteMessage' | translate: { name: toDelete()?.name ?? '' }"
      [additionalInfo]="(toDelete()?.articleCount ?? 0) > 0 ? ('softsupport.common.deleteWithArticles' | translate: { count: toDelete()?.articleCount }) : null"
      [cancelLabel]="'common.actions.cancel' | translate"
      [confirmLabel]="'common.actions.delete' | translate"
      (confirmed)="confirmDelete()"
    />
  `,
})
export class SoftSupportNamedItemsPage {
  private readonly api = inject(SoftSupportNamedItemService);
  private readonly articlesApi = inject(SoftSupportArticleService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly deleteModal = viewChild<ConfirmationModalComponent>('deleteModal');

  /** Lu dans `data.resource` de la route grâce à `withComponentInputBinding`. */
  readonly resource = input<NamedResource>('themes');

  readonly rows = signal<NamedItem[]>([]);
  readonly loading = signal(true);
  readonly importing = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly search = signal('');
  readonly page = signal(1);
  readonly pageSize = signal<PageSize>(SOFTSUPPORT_DEFAULT_PAGE_SIZE as PageSize);
  readonly formOpen = signal(false);
  readonly edited = signal<NamedItem | null>(null);
  readonly toDelete = signal<NamedItem | null>(null);
  readonly articlesSource = signal<Observable<ArticleRef[]> | null>(null);
  readonly articlesHeading = signal('');

  readonly form = inject(FormBuilder).nonNullable.group({ name: ['', [Validators.required, Validators.maxLength(200)]] });

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    return term ? this.rows().filter(row => row.name.toLowerCase().includes(term)) : this.rows();
  });

  readonly visible = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  constructor() {
    effect(() => {
      this.resource();
      untracked(() => {
        this.search.set('');
        this.page.set(1);
        this.load();
      });
    });
  }

  key(name: string): string {
    return `softsupport.${this.resource()}.${name}`;
  }

  openForm(item: NamedItem | null): void {
    this.edited.set(item);
    this.form.reset({ name: item?.name ?? '' });
    this.formOpen.set(true);
  }

  showArticles(item: NamedItem): void {
    this.articlesHeading.set(item.name);
    this.articlesSource.set(this.api.getArticles(this.resource(), item.id));
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const name = this.form.getRawValue().name.trim();
    const item = this.edited();
    this.saving.set(true);
    (item ? this.api.update(this.resource(), item.id, name) : this.api.create(this.resource(), name)).subscribe({
      next: message => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.done(message);
      },
      error: error => this.fail(error, () => this.saving.set(false)),
    });
  }

  askDelete(item: NamedItem): void {
    this.toDelete.set(item);
    this.deleteModal()?.open();
  }

  confirmDelete(): void {
    const item = this.toDelete();
    if (item) {
      this.api.delete(this.resource(), item.id).subscribe({ next: message => this.done(message), error: error => this.fail(error) });
    }
  }

  importFromCrm(): void {
    this.importing.set(true);
    this.api.importFromCrm(this.resource()).subscribe({
      next: message => {
        this.importing.set(false);
        this.done(message);
      },
      error: error => this.fail(error, () => this.importing.set(false)),
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getAll(this.resource()).subscribe({
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

  private done(message: string): void {
    this.toast.success(message);
    this.articlesApi.getReferences(true);
    this.load();
  }

  private fail(error: unknown, reset?: () => void): void {
    reset?.();
    this.toast.error(getApiErrorMessage(error) ?? this.translate.instant('common.errors.generic'));
  }
}
