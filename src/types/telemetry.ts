export interface TelemetryPayload {
  accumulatedMass: number; // kg (> 0 and increasing)
  density: number; // kg/m³ (between 0 and 1)
  temperature: number; // °C
  flowRate: number; // kg/h (> 0)
}

export interface EtaResult {
  remainingKg: number;
  totalPresetKg: number;
  currentLoadedKg: number;
  flowRateKgH: number;
  remainingMinutes: number | null;
  statusText: string;
  isComplete: boolean;
}

export interface ElapsedTimeResult {
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
}
