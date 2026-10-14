import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AppConfigService } from '@soft-mfe/shared-services';
import { catchError, throwError } from 'rxjs';
import { SoftSupportSessionService } from './softsupport-session.service';

export const softSupportJwtInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SoftSupportSessionService);
  const config = inject(AppConfigService);
  const token = session.token();

  if (!token || !request.url.startsWith(config.apiBaseUrl)) {
    return next(request);
  }

  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};

export const softSupportUnauthorizedInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SoftSupportSessionService);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse
        && error.status === 401
        && !request.url.includes('/auth/')
        && session.token()
      ) {
        session.close();
        void router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
