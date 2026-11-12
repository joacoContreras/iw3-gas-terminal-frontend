/*
 * La ETA y el tiempo transcurrido de la carga viven ahora en `features/orders/lib/order-metrics.ts` y `lib/dates.ts`
 * (Fase 6). Lo que queda acá es de la conciliación y se reescribe en la Fase 7.
 */

/**
 * Calculates reconciliation metrics between scale and flow meter
 */
export function calculateReconciliationMetrics(
  initialWeightKg: number,
  finalWeightKg: number,
  meterLoadedKg: number
) {
  const netByScale = Math.max(0, (finalWeightKg || 0) - (initialWeightKg || 0));
  const productLoadedByMeter = Math.max(0, meterLoadedKg || 0);
  const difference = netByScale - productLoadedByMeter;
  const differencePercentage =
    netByScale > 0 ? (difference / netByScale) * 100 : 0;

  return {
    netByScale,
    productLoadedByMeter,
    differenceScaleVsMeter: difference,
    differencePercentage: Number(differencePercentage.toFixed(2)),
  };
}
