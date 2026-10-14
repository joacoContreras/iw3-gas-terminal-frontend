import type { EtaResult, ElapsedTimeResult } from "../types/telemetry";

/**
 * Calculates Estimated Time of Arrival / Completion (ETA)
 * Formula per spec:
 * Preset (kg)
 * Accumulated mass (kg)
 * Flow rate (kg/h)
 *
 * Remaining kg = Preset - Accumulated mass
 * If flow rate > 0 and remaining > 0: Time = Remaining / Flow rate (hours)
 */
export function calculateEta(
  presetKg: number,
  accumulatedMassKg: number,
  flowRateKgH: number
): EtaResult {
  const safePreset = Math.max(0, presetKg || 0);
  const safeLoaded = Math.max(0, accumulatedMassKg || 0);
  const remainingKg = Math.max(0, safePreset - safeLoaded);

  if (safeLoaded >= safePreset && safePreset > 0) {
    return {
      remainingKg: 0,
      totalPresetKg: safePreset,
      currentLoadedKg: safeLoaded,
      flowRateKgH: flowRateKgH || 0,
      remainingMinutes: 0,
      statusText: "Carga completada",
      isComplete: true,
    };
  }

  if (!flowRateKgH || flowRateKgH <= 0) {
    return {
      remainingKg,
      totalPresetKg: safePreset,
      currentLoadedKg: safeLoaded,
      flowRateKgH: 0,
      remainingMinutes: null,
      statusText: "En espera / Caudal cero",
      isComplete: false,
    };
  }

  const hoursRemaining = remainingKg / flowRateKgH;
  const minutesRemaining = Math.round(hoursRemaining * 60);

  return {
    remainingKg,
    totalPresetKg: safePreset,
    currentLoadedKg: safeLoaded,
    flowRateKgH,
    remainingMinutes: minutesRemaining,
    statusText: minutesRemaining < 1 ? "< 1 min restante" : `~${minutesRemaining} min restantes`,
    isComplete: false,
  };
}

/**
 * Calculates elapsed time from load start timestamp
 */
export function calculateElapsedTime(
  startTimeIso?: string,
  endTimeIso?: string
): ElapsedTimeResult {
  if (!startTimeIso) {
    return { hours: 0, minutes: 0, seconds: 0, formatted: "--:--:--" };
  }

  const startMs = new Date(startTimeIso).getTime();
  const endMs = endTimeIso ? new Date(endTimeIso).getTime() : Date.now();

  if (isNaN(startMs)) {
    return { hours: 0, minutes: 0, seconds: 0, formatted: "--:--:--" };
  }

  const diffSec = Math.max(0, Math.floor((endMs - startMs) / 1000));
  const hours = Math.floor(diffSec / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");
  const formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return { hours, minutes, seconds, formatted };
}

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
