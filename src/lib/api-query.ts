import type { AlarmsQuery } from "../types/api/alarm";
import type { Page, PageInfo } from "../types/api/common";
import type { OrdersQuery } from "../types/api/order";

/**
 * Parámetros de consulta y paginación del contrato real. El tope de 100 por página y el formato de `sort`
 * (`campo,dirección`) son los del backend; los respeta acá para no mandar pedidos que se sabe que se acotan o se rechazan.
 */

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

type Params = Record<string, string | number | undefined>;

export function clampPageSize(size: number): number {
  if (!Number.isFinite(size)) return DEFAULT_PAGE_SIZE;
  return Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(size)));
}

export function clampPage(page: number): number {
  return Number.isFinite(page) ? Math.max(0, Math.trunc(page)) : 0;
}

/** Parámetros de `GET /orders`: `status` (1 a 4), `sort=campo,dirección`, `page` y `size`. Lo no informado se omite. */
export function ordersParams(query: OrdersQuery = {}): Params {
  return {
    status: query.status,
    sort: query.sort ? `${query.sort.field},${query.sort.direction}` : undefined,
    page: query.page === undefined ? undefined : clampPage(query.page),
    size: query.size === undefined ? undefined : clampPageSize(query.size),
  };
}

/** Parámetros de `GET /alarms`: `status` (`PENDING` o `ACKNOWLEDGED`), `orderNumber`, `page` y `size`. */
export function alarmsParams(query: AlarmsQuery = {}): Params {
  return {
    status: query.status,
    orderNumber: query.orderNumber,
    page: query.page === undefined ? undefined : clampPage(query.page),
    size: query.size === undefined ? undefined : clampPageSize(query.size),
  };
}

/** Una página vacía (estado inicial de una pantalla antes de que llegue la primera respuesta). */
export function emptyPage<T>(size: number = DEFAULT_PAGE_SIZE): Page<T> {
  return { content: [], page: { size, number: 0, totalElements: 0, totalPages: 0 } };
}

export function hasNextPage(info: PageInfo): boolean {
  return info.number + 1 < info.totalPages;
}

export function hasPreviousPage(info: PageInfo): boolean {
  return info.number > 0;
}

/** `1–20 de 154` (o `0 de 0` si no hay elementos). `shown` es la cantidad de filas de la página actual. */
export function pageRangeLabel(info: PageInfo, shown: number): string {
  if (info.totalElements === 0 || shown === 0) return "0 de 0";
  const from = info.number * info.size + 1;
  return `${from}–${from + shown - 1} de ${info.totalElements}`;
}
