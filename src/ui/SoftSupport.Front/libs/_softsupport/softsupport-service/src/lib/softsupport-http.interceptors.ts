import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AppConfigService } from '@soft-mfe/shared-services';
import { catchError, throwError } from 'rxjs';
import { SoftSupportSessionService } from './softsupport-session.service';

/** Ajoute le jeton aux seuls appels vers l'API SoftSupport. */
export const softSupportJwtInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SoftSupportSessionService);
  const config = inject(AppConfigService);
  const token = session.token();

  if (!token || !request.url.startsWith(config.apiBaseUrl)) {
    return next(request);
  }

  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};

/** Un 401 sur une route protégée ferme la session et renvoie à l'écran de connexion. */
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
