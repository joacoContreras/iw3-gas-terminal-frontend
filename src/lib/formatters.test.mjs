import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { formatDensity, formatFlowRate, formatKg, formatLiters, formatTemperature } from "./formatters.ts";

/** Node puede dar el espacio fino o el espacio duro según la versión de ICU: se normaliza antes de comparar. */
const norm = (s) => s.replace(/[  ]/g, " ");

describe("formato es-AR de las medidas", () => {
  test("kilogramos con punto de miles y coma decimal", () => {
    assert.equal(norm(formatKg(15000)), "15.000 kg");
    assert.equal(norm(formatKg(4809.85)), "4.809,9 kg");
    assert.equal(norm(formatKg(0)), "0 kg");
    assert.equal(norm(formatKg(-8600)), "-8.600 kg");
  });

  test("temperatura con uno o dos decimales", () => {
    assert.equal(norm(formatTemperature(31)), "31,0 °C");
    assert.equal(norm(formatTemperature(19.15)), "19,15 °C");
  });

  test("densidad sin unidad (el contrato solo dice «entre 0 y 1»)", () => {
    assert.equal(formatDensity(0.5), "0,500");
    assert.equal(formatDensity(0.51875), "0,5188");
    assert.ok(!/kg|m³/.test(formatDensity(0.5)));
  });

  test("caudal y litros", () => {
    assert.equal(norm(formatFlowRate(3532.675)), "3.532,7 kg/h");
    assert.equal(norm(formatLiters(18000)), "18.000 L");
  });
});

describe("un dato inexistente es una raya, nunca un cero", () => {
  const formatters = { formatKg, formatTemperature, formatDensity, formatFlowRate, formatLiters };
  for (const [name, fn] of Object.entries(formatters)) {
    test(name, () => {
      for (const missing of [null, undefined, Number.NaN]) assert.equal(fn(missing), "—", `${name}(${missing})`);
    });
  }

  test("el cero real SÍ se muestra (una medición de 0 °C no es «sin dato»)", () => {
    assert.equal(norm(formatTemperature(0)), "0,0 °C");
    assert.equal(norm(formatKg(0)), "0 kg");
  });
});
