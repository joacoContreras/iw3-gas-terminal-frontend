import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  calculateDifferencePercentage,
  calculateReconciliationMetrics,
  DEFAULT_RECONCILIATION_TOLERANCE_PERCENT,
  isWithinTolerance,
} from "./calculations.ts";

describe("calculateDifferencePercentage = (difference / scaleNet) * 100", () => {
  test("cálculo normal: 100 kg de desvío sobre 20000 kg neto = 0.5%", () => {
    assert.equal(calculateDifferencePercentage(100, 20000), 0.5);
  });

  test("desvío negativo: caudalímetro midió más que la balanza", () => {
    // diferencia = -50 kg, neto = 10000 kg -> -0.5%
    assert.equal(calculateDifferencePercentage(-50, 10000), -0.5);
  });

  test("diferencia exacta cero: 0%", () => {
    assert.equal(calculateDifferencePercentage(0, 15000), 0);
  });

  test("ejemplo real del contrato: 9.75 kg de diferencia sobre 4809.85 kg neto = 0.20%", () => {
    const scaleNet = 4809.8499999999985;
    const difference = 9.749999999998181;
    assert.equal(calculateDifferencePercentage(difference, scaleNet), 0.2);
  });

  test("división por cero: si el neto balanza es 0 o negativo devuelve null", () => {
    assert.equal(calculateDifferencePercentage(100, 0), null);
    assert.equal(calculateDifferencePercentage(100, -100), null);
  });

  test("valores no finitos devuelven null", () => {
    assert.equal(calculateDifferencePercentage(Number.NaN, 1000), null);
    assert.equal(calculateDifferencePercentage(100, Number.POSITIVE_INFINITY), null);
  });
});

describe("isWithinTolerance", () => {
  test("dentro de la tolerancia por defecto (±1.0%)", () => {
    assert.equal(isWithinTolerance(0.5), true);
    assert.equal(isWithinTolerance(-0.5), true);
    assert.equal(isWithinTolerance(1.0), true);
    assert.equal(isWithinTolerance(-1.0), true);
    assert.equal(isWithinTolerance(0), true);
  });

  test("fuera de la tolerancia estándar", () => {
    assert.equal(isWithinTolerance(1.01), false);
    assert.equal(isWithinTolerance(-1.5), false);
    assert.equal(isWithinTolerance(5.2), false);
  });

  test("porcentaje nulo no está dentro de tolerancia", () => {
    assert.equal(isWithinTolerance(null), false);
  });

  test("tolerancia personalizada", () => {
    assert.equal(isWithinTolerance(0.6, 0.5), false);
    assert.equal(isWithinTolerance(0.4, 0.5), true);
  });

  test("constante de tolerancia estándar exportada", () => {
    assert.equal(DEFAULT_RECONCILIATION_TOLERANCE_PERCENT, 1.0);
  });
});

describe("calculateReconciliationMetrics (compatibilidad)", () => {
  test("calcula neto, diferencia y porcentaje correctamente", () => {
    const metrics = calculateReconciliationMetrics(15000, 35000, 19900);
    assert.equal(metrics.netByScale, 20000);
    assert.equal(metrics.productLoadedByMeter, 19900);
    assert.equal(metrics.differenceScaleVsMeter, 100);
    assert.equal(metrics.differencePercentage, 0.5);
  });

  test("orden sin lecturas: loadedProduct = 0", () => {
    const metrics = calculateReconciliationMetrics(10000, 20000, 0);
    assert.equal(metrics.netByScale, 10000);
    assert.equal(metrics.productLoadedByMeter, 0);
    assert.equal(metrics.differenceScaleVsMeter, 10000);
    assert.equal(metrics.differencePercentage, 100);
  });
});
