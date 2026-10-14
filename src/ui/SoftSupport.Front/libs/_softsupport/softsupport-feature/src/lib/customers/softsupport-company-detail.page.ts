import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  ConfirmationModalComponent,
  DataTableEmptyStateComponent,
  SoftBadgeComponent,
  SoftButtonComponent,
  SoftIconComponent,
  SoftModalComponent,
} from '@soft-mfe/shared-components';
import { getApiErrorMessage, ToastService } from '@soft-mfe/shared-services';
import { CompanyDetail, ContractLine, contractState, ContractState, CustomerItem, LookupItem } from '@softsupport/models';
import { SoftSupportCompanyService, SoftSupportProductService } from '@softsupport/service';
import { Credentials, SoftSupportCredentialsModalComponent, SoftSupportPageHeaderComponent } from '@softsupport/ui';
import { ContractModalRequest, SoftSupportContractModalComponent } from './softsupport-contract-modal.component';
import { SoftSupportCustomerModalComponent } from './softsupport-customer-modal.component';

const STATE_VARIANT: Record<ContractState, 'success' | 'warning' | 'danger' | 'info'> = {
  active: 'success',
  expiring: 'warning',
  expired: 'danger',
  future: 'info',
};

@Component({
  selector: 'softsupport-company-detail-page',
  imports: [
    DatePipe,
    TranslatePipe,
    ConfirmationModalComponent,
    DataTableEmptyStateComponent,
    SoftBadgeComponent,
    SoftButtonComponent,
    SoftIconComponent,
    SoftModalComponent,
    SoftSupportPageHeaderComponent,
    SoftSupportCredentialsModalComponent,
    SoftSupportContractModalComponent,
    SoftSupportCustomerModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-testid="softsupport-company-detail">
      <softsupport-page-header
        [heading]="company()?.name ?? ('softsupport.companies.detailTitle' | translate)"
        [subtitle]="'softsupport.companies.detailSubtitle' | translate"
        [breadcrumb]="['softsupport.sidebar.customers' | translate, company()?.name ?? '']"
      >
        <soft-button variant="secondary" (onClick)="router.navigate(['/clients'])">
          <soft-icon name="arrow-left" size="sm" class="mr-1.5" />{{ 'softsupport.common.back' | translate }}
        </soft-button>
        <soft-button variant="primary" (onClick)="router.navigate(['/clients', id(), 'modifier'])">
          <soft-icon name="edit" size="sm" class="mr-1.5" />{{ 'common.actions.edit' | translate }}
        </soft-button>
      </softsupport-page-header>

      @if (loading() && !company()) {
        <p class="py-10 text-center text-sm text-slate-500">{{ 'common.loading' | translate }}</p>
      } @else if (error()) {
        <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</p>
      } @else if (company(); as c) {
        <div class="ss-reveal grid grid-cols-1 gap-4 sm:grid-cols-3" style="--delay: 0.12s">
          <div class="rounded-xl border border-slate-200 border-l-4 border-l-slate-800 bg-white p-4">
            <p class="text-xs font-semibold uppercase text-slate-500">{{ 'softsupport.companies.fields.shortName' | translate }}</p>
            <p class="mt-1 font-mono text-2xl font-bold text-slate-900">{{ c.shortName }}</p>
          </div>
          <div class="rounded-xl border border-slate-200 border-l-4 border-l-cyan-600 bg-white p-4">
            <p class="text-xs font-semibold uppercase text-slate-500">{{ 'softsupport.companies.fields.userNumber' | translate }}</p>
            <p class="mt-1 text-2xl font-bold text-slate-900">{{ c.userNumber }} <span class="text-sm font-medium text-slate-400">/ {{ c.customers.length }} {{ 'softsupport.companies.created' | translate }}</span></p>
          </div>
          <div class="rounded-xl border border-slate-200 border-l-4 border-l-emerald-600 bg-white p-4">
            <p class="text-xs font-semibold uppercase text-slate-500">{{ 'softsupport.companies.activeContracts' | translate }}</p>
            <p class="mt-1 text-2xl font-bold text-slate-900">{{ activeCount() }} <span class="text-sm font-medium text-slate-400">/ {{ c.contracts.length }}</span></p>
          </div>
        </div>

        <div class="ss-reveal mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white" style="--delay: 0.2s">
          <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
            <h2 class="flex items-center gap-2 font-bold text-slate-800"><soft-icon name="file-text" size="md" class="text-slate-400" />{{ 'softsupport.companies.sections.contracts' | translate }}</h2>
            <soft-button variant="primary" size="sm" (onClick)="contractRequest.set({ mode: 'add', contract: null })">
              <soft-icon name="plus" size="sm" class="mr-1" />{{ 'softsupport.contracts.add' | translate }}
            </soft-button>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-left text-sm">
              <thead class="bg-blue-50 text-xs uppercase tracking-wide text-blue-700">
                <tr>
                  <th class="px-4 py-3 font-semibold">{{ 'softsupport.articles.fields.product' | translate }}</th>
                  <th class="px-4 py-3 font-semibold">{{ 'softsupport.contracts.fields.start' | translate }}</th>
                  <th class="px-4 py-3 font-semibold">{{ 'softsupport.contracts.fields.end' | translate }}</th>
                  <th class="px-4 py-3 font-semibold">{{ 'softsupport.articles.columns.status' | translate }}</th>
                  <th class="px-4 py-3 text-right font-semibold">{{ 'softsupport.common.actions' | translate }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (line of c.contracts; track line.contractId) {
                  <tr class="ss-row hover:bg-slate-50" [style.--i]="$index">
                    <td class="px-4 py-3 font-medium text-slate-900">{{ line.productName }}</td>
                    <td class="whitespace-nowrap px-4 py-3 text-slate-700">{{ line.startDate | date: 'dd/MM/yyyy' }}</td>
                    <td class="whitespace-nowrap px-4 py-3 text-slate-700">{{ line.endDate | date: 'dd/MM/yyyy' }}</td>
                    <td class="px-4 py-3"><soft-badge [variant]="variant(line)">{{ 'softsupport.contracts.state.' + state(line) | translate }}</soft-badge></td>
                    <td class="px-4 py-3">
                      <div class="flex justify-end gap-1">
                        <button type="button" class="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700" [title]="'softsupport.contracts.history' | translate" (click)="showHistory(line)">
                          <soft-icon name="clock" size="sm" />
                        </button>
                        <button type="button" class="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-emerald-700" [title]="'softsupport.contracts.renew' | translate" (click)="contractRequest.set({ mode: 'renew', contract: line })">
                          <soft-icon name="repeat-ccw" size="sm" />
                        </button>
                        <button type="button" class="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700" [title]="'common.actions.edit' | translate" (click)="contractRequest.set({ mode: 'edit', contract: line })">
                          <soft-icon name="edit" size="sm" />
                        </button>
                        <button type="button" class="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" [title]="'common.actions.delete' | translate" (click)="askDeleteContract(line)">
                          <soft-icon name="trash" size="sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="5" class="px-4 py-8"><soft-data-table-empty-state [message]="'softsupport.contracts.empty' | translate" [hasActiveFilters]="false" /></td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <div class="ss-reveal mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white" style="--delay: 0.28s">
          <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
            <h2 class="flex items-center gap-2 font-bold text-slate-800"><soft-icon name="users" size="md" class="text-slate-400" />{{ 'softsupport.customers.title' | translate }}</h2>
            <soft-button variant="primary" size="sm" (onClick)="openCustomer(null)">
              <soft-icon name="plus" size="sm" class="mr-1" />{{ 'softsupport.customers.add' | translate }}
            </soft-button>
          </div>
          <table class="min-w-full text-left text-sm">
            <thead class="bg-blue-50 text-xs uppercase tracking-wide text-blue-700">
              <tr>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.users.columns.name' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.customers.fields.email' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.customers.fields.function' | translate }}</th>
                <th class="px-4 py-3 text-right font-semibold">{{ 'softsupport.common.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (customer of c.customers; track customer.customerId) {
                <tr class="ss-row cursor-pointer hover:bg-slate-50" [style.--i]="$index" (click)="openCustomer(customer)">
                  <td class="px-4 py-3 font-medium text-slate-900">
                    {{ customer.firstName }} {{ customer.lastName }}
                    @if (customer.isAdmin) {
                      <span class="ml-1 rounded bg-cyan-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-cyan-800">admin</span>
                    }
                  </td>
                  <td class="px-4 py-3 text-slate-700">{{ customer.email }}</td>
                  <td class="px-4 py-3 text-slate-700">{{ customer.function || '—' }}</td>
                  <td class="px-4 py-3" (click)="$event.stopPropagation()">
                    <div class="flex justify-end gap-1">
                      <button type="button" class="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700" [title]="'common.actions.edit' | translate" (click)="openCustomer(customer)">
                        <soft-icon name="edit" size="sm" />
                      </button>
                      <button type="button" class="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" [title]="'common.actions.delete' | translate" (click)="askDeleteCustomer(customer)">
                        <soft-icon name="trash" size="sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="4" class="px-4 py-8"><soft-data-table-empty-state [message]="'softsupport.customers.empty' | translate" [hasActiveFilters]="false" /></td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>

    @if (company(); as c) {
      <softsupport-contract-modal [companyId]="c.companyId" [products]="products()" [request]="contractRequest()" (closed)="contractRequest.set(null)" (saved)="onContractSaved()" />
      <softsupport-customer-modal [open]="customerOpen()" [companyId]="c.companyId" [customer]="editedCustomer()" (closed)="customerOpen.set(false)" (saved)="onCustomerSaved($event)" />
    }
    <softsupport-credentials-modal [credentials]="credentials()" (closed)="credentials.set(null)" />

    <soft-modal [open]="historyOf() !== null" size="md" (close)="historyOf.set(null)" [ariaLabel]="'softsupport.contracts.history' | translate">
      <div modal-header class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">{{ 'softsupport.contracts.history' | translate }}</h2>
          <p class="mt-0.5 text-sm text-slate-500">{{ historyOf()?.productName }}</p>
        </div>
        <button type="button" class="text-slate-400 hover:text-slate-600" (click)="historyOf.set(null)" [attr.aria-label]="'common.actions.close' | translate"><soft-icon name="x" size="md" /></button>
      </div>
      <div modal-body>
        <ol class="relative ml-2 border-l-2 border-slate-200">
          @for (line of history(); track line.contractId) {
            <li class="relative mb-3 pl-5">
              <span class="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full" [style.background]="dotColor(line)"></span>
              <p class="text-sm font-semibold text-slate-800">{{ line.startDate | date: 'dd/MM/yyyy' }} → {{ line.endDate | date: 'dd/MM/yyyy' }}</p>
              <soft-badge [variant]="variant(line)">{{ 'softsupport.contracts.state.' + state(line) | translate }}</soft-badge>
            </li>
          }
        </ol>
      </div>
      <div modal-footer class="flex justify-end">
        <soft-button variant="secondary" (onClick)="historyOf.set(null)">{{ 'common.actions.close' | translate }}</soft-button>
      </div>
    </soft-modal>

    <app-confirmation-modal
      #deleteContractModal
      [title]="'softsupport.contracts.delete.title' | translate"
      [message]="'softsupport.contracts.delete.message' | translate: { product: contractToDelete()?.productName ?? '' }"
      [cancelLabel]="'common.actions.cancel' | translate"
      [confirmLabel]="'common.actions.delete' | translate"
      (confirmed)="confirmDeleteContract()"
    />
    <app-confirmation-modal
      #deleteCustomerModal
      [title]="'softsupport.customers.delete.title' | translate"
      [message]="'softsupport.common.deleteMessage' | translate: { name: customerToDelete()?.email ?? '' }"
      [additionalInfo]="'softsupport.customers.delete.info' | translate"
      [cancelLabel]="'common.actions.cancel' | translate"
      [confirmLabel]="'common.actions.delete' | translate"
      (confirmed)="confirmDeleteCustomer()"
    />
  `,
})
export class SoftSupportCompanyDetailPage {
  readonly router = inject(Router);
  private readonly companiesApi = inject(SoftSupportCompanyService);
  private readonly productsApi = inject(SoftSupportProductService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly deleteContractModal = viewChild<ConfirmationModalComponent>('deleteContractModal');
  private readonly deleteCustomerModal = viewChild<ConfirmationModalComponent>('deleteCustomerModal');

  readonly id = input.required<string>();

  readonly company = signal<CompanyDetail | null>(null);
  readonly products = signal<LookupItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly contractRequest = signal<ContractModalRequest | null>(null);
  readonly historyOf = signal<ContractLine | null>(null);
  readonly history = signal<ContractLine[]>([]);
  readonly customerOpen = signal(false);
  readonly editedCustomer = signal<CustomerItem | null>(null);
  readonly credentials = signal<Credentials | null>(null);
  readonly contractToDelete = signal<ContractLine | null>(null);
  readonly customerToDelete = signal<CustomerItem | null>(null);

  readonly activeCount = computed(() => (this.company()?.contracts ?? []).filter(line => ['active', 'expiring'].includes(this.state(line))).length);

  constructor() {
    this.productsApi.getLookup().subscribe({ next: products => this.products.set(products) });
    effect(() => {
      this.id();
      untracked(() => this.load());
    });
  }

  state(line: ContractLine): ContractState {
    return contractState(line.startDate, line.endDate);
  }

  variant(line: ContractLine): 'success' | 'warning' | 'danger' | 'info' {
    return STATE_VARIANT[this.state(line)];
  }

  dotColor(line: ContractLine): string {
    return { active: '#10b981', expiring: '#fbbf24', expired: '#f87171', future: '#38bdf8' }[this.state(line)];
  }

  showHistory(line: ContractLine): void {
    this.historyOf.set(line);
    this.history.set([]);
    this.companiesApi.getProductContracts(Number(this.id()), line.productId).subscribe({ next: lines => this.history.set(lines) });
  }

  onContractSaved(): void {
    this.contractRequest.set(null);
    this.load();
  }

  openCustomer(customer: CustomerItem | null): void {
    this.editedCustomer.set(customer);
    this.customerOpen.set(true);
  }

  onCustomerSaved(credentials: Credentials | null): void {
    this.customerOpen.set(false);
    this.credentials.set(credentials);
    this.load();
  }

  askDeleteContract(line: ContractLine): void {
    this.contractToDelete.set(line);
    this.deleteContractModal()?.open();
  }

  confirmDeleteContract(): void {
    const line = this.contractToDelete();
    if (line) {
      this.companiesApi.deleteContract(line.contractId).subscribe({ next: message => this.done(message), error: error => this.fail(error) });
    }
  }

  askDeleteCustomer(customer: CustomerItem): void {
    this.customerToDelete.set(customer);
    this.deleteCustomerModal()?.open();
  }

  confirmDeleteCustomer(): void {
    const customer = this.customerToDelete();
    if (customer) {
      this.companiesApi.deleteCustomer(customer.customerId).subscribe({ next: message => this.done(message), error: error => this.fail(error) });
    }
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.companiesApi.get(Number(this.id())).subscribe({
      next: company => {
        this.company.set(company);
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
    this.load();
  }

  private fail(error: unknown): void {
    this.toast.error(getApiErrorMessage(error) ?? this.translate.instant('common.errors.generic'));
  }
}
