import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  ConfirmationModalComponent,
  DataTableEmptyStateComponent,
  SoftButtonComponent,
  SoftIconComponent,
  SoftInputComponent,
  SoftModalComponent,
  SoftSelectComponent,
} from '@soft-mfe/shared-components';
import { SelectOption } from '@soft-mfe/shared-models';
import { getApiErrorMessage, ToastService } from '@soft-mfe/shared-services';
import { LookupItem, PackItem } from '@softsupport/models';
import { SoftSupportProductService } from '@softsupport/service';
import { SoftSupportPageHeaderComponent } from '@softsupport/ui';
import { SoftSupportCheckListComponent } from './softsupport-check-list.component';

@Component({
  selector: 'softsupport-packs-page',
  imports: [
    TranslatePipe,
    ConfirmationModalComponent,
    DataTableEmptyStateComponent,
    SoftButtonComponent,
    SoftIconComponent,
    SoftInputComponent,
    SoftModalComponent,
    SoftSelectComponent,
    SoftSupportCheckListComponent,
    SoftSupportPageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-testid="softsupport-packs">
      <softsupport-page-header
        [heading]="'softsupport.packs.title' | translate"
        [subtitle]="'softsupport.packs.subtitle' | translate"
        [breadcrumb]="['softsupport.sidebar.catalog' | translate, 'softsupport.sidebar.packs' | translate]"
      >
        <soft-button variant="primary" (onClick)="openForm(null)">
          <soft-icon name="plus" size="sm" class="mr-1.5" />{{ 'softsupport.packs.add' | translate }}
        </soft-button>
      </softsupport-page-header>

      <div class="ss-reveal w-full max-w-xl" style="--delay: 0.15s">
        <soft-input [label]="'softsupport.common.search' | translate" [placeholder]="'softsupport.packs.searchPlaceholder' | translate" name="filter-pack" autocomplete="off" [value]="search()" (valueChange)="search.set($event)" />
      </div>

      @if (loading() && packs().length === 0) {
        <p class="py-10 text-center text-sm text-slate-500">{{ 'common.loading' | translate }}</p>
      } @else if (error()) {
        <p class="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</p>
      } @else if (filtered().length === 0) {
        <div class="ss-reveal mt-4 rounded-xl border border-slate-200 bg-white p-10">
          <soft-data-table-empty-state [message]="'softsupport.packs.empty' | translate" [hasActiveFilters]="search().trim() !== ''" (clearFilters)="search.set('')" />
        </div>
      } @else {
        <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          @for (pack of filtered(); track pack.productId) {
            <article class="ss-reveal rounded-xl border border-slate-200 bg-white p-5" [style.--delay]="0.2 + $index * 0.04 + 's'">
              <div class="flex items-start justify-between gap-3">
                <div class="flex min-w-0 items-center gap-3">
                  <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700"><soft-icon name="inventory" size="md" /></span>
                  <div class="min-w-0">
                    <h2 class="truncate font-semibold text-slate-900">{{ pack.productName }}</h2>
                    <p class="text-xs text-slate-500">{{ 'softsupport.packs.includedCount' | translate: { count: pack.includedProducts.length } }}</p>
                  </div>
                </div>
                <div class="flex shrink-0 gap-1">
                  <button type="button" class="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700" [title]="'common.actions.edit' | translate" (click)="openForm(pack)">
                    <soft-icon name="edit" size="sm" />
                  </button>
                  <button type="button" class="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" [title]="'common.actions.delete' | translate" (click)="askDelete(pack)">
                    <soft-icon name="trash" size="sm" />
                  </button>
                </div>
              </div>
              <ul class="mt-4 flex flex-wrap gap-1.5">
                @for (item of pack.includedProducts; track item.id) {
                  <li class="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">{{ item.name }}</li>
                }
              </ul>
            </article>
          }
        </div>
      }
    </section>

    <soft-modal [open]="formOpen()" size="lg" (close)="formOpen.set(false)" [ariaLabel]="'softsupport.packs.formTitle' | translate">
      <div modal-header class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-slate-900">{{ (edited() ? 'softsupport.packs.editTitle' : 'softsupport.packs.formTitle') | translate }}</h2>
        <button type="button" class="text-slate-400 hover:text-slate-600" (click)="formOpen.set(false)" [attr.aria-label]="'common.actions.close' | translate"><soft-icon name="x" size="md" /></button>
      </div>
      <div modal-body class="space-y-4">
        <soft-select
          [label]="'softsupport.packs.product' | translate"
          [placeholder]="'softsupport.packs.productPlaceholder' | translate"
          [options]="productOptions()"
          [searchable]="true"
          [required]="true"
          [disabled]="edited() !== null"
          [value]="packProductId()"
          (valueChange)="packProductId.set($event)"
        />
        <div>
          <p class="form-label">{{ 'softsupport.packs.included' | translate }} <span class="text-danger">*</span></p>
          <softsupport-check-list [items]="includableProducts()" [(selected)]="included" />
        </div>
      </div>
      <div modal-footer class="flex justify-end gap-2">
        <soft-button variant="secondary" (onClick)="formOpen.set(false)">{{ 'common.actions.cancel' | translate }}</soft-button>
        <soft-button variant="primary" [isLoading]="saving()" [disabled]="!packProductId() || included().length === 0" (onClick)="save()">{{ 'common.actions.save' | translate }}</soft-button>
      </div>
    </soft-modal>

    <app-confirmation-modal
      #deleteModal
      [title]="'softsupport.packs.delete.title' | translate"
      [message]="'softsupport.common.deleteMessage' | translate: { name: toDelete()?.productName ?? '' }"
      [cancelLabel]="'common.actions.cancel' | translate"
      [confirmLabel]="'common.actions.delete' | translate"
      (confirmed)="confirmDelete()"
    />
  `,
})
export class SoftSupportPacksPage implements OnInit {
  private readonly productsApi = inject(SoftSupportProductService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly deleteModal = viewChild<ConfirmationModalComponent>('deleteModal');

  readonly packs = signal<PackItem[]>([]);
  readonly products = signal<LookupItem[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly search = signal('');
  readonly formOpen = signal(false);
  readonly edited = signal<PackItem | null>(null);
  readonly toDelete = signal<PackItem | null>(null);
  readonly packProductId = signal('');
  readonly included = signal<number[]>([]);

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    return term
      ? this.packs().filter(pack => [pack.productName, ...pack.includedProducts.map(item => item.name)].join(' ').toLowerCase().includes(term))
      : this.packs();
  });

  readonly productOptions = computed<SelectOption[]>(() => {
    const packIds = new Set(this.packs().map(pack => pack.productId));
    const editedId = this.edited()?.productId;
    return this.products()
      .filter(product => !packIds.has(product.id) || product.id === editedId)
      .map(product => ({ value: String(product.id), label: product.name }));
  });

  readonly includableProducts = computed(() => this.products().filter(product => String(product.id) !== this.packProductId()));

  ngOnInit(): void {
    this.productsApi.getLookup().subscribe({ next: products => this.products.set(products) });
    this.load();
  }

  openForm(pack: PackItem | null): void {
    this.edited.set(pack);
    this.packProductId.set(pack ? String(pack.productId) : '');
    this.included.set(pack ? pack.includedProducts.map(item => item.id) : []);
    this.formOpen.set(true);
  }

  save(): void {
    const productId = Number(this.packProductId());
    if (!productId || this.included().length === 0) {
      return;
    }
    this.saving.set(true);
    this.productsApi.savePack(productId, this.included()).subscribe({
      next: message => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.toast.success(message);
        this.load();
      },
      error: error => {
        this.saving.set(false);
        this.toast.error(getApiErrorMessage(error) ?? this.translate.instant('common.errors.generic'));
      },
    });
  }

  askDelete(pack: PackItem): void {
    this.toDelete.set(pack);
    this.deleteModal()?.open();
  }

  confirmDelete(): void {
    const pack = this.toDelete();
    if (!pack) {
      return;
    }
    this.productsApi.deletePack(pack.productId).subscribe({
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
    this.productsApi.getPacks().subscribe({
      next: packs => {
        this.packs.set(packs);
        this.loading.set(false);
      },
      error: error => {
        this.loading.set(false);
        this.error.set(getApiErrorMessage(error) ?? this.translate.instant('common.errors.generic'));
      },
    });
  }
}
