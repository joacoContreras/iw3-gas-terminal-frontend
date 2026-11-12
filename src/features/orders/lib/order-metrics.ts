/**
 * Cálculos de la pantalla de órdenes: avance de la carga y tiempo estimado de llenado (ETA).
 * Se calculan en el cliente con los datos reales de la orden (`preset`, `lastAccumulatedMass`, `lastFlowRate`).
 *
 * Este módulo no tiene imports en tiempo de ejecución a propósito: así lo prueba `npm test` con el ejecutor de Node.
 */

/** Resultado de la ETA. `kind` dice qué mostrar; solo `estimate` trae un tiempo. */
export type EtaResult =
  /** La orden no está en estado 2: no hay carga en curso, así que no hay estimación. */
  | { kind: "not-loading" }
  /** Estado 2 pero todavía no llegó ninguna lectura válida. */
  | { kind: "no-readings"; remainingKg: number }
  /** Ya se cargó el preset (o más). */
  | { kind: "complete"; remainingKg: 0 }
  /** Hay lecturas pero el caudal es 0 o no se conoce: no se puede estimar. */
  | { kind: "stalled"; remainingKg: number }
  /** Faltan `remainingKg` y, al caudal actual, `seconds`. */
  | { kind: "estimate"; remainingKg: number; seconds: number };

export interface EtaInput {
  /** Estado de la orden (1 a 4). */
  status: number;
  /** Kilogramos a cargar. */
  preset: number;
  /** `lastAccumulatedMass`: masa acumulada de la última lectura válida (kg), `null` si no hay lecturas. */
  accumulatedMass: number | null;
  /** `lastFlowRate`: caudal de la última lectura válida (kg/h), `null` si no hay lecturas. */
  flowRate: number | null;
}

/**
 * ETA = (preset − masa acumulada) / caudal. Solo tiene sentido con la carga en curso (estado 2).
 * Los casos de borde se distinguen para no mostrar un tiempo inventado: sin lecturas, carga completa, caudal cero.
 */
export function calculateEta({ status, preset, accumulatedMass, flowRate }: EtaInput): EtaResult {
  if (status !== 2) return { kind: "not-loading" };

  const safePreset = Number.isFinite(preset) ? Math.max(0, preset) : 0;
  if (accumulatedMass === null || !Number.isFinite(accumulatedMass)) {
    return { kind: "no-readings", remainingKg: safePreset };
  }

  const remainingKg = Math.max(0, safePreset - Math.max(0, accumulatedMass));
  if (remainingKg === 0) return { kind: "complete", remainingKg: 0 };

  if (flowRate === null || !Number.isFinite(flowRate) || flowRate <= 0) {
    return { kind: "stalled", remainingKg };
  }
  return { kind: "estimate", remainingKg, seconds: Math.round((remainingKg / flowRate) * 3600) };
}

/** Porcentaje cargado respecto del preset, entre 0 y 100 (0 si no hay preset o lecturas). */
export function loadProgress(preset: number, accumulatedMass: number | null): number {
  if (!Number.isFinite(preset) || preset <= 0) return 0;
  if (accumulatedMass === null || !Number.isFinite(accumulatedMass)) return 0;
  return Math.min(100, Math.max(0, (accumulatedMass / preset) * 100));
}

/** `1 h 25 min`, `12 min` o `< 1 min`. */
export function formatEtaSeconds(seconds: number): string {
  const totalMinutes = Math.floor(seconds / 60);
  if (totalMinutes < 1) return "< 1 min";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours === 0 ? `${minutes} min` : `${hours} h ${String(minutes).padStart(2, "0")} min`;
}

/** Texto corto de la ETA para tablas y tarjetas. */
export function etaLabel(eta: EtaResult): string {
  switch (eta.kind) {
    case "not-loading":
      return "—";
    case "no-readings":
      return "Sin lecturas";
    case "complete":
      return "Completa";
    case "stalled":
      return "Caudal cero";
    case "estimate":
      return formatEtaSeconds(eta.seconds);
  }
}
