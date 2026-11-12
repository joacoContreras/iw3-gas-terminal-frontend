import type { LocalDateTime } from "./common";

/** `PENDING` hasta que un usuario autorizado (ADMIN o SUPERVISOR) la acepta. */
export type AlarmStatus = "PENDING" | "ACKNOWLEDGED";

export const ALARM_STATUSES: readonly AlarmStatus[] = ["PENDING", "ACKNOWLEDGED"];

/**
 * Alarma de temperatura (`GET /alarms`). Una sola pendiente por orden: mientras exista no se crea ni se avisa otra.
 * `emailSentAt` nulo significa que el correo **no salió** (todavía, o porque el servidor de correo falló; no se reintenta):
 * la interfaz debe mostrarlo.
 */
export interface TemperatureAlarm {
  id: number;
  orderNumber: number;
  /** Temperatura (°C) de la lectura que la disparó. */
  temperature: number;
  /** Umbral vigente cuando se disparó (°C). */
  threshold: number;
  status: AlarmStatus;
  triggeredAt: LocalDateTime;
  emailSentAt: LocalDateTime | null;
  /** Usuario que la aceptó (sale del token). */
  acknowledgedBy: string | null;
  acknowledgedAt: LocalDateTime | null;
  observation: string | null;
}

/** `GET` y `PUT /alarms/config` (el `PUT` solo para ADMIN y reemplaza todo). */
export interface AlarmConfig {
  /** Se alarma cuando la temperatura lo supera estrictamente. Número finito. */
  temperatureThreshold: number;
  /** Hasta 20, sin repetidos y con formato de correo válido; puede ser vacía. */
  recipientEmails: string[];
}

/** Cuerpo opcional de `POST /alarms/{id}/acknowledge`. El usuario NO viaja acá: sale del token. */
export interface AlarmAckRequest {
  /** Máximo 500 caracteres. */
  observation?: string;
}

/** Parámetros de `GET /alarms`. */
export interface AlarmsQuery {
  status?: AlarmStatus;
  orderNumber?: number;
  page?: number;
  size?: number;
}
