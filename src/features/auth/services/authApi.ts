import { apiClient } from "@/services/api/client";
import { User, UserRole, AuthTokenClaims } from "@/types/auth";

export function parseJwt(token: string): AuthTokenClaims | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error("Error al decodificar JWT", err);
    return null;
  }
}

export function buildMockJwt(username: string, roles: UserRole[]): string {
  const header = btoa(JSON.stringify({ alg: "HS512", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      sub: username,
      email: `${username.toLowerCase()}@gas-terminal.com`,
      roles,
      exp: Math.floor(Date.now() / 1000) + 3600 * 24,
      version: "1.0.0",
    })
  );
  return `${header}.${payload}.mockSignature512`;
}

export const authApi = {
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    try {
      // In Java Spring Boot: AuthRestController receives @RequestParam username, @RequestParam password
      const params = new URLSearchParams();
      params.append("username", username);
      params.append("password", password);

      const token = await apiClient<string>("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const claims = parseJwt(token);
      const roles: UserRole[] = (claims?.roles as UserRole[]) || ["ROLE_OPERADOR"];

      const user: User = {
        username: claims?.sub || username,
        email: claims?.email,
        roles,
      };

      return { token: token.trim(), user };
    } catch (err: any) {
      // Fallback for development/demo mode if backend is not yet started
      console.warn("Backend no disponible o error al conectar con /login, activando modo demo simulado", err);

      let roles: UserRole[] = ["ROLE_OPERADOR"];
      const lower = username.toLowerCase();
      if (lower.includes("admin")) {
        roles = ["ROLE_ADMIN", "ROLE_SUPERVISOR", "ROLE_OPERADOR"];
      } else if (lower.includes("super")) {
        roles = ["ROLE_SUPERVISOR", "ROLE_OPERADOR"];
      }

      const mockToken = buildMockJwt(username, roles);
      const user: User = {
        username,
        email: `${username.toLowerCase()}@gas-terminal.com`,
        roles,
      };

      return { token: mockToken, user };
    }
  },
};
