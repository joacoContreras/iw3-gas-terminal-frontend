import assert from "node:assert/strict";
import test from "node:test";
import { calculateReconciliationMetrics } from "./calculations.ts";

test("calculateReconciliationMetrics calculates net, diff and percentage correctly", () => {
  // Tara 15000 kg, Bruto 35000 kg -> Neto balanza 20000 kg
  // Medidor 19900 kg -> Desvío +100 kg (0.5%)
  const metrics = calculateReconciliationMetrics(15000, 35000, 19900);
  assert.equal(metrics.netByScale, 20000);
  assert.equal(metrics.productLoadedByMeter, 19900);
  assert.equal(metrics.differenceScaleVsMeter, 100);
  assert.equal(metrics.differencePercentage, 0.5);
});
