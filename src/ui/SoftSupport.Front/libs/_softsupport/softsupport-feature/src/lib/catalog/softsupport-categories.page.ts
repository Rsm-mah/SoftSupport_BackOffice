import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
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
import { CategoryDetail, CategoryListItem, LookupItem, SOFTSUPPORT_DEFAULT_PAGE_SIZE } from '@softsupport/models';
import { SoftSupportArticleService, SoftSupportCategoryService } from '@softsupport/service';
import { SoftSupportListPaginationComponent, SoftSupportPageHeaderComponent } from '@softsupport/ui';
import { forkJoin, of } from 'rxjs';
import { SoftSupportCheckListComponent } from './softsupport-check-list.component';

/** Catégories : leur code préfixe les identifiants d'articles des produits rattachés. */
@Component({
  selector: 'softsupport-categories-page',
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    ConfirmationModalComponent,
    DataTableEmptyStateComponent,
    SoftButtonComponent,
    SoftIconComponent,
    SoftInputComponent,
    SoftModalComponent,
    SoftSupportCheckListComponent,
    SoftSupportListPaginationComponent,
    SoftSupportPageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-testid="softsupport-categories">
      <softsupport-page-header
        [heading]="'softsupport.categories.title' | translate"
        [subtitle]="'softsupport.categories.subtitle' | translate"
        [breadcrumb]="['softsupport.sidebar.catalog' | translate, 'softsupport.sidebar.categories' | translate]"
      >
        <soft-button variant="primary" (onClick)="openForm(null)">
          <soft-icon name="plus" size="sm" class="mr-1.5" />{{ 'softsupport.categories.add' | translate }}
        </soft-button>
      </softsupport-page-header>

      <div class="ss-reveal w-full max-w-xl" style="--delay: 0.15s">
        <soft-input [label]="'softsupport.common.search' | translate" [placeholder]="'softsupport.categories.searchPlaceholder' | translate" name="filter-category" autocomplete="off" [value]="search()" (valueChange)="search.set($event); page.set(1)" />
      </div>

      <div class="ss-reveal mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white" style="--delay: 0.25s">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-blue-50 text-xs uppercase tracking-wide text-blue-700">
            <tr>
              <th class="px-4 py-3 font-semibold">{{ 'softsupport.categories.fields.code' | translate }}</th>
              <th class="px-4 py-3 font-semibold">{{ 'softsupport.categories.fields.name' | translate }}</th>
              <th class="px-4 py-3 font-semibold">{{ 'softsupport.categories.columns.example' | translate }}</th>
              <th class="px-4 py-3 text-right font-semibold">{{ 'softsupport.categories.columns.products' | translate }}</th>
              <th class="px-4 py-3 text-right font-semibold">{{ 'softsupport.common.actions' | translate }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @if (loading() && rows().length === 0) {
              <tr><td colspan="5" class="px-4 py-8 text-center text-slate-500">{{ 'common.loading' | translate }}</td></tr>
            } @else if (error()) {
              <tr><td colspan="5" class="px-4 py-8 text-center text-red-600">{{ error() }}</td></tr>
            } @else if (visible().length === 0) {
              <tr><td colspan="5" class="px-4 py-10"><soft-data-table-empty-state [message]="'softsupport.categories.empty' | translate" [hasActiveFilters]="search().trim() !== ''" (clearFilters)="search.set('')" /></td></tr>
            } @else {
              @for (row of visible(); track row.categoryId) {
                <tr class="ss-row cursor-pointer hover:bg-slate-50" [style.--i]="$index" (click)="openForm(row)">
                  <td class="px-4 py-3 font-mono text-xs font-semibold text-cyan-700">{{ row.code }}</td>
                  <td class="px-4 py-3 font-medium text-slate-900">{{ row.name }}</td>
                  <td class="px-4 py-3 font-mono text-xs text-slate-400">{{ row.code }}|00000001</td>
                  <td class="px-4 py-3 text-right text-slate-700">{{ row.productCount }}</td>
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
    </section>

    <soft-modal [open]="formOpen()" size="lg" (close)="formOpen.set(false)" [ariaLabel]="'softsupport.categories.createTitle' | translate">
      <div modal-header class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-slate-900">{{ (edited() ? 'softsupport.categories.editTitle' : 'softsupport.categories.createTitle') | translate }}</h2>
        <button type="button" class="text-slate-400 hover:text-slate-600" (click)="formOpen.set(false)" [attr.aria-label]="'common.actions.close' | translate"><soft-icon name="x" size="md" /></button>
      </div>
      <div modal-body>
        @if (formLoading()) {
          <p class="py-8 text-center text-sm text-slate-500">{{ 'common.loading' | translate }}</p>
        } @else {
          <form class="space-y-4" [formGroup]="form" (ngSubmit)="save()">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
              <soft-input
                [label]="'softsupport.categories.fields.code' | translate"
                [required]="true"
                formControlName="code"
                [hint]="'softsupport.categories.codeHint' | translate"
                [error]="form.controls.code.invalid && form.controls.code.touched ? ('softsupport.categories.codeInvalid' | translate) : ''"
              />
              <div class="md:col-span-2">
                <soft-input
                  [label]="'softsupport.categories.fields.name' | translate"
                  [required]="true"
                  formControlName="name"
                  [error]="form.controls.name.invalid && form.controls.name.touched ? ('softsupport.common.nameRequired' | translate) : ''"
                />
              </div>
            </div>
            <div>
              <p class="form-label">{{ 'softsupport.categories.columns.products' | translate }}</p>
              <softsupport-check-list [items]="assignable()" [(selected)]="productIds" />
              <p class="mt-1.5 text-xs text-slate-500">{{ 'softsupport.categories.productsHint' | translate }}</p>
            </div>
          </form>
        }
      </div>
      <div modal-footer class="flex justify-end gap-2">
        <soft-button variant="secondary" (onClick)="formOpen.set(false)">{{ 'common.actions.cancel' | translate }}</soft-button>
        <soft-button variant="primary" [isLoading]="saving()" [disabled]="form.invalid || formLoading()" (onClick)="save()">{{ (edited() ? 'common.actions.update' : 'common.actions.create') | translate }}</soft-button>
      </div>
    </soft-modal>

    <app-confirmation-modal
      #deleteModal
      [title]="'softsupport.categories.delete.title' | translate"
      [message]="'softsupport.common.deleteMessage' | translate: { name: toDelete()?.code ?? '' }"
      [additionalInfo]="'softsupport.categories.delete.info' | translate"
      [cancelLabel]="'common.actions.cancel' | translate"
      [confirmLabel]="'common.actions.delete' | translate"
      (confirmed)="confirmDelete()"
    />
  `,
})
export class SoftSupportCategoriesPage implements OnInit {
  private readonly categoriesApi = inject(SoftSupportCategoryService);
  private readonly articlesApi = inject(SoftSupportArticleService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly deleteModal = viewChild<ConfirmationModalComponent>('deleteModal');

  readonly rows = signal<CategoryListItem[]>([]);
  readonly loading = signal(true);
  readonly formLoading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly search = signal('');
  readonly page = signal(1);
  readonly pageSize = signal<PageSize>(SOFTSUPPORT_DEFAULT_PAGE_SIZE as PageSize);
  readonly formOpen = signal(false);
  readonly edited = signal<CategoryListItem | null>(null);
  readonly toDelete = signal<CategoryListItem | null>(null);
  readonly assignable = signal<LookupItem[]>([]);
  readonly productIds = signal<number[]>([]);

  readonly form = inject(FormBuilder).nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(20), Validators.pattern(/^[^|]+$/)]],
    name: ['', [Validators.required, Validators.maxLength(200)]],
  });

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    return term ? this.rows().filter(row => `${row.code} ${row.name}`.toLowerCase().includes(term)) : this.rows();
  });

  readonly visible = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.load();
  }

  openForm(category: CategoryListItem | null): void {
    this.edited.set(category);
    this.form.reset({ code: category?.code ?? '', name: category?.name ?? '' });
    this.productIds.set([]);
    this.formOpen.set(true);
    this.formLoading.set(true);
    forkJoin({
      assignable: this.categoriesApi.getAssignableProducts(category?.categoryId ?? null),
      detail: category ? this.categoriesApi.get(category.categoryId) : of<CategoryDetail | null>(null),
    }).subscribe({
      next: ({ assignable, detail }) => {
        this.assignable.set(assignable);
        this.productIds.set(detail?.products.map(product => product.id) ?? []);
        this.formLoading.set(false);
      },
      error: error => {
        this.formLoading.set(false);
        this.fail(error);
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const payload = { code: value.code.trim().toUpperCase(), name: value.name.trim(), productIds: this.productIds() };
    const category = this.edited();
    this.saving.set(true);
    (category ? this.categoriesApi.update(category.categoryId, payload) : this.categoriesApi.create(payload)).subscribe({
      next: message => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.done(message);
      },
      error: error => {
        this.saving.set(false);
        this.fail(error);
      },
    });
  }

  askDelete(category: CategoryListItem): void {
    this.toDelete.set(category);
    this.deleteModal()?.open();
  }

  confirmDelete(): void {
    const category = this.toDelete();
    if (category) {
      this.categoriesApi.delete(category.categoryId).subscribe({ next: message => this.done(message), error: error => this.fail(error) });
    }
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.categoriesApi.getAll().subscribe({
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

  private fail(error: unknown): void {
    this.toast.error(getApiErrorMessage(error) ?? this.translate.instant('common.errors.generic'));
  }
}
