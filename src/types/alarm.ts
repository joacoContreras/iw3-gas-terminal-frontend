export type AlarmStatus = "PENDING" | "ACKNOWLEDGED";

export interface Alarm {
  id: number;
  orderId: number;
  orderNumber: number;
  temperature: number;
  threshold: number;
  triggeredAt: string;
  status: AlarmStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  observation?: string;
}

export interface AlarmConfig {
  temperatureThreshold: number; // °C threshold to trigger email & alarm
  recipientEmails: string[]; // List of emails to notify
}

export interface AlarmAcknowledgePayload {
  username: string;
  observation?: string;
}
