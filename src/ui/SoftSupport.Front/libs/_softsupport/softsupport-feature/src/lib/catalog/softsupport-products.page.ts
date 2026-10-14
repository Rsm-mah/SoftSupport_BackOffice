import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal, untracked, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  ConfirmationModalComponent,
  DataTableEmptyStateComponent,
  SoftBadgeComponent,
  SoftButtonComponent,
  SoftIconComponent,
  SoftInputComponent,
  SoftModalComponent,
  SoftSelectComponent,
} from '@soft-mfe/shared-components';
import { PageSize, SelectOption } from '@soft-mfe/shared-models';
import { getApiErrorMessage, ToastService } from '@soft-mfe/shared-services';
import { ArticleRef, CategoryListItem, ProductListItem, SOFTSUPPORT_DEFAULT_PAGE_SIZE } from '@softsupport/models';
import { SoftSupportArticleService, SoftSupportCategoryService, SoftSupportProductService } from '@softsupport/service';
import { SoftSupportArticleRefsModalComponent, SoftSupportListPaginationComponent, SoftSupportPageHeaderComponent } from '@softsupport/ui';
import { Observable } from 'rxjs';

/** Référentiel des produits : catégorie (préfixe des identifiants), articles liés, import CRM. */
@Component({
  selector: 'softsupport-products-page',
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    ConfirmationModalComponent,
    DataTableEmptyStateComponent,
    SoftBadgeComponent,
    SoftButtonComponent,
    SoftIconComponent,
    SoftInputComponent,
    SoftModalComponent,
    SoftSelectComponent,
    SoftSupportArticleRefsModalComponent,
    SoftSupportListPaginationComponent,
    SoftSupportPageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-testid="softsupport-products">
      <softsupport-page-header
        [heading]="'softsupport.products.title' | translate"
        [subtitle]="'softsupport.products.subtitle' | translate"
        [breadcrumb]="['softsupport.sidebar.catalog' | translate, 'softsupport.sidebar.products' | translate]"
      >
        <soft-button variant="secondary" [isLoading]="importing()" (onClick)="importFromCrm()">
          <soft-icon name="refresh" size="sm" class="mr-1.5" />{{ 'softsupport.common.importCrm' | translate }}
        </soft-button>
        <soft-button variant="primary" (onClick)="openForm(null)">
          <soft-icon name="plus" size="sm" class="mr-1.5" />{{ 'softsupport.products.add' | translate }}
        </soft-button>
      </softsupport-page-header>

      <div class="ss-reveal grid w-full max-w-3xl grid-cols-1 gap-3 md:grid-cols-2" style="--delay: 0.15s">
        <soft-input
          [label]="'softsupport.common.search' | translate"
          [placeholder]="'softsupport.products.searchPlaceholder' | translate"
          name="filter-product"
          autocomplete="off"
          [value]="search()"
          (valueChange)="onSearch($event)"
        />
        <soft-select
          [label]="'softsupport.products.fields.category' | translate"
          [placeholder]="'softsupport.common.all' | translate"
          [options]="categoryFilterOptions()"
          [searchable]="true"
          [value]="categoryFilter()"
          (valueChange)="categoryFilter.set($event); page.set(1)"
        />
      </div>

      <div class="ss-reveal mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white" style="--delay: 0.25s">
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-blue-50 text-xs uppercase tracking-wide text-blue-700">
              <tr>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.products.fields.name' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.products.fields.category' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.products.columns.origin' | translate }}</th>
                <th class="px-4 py-3 text-right font-semibold">{{ 'softsupport.common.articles' | translate }}</th>
                <th class="px-4 py-3 text-right font-semibold">{{ 'softsupport.common.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @if (loading() && rows().length === 0) {
                <tr><td colspan="5" class="px-4 py-8 text-center text-slate-500">{{ 'common.loading' | translate }}</td></tr>
              } @else if (error()) {
                <tr><td colspan="5" class="px-4 py-8 text-center text-red-600">{{ error() }}</td></tr>
              } @else if (visible().length === 0) {
                <tr><td colspan="5" class="px-4 py-10"><soft-data-table-empty-state [message]="'softsupport.products.empty' | translate" [hasActiveFilters]="hasFilters()" (clearFilters)="clearFilters()" /></td></tr>
              } @else {
                @for (row of visible(); track row.productId) {
                  <tr class="ss-row cursor-pointer hover:bg-slate-50" [style.--i]="$index" (click)="showArticles(row)">
                    <td class="px-4 py-3 font-medium text-slate-900">{{ row.name }}</td>
                    <td class="px-4 py-3">
                      @if (row.categoryCode) {
                        <span class="font-mono text-xs font-semibold text-cyan-700">{{ row.categoryCode }}</span>
                        <span class="ml-1.5 text-xs text-slate-500">{{ row.categoryName }}</span>
                      } @else {
                        <span class="text-xs italic text-slate-400">{{ 'softsupport.products.noCategory' | translate }}</span>
                      }
                    </td>
                    <td class="px-4 py-3">
                      <soft-badge [variant]="row.isLocal ? 'secondary' : 'info'">{{ (row.isLocal ? 'softsupport.products.local' : 'softsupport.products.crm') | translate }}</soft-badge>
                    </td>
                    <td class="px-4 py-3 text-right text-slate-700">{{ row.articleCount }}</td>
                    <td class="px-4 py-3" (click)="$event.stopPropagation()">
                      <div class="flex justify-end gap-1">
                        <button type="button" class="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700" [title]="'softsupport.common.linkedArticlesAction' | translate" (click)="showArticles(row)">
                          <soft-icon name="list" size="sm" />
                        </button>
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
        </div>
        @if (!error() && filtered().length > 0) {
          <softsupport-list-pagination [page]="page()" [pageSize]="pageSize()" [totalCount]="filtered().length" (pageChange)="page.set($event)" (pageSizeChange)="pageSize.set($event); page.set(1)" />
        }
      </div>
      <p class="mt-3 text-xs text-slate-500">{{ 'softsupport.products.hint' | translate }}</p>
    </section>

    <soft-modal [open]="formOpen()" size="md" (close)="formOpen.set(false)" [ariaLabel]="formTitle() | translate">
      <div modal-header class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-slate-900">{{ formTitle() | translate }}</h2>
        <button type="button" class="text-slate-400 hover:text-slate-600" (click)="formOpen.set(false)" [attr.aria-label]="'common.actions.close' | translate"><soft-icon name="x" size="md" /></button>
      </div>
      <div modal-body>
        <form class="space-y-4" [formGroup]="form" (ngSubmit)="save()">
          <soft-input
            [label]="'softsupport.products.fields.name' | translate"
            [required]="true"
            formControlName="name"
            [error]="form.controls.name.invalid && form.controls.name.touched ? ('softsupport.common.nameRequired' | translate) : ''"
          />
          <soft-select
            [label]="'softsupport.products.fields.category' | translate"
            [placeholder]="'softsupport.products.noCategory' | translate"
            [options]="categoryOptions()"
            [searchable]="true"
            [hint]="'softsupport.products.categoryHint' | translate"
            formControlName="categoryId"
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
      [title]="'softsupport.products.delete.title' | translate"
      [message]="'softsupport.common.deleteMessage' | translate: { name: toDelete()?.name ?? '' }"
      [additionalInfo]="'softsupport.products.delete.info' | translate"
      [cancelLabel]="'common.actions.cancel' | translate"
      [confirmLabel]="'common.actions.delete' | translate"
      (confirmed)="confirmDelete()"
    />
  `,
})
export class SoftSupportProductsPage implements OnInit {
  private readonly productsApi = inject(SoftSupportProductService);
  private readonly categoriesApi = inject(SoftSupportCategoryService);
  private readonly articlesApi = inject(SoftSupportArticleService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly deleteModal = viewChild<ConfirmationModalComponent>('deleteModal');

  readonly rows = signal<ProductListItem[]>([]);
  readonly categories = signal<CategoryListItem[]>([]);
  readonly loading = signal(true);
  readonly importing = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly search = signal('');
  readonly categoryFilter = signal('');
  readonly page = signal(1);
  readonly pageSize = signal<PageSize>(SOFTSUPPORT_DEFAULT_PAGE_SIZE as PageSize);
  readonly formOpen = signal(false);
  readonly edited = signal<ProductListItem | null>(null);
  readonly toDelete = signal<ProductListItem | null>(null);
  readonly articlesSource = signal<Observable<ArticleRef[]> | null>(null);
  readonly articlesHeading = signal('');

  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    categoryId: [''],
  });

  readonly formTitle = computed(() => (this.edited() ? 'softsupport.products.editTitle' : 'softsupport.products.createTitle'));
  readonly hasFilters = computed(() => this.search().trim() !== '' || this.categoryFilter() !== '');

  readonly categoryOptions = computed<SelectOption[]>(() =>
    this.categories().map(category => ({ value: String(category.categoryId), label: `${category.code} — ${category.name}` })),
  );

  readonly categoryFilterOptions = computed<SelectOption[]>(() => [
    { value: '', label: this.translate.instant('softsupport.common.all') },
    { value: 'none', label: this.translate.instant('softsupport.products.noCategory') },
    ...this.categoryOptions(),
  ]);

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const category = this.categoryFilter();
    return this.rows().filter(
      row =>
        (!term || `${row.name} ${row.categoryCode ?? ''}`.toLowerCase().includes(term))
        && (!category || (category === 'none' ? row.categoryId === null : String(row.categoryId) === category)),
    );
  });

  readonly visible = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  constructor() {
    effect(() => {
      if (this.formOpen()) {
        untracked(() => {
          const product = this.edited();
          this.form.reset({ name: product?.name ?? '', categoryId: product?.categoryId ? String(product.categoryId) : '' });
        });
      }
    });
  }

  ngOnInit(): void {
    this.categoriesApi.getAll().subscribe({ next: categories => this.categories.set(categories) });
    this.load();
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  clearFilters(): void {
    this.search.set('');
    this.categoryFilter.set('');
    this.page.set(1);
  }

  openForm(product: ProductListItem | null): void {
    this.edited.set(product);
    this.formOpen.set(true);
  }

  showArticles(product: ProductListItem): void {
    this.articlesHeading.set(product.name);
    this.articlesSource.set(this.productsApi.getArticles(product.productId));
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const payload = { name: value.name.trim(), categoryId: value.categoryId ? Number(value.categoryId) : null };
    const product = this.edited();
    this.saving.set(true);
    (product ? this.productsApi.update(product.productId, payload) : this.productsApi.create(payload)).subscribe({
      next: message => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.toast.success(message);
        this.articlesApi.getReferences(true);
        this.load();
      },
      error: error => this.fail(error, () => this.saving.set(false)),
    });
  }

  askDelete(product: ProductListItem): void {
    this.toDelete.set(product);
    this.deleteModal()?.open();
  }

  confirmDelete(): void {
    const product = this.toDelete();
    if (!product) {
      return;
    }
    this.productsApi.delete(product.productId).subscribe({
      next: message => {
        this.toast.success(message);
        this.load();
      },
      error: error => this.fail(error),
    });
  }

  importFromCrm(): void {
    this.importing.set(true);
    this.productsApi.importFromCrm().subscribe({
      next: message => {
        this.importing.set(false);
        this.toast.success(message);
        this.load();
      },
      error: error => this.fail(error, () => this.importing.set(false)),
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.productsApi.getAll().subscribe({
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

  private fail(error: unknown, reset?: () => void): void {
    reset?.();
    this.toast.error(getApiErrorMessage(error) ?? this.translate.instant('common.errors.generic'));
  }
}
