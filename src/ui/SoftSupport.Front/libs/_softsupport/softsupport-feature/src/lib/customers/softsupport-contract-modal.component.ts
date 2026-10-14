import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SoftButtonComponent, SoftIconComponent, SoftInputComponent, SoftModalComponent, SoftSelectComponent } from '@soft-mfe/shared-components';
import { SelectOption } from '@soft-mfe/shared-models';
import { getApiErrorMessage, ToastService } from '@soft-mfe/shared-services';
import { ContractLine, LookupItem, toDateInput } from '@softsupport/models';
import { SoftSupportCompanyService } from '@softsupport/service';
import { Observable } from 'rxjs';

/** `add` : nouveau contrat (3 mois minimum) ; `edit` : correction d'une période ; `renew` : période suivante. */
export type ContractModalMode = 'add' | 'edit' | 'renew';

export interface ContractModalRequest {
  mode: ContractModalMode;
  contract: ContractLine | null;
}

@Component({
  selector: 'softsupport-contract-modal',
  imports: [ReactiveFormsModule, TranslatePipe, SoftModalComponent, SoftButtonComponent, SoftIconComponent, SoftInputComponent, SoftSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <soft-modal [open]="request() !== null" size="md" (close)="closed.emit()" [ariaLabel]="title() | translate">
      <div modal-header class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">{{ title() | translate }}</h2>
          <p class="mt-0.5 text-sm text-slate-500">{{ hint() | translate }}</p>
        </div>
        <button type="button" class="text-slate-400 hover:text-slate-600" (click)="closed.emit()" [attr.aria-label]="'common.actions.close' | translate"><soft-icon name="x" size="md" /></button>
      </div>
      <div modal-body>
        <form class="space-y-4" [formGroup]="form" (ngSubmit)="save()">
          @if (request()?.mode === 'renew') {
            <p class="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <span class="font-semibold">{{ request()?.contract?.productName }}</span>
            </p>
          } @else {
            <soft-select
              [label]="'softsupport.articles.fields.product' | translate"
              [placeholder]="'softsupport.articles.form.productPlaceholder' | translate"
              [options]="productOptions()"
              [searchable]="true"
              [required]="true"
              formControlName="productId"
            />
          }
          <div class="grid grid-cols-2 gap-3">
            <soft-input type="date" [label]="'softsupport.contracts.fields.start' | translate" [required]="true" formControlName="startDate" />
            <soft-input type="date" [label]="'softsupport.contracts.fields.end' | translate" [required]="true" formControlName="endDate" />
          </div>
        </form>
      </div>
      <div modal-footer class="flex justify-end gap-2">
        <soft-button variant="secondary" (onClick)="closed.emit()">{{ 'common.actions.cancel' | translate }}</soft-button>
        <soft-button variant="primary" [isLoading]="saving()" [disabled]="form.invalid" (onClick)="save()">{{ 'common.actions.save' | translate }}</soft-button>
      </div>
    </soft-modal>
  `,
})
export class SoftSupportContractModalComponent {
  private readonly companiesApi = inject(SoftSupportCompanyService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly companyId = input.required<number>();
  readonly products = input<LookupItem[]>([]);
  readonly request = input<ContractModalRequest | null>(null);
  readonly closed = output<void>();
  readonly saved = output<void>();

  readonly saving = signal(false);

  readonly form = inject(FormBuilder).nonNullable.group({
    productId: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
  });

  readonly title = computed(() => `softsupport.contracts.${this.request()?.mode ?? 'add'}Title`);
  readonly hint = computed(() => `softsupport.contracts.${this.request()?.mode ?? 'add'}Hint`);

  readonly productOptions = computed<SelectOption[]>(() => {
    const options = this.products().map(product => ({ value: String(product.id), label: product.name }));
    const contract = this.request()?.contract;
    if (contract && !options.some(option => option.value === String(contract.productId))) {
      options.unshift({ value: String(contract.productId), label: contract.productName });
    }
    return options;
  });

  constructor() {
    effect(() => {
      const request = this.request();
      if (!request) {
        return;
      }
      untracked(() => {
        const contract = request.contract;
        if (request.mode === 'renew' && contract) {
          // La période proposée commence le lendemain de l'échéance et dure un an.
          const start = new Date(contract.endDate);
          start.setDate(start.getDate() + 1);
          const end = new Date(start);
          end.setFullYear(end.getFullYear() + 1);
          end.setDate(end.getDate() - 1);
          this.form.reset({ productId: String(contract.productId), startDate: this.iso(start), endDate: this.iso(end) });
        } else {
          this.form.reset({
            productId: contract ? String(contract.productId) : '',
            startDate: toDateInput(contract?.startDate),
            endDate: toDateInput(contract?.endDate),
          });
        }
      });
    });
  }

  save(): void {
    const request = this.request();
    if (!request || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    if (value.endDate <= value.startDate) {
      this.toast.warning(this.translate.instant('softsupport.contracts.endAfterStart'));
      return;
    }
    const payload = { productId: Number(value.productId), startDate: value.startDate, endDate: value.endDate };
    let call: Observable<string>;
    if (request.mode === 'edit' && request.contract) {
      call = this.companiesApi.updateContract(request.contract.contractId, payload);
    } else if (request.mode === 'renew') {
      call = this.companiesApi.renewContract(this.companyId(), payload);
    } else {
      call = this.companiesApi.addContract(this.companyId(), payload);
    }

    this.saving.set(true);
    call.subscribe({
      next: message => {
        this.saving.set(false);
        this.toast.success(message);
        this.saved.emit();
      },
      error: error => {
        this.saving.set(false);
        this.toast.error(getApiErrorMessage(error) ?? this.translate.instant('common.errors.generic'));
      },
    });
  }

  private iso(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }
}
