import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

import { PERMISSIONS, ROLE_LABELS, ROLE_NAMES, can, hasAnyRole, normalizeRole, primaryRole } from "./permissions.ts";

/** Roles por endpoint, leídos de la tabla de la sección 3 de docs/contrato-api.md. */
function contractRoles() {
  const doc = readFileSync(new URL("../../../../docs/contrato-api.md", import.meta.url), "utf8");
  const map = new Map();
  for (const line of doc.split("\n")) {
    const m = line.match(/^\| `((?:GET|POST|PUT|DELETE) [^`]+)` \| ([^|]+) \|/);
    if (m) map.set(m[1], m[2].split(",").map((r) => r.trim()));
  }
  return map;
}

describe("la tabla de permisos coincide con el contrato del backend", () => {
  const roles = contractRoles();

  test("se leyeron los 17 endpoints de la matriz", () => {
    assert.equal(roles.size, 17);
  });

  for (const [permission, def] of Object.entries(PERMISSIONS)) {
    test(`${permission}: roles = los de todos sus endpoints`, () => {
      assert.ok(def.endpoints.length > 0);
      let common = null;
      for (const endpoint of def.endpoints) {
        const r = roles.get(endpoint);
        assert.ok(r, `el endpoint ${endpoint} no está en el contrato`);
        common = common === null ? new Set(r) : new Set([...common].filter((x) => r.includes(x)));
      }
      assert.deepEqual([...def.roles].sort(), [...common].sort());
    });
  }
});

describe("hasAnyRole / can", () => {
  test("acepta el rol con o sin prefijo ROLE_", () => {
    assert.equal(normalizeRole("ROLE_ADMIN"), "ADMIN");
    assert.equal(normalizeRole("ADMIN"), "ADMIN");
    assert.equal(hasAnyRole(["ROLE_SUPERVISOR"], ["ADMIN", "SUPERVISOR"]), true);
    assert.equal(hasAnyRole(["ROLE_OPERADOR"], ["ROLE_ADMIN"]), false);
  });

  test("sin roles no se puede nada", () => {
    for (const p of Object.keys(PERMISSIONS)) assert.equal(can([], p), false, p);
  });

  test("un rol inventado o parecido no concede nada", () => {
    for (const r of ["ROLE_ADMINISTRATOR", "ROLE_admin", "ROLE_", "", "ADMIN_", "ROLE_ROLE_ADMIN"]) {
      assert.equal(can([r], "orders:view"), false, r);
    }
  });

  test("ADMIN puede todo", () => {
    for (const p of Object.keys(PERMISSIONS)) assert.equal(can(["ROLE_ADMIN"], p), true, p);
  });

  test("SUPERVISOR acepta alarmas y mira la configuración, pero no la edita ni usa el simulador", () => {
    const r = ["ROLE_SUPERVISOR"];
    assert.equal(can(r, "alarms:acknowledge"), true);
    assert.equal(can(r, "alarms:config:view"), true);
    assert.equal(can(r, "alarms:config:edit"), false);
    assert.equal(can(r, "simulator:use"), false);
  });

  test("OPERADOR ve y cierra órdenes, ve alarmas pero no las acepta", () => {
    const r = ["ROLE_OPERADOR"];
    assert.equal(can(r, "orders:view"), true);
    assert.equal(can(r, "orders:close"), true);
    assert.equal(can(r, "alarms:view"), true);
    assert.equal(can(r, "alarms:acknowledge"), false);
    assert.equal(can(r, "alarms:config:view"), false);
  });

  test("los sistemas y USER no ven las pantallas de personas; LOADER solo puede cerrar la orden", () => {
    for (const r of ["ROLE_SAP", "ROLE_TMS", "ROLE_USER"]) {
      for (const p of Object.keys(PERMISSIONS)) assert.equal(can([r], p), false, `${r} ${p}`);
    }
    assert.equal(can(["ROLE_LOADER"], "orders:close"), true);
    assert.equal(can(["ROLE_LOADER"], "orders:view"), false);
  });

  test("con varios roles alcanza con que uno lo permita", () => {
    assert.equal(can(["ROLE_USER", "ROLE_SUPERVISOR"], "alarms:acknowledge"), true);
  });
});

describe("primaryRole", () => {
  test("elige el de mayor jerarquía", () => {
    assert.equal(primaryRole(["ROLE_OPERADOR", "ROLE_ADMIN"]), "ADMIN");
    assert.equal(primaryRole(["ROLE_USER", "ROLE_OPERADOR"]), "OPERADOR");
  });
  test("sin roles reconocidos es null", () => {
    assert.equal(primaryRole([]), null);
    assert.equal(primaryRole(["ROLE_X"]), null);
  });
  test("todos los roles tienen etiqueta", () => {
    for (const r of ROLE_NAMES) assert.ok(ROLE_LABELS[r].length > 3, r);
  });
});
