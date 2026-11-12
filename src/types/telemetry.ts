export interface TelemetryPayload {
  accumulatedMass: number; // kg (> 0 and increasing)
  density: number; // kg/m³ (between 0 and 1)
  temperature: number; // °C
  flowRate: number; // kg/h (> 0)
}
