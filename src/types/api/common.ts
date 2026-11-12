/**
 * Tipos comunes del contrato real del backend (docs/contrato-api.md).
 * Los nombres y las formas son los del JSON: no se renombran ni se adaptan.
 */

/**
 * Fecha y hora sin zona (`2026-11-12T10:30:00`, con o sin fracción de segundo), en hora de Argentina.
 * No usar `new Date(valor)` directamente: el navegador la interpretaría en SU zona horaria.
 * Ver `parseBackendDate` en `@/lib/dates`.
 */
export type LocalDateTime = string;

/** Datos de paginación que acompañan a todo listado paginado. */
export interface PageInfo {
  size: number;
  /** Número de página, desde 0. */
  number: number;
  totalElements: number;
  totalPages: number;
}

/** Respuesta de los listados paginados: `GET /orders`, `/orders/{n}/details` y `/alarms`. */
export interface Page<T> {
  content: T[];
  page: PageInfo;
}

/**
 * Cuerpo estándar de error. `devInfo` trae el stack trace en desarrollo y es `null` en producción:
 * **nunca se muestra** (el cliente HTTP ni siquiera lo expone). Algunos 400 de Spring llegan sin `message`.
 */
export interface ApiErrorBody {
  message?: string | null;
  code?: number;
  devInfo?: string | null;
}
