import { Injectable } from '@angular/core';
import { SaveUserPayload, UserFormOptions, UserListItem } from '@softsupport/models';
import { Observable } from 'rxjs';
import { SoftSupportApiBase } from './softsupport-api.base';

@Injectable({ providedIn: 'root' })
export class SoftSupportUsersService extends SoftSupportApiBase {
  getAll(): Observable<UserListItem[]> {
    return this.getData<UserListItem[]>('users');
  }

  /** Rôles et départements (formulaire utilisateur, extraction des articles). */
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
