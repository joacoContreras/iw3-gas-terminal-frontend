import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  isValidEmail,
  MAX_OBSERVATION_LENGTH,
  MAX_RECIPIENT_EMAILS,
  validateObservation,
  validateRecipientEmails,
  validateThreshold,
} from "./alarm-validation.ts";

describe("isValidEmail", () => {
  test("valida correos estándar válidos", () => {
    assert.equal(isValidEmail("admin@iw3.local"), true);
    assert.equal(isValidEmail("seguridad.planta@terminal-gas.com.ar"), true);
    assert.equal(isValidEmail("user+alerts@empresa.org"), true);
  });

  test("rechaza correos inválidos o mal formados", () => {
    assert.equal(isValidEmail("sin-arroba.com"), false);
    assert.equal(isValidEmail("usuario@"), false);
    assert.equal(isValidEmail("@dominio.com"), false);
    assert.equal(isValidEmail("usuario@dominio"), false);
    assert.equal(isValidEmail(""), false);
    assert.equal(isValidEmail("  "), false);
  });
});

describe("validateThreshold", () => {
  test("números finitos válidos", () => {
    assert.equal(validateThreshold(25).valid, true);
    assert.equal(validateThreshold(30.5).valid, true);
    assert.equal(validateThreshold(0).valid, true);
    assert.equal(validateThreshold(-10).valid, true);
  });

  test("rechaza cadenas no numéricas, vacíos o infinitos", () => {
    assert.equal(validateThreshold("").valid, false);
    assert.equal(validateThreshold(null).valid, false);
    assert.equal(validateThreshold(undefined).valid, false);
    assert.equal(validateThreshold("abc").valid, false);
    assert.equal(validateThreshold(Number.NaN).valid, false);
    assert.equal(validateThreshold(Number.POSITIVE_INFINITY).valid, false);
  });

  test("rechaza temperaturas extremas fuera de rango operativo", () => {
    assert.equal(validateThreshold(250).valid, false);
    assert.equal(validateThreshold(-150).valid, false);
  });
});

describe("validateRecipientEmails", () => {
  test("lista vacía es válida según el contrato", () => {
    const res = validateRecipientEmails([]);
    assert.equal(res.valid, true);
    assert.deepEqual(res.sanitized, []);
  });

  test("lista con correos válidos se sanitiza (recorta espacios)", () => {
    const res = validateRecipientEmails(["  admin@iw3.local ", "guardia@terminal.com"]);
    assert.equal(res.valid, true);
    assert.deepEqual(res.sanitized, ["admin@iw3.local", "guardia@terminal.com"]);
  });

  test("detecta correos duplicados (case-insensitive)", () => {
    const res = validateRecipientEmails(["alertas@gas.com", "ALERTAS@gas.com"]);
    assert.equal(res.valid, false);
    assert.match(res.error, /repetido/i);
  });

  test("detecta correo con formato inválido", () => {
    const res = validateRecipientEmails(["valido@gas.com", "invalido"]);
    assert.equal(res.valid, false);
    assert.match(res.error, /no tiene un formato válido/i);
  });

  test("rechaza más de 20 correos", () => {
    const twentyOne = Array.from({ length: MAX_RECIPIENT_EMAILS + 1 }, (_, i) => `correo${i}@gas.com`);
    const res = validateRecipientEmails(twentyOne);
    assert.equal(res.valid, false);
    assert.match(res.error, /20 destinatarios/i);
  });
});

describe("validateObservation", () => {
  test("observación ausente o vacía es válida (es opcional)", () => {
    assert.equal(validateObservation(null).valid, true);
    assert.equal(validateObservation(undefined).valid, true);
    assert.equal(validateObservation("").valid, true);
  });

  test("observación normal es válida", () => {
    assert.equal(validateObservation("Se enfrió la línea y se restableció el caudal.").valid, true);
  });

  test("rechaza observaciones mayores a 500 caracteres", () => {
    const longObs = "a".repeat(MAX_OBSERVATION_LENGTH + 1);
    const res = validateObservation(longObs);
    assert.equal(res.valid, false);
    assert.match(res.error, /500 caracteres/i);
  });
});
