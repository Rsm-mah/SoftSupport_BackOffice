import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { SoftButtonComponent, SoftIconComponent, SoftModalComponent } from '@soft-mfe/shared-components';
import { COMMENT_REPLY_MAX_LENGTH, CommentListItem } from '@softsupport/models';

@Component({
  selector: 'softsupport-comment-reply-modal',
  imports: [DatePipe, FormsModule, TranslatePipe, SoftModalComponent, SoftButtonComponent, SoftIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <soft-modal [open]="!!comment()" size="lg" (close)="closed.emit()" [ariaLabel]="'softsupport.comments.reply.title' | translate">
      <div modal-header class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-slate-900">{{ 'softsupport.comments.reply.title' | translate }}</h2>
        <button type="button" class="text-slate-400 hover:text-slate-600" (click)="closed.emit()" [attr.aria-label]="'common.actions.close' | translate">
          <soft-icon name="x" size="md" />
        </button>
      </div>
      <div modal-body>
        @if (comment(); as c) {
          <div class="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <div class="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
              <span class="font-semibold text-slate-800">{{ c.customerName || c.customerEmail }}</span>
              @if (c.companyName) {
                <span>· {{ c.companyName }}</span>
              }
              <span>· {{ c.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <p class="mt-1 text-xs text-slate-500">{{ c.articleCode ?? '—' }} — {{ c.articleTitle }}</p>
            <p class="mt-2 whitespace-pre-line text-slate-800">{{ c.description }}</p>
          </div>

          <p class="mt-4 text-xs text-slate-500">
            <soft-icon name="mail" size="xs" class="mr-1 inline-block align-[-2px]" />{{ 'softsupport.comments.reply.recipient' | translate: { email: c.customerEmail } }}
          </p>
          <label for="ss-comment-reply" class="form-label mt-2">{{ 'softsupport.comments.reply.message' | translate }} <span class="text-danger">*</span></label>
          <textarea
            id="ss-comment-reply"
            rows="7"
            class="form-textarea w-full"
            [maxlength]="maxLength"
            [ngModel]="message()"
            (ngModelChange)="message.set($event)"
            [placeholder]="'softsupport.comments.reply.placeholder' | translate"
          ></textarea>
          <p class="mt-1 text-right text-xs text-slate-400">{{ message().length }} / {{ maxLength }}</p>
        }
      </div>
      <div modal-footer class="flex justify-end gap-2">
        <soft-button variant="secondary" (onClick)="closed.emit()">{{ 'common.actions.cancel' | translate }}</soft-button>
        <soft-button variant="primary" [isLoading]="busy()" [disabled]="!canSend()" (onClick)="send.emit(message().trim())">
          <soft-icon name="send" size="sm" class="mr-1.5" />{{ 'softsupport.comments.reply.send' | translate }}
        </soft-button>
      </div>
    </soft-modal>
  `,
})
export class SoftSupportCommentReplyModalComponent {
  readonly comment = input<CommentListItem | null>(null);
  readonly busy = input(false);
  readonly closed = output<void>();
  readonly send = output<string>();

  readonly maxLength = COMMENT_REPLY_MAX_LENGTH;
  readonly message = signal('');
  readonly canSend = computed(() => {
    const text = this.message().trim();
    return text.length > 0 && text.length <= this.maxLength;
  });

  constructor() {
    effect(() => {
      if (this.comment()) {
        untracked(() => this.message.set(''));
      }
    });
  }
}
