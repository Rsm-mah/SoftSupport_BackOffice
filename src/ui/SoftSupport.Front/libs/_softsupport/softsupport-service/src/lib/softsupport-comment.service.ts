import { Injectable } from '@angular/core';
import { CommentListItem, CommentsQuery, SOFTSUPPORT_DEFAULT_PAGE_SIZE, SoftSupportPagedResult } from '@softsupport/models';
import { Observable } from 'rxjs';
import { SoftSupportApiBase } from './softsupport-api.base';

@Injectable({ providedIn: 'root' })
export class SoftSupportCommentService extends SoftSupportApiBase {
  search(query: CommentsQuery = {}): Observable<SoftSupportPagedResult<CommentListItem>> {
    return this.getData<SoftSupportPagedResult<CommentListItem>>(
      'comments',
      this.params({
        page: query.page ?? 1,
        pageSize: query.pageSize ?? SOFTSUPPORT_DEFAULT_PAGE_SIZE,
        status: query.status,
        search: query.search,
      }),
    );
  }

  countPending(): Observable<{ pending: number }> {
    return this.getData<{ pending: number }>('comments/count');
  }

  reply(commentId: number, message: string): Observable<string> {
    return this.sendMessage('POST', `comments/${commentId}/reply`, { message });
  }

  delete(commentId: number): Observable<string> {
    return this.sendMessage('DELETE', `comments/${commentId}`);
  }
}
