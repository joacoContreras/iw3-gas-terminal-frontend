import type { TokenClaims } from "@/types/api/auth";

/**
 * Lectura de la sesión a partir del JWT que devuelve `POST /login`.
 *
 * El token está firmado, no cifrado: el frontend puede leer `sub`, `roles` y `exp` del payload, pero NO puede
 * verificar la firma (la clave es del backend). Lo que se lee acá sirve para la interfaz (a quién saludar, cuándo
 * vence, qué botones mostrar); la API siempre vuelve a decidir con su propio control.
 *
 * Este módulo no tiene imports en tiempo de ejecución a propósito: así lo prueba `npm test` con el ejecutor de Node.
 */

/** Sesión del usuario autenticado, derivada del token (no se guarda nada más que el token). */
export interface Session {
  token: string;
  username: string;
  email: string | null;
  /** Roles tal como vienen en el token (`ROLE_ADMIN`, ...). */
  roles: string[];
  /** Vencimiento en milisegundos Unix (`exp` del token × 1000). */
  expiresAt: number;
}

function decodeBase64Url(segment: string): string {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Decodifica el payload del JWT. Devuelve `null` si no tiene la forma `a.b.c` o el payload no es un objeto JSON. */
export function decodeTokenPayload(token: string): Record<string, unknown> | null {
  if (typeof token !== "string") return null;
  const parts = token.trim().split(".");
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    const payload: unknown = JSON.parse(decodeBase64Url(parts[1]));
    if (payload === null || typeof payload !== "object" || Array.isArray(payload)) return null;
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Valida que el payload tenga los claims que la interfaz necesita (`sub` y `exp` obligatorios; `roles` lista de textos). */
export function parseTokenClaims(token: string): TokenClaims | null {
  const payload = decodeTokenPayload(token);
  if (!payload) return null;
  const { sub, exp, roles, email, version } = payload;
  if (typeof sub !== "string" || sub.length === 0) return null;
  if (typeof exp !== "number" || !Number.isFinite(exp)) return null;
  if (roles !== undefined && (!Array.isArray(roles) || !roles.every((r) => typeof r === "string"))) return null;
  return {
    sub,
    exp,
    roles: (roles as string[] | undefined) ?? [],
    email: typeof email === "string" ? email : null,
    version: typeof version === "string" ? version : undefined,
  };
}

/** ¿Venció? `expiresAt` en milisegundos. Un token que vence en este mismo instante ya se considera vencido. */
export function isExpired(expiresAt: number, nowMs: number): boolean {
  return expiresAt <= nowMs;
}

/**
 * Arma la sesión desde un token, o `null` si el token no sirve (mal formado, sin `sub`/`exp`) o ya venció.
 * Así una sesión guardada en el navegador nunca se restaura vencida ni con un valor inventado.
 */
export function sessionFromToken(token: string, nowMs: number): Session | null {
  const clean = typeof token === "string" ? token.trim() : "";
  const claims = parseTokenClaims(clean);
  if (!claims) return null;
  const expiresAt = claims.exp * 1000;
  if (isExpired(expiresAt, nowMs)) return null;
  return { token: clean, username: claims.sub, email: claims.email, roles: claims.roles, expiresAt };
}

/** Milisegundos hasta el vencimiento (0 si ya venció). Sirve para programar el cierre automático de la sesión. */
export function msUntilExpiry(session: Pick<Session, "expiresAt">, nowMs: number): number {
  return Math.max(0, session.expiresAt - nowMs);
}
