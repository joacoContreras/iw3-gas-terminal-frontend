/** Roles del backend. ADMIN accede a todo; SAP, TMS y LOADER son sistemas externos. */
export type ApiRole =
  | "ROLE_ADMIN"
  | "ROLE_SUPERVISOR"
  | "ROLE_OPERADOR"
  | "ROLE_SAP"
  | "ROLE_TMS"
  | "ROLE_LOADER"
  | "ROLE_USER";

/**
 * Claims del JWT que emite `POST /login` (HS512, vence a la hora). El token está firmado, no cifrado:
 * el frontend puede leer `exp` y `roles` decodificando el payload, pero la API siempre decide.
 */
export interface TokenClaims {
  /** Usuario. */
  sub: string;
  roles: string[];
  email: string | null;
  version?: string;
  /** Vencimiento en segundos Unix. */
  exp: number;
}
