import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  ConfirmationModalComponent,
  DataTableEmptyStateComponent,
  SoftButtonComponent,
  SoftIconComponent,
  SoftInputComponent,
} from '@soft-mfe/shared-components';
import { getApiErrorMessage, ToastService } from '@soft-mfe/shared-services';
import { CompanyListItem } from '@softsupport/models';
import { SoftSupportCompanyService } from '@softsupport/service';
import { SoftSupportPageHeaderComponent } from '@softsupport/ui';

@Component({
  selector: 'softsupport-companies-page',
  imports: [
    DatePipe,
    TranslatePipe,
    ConfirmationModalComponent,
    DataTableEmptyStateComponent,
    SoftButtonComponent,
    SoftIconComponent,
    SoftInputComponent,
    SoftSupportPageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-testid="softsupport-companies">
      <softsupport-page-header
        [heading]="'softsupport.companies.title' | translate"
        [subtitle]="'softsupport.companies.subtitle' | translate"
        [breadcrumb]="['softsupport.sidebar.customers' | translate]"
      >
        <soft-button variant="primary" (onClick)="router.navigate(['/clients/nouveau'])">
          <soft-icon name="plus" size="sm" class="mr-1.5" />{{ 'softsupport.companies.add' | translate }}
        </soft-button>
      </softsupport-page-header>

      <div class="ss-reveal w-full max-w-xl" style="--delay: 0.15s">
        <soft-input [label]="'softsupport.common.search' | translate" [placeholder]="'softsupport.companies.searchPlaceholder' | translate" name="filter-company" autocomplete="off" [value]="search()" (valueChange)="search.set($event)" />
      </div>

      @if (loading() && companies().length === 0) {
        <p class="py-10 text-center text-sm text-slate-500">{{ 'common.loading' | translate }}</p>
      } @else if (error()) {
        <p class="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</p>
      } @else if (filtered().length === 0) {
        <div class="ss-reveal mt-4 rounded-xl border border-slate-200 bg-white p-10">
          <soft-data-table-empty-state [message]="'softsupport.companies.empty' | translate" [hasActiveFilters]="search().trim() !== ''" (clearFilters)="search.set('')" />
        </div>
      } @else {
        <div class="ss-reveal mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white" style="--delay: 0.25s">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-blue-50 text-xs uppercase tracking-wide text-blue-700">
              <tr>
                <th class="w-10 px-4 py-3"></th>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.companies.fields.name' | translate }}</th>
                <th class="px-4 py-3 text-right font-semibold">{{ 'softsupport.companies.fields.userNumber' | translate }}</th>
                <th class="px-4 py-3 text-right font-semibold">{{ 'softsupport.companies.columns.contracts' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.companies.columns.nextEnd' | translate }}</th>
                <th class="px-4 py-3 text-right font-semibold">{{ 'softsupport.common.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (company of filtered(); track company.companyId) {
                <tr class="ss-row cursor-pointer border-t border-slate-100 hover:bg-slate-50" [style.--i]="$index" (click)="open(company)">
                  <td class="px-4 py-3" (click)="$event.stopPropagation()">
                    <button
                      type="button"
                      class="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      [attr.aria-expanded]="isExpanded(company.companyId)"
                      [title]="'softsupport.companies.showUsers' | translate"
                      (click)="toggle(company.companyId)"
                    >
                      <soft-icon name="chevron-right" size="sm" class="transition-transform" [style.transform]="isExpanded(company.companyId) ? 'rotate(90deg)' : 'none'" />
                    </button>
                  </td>
                  <td class="px-4 py-3">
                    <span class="mr-1.5 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] font-bold text-white">{{ company.shortName }}</span>
                    <span class="font-medium text-slate-900">{{ company.name }}</span>
                    <span class="ml-2 text-xs text-slate-400">{{ 'softsupport.companies.usersCount' | translate: { count: company.customers.length } }}</span>
                  </td>
                  <td class="px-4 py-3 text-right text-slate-700">{{ company.userNumber }}</td>
                  <td class="px-4 py-3 text-right text-slate-700">{{ company.contractCount }}</td>
                  <td class="whitespace-nowrap px-4 py-3">
                    @if (company.nextEndDate) {
                      <span [class]="soon(company.nextEndDate) ? 'font-semibold text-amber-600' : 'text-slate-700'">{{ company.nextEndDate | date: 'dd/MM/yyyy' }}</span>
                    } @else {
                      <span class="text-xs text-slate-400">—</span>
                    }
                  </td>
                  <td class="px-4 py-3" (click)="$event.stopPropagation()">
                    <div class="flex justify-end gap-1">
                      <button type="button" class="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700" [title]="'softsupport.common.view' | translate" (click)="open(company)">
                        <soft-icon name="eye" size="sm" />
                      </button>
                      <button type="button" class="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700" [title]="'common.actions.edit' | translate" (click)="router.navigate(['/clients', company.companyId, 'modifier'])">
                        <soft-icon name="edit" size="sm" />
                      </button>
                      <button type="button" class="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" [title]="'common.actions.delete' | translate" (click)="askDelete(company)">
                        <soft-icon name="trash" size="sm" />
                      </button>
                    </div>
                  </td>
                </tr>
                @if (isExpanded(company.companyId)) {
                  @for (customer of company.customers; track customer.customerId) {
                    <tr class="bg-slate-50/70 text-xs">
                      <td></td>
                      <td class="px-4 py-2 pl-10 text-slate-700" colspan="2">
                        <soft-icon name="user" size="xs" class="mr-1 text-slate-400" />
                        {{ customer.firstName }} {{ customer.lastName }}
                        @if (customer.isAdmin) {
                          <span class="ml-1 rounded bg-cyan-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-cyan-800">admin</span>
                        }
                      </td>
                      <td class="px-4 py-2 text-slate-500" colspan="3">{{ customer.email }}{{ customer.function ? ' · ' + customer.function : '' }}</td>
                    </tr>
                  } @empty {
                    <tr class="bg-slate-50/70 text-xs"><td></td><td class="px-4 py-2 pl-10 italic text-slate-400" colspan="5">{{ 'softsupport.customers.empty' | translate }}</td></tr>
                  }
                }
              }
            </tbody>
          </table>
        </div>
      }
    </section>

    <app-confirmation-modal
      #deleteModal
      [title]="'softsupport.companies.delete.title' | translate"
      [message]="'softsupport.common.deleteMessage' | translate: { name: toDelete()?.name ?? '' }"
      [additionalInfo]="'softsupport.companies.delete.info' | translate"
      [cancelLabel]="'common.actions.cancel' | translate"
      [confirmLabel]="'common.actions.delete' | translate"
      (confirmed)="confirmDelete()"
    />
  `,
})
export class SoftSupportCompaniesPage implements OnInit {
  readonly router = inject(Router);
  private readonly companiesApi = inject(SoftSupportCompanyService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly deleteModal = viewChild<ConfirmationModalComponent>('deleteModal');

  readonly companies = signal<CompanyListItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly search = signal('');
  readonly expanded = signal<ReadonlySet<number>>(new Set());
  readonly toDelete = signal<CompanyListItem | null>(null);

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    return term
      ? this.companies().filter(company =>
          [company.name, company.shortName, ...company.customers.map(customer => `${customer.firstName} ${customer.lastName} ${customer.email}`)]
            .join(' ')
            .toLowerCase()
            .includes(term),
        )
      : this.companies();
  });

  ngOnInit(): void {
    this.load();
  }

  isExpanded(companyId: number): boolean {
    return this.expanded().has(companyId);
  }

  toggle(companyId: number): void {
    this.expanded.update(current => {
      const next = new Set(current);
      if (!next.delete(companyId)) {
        next.add(companyId);
      }
      return next;
    });
  }

  soon(date: string): boolean {
    return new Date(date).getTime() - Date.now() <= 90 * 86_400_000;
  }

  open(company: CompanyListItem): void {
    void this.router.navigate(['/clients', company.companyId]);
  }

  askDelete(company: CompanyListItem): void {
    this.toDelete.set(company);
    this.deleteModal()?.open();
  }

  confirmDelete(): void {
    const company = this.toDelete();
    if (!company) {
      return;
    }
    this.companiesApi.delete(company.companyId).subscribe({
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
    this.companiesApi.getAll().subscribe({
      next: companies => {
        this.companies.set(companies);
        this.loading.set(false);
      },
      error: error => {
        this.loading.set(false);
        this.error.set(getApiErrorMessage(error) ?? this.translate.instant('common.errors.generic'));
      },
    });
  }
}
