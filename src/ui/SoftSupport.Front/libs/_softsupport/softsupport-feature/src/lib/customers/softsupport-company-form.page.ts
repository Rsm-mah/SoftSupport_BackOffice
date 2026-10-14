import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SoftButtonComponent, SoftIconComponent, SoftInputComponent } from '@soft-mfe/shared-components';
import { getApiErrorMessage, ToastService } from '@soft-mfe/shared-services';
import { CompanyDetail, ContractInput, LookupItem, toDateInput } from '@softsupport/models';
import { SoftSupportCompanyService, SoftSupportProductService } from '@softsupport/service';
import { Credentials, SoftSupportCredentialsModalComponent, SoftSupportPageHeaderComponent } from '@softsupport/ui';
import { forkJoin, of } from 'rxjs';

interface ContractRow {
  productId: number;
  productName: string;
  selected: boolean;
  /** Produit déjà sous contrat : ses dates se modifient depuis la fiche de la société. */
  existing: boolean;
  startDate: string;
  endDate: string;
}

/** Création ou modification d'une société : informations, produits sous contrat, administrateur client. */
@Component({
  selector: 'softsupport-company-form-page',
  imports: [ReactiveFormsModule, TranslatePipe, SoftButtonComponent, SoftIconComponent, SoftInputComponent, SoftSupportPageHeaderComponent, SoftSupportCredentialsModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-testid="softsupport-company-form">
      <softsupport-page-header
        [heading]="(isEdit() ? 'softsupport.companies.editTitle' : 'softsupport.companies.createTitle') | translate"
        [subtitle]="isEdit() ? companyName() : ('softsupport.companies.createSubtitle' | translate)"
        [breadcrumb]="['softsupport.sidebar.customers' | translate, (isEdit() ? 'common.actions.edit' : 'softsupport.companies.add') | translate]"
      >
        <soft-button variant="secondary" (onClick)="back()">
          <soft-icon name="arrow-left" size="sm" class="mr-1.5" />{{ 'softsupport.common.back' | translate }}
        </soft-button>
      </softsupport-page-header>

      @if (loading()) {
        <p class="py-10 text-center text-sm text-slate-500">{{ 'common.loading' | translate }}</p>
      } @else {
        <form class="space-y-6" [formGroup]="form" (ngSubmit)="save()">
          <div class="ss-reveal rounded-xl border border-slate-200 bg-white p-6" style="--delay: 0.12s">
            <h2 class="mb-4 flex items-center gap-2 text-base font-bold text-slate-800"><soft-icon name="building-library" size="md" class="text-slate-400" />{{ 'softsupport.companies.sections.company' | translate }}</h2>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div class="md:col-span-2">
                <label for="company-name" class="form-label">{{ 'softsupport.companies.fields.name' | translate }} <span class="text-danger">*</span></label>
                <input
                  id="company-name"
                  type="text"
                  class="form-input"
                  list="crm-companies"
                  autocomplete="off"
                  formControlName="name"
                  [class.error]="form.controls.name.invalid && form.controls.name.touched"
                />
                @if (form.controls.name.invalid && form.controls.name.touched) {
                  <div class="form-error">{{ 'softsupport.common.nameRequired' | translate }}</div>
                } @else {
                  <div class="form-hint">{{ (isEdit() ? 'softsupport.companies.nameLocked' : 'softsupport.companies.nameHint') | translate }}</div>
                }
                <datalist id="crm-companies">
                  @for (name of crmNames(); track name) {
                    <option [value]="name"></option>
                  }
                </datalist>
              </div>
              <soft-input
                [label]="'softsupport.companies.fields.shortName' | translate"
                [required]="true"
                formControlName="shortName"
                [error]="form.controls.shortName.invalid && form.controls.shortName.touched ? ('softsupport.companies.shortNameRequired' | translate) : ''"
              />
              <soft-input type="number" [min]="0" [label]="'softsupport.companies.fields.userNumber' | translate" formControlName="userNumber" />
            </div>
          </div>

          <div class="ss-reveal rounded-xl border border-slate-200 bg-white p-6" style="--delay: 0.2s">
            <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 class="flex items-center gap-2 text-base font-bold text-slate-800">
                <soft-icon name="file-text" size="md" class="text-slate-400" />{{ 'softsupport.companies.sections.contracts' | translate }}
                <span class="rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-cyan-700">{{ selectedCount() }}</span>
              </h2>
              <div class="flex items-center gap-3">
                <label class="flex items-center gap-2 whitespace-nowrap text-sm text-slate-600">
                  <input type="checkbox" class="h-4 w-4 accent-cyan-700" [checked]="onlySelected()" (change)="onlySelected.set(!onlySelected())" />
                  {{ 'softsupport.companies.onlySelected' | translate }}
                </label>
                <input
                  type="search"
                  class="form-input w-56"
                  [placeholder]="'softsupport.common.filter' | translate"
                  [value]="productFilter()"
                  (input)="productFilter.set($any($event.target).value)"
                />
              </div>
            </div>
            <div class="max-h-[420px] overflow-y-auto rounded-lg border border-slate-100">
              <table class="min-w-full text-left text-sm">
                <thead class="sticky top-0 z-10 bg-blue-50 text-xs uppercase tracking-wide text-blue-700">
                  <tr>
                    <th class="w-10 px-4 py-2.5"></th>
                    <th class="px-4 py-2.5 font-semibold">{{ 'softsupport.articles.fields.product' | translate }}</th>
                    <th class="px-4 py-2.5 font-semibold">{{ 'softsupport.contracts.fields.start' | translate }}</th>
                    <th class="px-4 py-2.5 font-semibold">{{ 'softsupport.contracts.fields.end' | translate }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (row of visibleRows(); track row.productId) {
                    <tr [class.bg-cyan-50]="row.selected">
                      <td class="px-4 py-2"><input type="checkbox" class="h-4 w-4 accent-cyan-700" [checked]="row.selected" (change)="toggleRow(row)" [attr.aria-label]="row.productName" /></td>
                      <td class="px-4 py-2 font-medium text-slate-800">
                        {{ row.productName }}
                        @if (row.existing) {
                          <span class="ml-1 text-[11px] font-normal text-slate-400">{{ 'softsupport.companies.existingContract' | translate }}</span>
                        }
                      </td>
                      <td class="px-4 py-2">
                        <input type="date" class="form-input" [disabled]="!row.selected || row.existing" [value]="row.startDate" (change)="setDate(row, 'startDate', $any($event.target).value)" />
                      </td>
                      <td class="px-4 py-2">
                        <input type="date" class="form-input" [disabled]="!row.selected || row.existing" [value]="row.endDate" (change)="setDate(row, 'endDate', $any($event.target).value)" />
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="4" class="px-4 py-6 text-center text-xs text-slate-400">{{ 'softsupport.common.noResult' | translate }}</td></tr>
                  }
                </tbody>
              </table>
            </div>
            @if (isEdit()) {
              <p class="mt-2 text-xs text-slate-500">{{ 'softsupport.companies.contractsEditHint' | translate }}</p>
            }
          </div>

          <div class="ss-reveal rounded-xl border border-slate-200 bg-white p-6" style="--delay: 0.28s">
            <h2 class="mb-1 flex items-center gap-2 text-base font-bold text-slate-800"><soft-icon name="user" size="md" class="text-slate-400" />{{ 'softsupport.companies.sections.admin' | translate }}</h2>
            <p class="mb-4 text-xs text-slate-500">{{ 'softsupport.companies.adminHint' | translate }}</p>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
              <soft-input [label]="'softsupport.customers.fields.lastName' | translate" formControlName="adminLastName" />
              <soft-input [label]="'softsupport.customers.fields.firstName' | translate" formControlName="adminFirstName" />
              <soft-input [label]="'softsupport.customers.fields.function' | translate" formControlName="adminFunction" />
              <soft-input
                type="email"
                [label]="'softsupport.customers.fields.email' | translate"
                formControlName="adminEmail"
                [error]="form.controls.adminEmail.invalid && form.controls.adminEmail.touched ? ('softsupport.common.emailInvalid' | translate) : ''"
              />
            </div>
          </div>

          <div class="flex justify-end gap-2">
            <soft-button variant="secondary" (onClick)="back()">{{ 'common.actions.cancel' | translate }}</soft-button>
            <soft-button type="submit" variant="primary" [isLoading]="saving()">{{ 'common.actions.save' | translate }}</soft-button>
          </div>
        </form>
      }
    </section>

    <softsupport-credentials-modal [credentials]="credentials()" (closed)="afterCredentials()" />
  `,
})
export class SoftSupportCompanyFormPage {
  private readonly router = inject(Router);
  private readonly companiesApi = inject(SoftSupportCompanyService);
  private readonly productsApi = inject(SoftSupportProductService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  /** Paramètre de route `:id` (absent en création). */
  readonly id = input<string | undefined>();

  readonly isEdit = computed(() => !!this.id());
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly companyName = signal('');
  readonly crmNames = signal<string[]>([]);
  readonly rows = signal<ContractRow[]>([]);
  readonly productFilter = signal('');
  readonly onlySelected = signal(false);
  readonly credentials = signal<Credentials | null>(null);
  private savedCompanyId: number | null = null;

  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    shortName: ['', [Validators.required, Validators.maxLength(50)]],
    userNumber: [0, Validators.min(0)],
    adminFirstName: [''],
    adminLastName: [''],
    adminFunction: [''],
    adminEmail: ['', Validators.email],
  });

  readonly selectedCount = computed(() => this.rows().filter(row => row.selected).length);

  readonly visibleRows = computed(() => {
    const term = this.productFilter().trim().toLowerCase();
    return this.rows().filter(row => (!this.onlySelected() || row.selected) && (!term || row.productName.toLowerCase().includes(term)));
  });

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.load(id ? Number(id) : null));
    });
  }

  toggleRow(row: ContractRow): void {
    this.rows.update(rows => rows.map(item => (item.productId === row.productId ? { ...item, selected: !item.selected } : item)));
  }

  setDate(row: ContractRow, field: 'startDate' | 'endDate', value: string): void {
    this.rows.update(rows => rows.map(item => (item.productId === row.productId ? { ...item, [field]: value } : item)));
  }

  back(): void {
    const id = this.id();
    void this.router.navigate(id ? ['/clients', id] : ['/clients']);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const selected = this.rows().filter(row => row.selected);
    const incomplete = selected.find(row => !row.startDate || !row.endDate || row.endDate <= row.startDate);
    if (incomplete) {
      this.toast.warning(this.translate.instant('softsupport.companies.invalidDates', { product: incomplete.productName }));
      return;
    }

    const value = this.form.getRawValue();
    const contracts: ContractInput[] = selected.map(row => ({ productId: row.productId, startDate: row.startDate, endDate: row.endDate }));
    const admin = value.adminEmail.trim()
      ? {
          firstName: value.adminFirstName.trim(),
          lastName: value.adminLastName.trim(),
          email: value.adminEmail.trim(),
          function: value.adminFunction.trim() || null,
        }
      : null;
    const payload = { name: value.name.trim(), shortName: value.shortName.trim(), userNumber: Number(value.userNumber) || 0, contracts, admin };

    this.saving.set(true);
    const id = this.id();
    if (id) {
      this.companiesApi.update(Number(id), payload).subscribe({
        next: message => {
          this.saving.set(false);
          this.toast.success(message);
          void this.router.navigate(['/clients', id]);
        },
        error: error => this.fail(error),
      });
      return;
    }

    this.companiesApi.create(payload).subscribe({
      next: response => {
        this.saving.set(false);
        this.toast.success(response.message, 8000);
        this.savedCompanyId = response.data.companyId;
        if (response.data.adminEmail && response.data.adminPassword) {
          this.credentials.set({ email: response.data.adminEmail, password: response.data.adminPassword });
        } else {
          this.afterCredentials();
        }
      },
      error: error => this.fail(error),
    });
  }

  afterCredentials(): void {
    this.credentials.set(null);
    if (this.savedCompanyId) {
      void this.router.navigate(['/clients', this.savedCompanyId]);
    }
  }

  private load(companyId: number | null): void {
    this.loading.set(true);
    if (!companyId) {
      this.companiesApi.getCrmNames().subscribe({ next: names => this.crmNames.set(names) });
    }
    forkJoin({
      products: this.productsApi.getLookup(),
      company: companyId ? this.companiesApi.get(companyId) : of<CompanyDetail | null>(null),
    }).subscribe({
      next: ({ products, company }) => {
        this.rows.set(this.buildRows(products, company));
        if (company) {
          const admin = company.customers.find(customer => customer.isAdmin);
          this.companyName.set(company.name);
          this.form.reset({
            name: company.name,
            shortName: company.shortName,
            userNumber: company.userNumber,
            adminFirstName: admin?.firstName ?? '',
            adminLastName: admin?.lastName ?? '',
            adminFunction: admin?.function ?? '',
            adminEmail: admin?.email ?? '',
          });
          this.onlySelected.set(true);
          this.form.controls.name.disable();
        }
        this.loading.set(false);
      },
      error: error => {
        this.loading.set(false);
        this.toast.error(getApiErrorMessage(error) ?? this.translate.instant('common.errors.generic'));
      },
    });
  }

  /** Une ligne par produit ; un produit sous contrat reprend sa période la plus récente. */
  private buildRows(products: LookupItem[], company: CompanyDetail | null): ContractRow[] {
    const latest = new Map<number, { name: string; start: string; end: string }>();
    for (const contract of company?.contracts ?? []) {
      const current = latest.get(contract.productId);
      if (!current || contract.startDate > current.start) {
        latest.set(contract.productId, { name: contract.productName, start: contract.startDate, end: contract.endDate });
      }
    }

    const rows: ContractRow[] = products.map(product => ({
      productId: product.id,
      productName: product.name,
      selected: latest.has(product.id),
      existing: latest.has(product.id),
      startDate: toDateInput(latest.get(product.id)?.start),
      endDate: toDateInput(latest.get(product.id)?.end),
    }));
    for (const [productId, contract] of latest) {
      if (!products.some(product => product.id === productId)) {
        rows.push({ productId, productName: contract.name, selected: true, existing: true, startDate: toDateInput(contract.start), endDate: toDateInput(contract.end) });
      }
    }
    return rows.sort((a, b) => Number(b.selected) - Number(a.selected) || a.productName.localeCompare(b.productName));
  }

  private fail(error: unknown): void {
    this.saving.set(false);
    this.toast.error(getApiErrorMessage(error) ?? this.translate.instant('common.errors.generic'));
  }
}
