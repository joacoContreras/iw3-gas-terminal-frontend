import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { massForInterval, nextAccumulatedMass, loadSimulatorOrders } from "./simulation.ts";

describe("progreso confirmado del simulador", () => {
  test("una respuesta del polling atrasada no repite ni reduce la masa aceptada", () => {
    assert.equal(nextAccumulatedMass(0, 500, 500, 1500), 1000);
    assert.equal(nextAccumulatedMass(500, 1000, 500, 1500), 1500);
  });
  test("incorpora una lectura más reciente enviada por otro emisor", () => {
    assert.equal(nextAccumulatedMass(1200, 500, 100, 1500), 1300);
  });
  test("limita el último incremento al preset", () => {
    assert.equal(nextAccumulatedMass(null, 0, 2000, 1500), 1500);
  });
  test("si el backend ya superó el preset no retrocede", () => {
    assert.equal(nextAccumulatedMass(1600, 1500, 500, 1500), 1600);
  });
  test("redondea a gramos sin acumular ruido de coma flotante", () => {
    assert.equal(nextAccumulatedMass(0.1, 0, 0.2, 100), 0.3);
  });
  test("el caudal en kg/h determina la masa por intervalo", () => {
    assert.equal(massForInterval(12000, 1500), 5);
    assert.equal(massForInterval(3600, 1000), 1);
    assert.equal(massForInterval(0, 1500), 0);
  });
});

describe("órdenes activas paginadas del simulador", () => {
  test("incluye las órdenes después de la primera página de cada estado", async () => {
    const calls = [];
    const signal = new AbortController().signal;
    const result = await loadSimulatorOrders(async (query, receivedSignal) => {
      calls.push(query);
      assert.equal(receivedSignal, signal);
      const count = query.status === 2 ? 2 : 1;
      return {
        content: [{ orderNumber: query.status * 1000 + query.page, status: query.status }],
        page: { totalPages: count },
      };
    }, signal);
    assert.deepEqual(result.map((o) => o.orderNumber), [1000, 2000, 2001, 3000]);
    assert.equal(calls.length, 4);
    assert.ok(calls.every((q) => q.size === 100 && q.status !== 4));
  });
  test("no duplica una orden que cambia de estado entre consultas", async () => {
    const result = await loadSimulatorOrders(async (query) => ({
      content: query.status === 3 ? [] : [{ orderNumber: 42, status: query.status }],
      page: { totalPages: 1 },
    }), new AbortController().signal);
    assert.equal(result.length, 1);
    assert.equal(result[0].status, 2);
  });
  test("propaga el error sin devolver un listado parcial que parezca válido", async () => {
    const failure = new Error("Sin conexión");
    await assert.rejects(loadSimulatorOrders(async () => { throw failure; }, new AbortController().signal), (err) => err === failure);
  });
  test("respeta la cancelación antes de pedir otra página", async () => {
    const controller = new AbortController();
    controller.abort();
    let calls = 0;
    await assert.rejects(loadSimulatorOrders(async () => { calls++; }, controller.signal), { name: "AbortError" });
    assert.equal(calls, 0);
  });
});
