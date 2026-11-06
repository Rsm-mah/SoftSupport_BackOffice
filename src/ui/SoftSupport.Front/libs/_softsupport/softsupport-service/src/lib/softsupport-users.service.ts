import { Injectable } from '@angular/core';
import {
  SaveUserPayload,
  SOFTSUPPORT_DEFAULT_PAGE_SIZE,
  SoftSupportPagedResult,
  UserFormOptions,
  UserListItem,
  UsersQuery,
} from '@softsupport/models';
import { Observable } from 'rxjs';
import { SoftSupportApiBase } from './softsupport-api.base';

@Injectable({ providedIn: 'root' })
export class SoftSupportUsersService extends SoftSupportApiBase {
  getAll(query: UsersQuery = {}): Observable<SoftSupportPagedResult<UserListItem>> {
    return this.getData<SoftSupportPagedResult<UserListItem>>(
      'users',
      this.params({
        page: query.page ?? 1,
        pageSize: query.pageSize ?? SOFTSUPPORT_DEFAULT_PAGE_SIZE,
        roleId: query.roleId,
        search: query.search,
      }),
    );
  }

  getFormOptions(): Observable<UserFormOptions> {
    return this.getData<UserFormOptions>('users/form-options');
  }

  create(payload: SaveUserPayload): Observable<string> {
    return this.sendMessage('POST', 'users', payload);
  }

  update(userId: string, payload: SaveUserPayload): Observable<string> {
    return this.sendMessage('PUT', `users/${encodeURIComponent(userId)}`, payload);
  }

  delete(userId: string): Observable<string> {
    return this.sendMessage('DELETE', `users/${encodeURIComponent(userId)}`);
  }
}
