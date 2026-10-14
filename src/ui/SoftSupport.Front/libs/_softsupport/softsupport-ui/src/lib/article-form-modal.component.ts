import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  SoftButtonComponent,
  SoftIconComponent,
  SoftInputComponent,
  SoftModalComponent,
  SoftSelectComponent,
  SoftToggleComponent,
} from '@soft-mfe/shared-components';
import { SelectOption } from '@soft-mfe/shared-models';
import { getApiErrorMessage, ToastService } from '@soft-mfe/shared-services';
import { ArticleReferences, EditableArticle, isClient, isInterne, SaveArticlePayload } from '@softsupport/models';
import { SoftSupportArticleService, SoftSupportValidationService } from '@softsupport/service';
import { Observable } from 'rxjs';
import { SoftSupportArticleCodeComponent } from './softsupport-badges.component';
import { SoftSupportCommentModalComponent } from './comment-modal.component';
import { SoftSupportRichEditorComponent } from './softsupport-rich-editor.component';

export type ArticleFormMode = 'author' | 'validation';

type CommentAction = 'deny' | 'remove';

@Component({
  selector: 'softsupport-article-form-modal',
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    SoftModalComponent,
    SoftButtonComponent,
    SoftIconComponent,
    SoftInputComponent,
    SoftSelectComponent,
    SoftToggleComponent,
    SoftSupportRichEditorComponent,
    SoftSupportArticleCodeComponent,
    SoftSupportCommentModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <soft-modal [open]="open()" size="2xl" [closeOnBackdrop]="false" (close)="closed.emit()" [ariaLabel]="title() | translate">
      <div modal-header class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <h2 class="text-lg font-semibold text-slate-900">{{ title() | translate }}</h2>
          @if (article(); as a) {
            <p class="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <softsupport-article-code [code]="a.code" />
              @if (a.authorName) {
                <span>· {{ 'softsupport.articles.detail.author' | translate }} : {{ a.authorName }}</span>
              }
            </p>
          } @else {
            <p class="mt-0.5 text-sm text-slate-500">{{ 'softsupport.articles.form.subtitle' | translate }}</p>
          }
        </div>
        <button type="button" class="shrink-0 text-slate-400 hover:text-slate-600" (click)="closed.emit()" [attr.aria-label]="'common.actions.close' | translate">
          <soft-icon name="x" size="md" />
        </button>
      </div>

      <div modal-body>
        @if (loading()) {
          <p class="py-10 text-center text-sm text-slate-500">{{ 'common.loading' | translate }}</p>
        } @else {
          @if (article()?.comment && !article()?.isEnabled) {
            <div class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p class="font-semibold">{{ 'softsupport.articles.form.refusedComment' | translate }}</p>
              <p class="mt-1 whitespace-pre-wrap">{{ article()?.comment }}</p>
            </div>
          }

          <form class="space-y-4" [formGroup]="form" (ngSubmit)="submit()">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div class="md:col-span-3">
                <soft-select
                  [label]="'softsupport.articles.fields.product' | translate"
                  [placeholder]="'softsupport.articles.form.productPlaceholder' | translate"
                  [options]="productOptions()"
                  [searchable]="true"
                  [required]="true"
                  formControlName="productId"
                  [error]="form.controls.productId.invalid && form.controls.productId.touched ? ('softsupport.articles.form.productRequired' | translate) : ''"
                />
              </div>
              <soft-select
                [label]="'softsupport.articles.fields.version' | translate"
                [placeholder]="'softsupport.common.none' | translate"
                [options]="versionOptions()"
                [searchable]="true"
                formControlName="versionId"
              />
              <soft-select
                [label]="'softsupport.articles.fields.theme' | translate"
                [placeholder]="'softsupport.common.none' | translate"
                [options]="themeOptions()"
                [searchable]="true"
                formControlName="themeId"
              />
              <div class="grid grid-cols-2 gap-3">
                <soft-input [label]="'softsupport.articles.fields.ticketNumber' | translate" formControlName="ticketNumber" />
                <soft-input [label]="'softsupport.articles.fields.requestNumber' | translate" formControlName="requestNumber" />
              </div>
            </div>

            <soft-input
              [label]="'softsupport.articles.fields.title' | translate"
              [placeholder]="'softsupport.articles.form.titlePlaceholder' | translate"
              [required]="true"
              formControlName="title"
              [hint]="designation() ? ('softsupport.articles.form.designation' | translate: { value: designation() }) : ''"
              [error]="form.controls.title.invalid && form.controls.title.touched ? ('softsupport.articles.form.titleRequired' | translate) : ''"
            />

            <div>
              <p class="form-label">{{ 'softsupport.articles.fields.problem' | translate }} <span class="text-danger">*</span></p>
              <softsupport-rich-editor
                formControlName="problem"
                [label]="'softsupport.articles.fields.problem' | translate"
                [placeholder]="'softsupport.articles.form.problemPlaceholder' | translate"
                [invalid]="form.controls.problem.invalid && form.controls.problem.touched"
              />
            </div>
            <div>
              <p class="form-label">{{ 'softsupport.articles.fields.solution' | translate }} <span class="text-danger">*</span></p>
              <softsupport-rich-editor
                formControlName="solution"
                [label]="'softsupport.articles.fields.solution' | translate"
                [placeholder]="'softsupport.articles.form.solutionPlaceholder' | translate"
                [invalid]="form.controls.solution.invalid && form.controls.solution.touched"
              />
            </div>

            @if (mode() === 'validation') {
              <div class="flex flex-wrap items-center gap-6 rounded-xl border border-cyan-100 bg-cyan-50/60 px-4 py-3 text-sm">
                <span class="font-semibold text-slate-700">{{ 'softsupport.articles.columns.diffusion' | translate }}</span>
                <label class="flex items-center gap-2">
                  <soft-toggle activeColor="#0e7490" [checked]="interne()" (checkedChange)="setInterne($event)" [ariaLabel]="'softsupport.articles.options.interne' | translate" />
                  {{ 'softsupport.articles.options.interne' | translate }}
                </label>
                <label class="flex items-center gap-2">
                  <soft-toggle activeColor="#0e7490" [checked]="client()" (checkedChange)="setClient($event)" [ariaLabel]="'softsupport.articles.options.client' | translate" />
                  {{ 'softsupport.articles.options.client' | translate }}
                </label>
              </div>
            }
          </form>
        }
      </div>

      <div modal-footer class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex gap-2">
          @if (mode() === 'validation') {
            <soft-button variant="danger" [disabled]="saving()" (onClick)="commentAction.set('remove')">
              <soft-icon name="trash" size="sm" class="mr-1.5" />{{ 'common.actions.delete' | translate }}
            </soft-button>
            <soft-button variant="accent" [disabled]="saving()" (onClick)="commentAction.set('deny')">
              <soft-icon name="x-circle" size="sm" class="mr-1.5" />{{ 'softsupport.validation.deny' | translate }}
            </soft-button>
          }
        </div>
        <div class="flex gap-2">
          <soft-button variant="secondary" (onClick)="closed.emit()">{{ 'common.actions.cancel' | translate }}</soft-button>
          <soft-button variant="primary" [isLoading]="saving()" [disabled]="loading()" (onClick)="submit()">
            @if (mode() === 'validation') {
              <soft-icon name="check" size="sm" class="mr-1.5" />{{ 'common.actions.validate' | translate }}
            } @else {
              {{ (articleId() ? (article()?.isEnabled === false ? 'softsupport.articles.form.resubmit' : 'common.actions.update') : 'common.actions.create') | translate }}
            }
          </soft-button>
        </div>
      </div>
    </soft-modal>

    <softsupport-comment-modal
      [open]="commentAction() !== null"
      [heading]="(commentAction() === 'remove' ? 'softsupport.validation.removeTitle' : 'softsupport.validation.denyTitle') | translate"
      [message]="(commentAction() === 'remove' ? 'softsupport.validation.removeMessage' : 'softsupport.validation.denyMessage') | translate"
      [confirmLabel]="(commentAction() === 'remove' ? 'common.actions.delete' : 'softsupport.validation.deny') | translate"
      [danger]="commentAction() === 'remove'"
      [busy]="saving()"
      (closed)="commentAction.set(null)"
      (confirmed)="runCommentAction($event)"
    />
  `,
})
export class SoftSupportArticleFormModalComponent {
  private readonly articlesApi = inject(SoftSupportArticleService);
  private readonly validationApi = inject(SoftSupportValidationService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly open = input(false);
  readonly articleId = input<number | null>(null);
  readonly mode = input<ArticleFormMode>('author');
  readonly closed = output<void>();
  readonly saved = output<void>();

  readonly form = inject(FormBuilder).nonNullable.group({
    productId: ['', Validators.required],
    versionId: [''],
    themeId: [''],
    ticketNumber: ['', Validators.maxLength(100)],
    requestNumber: ['', Validators.maxLength(100)],
    title: ['', [Validators.required, Validators.maxLength(500)]],
    problem: ['', Validators.required],
    solution: ['', Validators.required],
  });

  readonly references = signal<ArticleReferences | null>(null);
  readonly article = signal<EditableArticle | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly interne = signal(true);
  readonly client = signal(false);
  readonly commentAction = signal<CommentAction | null>(null);

  private readonly values = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  readonly title = computed(() =>
    this.mode() === 'validation'
      ? 'softsupport.validation.formTitle'
      : this.articleId()
        ? 'softsupport.articles.form.editTitle'
        : 'softsupport.articles.form.createTitle',
  );

  readonly productOptions = computed<SelectOption[]>(() => {
    const current = this.article()?.productId;
    return (this.references()?.products ?? [])
      .filter(product => this.mode() === 'validation' || !!product.categoryCode || product.id === current)
      .map(product => ({ value: String(product.id), label: product.categoryCode ? `${product.name} (${product.categoryCode})` : product.name }));
  });

  readonly versionOptions = computed<SelectOption[]>(() =>
    (this.references()?.versions ?? []).map(item => ({ value: String(item.id), label: item.name })),
  );

  readonly themeOptions = computed<SelectOption[]>(() =>
    (this.references()?.themes ?? []).map(item => ({ value: String(item.id), label: item.name })),
  );

  readonly designation = computed(() => {
    const value = this.values();
    const references = this.references();
    const product = references?.products.find(item => String(item.id) === value.productId)?.name;
    const version = references?.versions.find(item => String(item.id) === value.versionId)?.name;
    const head = [product, version].filter(Boolean).join(' ');
    const title = (value.title ?? '').trim();
    return head && title ? `${head} - ${title}` : '';
  });

  constructor() {
    effect(() => {
      if (this.open()) {
        const id = this.articleId();
        untracked(() => this.load(id));
      }
    });
  }

  setInterne(value: boolean): void {
    this.interne.set(value || this.client());
  }

  setClient(value: boolean): void {
    this.client.set(value);
    if (value) {
      this.interne.set(true);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning(this.translate.instant('softsupport.articles.form.incomplete'));
      return;
    }

    const payload = this.payload();
    const id = this.articleId();
    let request: Observable<string>;
    if (this.mode() === 'validation' && id) {
      request = this.validationApi.validate(id, { ...payload, interne: this.interne(), client: this.client() });
    } else {
      request = id ? this.articlesApi.update(id, payload) : this.articlesApi.create(payload);
    }
    this.execute(request);
  }

  runCommentAction(comment: string): void {
    const id = this.articleId();
    const action = this.commentAction();
    if (!id || !action) {
      return;
    }
    this.execute(action === 'remove' ? this.validationApi.remove(id, comment) : this.validationApi.deny(id, comment), () =>
      this.commentAction.set(null),
    );
  }

  private execute(request: Observable<string>, onSuccess?: () => void): void {
    this.saving.set(true);
    request.subscribe({
      next: message => {
        this.saving.set(false);
        onSuccess?.();
        this.toast.success(message);
        this.saved.emit();
      },
      error: error => {
        this.saving.set(false);
        this.toast.error(getApiErrorMessage(error) ?? this.translate.instant('common.errors.generic'));
      },
    });
  }

  private payload(): SaveArticlePayload {
    const value = this.form.getRawValue();
    const toId = (text: string) => (text ? Number(text) : null);
    const clean = (text: string) => text.trim() || null;
    return {
      title: value.title.trim(),
      problem: value.problem,
      solution: value.solution,
      productId: toId(value.productId),
      versionId: toId(value.versionId),
      themeId: toId(value.themeId),
      ticketNumber: clean(value.ticketNumber),
      requestNumber: clean(value.requestNumber),
    };
  }

  private load(articleId: number | null): void {
    this.form.reset();
    this.article.set(null);
    this.interne.set(true);
    this.client.set(false);
    this.articlesApi.getReferences().subscribe({ next: references => this.references.set(references) });
    if (!articleId) {
      return;
    }

    this.loading.set(true);
    const source = this.mode() === 'validation' ? this.validationApi.get(articleId) : this.articlesApi.getEditable(articleId);
    source.subscribe({
      next: article => {
        this.article.set(article);
        this.form.reset({
          productId: article.productId ? String(article.productId) : '',
          versionId: article.versionId ? String(article.versionId) : '',
          themeId: article.themeId ? String(article.themeId) : '',
          ticketNumber: article.ticketNumber ?? '',
          requestNumber: article.requestNumber ?? '',
          title: article.title,
          problem: article.problem,
          solution: article.solution,
        });
        // Un article en attente est proposé au moins en interne, comme dans BDC.
        this.interne.set(isInterne(article.options) || !article.isValidated);
        this.client.set(isClient(article.options));
        this.loading.set(false);
      },
      error: error => {
        this.loading.set(false);
        this.toast.error(getApiErrorMessage(error) ?? this.translate.instant('common.errors.generic'));
        this.closed.emit();
      },
    });
  }
}
