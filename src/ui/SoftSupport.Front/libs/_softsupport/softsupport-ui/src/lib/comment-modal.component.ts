import { ChangeDetectionStrategy, Component, effect, input, output, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { SoftButtonComponent, SoftIconComponent, SoftModalComponent } from '@soft-mfe/shared-components';

/** Demande un commentaire obligatoire avant une action (refus ou suppression d'un article). */
@Component({
  selector: 'softsupport-comment-modal',
  imports: [FormsModule, TranslatePipe, SoftModalComponent, SoftButtonComponent, SoftIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <soft-modal [open]="open()" size="md" (close)="closed.emit()" [ariaLabel]="heading()">
      <div modal-header class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-slate-900">{{ heading() }}</h2>
        <button type="button" class="text-slate-400 hover:text-slate-600" (click)="closed.emit()" [attr.aria-label]="'common.actions.close' | translate">
          <soft-icon name="x" size="md" />
        </button>
      </div>
      <div modal-body>
        <p class="mb-3 text-sm text-slate-600">{{ message() }}</p>
        <label for="ss-comment" class="form-label">{{ 'softsupport.common.comment' | translate }} <span class="text-danger">*</span></label>
        <textarea
          id="ss-comment"
          rows="5"
          class="form-textarea w-full"
          [ngModel]="comment()"
          (ngModelChange)="comment.set($event)"
          [placeholder]="'softsupport.common.commentPlaceholder' | translate"
        ></textarea>
      </div>
      <div modal-footer class="flex justify-end gap-2">
        <soft-button variant="secondary" (onClick)="closed.emit()">{{ 'common.actions.cancel' | translate }}</soft-button>
        <soft-button [variant]="danger() ? 'danger' : 'primary'" [isLoading]="busy()" [disabled]="!comment().trim()" (onClick)="confirmed.emit(comment().trim())">
          {{ confirmLabel() }}
        </soft-button>
      </div>
    </soft-modal>
  `,
})
export class SoftSupportCommentModalComponent {
  readonly open = input(false);
  readonly heading = input.required<string>();
  readonly message = input('');
  readonly confirmLabel = input.required<string>();
  readonly danger = input(false);
  readonly busy = input(false);
  readonly closed = output<void>();
  readonly confirmed = output<string>();

  readonly comment = signal('');

  constructor() {
    effect(() => {
      if (this.open()) {
        untracked(() => this.comment.set(''));
      }
    });
  }
}
