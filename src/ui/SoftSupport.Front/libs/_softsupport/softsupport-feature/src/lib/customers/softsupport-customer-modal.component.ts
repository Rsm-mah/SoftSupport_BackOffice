import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SoftButtonComponent, SoftIconComponent, SoftInputComponent, SoftModalComponent, SoftToggleComponent } from '@soft-mfe/shared-components';
import { getApiErrorMessage, ToastService } from '@soft-mfe/shared-services';
import { CustomerItem } from '@softsupport/models';
import { SoftSupportCompanyService } from '@softsupport/service';
import { Credentials } from '@softsupport/ui';

/** Utilisateur du portail client : création (mot de passe généré) ou modification (réinitialisation possible). */
@Component({
  selector: 'softsupport-customer-modal',
  imports: [ReactiveFormsModule, TranslatePipe, SoftModalComponent, SoftButtonComponent, SoftIconComponent, SoftInputComponent, SoftToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <soft-modal [open]="open()" size="lg" (close)="closed.emit()" [ariaLabel]="'softsupport.customers.createTitle' | translate">
      <div modal-header class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-slate-900">{{ (customer() ? 'softsupport.customers.editTitle' : 'softsupport.customers.createTitle') | translate }}</h2>
        <button type="button" class="text-slate-400 hover:text-slate-600" (click)="closed.emit()" [attr.aria-label]="'common.actions.close' | translate"><soft-icon name="x" size="md" /></button>
      </div>
      <div modal-body>
        <form class="space-y-4" [formGroup]="form" (ngSubmit)="save()">
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <soft-input [label]="'softsupport.customers.fields.firstName' | translate" [required]="true" formControlName="firstName" />
            <soft-input [label]="'softsupport.customers.fields.lastName' | translate" [required]="true" formControlName="lastName" />
          </div>
          <soft-input
            type="email"
            [label]="'softsupport.customers.fields.email' | translate"
            [required]="true"
            formControlName="email"
            [error]="form.controls.email.invalid && form.controls.email.touched ? ('softsupport.common.emailInvalid' | translate) : ''"
          />
          <soft-input [label]="'softsupport.customers.fields.function' | translate" formControlName="function" />

          <div class="space-y-3 rounded-xl border border-slate-200 p-4 text-sm">
            <label class="flex items-center justify-between gap-3">
              <span>
                <span class="font-medium text-slate-800">{{ 'softsupport.customers.fields.isAdmin' | translate }}</span>
                <span class="block text-xs text-slate-500">{{ 'softsupport.customers.isAdminHint' | translate }}</span>
              </span>
              <soft-toggle activeColor="#0e7490" formControlName="isAdmin" [ariaLabel]="'softsupport.customers.fields.isAdmin' | translate" />
            </label>
            @if (customer()) {
              <label class="flex items-center justify-between gap-3">
                <span>
                  <span class="font-medium text-slate-800">{{ 'softsupport.customers.resetPassword' | translate }}</span>
                  <span class="block text-xs text-slate-500">{{ 'softsupport.customers.resetPasswordHint' | translate }}</span>
                </span>
                <soft-toggle activeColor="#0e7490" formControlName="resetPassword" [ariaLabel]="'softsupport.customers.resetPassword' | translate" />
              </label>
            }
            @if (!customer() || form.controls.resetPassword.value) {
              <label class="flex items-center justify-between gap-3">
                <span>
                  <span class="font-medium text-slate-800">{{ 'softsupport.customers.sendCredentials' | translate }}</span>
                  <span class="block text-xs text-slate-500">{{ 'softsupport.customers.sendCredentialsHint' | translate }}</span>
                </span>
                <soft-toggle activeColor="#0e7490" formControlName="sendCredentials" [ariaLabel]="'softsupport.customers.sendCredentials' | translate" />
              </label>
            }
          </div>
        </form>
      </div>
      <div modal-footer class="flex justify-end gap-2">
        <soft-button variant="secondary" (onClick)="closed.emit()">{{ 'common.actions.cancel' | translate }}</soft-button>
        <soft-button variant="primary" [isLoading]="saving()" [disabled]="form.invalid" (onClick)="save()">{{ (customer() ? 'common.actions.update' : 'common.actions.create') | translate }}</soft-button>
      </div>
    </soft-modal>
  `,
})
export class SoftSupportCustomerModalComponent {
  private readonly companiesApi = inject(SoftSupportCompanyService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly open = input(false);
  readonly companyId = input.required<number>();
  readonly customer = input<CustomerItem | null>(null);
  readonly closed = output<void>();
  /** Émis après enregistrement ; porte les identifiants quand un mot de passe vient d'être généré. */
  readonly saved = output<Credentials | null>();

  readonly saving = signal(false);

  readonly form = inject(FormBuilder).nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    function: ['', Validators.maxLength(100)],
    isAdmin: [false],
    resetPassword: [false],
    sendCredentials: [true],
  });

  constructor() {
    effect(() => {
      if (this.open()) {
        untracked(() => {
          const customer = this.customer();
          this.form.reset({
            firstName: customer?.firstName ?? '',
            lastName: customer?.lastName ?? '',
            email: customer?.email ?? '',
            function: customer?.function ?? '',
            isAdmin: customer?.isAdmin ?? false,
            resetPassword: false,
            sendCredentials: true,
          });
        });
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const customer = this.customer();
    const payload = {
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      email: value.email.trim(),
      function: value.function.trim() || null,
      isAdmin: value.isAdmin,
      resetPassword: !!customer && value.resetPassword,
      sendCredentials: value.sendCredentials,
    };
    this.saving.set(true);
    (customer ? this.companiesApi.updateCustomer(customer.customerId, payload) : this.companiesApi.addCustomer(this.companyId(), payload)).subscribe({
      next: response => {
        this.saving.set(false);
        this.toast.success(response.message, 8000);
        this.saved.emit(response.data.password ? { email: payload.email, password: response.data.password } : null);
      },
      error: error => {
        this.saving.set(false);
        this.toast.error(getApiErrorMessage(error) ?? this.translate.instant('common.errors.generic'));
      },
    });
  }
}
