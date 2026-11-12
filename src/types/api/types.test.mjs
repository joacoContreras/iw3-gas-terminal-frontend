import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { ALARM_STATUSES } from "./alarm.ts";
import {
  alarmConfigExample,
  alarmsPageExample,
  orderInLoadingExample,
  reconciliationExample,
  statusLogExample,
} from "./contract-examples.ts";
import { ORDER_SORT_FIELDS, ORDER_STATUS_CODES, ORDER_STATUS_LABELS } from "./order.ts";

/**
 * Lo que un tipo de TypeScript no puede garantizar en tiempo de ejecución: las constantes que repiten reglas del contrato
 * y la coherencia de los ejemplos reales. (La forma de cada objeto la verifica el chequeo de tipos de `next build`.)
 */
describe("constantes del contrato", () => {
  test("los cuatro estados de la orden y sus etiquetas", () => {
    assert.deepEqual([...ORDER_STATUS_CODES], [1, 2, 3, 4]);
    for (const code of ORDER_STATUS_CODES) assert.ok(ORDER_STATUS_LABELS[code].length > 5, String(code));
    assert.equal(ORDER_STATUS_LABELS[1], "Pendiente de pesaje inicial");
    assert.equal(ORDER_STATUS_LABELS[4], "Finalizada");
  });

  test("los campos de orden son EXACTAMENTE los que el backend permite (otro da 400)", () => {
    assert.deepEqual([...ORDER_SORT_FIELDS].sort(), ["orderNumber", "plannedLoadDateTime", "preset", "receptionDateTime", "status"]);
  });

  test("los estados de alarma", () => {
    assert.deepEqual([...ALARM_STATUSES], ["PENDING", "ACKNOWLEDGED"]);
  });
});

describe("ejemplos reales del backend", () => {
  test("una orden en carga (estado 2) tiene los datos de la carga y no tiene el peso final", () => {
    const o = orderInLoadingExample;
    assert.equal(o.status, 2);
    assert.ok(o.tare !== null && o.loadingStartDateTime !== null && o.lastTemperature !== null);
    assert.equal(o.finalWeight, null);
    assert.equal("activationPassword" in o, false, "la contraseña de activación no se publica");
  });

  test("la conciliación es coherente: neto = final − tara y diferencia = neto − producto cargado", () => {
    const r = reconciliationExample;
    assert.ok(Math.abs(r.scaleNet - (r.finalWeight - r.tare)) < 1e-9);
    assert.ok(Math.abs(r.difference - (r.scaleNet - r.loadedProduct)) < 1e-9);
  });

  test("el historial de estados es secuencial y la primera fila no tiene estado anterior", () => {
    assert.equal(statusLogExample[0].fromStatus, null);
    for (let i = 1; i < statusLogExample.length; i++) {
      assert.equal(statusLogExample[i].fromStatus, statusLogExample[i - 1].toStatus);
      assert.ok(statusLogExample[i].toStatus > statusLogExample[i].fromStatus);
    }
  });

  test("una alarma pendiente no tiene datos de aceptación", () => {
    const a = alarmsPageExample.content[0];
    assert.equal(a.status, "PENDING");
    assert.ok(a.temperature > a.threshold);
    assert.equal(a.acknowledgedBy, null);
  });

  test("la configuración de la alarma", () => {
    assert.equal(typeof alarmConfigExample.temperatureThreshold, "number");
    assert.ok(Array.isArray(alarmConfigExample.recipientEmails));
  });
});
