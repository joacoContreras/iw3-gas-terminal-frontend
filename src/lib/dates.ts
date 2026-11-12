/**
 * Fechas del backend. El backend manda `LocalDateTime` SIN zona (`2026-11-12T10:30:00`, a veces con microsegundos) y en hora
 * de Argentina. `new Date("2026-11-12T10:30:00")` la interpretaría en la zona del navegador: con un navegador en otra zona,
 * el tiempo transcurrido y los horarios saldrían corridos. Todo el frontend debe pasar por estas funciones.
 */

export const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";

/** Argentina no usa horario de verano desde 2009: el desfasaje con UTC es fijo. */
const ARGENTINA_OFFSET = "-03:00";

const HAS_ZONE = /(Z|[+-]\d{2}:\d{2}|[+-]\d{4})$/i;
const LOCAL_DATE_TIME = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2})(?::(\d{2}))?(?:\.(\d+))?)?$/;

/**
 * Convierte una fecha del backend en un instante real. Acepta fecha y hora (con o sin segundos y fracción), solo la fecha
 * (medianoche de Argentina) y, por si acaso, fechas que ya traen zona (`Z` o `±hh:mm`). Devuelve `null` si no es válida.
 */
export function parseBackendDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const text = value.trim();

  if (HAS_ZONE.test(text)) {
    const withZone = new Date(text);
    return Number.isNaN(withZone.getTime()) ? null : withZone;
  }

  const match = LOCAL_DATE_TIME.exec(text);
  if (!match) return null;
  const [, date, hoursMinutes = "00:00", seconds = "00", fraction = ""] = match;
  const millis = `${fraction}000`.slice(0, 3); // el backend manda microsegundos; JavaScript guarda milisegundos
  const instant = new Date(`${date}T${hoursMinutes}:${seconds}.${millis}${ARGENTINA_OFFSET}`);
  return Number.isNaN(instant.getTime()) ? null : instant;
}

const PLACEHOLDER = "—";

function format(value: string | null | undefined, options: Intl.DateTimeFormatOptions): string {
  const date = parseBackendDate(value);
  if (!date) return PLACEHOLDER;
  return new Intl.DateTimeFormat("es-AR", { timeZone: ARGENTINA_TIME_ZONE, hour12: false, ...options })
    .format(date)
    .replace(", ", " ");
}

/** `12/11/2026 14:20:06` (hora de Argentina, la que mostró el backend sin zona). */
export function formatBackendDateTime(value: string | null | undefined): string {
  return format(value, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/** `12/11/2026`. */
export function formatBackendDate(value: string | null | undefined): string {
  return format(value, { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** `14:20:06`. */
export function formatBackendTime(value: string | null | undefined): string {
  return format(value, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/**
 * Milisegundos entre una fecha del backend y `now` (por defecto, ahora). `null` si la fecha no es válida; nunca negativo
 * (un reloj del navegador atrasado respecto del servidor no debe mostrar un tiempo transcurrido negativo).
 */
export function elapsedMillis(start: string | null | undefined, now: number | Date = Date.now()): number | null {
  const from = parseBackendDate(start);
  if (!from) return null;
  const to = typeof now === "number" ? now : now.getTime();
  return Math.max(0, to - from.getTime());
}

/** `HH:MM:SS` (las horas pueden pasar de 24). `null` da `--:--:--`. */
export function formatDuration(millis: number | null): string {
  if (millis === null || !Number.isFinite(millis)) return "--:--:--";
  const total = Math.max(0, Math.floor(millis / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

/**
 * Tiempo transcurrido de la carga: desde `loadingStartDateTime` (primera lectura válida) hasta ahora, **solo con la orden en
 * estado 2**. En los demás estados la carga no está en curso, así que devuelve `null` (no se muestra como «en vivo»).
 */
export function loadingElapsedMillis(
  status: number,
  loadingStartDateTime: string | null | undefined,
  now: number | Date = Date.now(),
): number | null {
  if (status !== 2) return null;
  return elapsedMillis(loadingStartDateTime, now);
}
