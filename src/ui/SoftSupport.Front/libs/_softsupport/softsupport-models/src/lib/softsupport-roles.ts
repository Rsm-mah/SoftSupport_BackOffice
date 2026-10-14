export const ROLE_ADMINISTRATEUR = 'Administrateur';
export const ROLE_COMMERCIAL = 'Commercial';
export const ROLE_ECRITURE = 'Ecriture';
export const ROLE_LECTURE = 'Lecture';
export const ROLE_NON_ASSIGNE = 'Non Assigné';
export const ROLE_RESPONSABLE_COMMERCIAL = 'Responsable Commercial';

export const ALL_ROLES: readonly string[] = [
  ROLE_ADMINISTRATEUR,
  ROLE_COMMERCIAL,
  ROLE_ECRITURE,
  ROLE_LECTURE,
  ROLE_NON_ASSIGNE,
  ROLE_RESPONSABLE_COMMERCIAL,
];

export const REDACTION_ROLES: readonly string[] = [ROLE_ADMINISTRATEUR, ROLE_ECRITURE];

export const COMMERCIAL_ROLES: readonly string[] = [ROLE_COMMERCIAL, ROLE_RESPONSABLE_COMMERCIAL];

export const ADMIN_ROLES: readonly string[] = [ROLE_ADMINISTRATEUR];

export function isAdministrator(role: string | null | undefined): boolean {
  return role === ROLE_ADMINISTRATEUR;
}

export function homeRouteFor(role?: string | null): string {
  return !!role && [...ADMIN_ROLES, ...COMMERCIAL_ROLES].includes(role) ? '/tableau-de-bord' : '/articles';
}
