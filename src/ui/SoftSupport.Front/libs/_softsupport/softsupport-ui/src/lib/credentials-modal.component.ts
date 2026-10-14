import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SoftButtonComponent, SoftIconComponent, SoftModalComponent } from '@soft-mfe/shared-components';
import { ToastService } from '@soft-mfe/shared-services';

export interface Credentials {
  email: string;
  password: string;
}

/** Identifiants générés pour un utilisateur client : affichés une seule fois, à copier. */
@Component({
  selector: 'softsupport-credentials-modal',
  imports: [TranslatePipe, SoftModalComponent, SoftButtonComponent, SoftIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <soft-modal [open]="credentials() !== null" size="md" (close)="closed.emit()" [ariaLabel]="'softsupport.customers.credentials.title' | translate">
      <div modal-header class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-slate-900">{{ 'softsupport.customers.credentials.title' | translate }}</h2>
        <button type="button" class="text-slate-400 hover:text-slate-600" (click)="closed.emit()" [attr.aria-label]="'common.actions.close' | translate">
          <soft-icon name="x" size="md" />
        </button>
      </div>
      <div modal-body>
        @if (credentials(); as c) {
          <p class="mb-4 text-sm text-slate-600">{{ 'softsupport.customers.credentials.message' | translate }}</p>
          <dl class="divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
            <div class="flex items-center justify-between gap-3 px-4 py-3">
              <dt class="font-semibold text-slate-500">{{ 'softsupport.customers.fields.email' | translate }}</dt>
              <dd class="truncate text-slate-800">{{ c.email }}</dd>
            </div>
            <div class="flex items-center justify-between gap-3 px-4 py-3">
              <dt class="font-semibold text-slate-500">{{ 'softsupport.customers.credentials.password' | translate }}</dt>
              <dd class="flex items-center gap-2">
                <code class="rounded bg-slate-100 px-2 py-1 font-mono text-sm font-semibold text-slate-900">{{ c.password }}</code>
                <button type="button" class="rounded-md p-1.5 text-slate-500 hover:bg-cyan-50 hover:text-cyan-700" [title]="'softsupport.common.copy' | translate" (click)="copy(c.password)">
                  <soft-icon name="copy" size="sm" />
                </button>
              </dd>
            </div>
          </dl>
        }
      </div>
      <div modal-footer class="flex justify-end">
        <soft-button variant="primary" (onClick)="closed.emit()">{{ 'common.actions.close' | translate }}</soft-button>
      </div>
    </soft-modal>
  `,
})
export class SoftSupportCredentialsModalComponent {
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly credentials = input<Credentials | null>(null);
  readonly closed = output<void>();

  copy(value: string): void {
    void navigator.clipboard
      ?.writeText(value)
      .then(() => this.toast.success(this.translate.instant('softsupport.common.copied')))
      .catch(() => undefined);
  }
}
