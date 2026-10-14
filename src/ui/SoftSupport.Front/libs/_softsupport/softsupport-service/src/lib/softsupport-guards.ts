import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { homeRouteFor } from '@softsupport/models';
import { SoftSupportSessionService } from './softsupport-session.service';

export const softSupportAuthGuard: CanActivateFn = () => {
  const session = inject(SoftSupportSessionService);
  const router = inject(Router);
  if (session.isAuthenticated()) {
    return true;
  }
  session.close();
  return router.createUrlTree(['/login']);
};

export const softSupportRoleGuard: CanActivateFn = route => {
  const session = inject(SoftSupportSessionService);
  const router = inject(Router);
  const roles = (route.data?.['roles'] as readonly string[] | undefined) ?? [];
  if (roles.length === 0 || session.hasRole(roles)) {
    return true;
  }
  return router.createUrlTree(['/acces-refuse']);
};

export const softSupportGuestGuard: CanActivateFn = () => {
  const session = inject(SoftSupportSessionService);
  const router = inject(Router);
  return session.isAuthenticated() ? router.createUrlTree([homeRouteFor(session.roleName())]) : true;
};

export const softSupportValidatorGuard: CanActivateFn = () => {
  const session = inject(SoftSupportSessionService);
  const router = inject(Router);
  return session.user()?.isValidator ? true : router.createUrlTree(['/acces-refuse']);
};
