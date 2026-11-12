/**
 * Cliente HTTP único del frontend hacia el backend real (contrato en docs/contrato-api.md).
 *
 * Reglas (ver CLAUDE.md, secciones 3 y 6):
 *  - La dirección de la API viene de NEXT_PUBLIC_API_URL y NO tiene respaldo: sin ella se falla con un mensaje claro
 *    (un respaldo silencioso apuntaba a un backend equivocado sin que nadie se enterara).
 *  - Todo error llega como `ApiError(status, message)` con el `message` REAL del backend. El `devInfo` (stack trace en
 *    desarrollo) nunca se expone.
 *  - 401 con sesión iniciada: se emite el evento `iw3:unauthorized` para que la sesión se cierre y se vuelva al login.
 *    403: no cierra la sesión (el usuario sigue autenticado, solo le falta el rol).
 *  - Sin datos falsos ni respaldos ante un error: quien llama decide qué mostrar.
 *
 * Este módulo no tiene imports en tiempo de ejecución a propósito: así lo prueba `npm test` con el ejecutor de Node.
 */

export const TOKEN_STORAGE_KEY = "iw3_auth_token";

/** Evento de `window` que el proveedor de sesión escucha para cerrar la sesión (401 con token enviado). */
export const UNAUTHORIZED_EVENT = "iw3:unauthorized";

/** Tiempo máximo de espera de una respuesta. Evita pedidos colgados y acumulación de *polling*. */
export const DEFAULT_TIMEOUT_MS = 20_000;

export type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions extends RequestInit {
  /** Parámetros de la URL. `undefined`, `null` y la cadena vacía se omiten; un arreglo repite el parámetro (`sort`). */
  params?: Record<string, QueryValue | QueryValue[]>;
  /** Cuerpo JSON: se serializa y se agrega `Content-Type: application/json`. */
  json?: unknown;
  /** Cuerpo de formulario (`application/x-www-form-urlencoded`), por ejemplo el login. */
  form?: Record<string, string>;
  /** `false` no envía el token (login). Por defecto `true`. */
  auth?: boolean;
  /** Milisegundos máximos de espera (por defecto 20 s). */
  timeoutMs?: number;
}

export interface ApiResponse<T> {
  status: number;
  data: T;
  headers: Headers;
}

/** Error de la API. `status` 0 significa que no hubo respuesta (red caída, servidor apagado, CORS o tiempo agotado). */
export class ApiError extends Error {
  status: number;
  /** Cuerpo del error ya parseado y SIN `devInfo`. */
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }
  get isUnauthorized(): boolean {
    return this.status === 401;
  }
  get isForbidden(): boolean {
    return this.status === 403;
  }
  get isNotFound(): boolean {
    return this.status === 404;
  }
  get isConflict(): boolean {
    return this.status === 409;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Texto para mostrar al usuario: el `message` de un `ApiError` o, si es otro error, `fallback`. */
export function errorMessage(error: unknown, fallback = "Ocurrió un error inesperado"): string {
  return isApiError(error) && error.message ? error.message : fallback;
}

/** Mensaje por defecto cuando el backend no manda uno (por ejemplo, algunos 400 de Spring llegan sin `message`). */
export function defaultMessageFor(status: number): string {
  switch (status) {
    case 400:
      return "Los datos enviados no son válidos";
    case 401:
      return "Sesión vencida o credenciales inválidas";
    case 403:
      return "No tenés permisos para realizar esta acción";
    case 404:
      return "No se encontró lo que pedís";
    case 409:
      return "La operación no es válida para el estado actual";
    case 302:
      return "El recurso ya existe";
    default:
      return status >= 500 ? "Error interno del servidor" : `Error HTTP ${status}`;
  }
}

function getBaseUrl(): string {
  // OJO: debe leerse como `process.env.NEXT_PUBLIC_API_URL` literal. Next solo reemplaza ese acceso estático
  // (`process.env[nombre]` no se incrusta y en el navegador daría undefined). El valor queda fijo al compilar.
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url || !url.trim()) {
    throw new ApiError(0, "Falta configurar NEXT_PUBLIC_API_URL (ver .env.example)");
  }
  return url.trim().replace(/\/+$/, "");
}

function getStoredToken(): string | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null; // almacenamiento bloqueado (modo privado, políticas del navegador)
  }
}

function buildUrl(endpoint: string, params?: RequestOptions["params"]): string {
  const base = /^https?:\/\//i.test(endpoint)
    ? endpoint
    : `${getBaseUrl()}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  if (!params) return base;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined && item !== null && item !== "") search.append(key, String(item));
    }
  }
  const qs = search.toString();
  return qs ? `${base}${base.includes("?") ? "&" : "?"}${qs}` : base;
}

/** Cuerpo de error sin `devInfo`: nunca debe llegar a la pantalla. */
function sanitizeErrorBody(body: unknown): unknown {
  if (body && typeof body === "object" && !Array.isArray(body)) {
    const { devInfo: _devInfo, ...rest } = body as Record<string, unknown>;
    return rest;
  }
  return body;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/**
 * Hace el pedido y devuelve estado, datos y cabeceras (necesario para leer `Location` del alta de órdenes).
 * Lanza siempre `ApiError`, salvo que el que llama cancele con su propio `signal` (entonces relanza el `AbortError`).
 */
export async function apiRequest<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { params, json, form, auth = true, timeoutMs = DEFAULT_TIMEOUT_MS, headers, signal, body, ...rest } = options;

  const url = buildUrl(endpoint, params);

  const requestHeaders: Record<string, string> = {
    Accept: "application/json, text/plain, */*",
    ...(headers as Record<string, string> | undefined),
  };

  let requestBody: BodyInit | undefined = body ?? undefined;
  if (json !== undefined) {
    requestBody = JSON.stringify(json);
    requestHeaders["Content-Type"] = "application/json";
  } else if (form) {
    requestBody = new URLSearchParams(form).toString();
    requestHeaders["Content-Type"] = "application/x-www-form-urlencoded";
  } else if (requestBody !== undefined && !Object.keys(requestHeaders).some((h) => h.toLowerCase() === "content-type")) {
    requestHeaders["Content-Type"] = "application/json";
  }
  // Sin cuerpo no se manda Content-Type: un GET con ese header dispara un preflight de CORS que no hace falta.

  const token = auth ? getStoredToken() : null;
  if (token) requestHeaders["Authorization"] = `Bearer ${token}`;

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onCallerAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", onCallerAbort, { once: true });
  }

  let response: Response;
  let text: string;
  try {
    response = await fetch(url, { ...rest, body: requestBody, headers: requestHeaders, signal: controller.signal });
    // El tiempo máximo abarca también la lectura del cuerpo: un cuerpo que se cuelga a mitad de camino también vence
    text = await response.text();
  } catch (error) {
    if (timedOut) throw new ApiError(0, "El servidor tardó demasiado en responder");
    if (signal?.aborted) throw error; // cancelación del que llama (por ejemplo, al desmontar un componente)
    throw new ApiError(0, "No se pudo conectar con el servidor");
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onCallerAbort);
  }

  if (!response.ok) {
    const body = parseJson(text);
    const fromBackend =
      body && typeof body === "object" && typeof (body as { message?: unknown }).message === "string"
        ? (body as { message: string }).message.trim()
        : "";
    // Texto plano que no sea JSON (por ejemplo, la página de error de un proxy): se usa solo si es corto
    const plain = body === undefined && text.trim() && text.length < 200 && !text.trim().startsWith("<") ? text.trim() : "";
    const message = fromBackend || plain || defaultMessageFor(response.status);

    if (response.status === 401 && token && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(response.status, message, sanitizeErrorBody(body));
  }

  const contentType = response.headers.get("content-type") ?? "";
  let data: unknown;
  if (!text.trim()) {
    data = undefined; // 201 sin cuerpo (alta de órdenes) o 204
  } else if (contentType.includes("application/json")) {
    const parsed = parseJson(text);
    if (parsed !== undefined) {
      data = parsed;
    } else if (!/^\s*[{\[]/.test(text)) {
      // El login del backend devuelve el token pelado (no es JSON) pero, si el Accept pide JSON primero, lo etiqueta
      // como application/json. Un cuerpo que no es un objeto ni un arreglo se trata como texto.
      data = text.trim();
    } else {
      throw new ApiError(response.status, "La respuesta del servidor no es válida");
    }
  } else {
    data = text.trim(); // texto plano
  }
  return { status: response.status, data: data as T, headers: response.headers };
}

/** Igual que `apiRequest` pero devuelve solo los datos. */
export async function apiClient<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  return (await apiRequest<T>(endpoint, options)).data;
}
