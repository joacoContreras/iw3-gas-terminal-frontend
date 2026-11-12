import type { LocalDateTime } from "./common";

/** Estado de la orden: 1 Pendiente de pesaje inicial · 2 Con pesaje inicial registrado (llegan lecturas) · 3 Cerrada para carga · 4 Finalizada. */
export type OrderStatusCode = 1 | 2 | 3 | 4;

export const ORDER_STATUS_CODES: readonly OrderStatusCode[] = [1, 2, 3, 4];

export const ORDER_STATUS_LABELS: Record<OrderStatusCode, string> = {
  1: "Pendiente de pesaje inicial",
  2: "Con pesaje inicial registrado",
  3: "Cerrada para carga",
  4: "Finalizada",
};

export interface TruckTank {
  id: number;
  number: number;
  capacityLiters: number;
}

export interface Truck {
  id: number;
  externalCode: string;
  /** Patente. */
  plate: string;
  description: string | null;
  tanks: TruckTank[];
}

export interface Driver {
  id: number;
  externalCode: string;
  name: string;
  lastName: string;
  document: string | null;
}

export interface Customer {
  id: number;
  externalCode: string;
  /** Razón social. */
  companyName: string;
  contact: string | null;
}

export interface Product {
  id: number;
  externalCode: string;
  name: string;
  description: string | null;
}

/**
 * Orden de carga (`GET /orders/{orderNumber}`). Se identifica por `orderNumber`, no por `id`.
 * `activationPassword` NO se publica (solo viaja en la respuesta de la tara). Los campos nulos se llenan
 * cuando ocurre el evento: tara en el estado 2, lecturas durante la carga, peso final en el estado 4.
 */
export interface Order {
  id: number;
  orderNumber: number;
  truck: Truck;
  driver: Driver;
  customer: Customer;
  product: Product;
  plannedLoadDateTime: LocalDateTime;
  /** Kilogramos a cargar. */
  preset: number;
  status: OrderStatusCode;
  receptionDateTime: LocalDateTime;
  /** Peso del camión vacío (kg). */
  tare: number | null;
  initialWeighingDateTime: LocalDateTime | null;
  activationDateTime: LocalDateTime | null;
  /** Primera lectura válida: desde acá corre el tiempo transcurrido. */
  loadingStartDateTime: LocalDateTime | null;
  /** Última lectura válida (también es la estampa de los `last*`). */
  loadingEndDateTime: LocalDateTime | null;
  /** Masa acumulada (kg) de la última lectura válida. */
  lastAccumulatedMass: number | null;
  lastDensity: number | null;
  /** Temperatura (°C) de la última lectura válida. */
  lastTemperature: number | null;
  /** Caudal (kg/h) de la última lectura válida. */
  lastFlowRate: number | null;
  /** Peso del camión cargado (kg). */
  finalWeight: number | null;
  finalWeighingDateTime: LocalDateTime | null;
}

/** Una lectura guardada del caudalímetro (`GET /orders/{orderNumber}/details`). */
export interface OrderReading {
  id: number;
  accumulatedMass: number;
  density: number;
  temperature: number;
  flowRate: number;
  timestamp: LocalDateTime;
}

/** Una fila del historial de estados (`GET /orders/{orderNumber}/status-log`). */
export interface OrderStatusLog {
  id: number;
  /** `null` en la primera fila (alta de la orden). */
  fromStatus: OrderStatusCode | null;
  toStatus: OrderStatusCode;
  dateTime: LocalDateTime;
  /** Usuario o proceso que hizo el cambio. */
  actor: string;
  observations: string | null;
}

/**
 * Conciliación (`GET /orders/{orderNumber}/reconciliation`, solo estado 4; otro estado da 409).
 * El porcentaje de diferencia no viene del backend: se calcula como `difference / scaleNet * 100`.
 */
export interface Reconciliation {
  orderNumber: number;
  /** Pesaje inicial (kg). */
  tare: number;
  /** Pesaje final (kg). */
  finalWeight: number;
  /** Producto cargado: última masa acumulada (kg). */
  loadedProduct: number;
  /** Neto por balanza: `finalWeight - tare`. */
  scaleNet: number;
  /** Diferencia balanza vs. caudalímetro: `scaleNet - loadedProduct`. */
  difference: number;
  /** `null` si la orden no tiene lecturas. */
  averageTemperature: number | null;
  averageDensity: number | null;
  averageFlowRate: number | null;
}

/** Campos por los que `GET /orders` permite ordenar (cualquier otro da 400). */
export const ORDER_SORT_FIELDS = [
  "orderNumber",
  "plannedLoadDateTime",
  "receptionDateTime",
  "status",
  "preset",
] as const;

export type OrderSortField = (typeof ORDER_SORT_FIELDS)[number];
export type SortDirection = "asc" | "desc";

/** Parámetros de `GET /orders`. Sin `sort`: la orden más reciente primero. */
export interface OrdersQuery {
  status?: OrderStatusCode;
  sort?: { field: OrderSortField; direction: SortDirection };
  /** Desde 0. */
  page?: number;
  /** Por defecto 20, máximo 100. */
  size?: number;
}
