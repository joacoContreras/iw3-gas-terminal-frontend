import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { decodeTokenPayload, isExpired, msUntilExpiry, parseTokenClaims, sessionFromToken } from "./session.ts";

const b64url = (value) => Buffer.from(typeof value === "string" ? value : JSON.stringify(value), "utf8").toString("base64url");
const makeToken = (payload) => `${b64url({ alg: "HS512", typ: "JWT" })}.${b64url(payload)}.firma`;

const NOW = Date.UTC(2026, 10, 12, 15, 0, 0);
const inSeconds = (s) => Math.floor(NOW / 1000) + s;
const adminPayload = { sub: "admin", roles: ["ROLE_ADMIN"], email: "admin@gas.com", version: "1.0", exp: inSeconds(3600) };

describe("decodeTokenPayload", () => {
  test("lee el payload de un token real (base64url, sin relleno)", () => {
    assert.deepEqual(decodeTokenPayload(makeToken(adminPayload)), adminPayload);
  });

  test("respeta los caracteres con tilde (UTF-8)", () => {
    assert.equal(decodeTokenPayload(makeToken({ ...adminPayload, sub: "perez_ñandú" })).sub, "perez_ñandú");
  });

  test("rechaza lo que no es un JWT", () => {
    const malos = ["", "abc", "a.b", "a.b.c.d", "a..c", "demo-jwt-token-terminal-admin", "x.%%%.z", `a.${b64url("no es json")}.c`];
    for (const bad of malos) {
      assert.equal(decodeTokenPayload(bad), null, bad);
    }
  });

  test("rechaza un payload que no es un objeto", () => {
    assert.equal(decodeTokenPayload(makeToken([1, 2])), null);
    assert.equal(decodeTokenPayload(`a.${b64url("7")}.c`), null);
    assert.equal(decodeTokenPayload(`a.${b64url("null")}.c`), null);
  });
});

describe("parseTokenClaims", () => {
  test("devuelve los claims", () => {
    assert.deepEqual(parseTokenClaims(makeToken(adminPayload)), adminPayload);
  });

  test("sin email ni version: email null, version indefinida", () => {
    const c = parseTokenClaims(makeToken({ sub: "sap", roles: ["ROLE_SAP"], exp: inSeconds(10) }));
    assert.equal(c.email, null);
    assert.equal(c.version, undefined);
  });

  test("sin roles queda una lista vacía; con roles mal formados se rechaza", () => {
    assert.deepEqual(parseTokenClaims(makeToken({ sub: "x", exp: inSeconds(10) })).roles, []);
    assert.equal(parseTokenClaims(makeToken({ sub: "x", exp: inSeconds(10), roles: "ROLE_ADMIN" })), null);
    assert.equal(parseTokenClaims(makeToken({ sub: "x", exp: inSeconds(10), roles: [1] })), null);
  });

  test("exige sub (texto no vacío) y exp (número finito)", () => {
    assert.equal(parseTokenClaims(makeToken({ roles: [], exp: inSeconds(10) })), null);
    assert.equal(parseTokenClaims(makeToken({ sub: "", roles: [], exp: inSeconds(10) })), null);
    assert.equal(parseTokenClaims(makeToken({ sub: "x", roles: [] })), null);
    assert.equal(parseTokenClaims(makeToken({ sub: "x", roles: [], exp: "9999999999" })), null);
  });
});

describe("vencimiento", () => {
  test("isExpired: vence en el mismo instante del exp", () => {
    assert.equal(isExpired(NOW + 1, NOW), false);
    assert.equal(isExpired(NOW, NOW), true);
    assert.equal(isExpired(NOW - 1, NOW), true);
  });

  test("msUntilExpiry nunca es negativo", () => {
    assert.equal(msUntilExpiry({ expiresAt: NOW + 5000 }, NOW), 5000);
    assert.equal(msUntilExpiry({ expiresAt: NOW - 5000 }, NOW), 0);
  });
});

describe("sessionFromToken", () => {
  test("un token vigente da la sesión, con el vencimiento en milisegundos", () => {
    const s = sessionFromToken(makeToken(adminPayload), NOW);
    assert.equal(s.username, "admin");
    assert.equal(s.email, "admin@gas.com");
    assert.deepEqual(s.roles, ["ROLE_ADMIN"]);
    assert.equal(s.expiresAt, adminPayload.exp * 1000);
  });

  test("tolera espacios o saltos de línea alrededor del token (el login devuelve texto)", () => {
    const token = makeToken(adminPayload);
    assert.equal(sessionFromToken(`  ${token}\n`, NOW).token, token);
  });

  test("un token vencido NO se restaura", () => {
    assert.equal(sessionFromToken(makeToken({ ...adminPayload, exp: inSeconds(-1) }), NOW), null);
    assert.equal(sessionFromToken(makeToken({ ...adminPayload, exp: inSeconds(0) }), NOW), null);
  });

  test("el token de demo del código viejo y cualquier basura se rechazan", () => {
    for (const bad of ["demo-jwt-token-terminal-admin", "", "   ", "null", undefined, null, 42]) {
      assert.equal(sessionFromToken(bad, NOW), null, String(bad));
    }
  });
});
