import { Injectable } from '@angular/core';
import { LoginPayload, LoginResult } from '@softsupport/models';
import { map, Observable } from 'rxjs';
import { SoftSupportApiBase } from './softsupport-api.base';

@Injectable({ providedIn: 'root' })
export class SoftSupportAuthService extends SoftSupportApiBase {
  login(payload: LoginPayload): Observable<LoginResult> {
    return this.sendData<LoginResult>('POST', 'auth/login', payload).pipe(map(response => response.data));
  }
}
