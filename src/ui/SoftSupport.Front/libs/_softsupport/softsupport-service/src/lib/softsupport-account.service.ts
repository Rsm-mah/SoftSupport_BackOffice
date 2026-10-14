import { Injectable } from '@angular/core';
import { ChangePasswordPayload, UserProfile } from '@softsupport/models';
import { Observable } from 'rxjs';
import { SoftSupportApiBase } from './softsupport-api.base';

@Injectable({ providedIn: 'root' })
export class SoftSupportAccountService extends SoftSupportApiBase {
  getMe(): Observable<UserProfile> {
    return this.getData<UserProfile>('account/me');
  }

  changePassword(payload: ChangePasswordPayload): Observable<string> {
    return this.sendMessage('PUT', 'account/password', payload);
  }
}
