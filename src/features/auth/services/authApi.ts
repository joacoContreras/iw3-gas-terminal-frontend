import { ApiError, apiClient } from "@/services/api/client";
import { sessionFromToken, type Session } from "../lib/session";

export const authApi = {
  /**
   * `POST /login` (formulario `username` y `password`). El backend responde el JWT como texto.
   *
   * Sin modo demo ni credenciales por defecto: si el backend no responde o rechaza las credenciales, el error llega
   * tal cual (`ApiError` con el `message` real) y el usuario NO queda autenticado. `auth: false` evita mandar un
   * token viejo: un 401 acá son credenciales incorrectas, no una sesión vencida.
   */
  async login(username: string, password: string): Promise<Session> {
    const token = await apiClient<string>("/login", {
      method: "POST",
      auth: false,
      form: { username, password },
    });

    // No se confía a ciegas en lo que vuelve: tiene que ser un JWT legible y vigente.
    const session = typeof token === "string" ? sessionFromToken(token, Date.now()) : null;
    if (!session) {
      throw new ApiError(0, "El servidor devolvió un token de sesión no válido");
    }
    return session;
  },
};
