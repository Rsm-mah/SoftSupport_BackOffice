export interface AuthUser {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  roleName: string | null;
  departementName: string | null;
  isValidator: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}
