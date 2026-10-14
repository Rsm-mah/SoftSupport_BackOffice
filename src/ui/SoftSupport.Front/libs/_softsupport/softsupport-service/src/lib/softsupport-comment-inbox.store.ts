import { inject, Injectable, signal } from '@angular/core';
import { COMMENT_ROLES } from '@softsupport/models';
import { SoftSupportCommentService } from './softsupport-comment.service';
import { SoftSupportSessionService } from './softsupport-session.service';

@Injectable({ providedIn: 'root' })
export class SoftSupportCommentInboxStore {
  private readonly commentsApi = inject(SoftSupportCommentService);
  private readonly session = inject(SoftSupportSessionService);

  readonly pending = signal(0);

  refresh(): void {
    if (!this.session.isAuthenticated() || !this.session.hasRole(COMMENT_ROLES)) {
      this.pending.set(0);
      return;
    }
    this.commentsApi.countPending().subscribe({
      next: result => this.pending.set(result.pending),
      error: () => this.pending.set(0),
    });
  }
}
