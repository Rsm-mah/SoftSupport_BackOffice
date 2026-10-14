import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SoftButtonComponent, SoftIconComponent, SoftInputComponent, SoftModalComponent, SoftSelectComponent } from '@soft-mfe/shared-components';
import { SelectOption } from '@soft-mfe/shared-models';
import { getApiErrorMessage, mapBlobHttpError, ToastService } from '@soft-mfe/shared-services';
import { LookupItem } from '@softsupport/models';
import { SoftSupportArticleService, SoftSupportUsersService } from '@softsupport/service';

@Component({
  selector: 'softsupport-export-modal',
  imports: [ReactiveFormsModule, TranslatePipe, SoftModalComponent, SoftButtonComponent, SoftIconComponent, SoftInputComponent, SoftSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <soft-modal [open]="open()" size="md" (close)="closed.emit()" [ariaLabel]="'softsupport.export.title' | translate">
      <div modal-header class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">{{ 'softsupport.export.title' | translate }}</h2>
          <p class="mt-0.5 text-sm text-slate-500">{{ 'softsupport.export.subtitle' | translate }}</p>
        </div>
        <button type="button" class="text-slate-400 hover:text-slate-600" (click)="closed.emit()" [attr.aria-label]="'common.actions.close' | translate">
          <soft-icon name="x" size="md" />
        </button>
      </div>
      <div modal-body>
        <form class="space-y-4" [formGroup]="form" (ngSubmit)="download()">
          <div class="grid grid-cols-2 gap-3">
            <soft-input type="date" [label]="'softsupport.export.from' | translate" [required]="true" formControlName="from" />
            <soft-input type="date" [label]="'softsupport.export.to' | translate" [required]="true" formControlName="to" />
          </div>
          <soft-select
            [label]="'softsupport.users.fields.departement' | translate"
            [placeholder]="'softsupport.export.departementPlaceholder' | translate"
            [options]="departementOptions()"
            [required]="true"
            formControlName="departementId"
          />
        </form>
      </div>
      <div modal-footer class="flex justify-end gap-2">
        <soft-button variant="secondary" (onClick)="closed.emit()">{{ 'common.actions.cancel' | translate }}</soft-button>
        <soft-button variant="primary" [isLoading]="busy()" [disabled]="form.invalid" (onClick)="download()">
          <soft-icon name="download" size="sm" class="mr-1.5" />{{ 'softsupport.export.download' | translate }}
        </soft-button>
      </div>
    </soft-modal>
  `,
})
export class SoftSupportExportModalComponent {
  private readonly articlesApi = inject(SoftSupportArticleService);
  private readonly usersApi = inject(SoftSupportUsersService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly open = input(false);
  readonly closed = output<void>();

  readonly departements = signal<LookupItem[]>([]);
  readonly busy = signal(false);

  readonly departementOptions = computed<SelectOption[]>(() =>
    this.departements().slice(1).map(item => ({ value: String(item.id), label: item.name })),
  );

  readonly form = inject(FormBuilder).nonNullable.group({
    from: [this.firstDayOfMonth(), Validators.required],
    to: [new Date().toISOString().substring(0, 10), Validators.required],
    departementId: ['', Validators.required],
  });

  constructor() {
    effect(() => {
      if (this.open() && this.departements().length === 0) {
        untracked(() => this.usersApi.getFormOptions().subscribe({ next: options => this.departements.set(options.departements) }));
      }
    });
  }

  download(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { from, to, departementId } = this.form.getRawValue();
    this.busy.set(true);
    this.articlesApi
      .export(from, to, Number(departementId))
      .pipe(mapBlobHttpError)
      .subscribe({
        next: blob => {
          this.busy.set(false);
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `EtatArticles_${from}_${to}.csv`;
          link.click();
          URL.revokeObjectURL(url);
          this.closed.emit();
        },
        error: error => {
          this.busy.set(false);
          this.toast.error(getApiErrorMessage(error) ?? this.translate.instant('common.errors.generic'));
        },
      });
  }

  private firstDayOfMonth(): string {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString().substring(0, 10);
  }
}
