import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { homeRouteFor } from '@softsupport/models';
import { SoftSupportSessionService } from './softsupport-session.service';

/** Exige une session valide ; sinon renvoie à la connexion. */
export const softSupportAuthGuard: CanActivateFn = () => {
  const session = inject(SoftSupportSessionService);
  const router = inject(Router);
  if (session.isAuthenticated()) {
    return true;
  }
  session.close();
  return router.createUrlTree(['/login']);
};

/** Réservé aux rôles listés dans `data.roles` de la route. */
export const softSupportRoleGuard: CanActivateFn = route => {
  const session = inject(SoftSupportSessionService);
  const router = inject(Router);
  const roles = (route.data?.['roles'] as readonly string[] | undefined) ?? [];
  if (roles.length === 0 || session.hasRole(roles)) {
    return true;
  }
  return router.createUrlTree(['/acces-refuse']);
};

/** Évite d'afficher la connexion à un utilisateur déjà connecté. */
export const softSupportGuestGuard: CanActivateFn = () => {
  const session = inject(SoftSupportSessionService);
  const router = inject(Router);
  return session.isAuthenticated() ? router.createUrlTree([homeRouteFor(session.roleName())]) : true;
};

/** Réservé aux validateurs (départements confiés dans la colonne `Validator`). */
export const softSupportValidatorGuard: CanActivateFn = () => {
  const session = inject(SoftSupportSessionService);
  const router = inject(Router);
  return session.user()?.isValidator ? true : router.createUrlTree(['/acces-refuse']);
};
