import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateEta,
  calculateElapsedTime,
  calculateReconciliationMetrics,
} from "./calculations.ts";

test("calculateEta returns correct remaining minutes with positive flow rate", () => {
  // Preset 10000 kg, loaded 4000 kg, remaining 6000 kg, flow 6000 kg/h -> 1 hour (60 min)
  const result = calculateEta(10000, 4000, 6000);
  assert.equal(result.remainingKg, 6000);
  assert.equal(result.remainingMinutes, 60);
  assert.equal(result.isComplete, false);
});

test("calculateEta handles completed load", () => {
  const result = calculateEta(10000, 10000, 5000);
  assert.equal(result.remainingKg, 0);
  assert.equal(result.remainingMinutes, 0);
  assert.equal(result.isComplete, true);
  assert.equal(result.statusText, "Carga completada");
});

test("calculateEta handles zero or negative flow rate gracefully", () => {
  const result = calculateEta(10000, 2000, 0);
  assert.equal(result.remainingKg, 8000);
  assert.equal(result.remainingMinutes, null);
  assert.equal(result.isComplete, false);
});

test("calculateReconciliationMetrics calculates net, diff and percentage correctly", () => {
  // Tara 15000 kg, Bruto 35000 kg -> Neto balanza 20000 kg
  // Medidor 19900 kg -> Desvío +100 kg (0.5%)
  const metrics = calculateReconciliationMetrics(15000, 35000, 19900);
  assert.equal(metrics.netByScale, 20000);
  assert.equal(metrics.productLoadedByMeter, 19900);
  assert.equal(metrics.differenceScaleVsMeter, 100);
  assert.equal(metrics.differencePercentage, 0.5);
});

test("calculateElapsedTime formats HH:MM:SS correctly", () => {
  const start = "2026-10-14T10:00:00.000Z";
  const end = "2026-10-14T11:15:30.000Z";
  const elapsed = calculateElapsedTime(start, end);
  assert.equal(elapsed.hours, 1);
  assert.equal(elapsed.minutes, 15);
  assert.equal(elapsed.seconds, 30);
  assert.equal(elapsed.formatted, "01:15:30");
});


