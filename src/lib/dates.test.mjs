import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { describe, test } from "node:test";

import {
  elapsedMillis,
  formatBackendDate,
  formatBackendDateTime,
  formatBackendTime,
  formatDuration,
  parseBackendDate,
} from "./dates.ts";

const iso = (value) => parseBackendDate(value)?.toISOString();

describe("parseBackendDate: las fechas sin zona del backend son hora de Argentina (UTC-3)", () => {
  test("fecha y hora: 10:30 de Argentina son las 13:30 UTC", () => {
    assert.equal(iso("2026-11-12T10:30:00"), "2026-11-12T13:30:00.000Z");
  });

  test("los microsegundos del backend se truncan a milisegundos", () => {
    assert.equal(iso("2026-11-12T14:20:06.801704"), "2026-11-12T17:20:06.801Z");
    assert.equal(iso("2026-11-12T14:20:06.5"), "2026-11-12T17:20:06.500Z");
    assert.equal(iso("2026-11-12T14:20:06.12"), "2026-11-12T17:20:06.120Z");
  });

  test("sin segundos y con espacio en lugar de la T", () => {
    assert.equal(iso("2026-11-12T10:30"), "2026-11-12T13:30:00.000Z");
    assert.equal(iso("2026-11-12 10:30:15"), "2026-11-12T13:30:15.000Z");
  });

  test("solo la fecha: medianoche de Argentina", () => {
    assert.equal(iso("2026-12-01"), "2026-12-01T03:00:00.000Z");
  });

  test("si ya trae zona se respeta (Z, ±hh:mm y ±hhmm)", () => {
    assert.equal(iso("2026-11-12T13:30:00Z"), "2026-11-12T13:30:00.000Z");
    assert.equal(iso("2026-11-12T10:30:00-03:00"), "2026-11-12T13:30:00.000Z");
    assert.equal(iso("2026-11-12T10:30:00+01:00"), "2026-11-12T09:30:00.000Z");
    assert.equal(iso("2026-11-12T10:30:00-0300"), "2026-11-12T13:30:00.000Z");
  });

  test("lo inválido da null (no una fecha rota)", () => {
    for (const malo of [null, undefined, "", "   ", "ayer", "12/11/2026", "2026-13-45T10:00:00", "2026-11-12T25:00:00", "20261112"]) {
      assert.equal(parseBackendDate(malo), null, String(malo));
    }
  });

  test("el resultado NO depende de la zona horaria del navegador (el error que se evita)", () => {
    const code = `import { parseBackendDate } from "./src/lib/dates.ts"; console.log(parseBackendDate("2026-11-12T10:30:00").toISOString());`;
    for (const tz of ["America/Argentina/Buenos_Aires", "UTC", "Asia/Tokyo", "Europe/Madrid", "America/New_York"]) {
      const out = execFileSync(process.execPath, ["--experimental-strip-types", "--input-type=module", "-e", code], {
        env: { ...process.env, TZ: tz },
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
      assert.equal(out, "2026-11-12T13:30:00.000Z", `TZ=${tz}`);
    }
  });
});

describe("formateo (siempre en hora de Argentina)", () => {
  test("fecha y hora, fecha y hora sola", () => {
    assert.equal(formatBackendDateTime("2026-11-12T14:20:06.801704"), "12/11/2026 14:20:06");
    assert.equal(formatBackendDate("2026-11-12T14:20:06"), "12/11/2026");
    assert.equal(formatBackendTime("2026-11-12T14:20:06"), "14:20:06");
  });

  test("medianoche y fin de año no se corren de día", () => {
    assert.equal(formatBackendDateTime("2026-12-31T23:59:59"), "31/12/2026 23:59:59");
    assert.equal(formatBackendDateTime("2027-01-01T00:00:00"), "01/01/2027 00:00:00");
  });

  test("un instante con zona se muestra en hora de Argentina", () => {
    assert.equal(formatBackendDateTime("2026-11-12T17:20:06Z"), "12/11/2026 14:20:06");
  });

  test("sin valor o inválido se muestra una raya, no 'Invalid Date'", () => {
    for (const malo of [null, undefined, "", "basura"]) {
      assert.equal(formatBackendDateTime(malo), "—");
      assert.equal(formatBackendDate(malo), "—");
      assert.equal(formatBackendTime(malo), "—");
    }
  });
});

describe("tiempo transcurrido", () => {
  // 10:00:00 de Argentina = 13:00:00 UTC
  const start = "2026-11-12T10:00:00";

  test("diferencia en milisegundos contra un instante dado", () => {
    assert.equal(elapsedMillis(start, Date.UTC(2026, 10, 12, 13, 15, 30)), (15 * 60 + 30) * 1000);
    assert.equal(elapsedMillis(start, new Date(Date.UTC(2026, 10, 12, 13, 0, 1))), 1000);
  });

  test("nunca es negativo (reloj del navegador atrasado)", () => {
    assert.equal(elapsedMillis(start, Date.UTC(2026, 10, 12, 12, 0, 0)), 0);
  });

  test("fecha inválida da null", () => {
    assert.equal(elapsedMillis(null), null);
    assert.equal(elapsedMillis("basura"), null);
  });

  test("por defecto usa la hora actual", () => {
    const ms = elapsedMillis("2000-01-01T00:00:00");
    assert.ok(ms > 25 * 365 * 24 * 3600 * 1000);
  });

  test("formatDuration: HH:MM:SS, las horas pueden pasar de 24", () => {
    assert.equal(formatDuration(0), "00:00:00");
    assert.equal(formatDuration(930_000), "00:15:30");
    assert.equal(formatDuration(3_661_000), "01:01:01");
    assert.equal(formatDuration(90_061_000), "25:01:01");
    assert.equal(formatDuration(999), "00:00:00");
  });

  test("formatDuration sin dato", () => {
    assert.equal(formatDuration(null), "--:--:--");
    assert.equal(formatDuration(Number.NaN), "--:--:--");
    assert.equal(formatDuration(-5000), "00:00:00");
  });
});
