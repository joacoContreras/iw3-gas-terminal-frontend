import { apiClient } from "@/services/api/client";
import { alarmsParams } from "@/lib/api-query";
import type { Page, TemperatureAlarm } from "@/types/api";
import { Alarm, AlarmConfig } from "@/types/alarm";
import { MockStore } from "@/services/mock/mockStore";

export const alarmsApi = {
  /** Cantidad de alarmas pendientes (`totalElements` de `GET /alarms?status=PENDING&size=1`). Contrato real, sin respaldo. */
  async countPending(signal?: AbortSignal): Promise<number> {
    const page = await apiClient<Page<TemperatureAlarm>>("/alarms", { params: alarmsParams({ status: "PENDING", size: 1 }), signal });
    return page.page.totalElements;
  },

  async getAlarms(): Promise<Alarm[]> {
    try {
      const data = await apiClient<unknown>("/alarms");
      // LEGACY (hasta la Fase 8): el backend real responde una página `{ content, page }`, no el arreglo que esta pantalla
      // espera. Sin esta guarda, `.filter` rompería la pantalla; la Fase 8 la reescribe con los tipos reales.
      return Array.isArray(data) ? (data as Alarm[]) : [];
    } catch {
      return MockStore.getAlarms();
    }
  },

  async acknowledgeAlarm(
    alarmId: number,
    username: string,
    observation?: string
  ): Promise<Alarm> {
    try {
      return await apiClient<Alarm>(`/alarms/${alarmId}/acknowledge`, {
        method: "POST",
        body: JSON.stringify({ username, observation }),
      });
    } catch {
      return MockStore.acknowledgeAlarm(alarmId, username, observation);
    }
  },

  async getAlarmConfig(): Promise<AlarmConfig> {
    try {
      return await apiClient<AlarmConfig>("/alarms/config");
    } catch {
      return MockStore.getAlarmConfig();
    }
  },

  async updateAlarmConfig(config: Partial<AlarmConfig>): Promise<AlarmConfig> {
    try {
      return await apiClient<AlarmConfig>("/alarms/config", {
        method: "PUT",
        body: JSON.stringify(config),
      });
    } catch {
      return MockStore.updateAlarmConfig(config);
    }
  },
};
