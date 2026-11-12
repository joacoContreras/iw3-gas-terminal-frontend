import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { loadingElapsedMillis } from "../../../lib/dates.ts";
import { calculateEta, etaLabel, formatEtaSeconds, loadProgress } from "./order-metrics.ts";

const loading = { status: 2, preset: 15000, accumulatedMass: 5000, flowRate: 3000 };

describe("calculateEta = (preset − masa acumulada) / caudal", () => {
  test("cálculo manual: faltan 10000 kg a 3000 kg/h = 3 h 20 min", () => {
    const eta = calculateEta(loading);
    assert.equal(eta.kind, "estimate");
    assert.equal(eta.remainingKg, 10000);
    assert.equal(eta.seconds, 12000);
    assert.equal(etaLabel(eta), "3 h 20 min");
  });

  test("con los datos reales del contrato (orden de ejemplo): 14600 kg a 3000 kg/h", () => {
    const eta = calculateEta({ status: 2, preset: 15000, accumulatedMass: 400, flowRate: 3000 });
    assert.equal(eta.seconds, Math.round((14600 / 3000) * 3600));
    assert.equal(etaLabel(eta), "4 h 52 min");
  });

  test("solo existe en estado 2: en 1, 3 y 4 no hay estimación", () => {
    for (const status of [1, 3, 4]) assert.deepEqual(calculateEta({ ...loading, status }), { kind: "not-loading" });
    assert.equal(etaLabel({ kind: "not-loading" }), "—");
  });

  test("sin lecturas todavía (campos nulos) no inventa un tiempo", () => {
    const eta = calculateEta({ status: 2, preset: 15000, accumulatedMass: null, flowRate: null });
    assert.deepEqual(eta, { kind: "no-readings", remainingKg: 15000 });
    assert.equal(etaLabel(eta), "Sin lecturas");
  });

  test("carga completa: exactamente el preset o más", () => {
    assert.deepEqual(calculateEta({ ...loading, accumulatedMass: 15000 }), { kind: "complete", remainingKg: 0 });
    assert.equal(calculateEta({ ...loading, accumulatedMass: 15200 }).kind, "complete");
  });

  test("caudal cero, negativo o ausente: no se puede estimar (sin dividir por cero)", () => {
    for (const flowRate of [0, -5, null, Number.NaN]) {
      const eta = calculateEta({ ...loading, flowRate });
      assert.equal(eta.kind, "stalled", String(flowRate));
      assert.equal(eta.remainingKg, 10000);
    }
    assert.equal(etaLabel({ kind: "stalled", remainingKg: 1 }), "Caudal cero");
  });

  test("falta poco: menos de un minuto", () => {
    const eta = calculateEta({ ...loading, accumulatedMass: 14999, flowRate: 3000 });
    assert.equal(eta.kind, "estimate");
    assert.equal(etaLabel(eta), "< 1 min");
  });
});

describe("formatEtaSeconds", () => {
  test("minutos y horas", () => {
    assert.equal(formatEtaSeconds(30), "< 1 min");
    assert.equal(formatEtaSeconds(60), "1 min");
    assert.equal(formatEtaSeconds(59 * 60), "59 min");
    assert.equal(formatEtaSeconds(3600), "1 h 00 min");
    assert.equal(formatEtaSeconds(3600 + 5 * 60 + 59), "1 h 05 min");
  });
});

describe("loadProgress", () => {
  test("porcentaje entre 0 y 100", () => {
    assert.equal(loadProgress(10000, 2500), 25);
    assert.equal(loadProgress(10000, 12000), 100);
    assert.equal(loadProgress(10000, -5), 0);
  });
  test("sin preset o sin lecturas es 0", () => {
    assert.equal(loadProgress(0, 100), 0);
    assert.equal(loadProgress(10000, null), 0);
  });
});

describe("tiempo transcurrido: solo en estado 2", () => {
  const start = "2026-11-12T10:00:00"; // hora de Argentina = 13:00 UTC
  const now = Date.UTC(2026, 10, 12, 14, 15, 30);

  test("estado 2: desde el inicio de la carga", () => {
    assert.equal(loadingElapsedMillis(2, start, now), (1 * 3600 + 15 * 60 + 30) * 1000);
  });

  test("estados 1, 3 y 4: no se muestra (null)", () => {
    for (const status of [1, 3, 4]) assert.equal(loadingElapsedMillis(status, start, now), null, String(status));
  });

  test("estado 2 sin inicio de carga todavía: null", () => {
    assert.equal(loadingElapsedMillis(2, null, now), null);
  });

  test("no depende de la zona horaria del navegador (usa la de Argentina)", () => {
    const saved = process.env.TZ;
    for (const tz of ["UTC", "Asia/Tokyo", "America/Los_Angeles"]) {
      process.env.TZ = tz;
      assert.equal(loadingElapsedMillis(2, start, now), 4_530_000, tz);
    }
    process.env.TZ = saved;
  });

  test("un reloj atrasado respecto del servidor nunca da un tiempo negativo", () => {
    assert.equal(loadingElapsedMillis(2, start, Date.UTC(2026, 10, 12, 12, 0, 0)), 0);
  });
});
