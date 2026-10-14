import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
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
import { ROLE_ADMINISTRATEUR, SOFTSUPPORT_DEFAULT_PAGE_SIZE, UserFormOptions, UserListItem } from '@softsupport/models';
import { SoftSupportSessionService, SoftSupportUsersService } from '@softsupport/service';
import { SoftSupportListPaginationComponent, SoftSupportPageHeaderComponent } from '@softsupport/ui';

@Component({
  selector: 'softsupport-users-page',
  imports: [
    DatePipe,
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
    SoftSupportListPaginationComponent,
    SoftSupportPageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-testid="softsupport-users">
      <softsupport-page-header
        [heading]="'softsupport.users.title' | translate"
        [subtitle]="'softsupport.users.subtitle' | translate"
        [breadcrumb]="['softsupport.sidebar.administration' | translate, 'softsupport.sidebar.users' | translate]"
      >
        <soft-button variant="primary" (onClick)="openForm(null)">
          <soft-icon name="plus" size="sm" class="mr-1.5" />{{ 'softsupport.users.add' | translate }}
        </soft-button>
      </softsupport-page-header>

      <div class="ss-reveal grid w-full max-w-3xl grid-cols-1 gap-3 md:grid-cols-2" style="--delay: 0.15s">
        <soft-input [label]="'softsupport.common.search' | translate" [placeholder]="'softsupport.users.searchPlaceholder' | translate" name="filter-user" autocomplete="off" [value]="search()" (valueChange)="search.set($event); page.set(1)" />
        <soft-select [label]="'softsupport.users.fields.role' | translate" [placeholder]="'softsupport.common.all' | translate" [options]="roleFilterOptions()" [value]="roleFilter()" (valueChange)="roleFilter.set($event); page.set(1)" />
      </div>

      <div class="ss-reveal mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white" style="--delay: 0.25s">
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-blue-50 text-xs uppercase tracking-wide text-blue-700">
              <tr>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.users.columns.name' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.users.fields.email' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.users.fields.role' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.users.fields.departement' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.users.fields.validator' | translate }}</th>
                <th class="px-4 py-3 font-semibold">{{ 'softsupport.users.columns.createdAt' | translate }}</th>
                <th class="px-4 py-3 text-right font-semibold">{{ 'softsupport.common.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @if (loading() && rows().length === 0) {
                <tr><td colspan="7" class="px-4 py-8 text-center text-slate-500">{{ 'common.loading' | translate }}</td></tr>
              } @else if (error()) {
                <tr><td colspan="7" class="px-4 py-8 text-center text-red-600">{{ error() }}</td></tr>
              } @else if (visible().length === 0) {
                <tr><td colspan="7" class="px-4 py-10"><soft-data-table-empty-state [message]="'softsupport.users.empty' | translate" [hasActiveFilters]="search().trim() !== '' || roleFilter() !== ''" (clearFilters)="search.set(''); roleFilter.set('')" /></td></tr>
              } @else {
                @for (row of visible(); track row.userId) {
                  <tr class="ss-row cursor-pointer hover:bg-slate-50" [style.--i]="$index" (click)="openForm(row)">
                    <td class="px-4 py-3 font-medium text-slate-900">{{ fullName(row) || '—' }}</td>
                    <td class="px-4 py-3 text-slate-700">{{ row.email }}</td>
                    <td class="px-4 py-3"><soft-badge [variant]="row.role === admin ? 'primary' : 'secondary'">{{ row.role || '—' }}</soft-badge></td>
                    <td class="px-4 py-3 text-slate-700">{{ row.departement || '—' }}</td>
                    <td class="px-4 py-3">
                      <div class="flex max-w-[16rem] flex-wrap gap-1">
                        @for (id of row.validatorDepartementIds; track id) {
                          <span class="rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-700">{{ departementName(id) }}</span>
                        } @empty {
                          <span class="text-xs text-slate-400">—</span>
                        }
                      </div>
                    </td>
                    <td class="whitespace-nowrap px-4 py-3 text-slate-700">{{ row.dateCreated | date: 'dd/MM/yyyy' }}</td>
                    <td class="px-4 py-3" (click)="$event.stopPropagation()">
                      <div class="flex justify-end gap-1">
                        <button type="button" class="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700" [title]="'common.actions.edit' | translate" (click)="openForm(row)">
                          <soft-icon name="edit" size="sm" />
                        </button>
                        @if (row.userId !== currentUserId()) {
                          <button type="button" class="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" [title]="'common.actions.delete' | translate" (click)="askDelete(row)">
                            <soft-icon name="trash" size="sm" />
                          </button>
                        }
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
    </section>

    <soft-modal [open]="formOpen()" size="lg" (close)="formOpen.set(false)" [ariaLabel]="'softsupport.users.createTitle' | translate">
      <div modal-header class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">{{ (edited() ? 'softsupport.users.editTitle' : 'softsupport.users.createTitle') | translate }}</h2>
          @if (!edited()) {
            <p class="mt-0.5 text-sm text-slate-500">{{ 'softsupport.users.createHint' | translate }}</p>
          }
        </div>
        <button type="button" class="text-slate-400 hover:text-slate-600" (click)="formOpen.set(false)" [attr.aria-label]="'common.actions.close' | translate"><soft-icon name="x" size="md" /></button>
      </div>
      <div modal-body>
        <form class="space-y-4" [formGroup]="form" (ngSubmit)="save()">
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <soft-input [label]="'softsupport.users.fields.firstName' | translate" formControlName="firstName" />
            <soft-input [label]="'softsupport.users.fields.lastName' | translate" formControlName="lastName" />
          </div>
          <soft-input
            type="email"
            [label]="'softsupport.users.fields.email' | translate"
            [required]="true"
            formControlName="email"
            [error]="form.controls.email.invalid && form.controls.email.touched ? ('softsupport.common.emailInvalid' | translate) : ''"
          />
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <soft-select [label]="'softsupport.users.fields.role' | translate" [options]="roleOptions()" [required]="true" formControlName="roleId" />
            <soft-select [label]="'softsupport.users.fields.departement' | translate" [options]="departementOptions()" [required]="true" formControlName="departementId" />
          </div>
          <fieldset>
            <legend class="form-label">{{ 'softsupport.users.fields.validator' | translate }}</legend>
            <p class="mb-2 text-xs text-slate-500">{{ 'softsupport.users.validatorHint' | translate }}</p>
            <div class="flex flex-wrap gap-2">
              @for (departement of options()?.departements ?? []; track departement.id) {
                <label
                  class="flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition"
                  [class.border-cyan-600]="validators().includes(departement.id)"
                  [class.bg-cyan-50]="validators().includes(departement.id)"
                  [class.text-cyan-800]="validators().includes(departement.id)"
                  [class.border-slate-200]="!validators().includes(departement.id)"
                >
                  <input type="checkbox" class="h-3.5 w-3.5 accent-cyan-700" [checked]="validators().includes(departement.id)" (change)="toggleValidator(departement.id)" />
                  {{ departement.name }}
                </label>
              }
            </div>
          </fieldset>
        </form>
      </div>
      <div modal-footer class="flex justify-end gap-2">
        <soft-button variant="secondary" (onClick)="formOpen.set(false)">{{ 'common.actions.cancel' | translate }}</soft-button>
        <soft-button variant="primary" [isLoading]="saving()" [disabled]="form.invalid" (onClick)="save()">{{ (edited() ? 'common.actions.update' : 'common.actions.create') | translate }}</soft-button>
      </div>
    </soft-modal>

    <app-confirmation-modal
      #deleteModal
      [title]="'softsupport.users.delete.title' | translate"
      [message]="'softsupport.common.deleteMessage' | translate: { name: toDelete()?.email ?? '' }"
      [additionalInfo]="'softsupport.users.delete.info' | translate"
      [cancelLabel]="'common.actions.cancel' | translate"
      [confirmLabel]="'common.actions.delete' | translate"
      (confirmed)="confirmDelete()"
    />
  `,
})
export class SoftSupportUsersPage implements OnInit {
  private readonly usersApi = inject(SoftSupportUsersService);
  private readonly session = inject(SoftSupportSessionService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly deleteModal = viewChild<ConfirmationModalComponent>('deleteModal');

  readonly admin = ROLE_ADMINISTRATEUR;
  readonly currentUserId = computed(() => this.session.user()?.userId);

  readonly rows = signal<UserListItem[]>([]);
  readonly options = signal<UserFormOptions | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly search = signal('');
  readonly roleFilter = signal('');
  readonly page = signal(1);
  readonly pageSize = signal<PageSize>(SOFTSUPPORT_DEFAULT_PAGE_SIZE as PageSize);
  readonly formOpen = signal(false);
  readonly edited = signal<UserListItem | null>(null);
  readonly toDelete = signal<UserListItem | null>(null);
  readonly validators = signal<number[]>([]);

  readonly form = inject(FormBuilder).nonNullable.group({
    firstName: ['', Validators.maxLength(100)],
    lastName: ['', Validators.maxLength(100)],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    roleId: ['', Validators.required],
    departementId: ['', Validators.required],
  });

  readonly roleOptions = computed<SelectOption[]>(() => (this.options()?.roles ?? []).map(role => ({ value: String(role.id), label: role.name })));
  readonly departementOptions = computed<SelectOption[]>(() =>
    (this.options()?.departements ?? []).map(item => ({ value: String(item.id), label: item.name })),
  );
  readonly roleFilterOptions = computed<SelectOption[]>(() => [
    { value: '', label: this.translate.instant('softsupport.common.all') },
    ...(this.options()?.roles ?? []).map(role => ({ value: role.name, label: role.name })),
  ]);

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const role = this.roleFilter();
    return this.rows().filter(
      row => (!term || `${this.fullName(row)} ${row.email} ${row.departement ?? ''}`.toLowerCase().includes(term)) && (!role || row.role === role),
    );
  });

  readonly visible = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.usersApi.getFormOptions().subscribe({ next: options => this.options.set(options) });
    this.load();
  }

  fullName(row: UserListItem): string {
    return [row.firstName, row.lastName].filter(Boolean).join(' ');
  }

  departementName(id: number): string {
    return this.options()?.departements.find(item => item.id === id)?.name ?? `#${id}`;
  }

  toggleValidator(id: number): void {
    this.validators.update(ids => (ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]));
  }

  openForm(user: UserListItem | null): void {
    this.edited.set(user);
    this.form.reset({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      roleId: user ? String(user.roleId) : '',
      departementId: user ? String(user.departementId) : '',
    });
    // L'adresse e-mail sert d'identifiant de connexion : elle n'est pas modifiable.
    if (user) {
      this.form.controls.email.disable();
    } else {
      this.form.controls.email.enable();
    }
    this.validators.set(user ? [...user.validatorDepartementIds] : []);
    this.formOpen.set(true);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const payload = {
      firstName: value.firstName.trim() || null,
      lastName: value.lastName.trim() || null,
      email: value.email.trim(),
      roleId: Number(value.roleId),
      departementId: Number(value.departementId),
      validatorDepartementIds: this.validators(),
    };
    const user = this.edited();
    this.saving.set(true);
    (user ? this.usersApi.update(user.userId, payload) : this.usersApi.create(payload)).subscribe({
      next: message => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.toast.success(message, 8000);
        this.load();
      },
      error: error => {
        this.saving.set(false);
        this.toast.error(getApiErrorMessage(error) ?? this.translate.instant('common.errors.generic'));
      },
    });
  }

  askDelete(user: UserListItem): void {
    this.toDelete.set(user);
    this.deleteModal()?.open();
  }

  confirmDelete(): void {
    const user = this.toDelete();
    if (!user) {
      return;
    }
    this.usersApi.delete(user.userId).subscribe({
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
    this.usersApi.getAll().subscribe({
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
