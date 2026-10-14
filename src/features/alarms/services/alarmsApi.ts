import { apiClient } from "@/services/api/client";
import { Alarm, AlarmConfig } from "@/types/alarm";
import { MockStore } from "@/services/mock/mockStore";

export const alarmsApi = {
  async getAlarms(): Promise<Alarm[]> {
    try {
      return await apiClient<Alarm[]>("/alarms");
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
