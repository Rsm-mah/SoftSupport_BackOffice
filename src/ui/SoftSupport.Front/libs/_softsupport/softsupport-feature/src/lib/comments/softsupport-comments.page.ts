import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  ConfirmationModalComponent,
  DataTableEmptyStateComponent,
  SoftBadgeComponent,
  SoftButtonComponent,
  SoftIconComponent,
  SoftInputComponent,
} from '@soft-mfe/shared-components';
import { PageSize } from '@soft-mfe/shared-models';
import { getApiErrorMessage, ToastService } from '@soft-mfe/shared-services';
import { CommentListItem, CommentStatus, SOFTSUPPORT_DEFAULT_PAGE_SIZE } from '@softsupport/models';
import { SoftSupportCommentInboxStore, SoftSupportCommentService } from '@softsupport/service';
import {
  SoftSupportArticleDetailModalComponent,
  SoftSupportCommentReplyModalComponent,
  SoftSupportListPaginationComponent,
  SoftSupportPageHeaderComponent,
} from '@softsupport/ui';

type CommentTab = CommentStatus | 'all';

@Component({
  selector: 'softsupport-comments-page',
  imports: [
    DatePipe,
    TranslatePipe,
    ConfirmationModalComponent,
    DataTableEmptyStateComponent,
    SoftBadgeComponent,
    SoftButtonComponent,
    SoftIconComponent,
    SoftInputComponent,
    SoftSupportArticleDetailModalComponent,
    SoftSupportCommentReplyModalComponent,
    SoftSupportListPaginationComponent,
    SoftSupportPageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-testid="softsupport-comments">
      <softsupport-page-header
        [heading]="'softsupport.comments.title' | translate"
        [subtitle]="'softsupport.comments.subtitle' | translate"
        [breadcrumb]="['softsupport.sidebar.comments' | translate]"
      />

      <div class="ss-reveal flex flex-wrap items-end justify-between gap-3" style="--delay: 0.15s">
        <div class="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5" role="tablist">
          @for (item of tabs; track item) {
            <button
              type="button"
              role="tab"
              class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition"
              [class.bg-white]="tab() === item"
              [class.text-cyan-700]="tab() === item"
              [class.shadow-sm]="tab() === item"
              [class.text-slate-500]="tab() !== item"
              [attr.aria-selected]="tab() === item"
              [attr.data-testid]="'comments-tab-' + item"
              (click)="selectTab(item)"
            >
              {{ 'softsupport.comments.tabs.' + item | translate }}
              @if (item === 'Pending' && inbox.pending() > 0) {
                <span class="rounded-full bg-danger px-1.5 text-[10px] leading-4 text-white">{{ inbox.pending() }}</span>
              }
            </button>
          }
        </div>
        <div class="w-full max-w-sm">
          <soft-input [label]="'softsupport.common.search' | translate" [placeholder]="'softsupport.comments.searchPlaceholder' | translate" name="filter-comments" autocomplete="off" [value]="search()" (valueChange)="onSearch($event)" />
        </div>
      </div>

      <div class="ss-reveal mt-4 space-y-3" style="--delay: 0.25s">
        @if (loading() && rows().length === 0) {
          <div class="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">{{ 'common.loading' | translate }}</div>
        } @else if (error()) {
          <div class="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-red-600">{{ error() }}</div>
        } @else if (rows().length === 0) {
          <div class="rounded-xl border border-slate-200 bg-white px-4 py-10">
            <soft-data-table-empty-state [message]="'softsupport.comments.empty.' + tab() | translate" [hasActiveFilters]="search().trim() !== ''" (clearFilters)="clearSearch()" />
          </div>
        } @else {
          @for (row of rows(); track row.id) {
            <article class="ss-row rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-sm" [class.opacity-60]="loading()" [style.--i]="$index" [attr.data-testid]="'comment-' + row.id">
              <header class="flex flex-wrap items-start justify-between gap-3">
                <div class="flex min-w-0 items-start gap-3">
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-sm font-semibold text-cyan-700">{{ initials(row) }}</span>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-slate-900">
                      {{ row.customerName || row.customerEmail }}
                      @if (row.companyName) {
                        <span class="font-normal text-slate-500">· {{ row.companyName }}</span>
                      }
                    </p>
                    <p class="truncate text-xs text-slate-500">{{ row.customerEmail }} · {{ row.createdAt | date: 'dd/MM/yyyy HH:mm' }}</p>
                  </div>
                </div>
                <soft-badge [variant]="row.status === 'Answered' ? 'success' : 'warning'">{{ 'softsupport.comments.status.' + row.status | translate }}</soft-badge>
              </header>

              <button type="button" class="mt-3 inline-flex max-w-full items-center gap-1.5 truncate text-left text-xs font-medium text-cyan-700 hover:underline" (click)="articleId.set(row.articleId)">
                <soft-icon name="book" size="xs" />
                <span class="truncate">{{ row.articleCode ?? '—' }} — {{ row.articleTitle }}</span>
              </button>
              <p class="mt-2 whitespace-pre-line text-sm text-slate-800">{{ row.description }}</p>

              @if (row.replies.length > 0) {
                <div class="mt-3 space-y-2 border-l-2 border-emerald-200 pl-3">
                  @for (reply of row.replies; track reply.id) {
                    <div class="rounded-lg bg-emerald-50/60 p-2.5 text-sm">
                      <p class="text-xs font-semibold text-emerald-800">{{ 'softsupport.comments.repliedBy' | translate: { email: reply.from } }}</p>
                      <p class="mt-1 whitespace-pre-line text-slate-700">{{ reply.message }}</p>
                    </div>
                  }
                </div>
              }

              <footer class="mt-3 flex justify-end gap-2">
                <soft-button variant="ghost" size="sm" (onClick)="askDelete(row)">
                  <soft-icon name="trash" size="sm" class="mr-1" />{{ 'common.actions.delete' | translate }}
                </soft-button>
                <soft-button [variant]="row.status === 'Answered' ? 'secondary' : 'primary'" size="sm" (onClick)="replyTo.set(row)">
                  <soft-icon name="send" size="sm" class="mr-1" />{{ (row.status === 'Answered' ? 'softsupport.comments.replyAgain' : 'softsupport.comments.reply.action') | translate }}
                </soft-button>
              </footer>
            </article>
          }
        }
      </div>

      @if (!error() && totalCount() > 0) {
        <div class="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <softsupport-list-pagination [page]="page()" [pageSize]="pageSize()" [totalCount]="totalCount()" (pageChange)="page.set($event); load()" (pageSizeChange)="pageSize.set($event); reload()" />
        </div>
      }
    </section>

    <softsupport-comment-reply-modal [comment]="replyTo()" [busy]="sending()" (closed)="replyTo.set(null)" (send)="sendReply($event)" />
    <softsupport-article-detail-modal [articleId]="articleId()" (closed)="articleId.set(null)" />
    <app-confirmation-modal
      #deleteModal
      [title]="'softsupport.comments.delete.title' | translate"
      [message]="'softsupport.comments.delete.message' | translate: { name: toDelete()?.customerName || toDelete()?.customerEmail || '' }"
      [additionalInfo]="'softsupport.comments.delete.info' | translate"
      [cancelLabel]="'common.actions.cancel' | translate"
      [confirmLabel]="'common.actions.delete' | translate"
      (confirmed)="confirmDelete()"
    />
  `,
})
export class SoftSupportCommentsPage implements OnInit, OnDestroy {
  private readonly commentsApi = inject(SoftSupportCommentService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly deleteModal = viewChild<ConfirmationModalComponent>('deleteModal');
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  readonly inbox = inject(SoftSupportCommentInboxStore);

  readonly tabs: readonly CommentTab[] = ['Pending', 'Answered', 'all'];

  readonly rows = signal<CommentListItem[]>([]);
  readonly totalCount = signal(0);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly tab = signal<CommentTab>('Pending');
  readonly search = signal('');
  readonly page = signal(1);
  readonly pageSize = signal<PageSize>(SOFTSUPPORT_DEFAULT_PAGE_SIZE as PageSize);
  readonly replyTo = signal<CommentListItem | null>(null);
  readonly sending = signal(false);
  readonly articleId = signal<number | null>(null);
  readonly toDelete = signal<CommentListItem | null>(null);

  ngOnInit(): void {
    this.load();
    this.inbox.refresh();
  }

  ngOnDestroy(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  }

  initials(row: CommentListItem): string {
    const source = row.customerName || row.customerEmail;
    return (
      source
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part.charAt(0).toUpperCase())
        .join('') || '?'
    );
  }

  selectTab(tab: CommentTab): void {
    this.tab.set(tab);
    this.reload();
  }

  onSearch(value: string): void {
    this.search.set(value);
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => this.reload(), 350);
  }

  clearSearch(): void {
    this.search.set('');
    this.reload();
  }

  reload(): void {
    this.page.set(1);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    const tab = this.tab();
    this.commentsApi
      .search({ page: this.page(), pageSize: this.pageSize(), status: tab === 'all' ? null : tab, search: this.search() })
      .subscribe({
        next: result => {
          this.rows.set(result.items);
          this.totalCount.set(result.totalCount);
          this.loading.set(false);
        },
        error: error => {
          this.loading.set(false);
          this.error.set(getApiErrorMessage(error) ?? this.translate.instant('common.errors.generic'));
        },
      });
  }

  sendReply(message: string): void {
    const comment = this.replyTo();
    if (!comment) {
      return;
    }
    this.sending.set(true);
    this.commentsApi.reply(comment.id, message).subscribe({
      next: result => {
        this.sending.set(false);
        this.replyTo.set(null);
        this.done(result);
      },
      error: error => {
        this.sending.set(false);
        this.fail(error);
      },
    });
  }

  askDelete(comment: CommentListItem): void {
    this.toDelete.set(comment);
    this.deleteModal()?.open();
  }

  confirmDelete(): void {
    const comment = this.toDelete();
    if (comment) {
      this.commentsApi.delete(comment.id).subscribe({ next: message => this.done(message), error: error => this.fail(error) });
    }
  }

  private done(message: string): void {
    this.toast.success(message);
    this.toDelete.set(null);
    this.inbox.refresh();
    this.load();
  }

  private fail(error: unknown): void {
    this.toast.error(getApiErrorMessage(error) ?? this.translate.instant('common.errors.generic'));
  }
}
