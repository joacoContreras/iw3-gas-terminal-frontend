import type { AlarmConfig, ApiErrorBody, Order, OrderReading, OrderStatusLog, Page, Reconciliation, TemperatureAlarm } from "./index";

/**
 * Ejemplos REALES del backend (copiados de docs/contrato-api.md, sección 4), anotados con los tipos de `@/types/api`.
 *
 * Sirven de guardia: si un tipo se desvía del JSON verdadero (campo de más, de menos o de otro tipo), el chequeo de
 * tipos de `next build` falla. También los usan las pruebas como cuerpos de respuesta de un `fetch` simulado.
 * Cuando el backend cambie, se actualiza el contrato y estos ejemplos.
 */

export const orderInLoadingExample: Order = {
  id: 195,
  orderNumber: 1794504006,
  truck: {
    id: 26,
    externalCode: "ALM-TRK",
    plate: "AL123RM",
    description: null,
    tanks: [{ id: 39, number: 1, capacityLiters: 10000.0 }],
  },
  driver: { id: 25, externalCode: "ALM-DRV", name: "Ana", lastName: "Prueba", document: null },
  customer: { id: 24, externalCode: "ALM-CUS", companyName: "Gas de Prueba SA", contact: null },
  product: { id: 15, externalCode: "ALM-PRD", name: "GLP", description: null },
  plannedLoadDateTime: "2026-12-01T08:00:00",
  preset: 15000.0,
  status: 2,
  receptionDateTime: "2026-11-12T14:20:06.801704",
  tare: 14500.0,
  initialWeighingDateTime: "2026-11-12T14:20:06.929927",
  activationDateTime: "2026-11-12T14:20:07.054442",
  loadingStartDateTime: "2026-11-12T14:20:07.174519",
  loadingEndDateTime: "2026-11-12T14:20:08.396331",
  lastAccumulatedMass: 400.0,
  lastDensity: 0.5,
  lastTemperature: 31.0,
  lastFlowRate: 3000.0,
  finalWeight: null,
  finalWeighingDateTime: null,
};

export const ordersPageExample: Page<Order> = {
  content: [orderInLoadingExample],
  page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
};

export const readingsPageExample: Page<OrderReading> = {
  content: [
    { id: 339, accumulatedMass: 100.0, density: 0.5, temperature: 20.0, flowRate: 3000.0, timestamp: "2026-11-12T14:20:07.174519" },
    { id: 340, accumulatedMass: 200.0, density: 0.5, temperature: 26.0, flowRate: 3000.0, timestamp: "2026-11-12T14:20:07.409915" },
  ],
  page: { size: 2, number: 0, totalElements: 4, totalPages: 2 },
};

export const statusLogExample: OrderStatusLog[] = [
  { id: 232, fromStatus: null, toStatus: 1, dateTime: "2026-11-02T17:47:24.947429", actor: "admin", observations: "Orden recibida desde el sistema externo" },
  { id: 233, fromStatus: 1, toStatus: 2, dateTime: "2026-11-02T17:47:25.786172", actor: "admin", observations: "Tara registrada: 14500.5 kg" },
  { id: 234, fromStatus: 2, toStatus: 3, dateTime: "2026-11-02T17:47:26.944369", actor: "admin", observations: "Orden cerrada para carga" },
  { id: 235, fromStatus: 3, toStatus: 4, dateTime: "2026-11-02T17:47:27.179272", actor: "admin", observations: "Pesaje final registrado" },
];

export const reconciliationExample: Reconciliation = {
  orderNumber: 652444947,
  tare: 14500.5,
  finalWeight: 19310.35,
  loadedProduct: 4800.1,
  scaleNet: 4809.8499999999985,
  difference: 9.749999999998181,
  averageTemperature: 19.15,
  averageDensity: 0.51875,
  averageFlowRate: 3532.675,
};

export const alarmsPageExample: Page<TemperatureAlarm> = {
  content: [
    {
      id: 13,
      orderNumber: 1794504006,
      temperature: 31.0,
      threshold: 25.0,
      status: "PENDING",
      triggeredAt: "2026-11-12T14:20:08.410944",
      emailSentAt: null,
      acknowledgedBy: null,
      acknowledgedAt: null,
      observation: null,
    },
  ],
  page: { size: 1, number: 0, totalElements: 13, totalPages: 13 },
};

export const alarmConfigExample: AlarmConfig = { recipientEmails: [], temperatureThreshold: 30.0 };

export const unauthorizedErrorExample: ApiErrorBody = { message: "Falta el token o es inválido", code: 401, devInfo: null };
export const forbiddenErrorExample: ApiErrorBody = { message: "No tiene permisos para realizar esta operación", code: 403, devInfo: null };
export const notFoundErrorExample: ApiErrorBody = { message: "No se encuentra la Orden numero=1", code: 404, devInfo: null };
