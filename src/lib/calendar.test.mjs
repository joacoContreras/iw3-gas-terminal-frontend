import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calendarWeeks, shiftCalendarDay, shiftCalendarMonth } from "./calendar.ts";

describe("calendario de programación", () => {
  it("completa semanas de lunes a domingo entre meses y años", () => {
    const weeks = calendarWeeks("2026-12-01");
    assert.equal(weeks[0][0], "2026-11-30");
    assert.equal(weeks.at(-1).at(-1), "2027-01-03");
    assert.ok(weeks.every((week) => week.length === 7));
    assert.equal(new Set(weeks.flat()).size, 35);
  });
  it("incluye el 29 de febrero únicamente en años bisiestos", () => {
    assert.ok(calendarWeeks("2028-02-01").flat().includes("2028-02-29"));
    assert.ok(!calendarWeeks("2100-02-01").flat().includes("2100-02-29"));
  });
  it("conserva el día al cambiar de mes y lo limita al último día válido", () => {
    assert.equal(shiftCalendarMonth("2028-01-31", 1), "2028-02-29");
    assert.equal(shiftCalendarMonth("2026-03-31", -1), "2026-02-28");
    assert.equal(shiftCalendarMonth("2026-12-15", 1), "2027-01-15");
  });
  it("recorre días y semanas sin depender de la zona horaria del navegador", () => {
    assert.equal(shiftCalendarDay("2026-12-31", 1), "2027-01-01");
    assert.equal(shiftCalendarDay("2028-03-01", -1), "2028-02-29");
    assert.equal(shiftCalendarDay("2026-11-25", -7), "2026-11-18");
  });
});
