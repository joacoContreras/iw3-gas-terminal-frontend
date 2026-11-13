/**
 * Métricas y cálculos derivados de la conciliación (Fase 7).
 *
 * En el backend (docs/contrato-api.md, sección 4.5):
 * - `scaleNet = finalWeight - tare`
 * - `difference = scaleNet - loadedProduct`
 *
 * El porcentaje de desvío NO viene del backend: se calcula en el frontend como:
 * `(difference / scaleNet) * 100` (consigna 4f y contrato congelado).
 */

/** Tolerancia estándar típica en terminales de gas licuado: ±1.0%. */
export const DEFAULT_RECONCILIATION_TOLERANCE_PERCENT = 1.0;

/**
 * Calcula el porcentaje de diferencia balanza vs. caudalímetro:
 * `(difference / scaleNet) * 100`
 *
 * Devuelve `null` si el neto por balanza es 0 o negativo, o si los valores no son finitos.
 * Redondea a 2 decimales para evitar problemas de coma flotante.
 */
export function calculateDifferencePercentage(
  difference: number,
  scaleNet: number
): number | null {
  if (!Number.isFinite(difference) || !Number.isFinite(scaleNet) || scaleNet <= 0) {
    return null;
  }
  const pct = (difference / scaleNet) * 100;
  return Number.isFinite(pct) ? Number(pct.toFixed(2)) : null;
}

/**
 * Comprueba si el porcentaje de desvío está dentro de la tolerancia admitida.
 * Devuelve `false` si el porcentaje es `null` o no numérico.
 */
export function isWithinTolerance(
  differencePercentage: number | null,
  tolerancePercent: number = DEFAULT_RECONCILIATION_TOLERANCE_PERCENT
): boolean {
  if (differencePercentage === null || !Number.isFinite(differencePercentage)) {
    return false;
  }
  return Math.abs(differencePercentage) <= tolerancePercent;
}

/**
 * Cálculo integral de conciliación a partir de pesajes y masa cargada.
 * Mantiene compatibilidad con módulos y pruebas existentes.
 */
export function calculateReconciliationMetrics(
  initialWeightKg: number,
  finalWeightKg: number,
  meterLoadedKg: number
) {
  const netByScale = Math.max(0, (finalWeightKg || 0) - (initialWeightKg || 0));
  const productLoadedByMeter = Math.max(0, meterLoadedKg || 0);
  const difference = netByScale - productLoadedByMeter;
  const differencePercentage = calculateDifferencePercentage(difference, netByScale) ?? 0;

  return {
    netByScale,
    productLoadedByMeter,
    differenceScaleVsMeter: difference,
    differencePercentage,
  };
}
