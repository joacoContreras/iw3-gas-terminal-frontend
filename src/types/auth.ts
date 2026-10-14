export type UserRole = "ROLE_ADMIN" | "ROLE_OPERADOR" | "ROLE_SUPERVISOR" | "ROLE_USER";

export interface User {
  username: string;
  email?: string;
  roles: UserRole[];
}

export interface AuthTokenClaims {
  sub: string;
  email?: string;
  roles?: string[];
  exp?: number;
  iat?: number;
  version?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}
