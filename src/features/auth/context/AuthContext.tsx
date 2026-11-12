"use client";

import * as React from "react";
import { TOKEN_STORAGE_KEY, UNAUTHORIZED_EVENT } from "@/services/api/client";
import { authApi } from "../services/authApi";
import { can as canDo, hasAnyRole, type Permission } from "../lib/permissions";
import { msUntilExpiry, sessionFromToken, type Session } from "../lib/session";

/** Por qué terminó la sesión sin que el usuario lo pidiera (la pantalla de login lo explica). */
export type SessionEndReason = "expired" | "unauthorized";

export interface AuthUser {
  username: string;
  email: string | null;
  /** Roles del token (`ROLE_ADMIN`, ...). */
  roles: string[];
}

interface AuthContextType {
  /** `null` si no hay sesión (o todavía se está restaurando: ver `isLoading`). */
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  /** `true` hasta que se leyó la sesión guardada en el navegador (evita mostrar el login un instante a quien ya entró). */
  isLoading: boolean;
  /** Motivo del último cierre automático de sesión; se limpia al volver a iniciar sesión. */
  endReason: SessionEndReason | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  /** ¿Tiene alguno de estos roles? (`ROLE_X` o `X`). */
  hasRole: (roles: string | string[]) => boolean;
  /** ¿Tiene este permiso de la interfaz? (ver `lib/permissions.ts`). */
  can: (permission: Permission) => boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

/** `setTimeout` no admite más de 2^31-1 ms. */
const MAX_TIMER_MS = 2_147_483_647;

function readStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null; // almacenamiento bloqueado (modo privado, políticas del navegador)
  }
}

function writeStoredToken(token: string | null): void {
  try {
    if (token === null) window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    else window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // Sin almacenamiento la sesión dura lo que dure la pestaña; no es un error para el usuario.
  }
}

/** Lee la sesión guardada. Un token ilegible o vencido se borra: nunca se restaura una sesión inválida. */
function restoreSession(): { session: Session | null; hadToken: boolean } {
  const stored = readStoredToken();
  if (!stored) return { session: null, hadToken: false };
  const session = sessionFromToken(stored, Date.now());
  if (!session) writeStoredToken(null);
  return { session, hadToken: true };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [endReason, setEndReason] = React.useState<SessionEndReason | null>(null);

  const endSession = React.useCallback((reason: SessionEndReason | null) => {
    writeStoredToken(null);
    setSession(null);
    setEndReason(reason);
  }, []);

  const logout = React.useCallback(() => endSession(null), [endSession]);

  // Restaura la sesión al montar. Sin token (o token inválido) NO se inventa un usuario: queda sin sesión.
  React.useEffect(() => {
    const { session: restored, hadToken } = restoreSession();
    setSession(restored);
    if (hadToken && !restored) setEndReason("expired");
    setIsLoading(false);
  }, []);

  // Cierra la sesión sola cuando vence el token (el servidor ya no lo aceptaría).
  React.useEffect(() => {
    if (!session) return;
    const timer = window.setTimeout(
      () => endSession("expired"),
      Math.min(msUntilExpiry(session, Date.now()), MAX_TIMER_MS),
    );
    return () => window.clearTimeout(timer);
  }, [session, endSession]);

  React.useEffect(() => {
    // 401 con token enviado (lo dispara el cliente HTTP): el servidor dice que la sesión ya no vale.
    const onUnauthorized = () => endSession("unauthorized");

    // Otra pestaña inició o cerró sesión: se sincroniza esta.
    const onStorage = (event: StorageEvent) => {
      if (event.key !== TOKEN_STORAGE_KEY && event.key !== null) return;
      const { session: restored } = restoreSession();
      setSession(restored);
      if (restored) setEndReason(null);
    };

    // Los temporizadores se frenan con el equipo suspendido o la pestaña en segundo plano: al volver se revisa.
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      setSession((current) => {
        if (current && msUntilExpiry(current, Date.now()) === 0) {
          writeStoredToken(null);
          setEndReason("expired");
          return null;
        }
        return current;
      });
    };

    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [endSession]);

  const login = React.useCallback(async (username: string, password: string) => {
    // Si falla, el error (ApiError con el mensaje real) sube a la pantalla de login y no queda nada guardado.
    const next = await authApi.login(username, password);
    writeStoredToken(next.token);
    setEndReason(null);
    setSession(next);
  }, []);

  const value = React.useMemo<AuthContextType>(() => {
    const roles = session?.roles ?? [];
    return {
      user: session ? { username: session.username, email: session.email, roles: session.roles } : null,
      token: session?.token ?? null,
      isAuthenticated: session !== null,
      isLoading,
      endReason,
      login,
      logout,
      hasRole: (required) => hasAnyRole(roles, Array.isArray(required) ? required : [required]),
      can: (permission) => canDo(roles, permission),
    };
  }, [session, isLoading, endReason, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
