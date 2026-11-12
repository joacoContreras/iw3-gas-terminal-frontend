import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  alarmsParams,
  clampPage,
  clampPageSize,
  emptyPage,
  hasNextPage,
  hasPreviousPage,
  ordersParams,
  pageRangeLabel,
} from "./api-query.ts";

describe("ordersParams (GET /orders)", () => {
  test("sin nada: no manda parámetros (el backend usa sus valores por defecto)", () => {
    assert.deepEqual(ordersParams(), { status: undefined, sort: undefined, page: undefined, size: undefined });
  });

  test("estado, orden y página", () => {
    assert.deepEqual(
      ordersParams({ status: 2, sort: { field: "plannedLoadDateTime", direction: "desc" }, page: 1, size: 50 }),
      { status: 2, sort: "plannedLoadDateTime,desc", page: 1, size: 50 },
    );
  });

  test("el formato del sort es campo,dirección", () => {
    assert.equal(ordersParams({ sort: { field: "orderNumber", direction: "asc" } }).sort, "orderNumber,asc");
    assert.equal(ordersParams({ sort: { field: "preset", direction: "desc" } }).sort, "preset,desc");
  });

  test("el tamaño se acota a 100 y la página a 0 como mínimo", () => {
    assert.equal(ordersParams({ size: 500 }).size, MAX_PAGE_SIZE);
    assert.equal(ordersParams({ size: 0 }).size, 1);
    assert.equal(ordersParams({ page: -3 }).page, 0);
  });
});

describe("alarmsParams (GET /alarms)", () => {
  test("filtros del contrato", () => {
    assert.deepEqual(alarmsParams({ status: "PENDING", orderNumber: 90001, page: 0, size: 10 }), {
      status: "PENDING",
      orderNumber: 90001,
      page: 0,
      size: 10,
    });
  });

  test("sin filtros no manda nada", () => {
    assert.deepEqual(alarmsParams(), { status: undefined, orderNumber: undefined, page: undefined, size: undefined });
  });
});

describe("límites de paginación", () => {
  test("clampPageSize", () => {
    assert.equal(clampPageSize(20), 20);
    assert.equal(clampPageSize(100), 100);
    assert.equal(clampPageSize(101), 100);
    assert.equal(clampPageSize(2.9), 2);
    assert.equal(clampPageSize(-5), 1);
    assert.equal(clampPageSize(Number.NaN), DEFAULT_PAGE_SIZE);
  });

  test("clampPage", () => {
    assert.equal(clampPage(3), 3);
    assert.equal(clampPage(-1), 0);
    assert.equal(clampPage(1.7), 1);
    assert.equal(clampPage(Number.NaN), 0);
  });

  test("los valores del backend", () => {
    assert.equal(DEFAULT_PAGE_SIZE, 20);
    assert.equal(MAX_PAGE_SIZE, 100);
  });
});

describe("ayudas de página", () => {
  const info = (number, totalPages, totalElements = 0, size = 20) => ({ size, number, totalElements, totalPages });

  test("hay página siguiente y anterior", () => {
    assert.equal(hasNextPage(info(0, 3)), true);
    assert.equal(hasNextPage(info(2, 3)), false);
    assert.equal(hasNextPage(info(0, 0)), false);
    assert.equal(hasPreviousPage(info(0, 3)), false);
    assert.equal(hasPreviousPage(info(1, 3)), true);
  });

  test("etiqueta del rango", () => {
    assert.equal(pageRangeLabel(info(0, 8, 154), 20), "1–20 de 154");
    assert.equal(pageRangeLabel(info(1, 8, 154), 20), "21–40 de 154");
    assert.equal(pageRangeLabel(info(7, 8, 154), 14), "141–154 de 154");
    assert.equal(pageRangeLabel(info(0, 0, 0), 0), "0 de 0");
  });

  test("página vacía inicial", () => {
    assert.deepEqual(emptyPage(), { content: [], page: { size: 20, number: 0, totalElements: 0, totalPages: 0 } });
    assert.equal(emptyPage(50).page.size, 50);
  });
});
