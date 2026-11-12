/**
 * Formato de números para la interfaz (es-AR). Un dato que todavía no existe (`null` o `undefined`, por ejemplo la
 * temperatura de una orden sin lecturas) se muestra como una raya, nunca como un cero que parezca una medición.
 * Las fechas del backend se formatean con `@/lib/dates`.
 */
import { formatBackendDateTime } from "@/lib/dates";

const PLACEHOLDER = "—";

function isMissing(val: number | null | undefined): val is null | undefined {
  return val === undefined || val === null || Number.isNaN(val);
}

function number(val: number, options: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat("es-AR", options).format(val);
}

export function formatKg(val?: number | null): string {
  return isMissing(val) ? PLACEHOLDER : `${number(val, { maximumFractionDigits: 1 })} kg`;
}

export function formatTemperature(val?: number | null): string {
  return isMissing(val) ? PLACEHOLDER : `${number(val, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} °C`;
}

/** La densidad del contrato es un número entre 0 y 1 (sin unidad definida): se muestra sin unidad. */
export function formatDensity(val?: number | null): string {
  return isMissing(val) ? PLACEHOLDER : number(val, { minimumFractionDigits: 3, maximumFractionDigits: 4 });
}

export function formatFlowRate(val?: number | null): string {
  return isMissing(val) ? PLACEHOLDER : `${number(val, { maximumFractionDigits: 1 })} kg/h`;
}

export function formatLiters(val?: number | null): string {
  return isMissing(val) ? PLACEHOLDER : `${number(val, { maximumFractionDigits: 0 })} L`;
}

/** LEGACY: lo usan las pantallas de alarmas y conciliación hasta las Fases 8 y 7. Usar `formatBackendDateTime`. */
export function formatDateTime(isoDate?: string | null): string {
  return formatBackendDateTime(isoDate);
}
