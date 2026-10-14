export interface LookupItem {
  id: number;
  name: string;
}

export interface UserListItem {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  dateCreated: string;
  roleId: number;
  role: string | null;
  departementId: number;
  departement: string | null;
  validatorDepartementIds: number[];
}

export interface UserProfile {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  dateCreated: string;
  role: string | null;
  departement: string | null;
  validatorDepartements: string[];
}

export interface UserFormOptions {
  roles: LookupItem[];
  departements: LookupItem[];
}

export interface SaveUserPayload {
  firstName: string | null;
  lastName: string | null;
  email?: string;
  roleId: number;
  departementId: number;
  validatorDepartementIds: number[];
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
