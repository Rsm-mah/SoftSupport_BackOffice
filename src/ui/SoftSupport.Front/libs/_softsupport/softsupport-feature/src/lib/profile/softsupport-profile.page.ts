import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SoftBadgeComponent, SoftButtonComponent, SoftIconComponent, SoftInputComponent } from '@soft-mfe/shared-components';
import { getApiErrorMessage, ToastService } from '@soft-mfe/shared-services';
import { UserProfile } from '@softsupport/models';
import { SoftSupportAccountService } from '@softsupport/service';
import { SoftSupportPageHeaderComponent } from '@softsupport/ui';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('newPassword')?.value as string;
  const confirmation = group.get('confirmation')?.value as string;
  return password && password !== confirmation ? { mismatch: true } : null;
}

@Component({
  selector: 'softsupport-profile-page',
  imports: [DatePipe, ReactiveFormsModule, TranslatePipe, SoftButtonComponent, SoftIconComponent, SoftInputComponent, SoftBadgeComponent, SoftSupportPageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-testid="softsupport-profile">
      <softsupport-page-header
        [heading]="'softsupport.profile.title' | translate"
        [subtitle]="'softsupport.profile.subtitle' | translate"
        [breadcrumb]="['softsupport.sidebar.profile' | translate]"
      />

      @if (error()) {
        <p class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</p>
      }

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div class="ss-reveal rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2" style="--delay: 0.15s">
          <div class="flex items-center gap-4">
            <div
              class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
              style="background: linear-gradient(135deg, var(--color-brand-900), var(--color-brand-500))"
            >
              {{ initials() }}
            </div>
            <div class="min-w-0">
              <p class="truncate text-lg font-semibold text-slate-900">{{ profile()?.firstName }} {{ profile()?.lastName }}</p>
              <p class="truncate text-sm text-slate-500">{{ profile()?.email }}</p>
            </div>
          </div>

          <dl class="mt-6 divide-y divide-slate-100 rounded-lg border border-slate-200">
            <div class="grid grid-cols-3 items-center gap-3 px-4 py-2.5 text-sm">
              <dt class="font-semibold text-slate-500">{{ 'softsupport.users.fields.role' | translate }}</dt>
              <dd class="col-span-2">
                @if (profile()?.role) {
                  <soft-badge variant="primary">{{ profile()?.role }}</soft-badge>
                } @else {
                  —
                }
              </dd>
            </div>
            <div class="grid grid-cols-3 gap-3 px-4 py-2.5 text-sm">
              <dt class="font-semibold text-slate-500">{{ 'softsupport.users.fields.departement' | translate }}</dt>
              <dd class="col-span-2 text-slate-800">{{ profile()?.departement || '—' }}</dd>
            </div>
            <div class="grid grid-cols-3 gap-3 px-4 py-2.5 text-sm">
              <dt class="font-semibold text-slate-500">{{ 'softsupport.users.fields.validator' | translate }}</dt>
              <dd class="col-span-2 flex flex-wrap gap-1">
                @for (name of profile()?.validatorDepartements ?? []; track name) {
                  <span class="rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-700">{{ name }}</span>
                } @empty {
                  <span class="text-slate-400">—</span>
                }
              </dd>
            </div>
            <div class="grid grid-cols-3 gap-3 px-4 py-2.5 text-sm">
              <dt class="font-semibold text-slate-500">{{ 'softsupport.users.columns.createdAt' | translate }}</dt>
              <dd class="col-span-2 text-slate-800">{{ profile()?.dateCreated | date: 'dd/MM/yyyy' }}</dd>
            </div>
          </dl>
        </div>

        <div class="ss-reveal rounded-xl border border-slate-200 bg-white p-6 lg:col-span-3" style="--delay: 0.25s">
          <div class="mb-5 flex items-center gap-2">
            <soft-icon name="lock" size="md" class="text-slate-400" />
            <h2 class="text-lg font-bold text-slate-800">{{ 'softsupport.profile.security' | translate }}</h2>
          </div>

          <form class="space-y-4" [formGroup]="form" (ngSubmit)="submit()">
            <soft-input
              type="password"
              autocomplete="current-password"
              [label]="'softsupport.profile.currentPassword' | translate"
              [required]="true"
              formControlName="currentPassword"
            />
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <soft-input
                type="password"
                autocomplete="new-password"
                [label]="'softsupport.profile.newPassword' | translate"
                [hint]="'softsupport.profile.newPasswordHint' | translate"
                [required]="true"
                formControlName="newPassword"
                [error]="form.controls.newPassword.invalid && form.controls.newPassword.touched ? ('softsupport.profile.passwordTooShort' | translate) : ''"
              />
              <soft-input
                type="password"
                autocomplete="new-password"
                [label]="'softsupport.profile.confirmPassword' | translate"
                [required]="true"
                formControlName="confirmation"
                [error]="form.hasError('mismatch') && form.controls.confirmation.touched ? ('softsupport.profile.passwordMismatch' | translate) : ''"
              />
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <soft-button variant="secondary" (onClick)="form.reset()">{{ 'common.actions.cancel' | translate }}</soft-button>
              <soft-button type="submit" variant="primary" [isLoading]="saving()" [disabled]="form.invalid">
                {{ 'common.actions.save' | translate }}
              </soft-button>
            </div>
          </form>
        </div>
      </div>
    </section>
  `,
})
export class SoftSupportProfilePage implements OnInit {
  private readonly account = inject(SoftSupportAccountService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly profile = signal<UserProfile | null>(null);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);

  readonly form = inject(FormBuilder).nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(100)]],
      confirmation: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  ngOnInit(): void {
    this.account.getMe().subscribe({
      next: profile => this.profile.set(profile),
      error: error => this.error.set(getApiErrorMessage(error) ?? this.translate.instant('common.errors.generic')),
    });
  }

  initials(): string {
    const profile = this.profile();
    return (
      [profile?.firstName, profile?.lastName]
        .filter((part): part is string => !!part)
        .map(part => part.trim().charAt(0).toUpperCase())
        .join('')
        .slice(0, 2) || 'SS'
    );
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.account.changePassword({ currentPassword: value.currentPassword, newPassword: value.newPassword }).subscribe({
      next: message => {
        this.saving.set(false);
        this.toast.success(message);
        this.form.reset();
      },
      error: error => {
        this.saving.set(false);
        this.toast.error(getApiErrorMessage(error) ?? this.translate.instant('common.errors.generic'));
      },
    });
  }
}
