"use client";

import * as React from "react";
import { Alarm, AlarmConfig } from "@/types/alarm";
import { alarmsApi } from "../services/alarmsApi";

export function useAlarms(pollingIntervalMs: number = 5000) {
  const [alarms, setAlarms] = React.useState<Alarm[]>([]);
  const [config, setConfig] = React.useState<AlarmConfig | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [alarmsData, configData] = await Promise.all([
        alarmsApi.getAlarms(),
        alarmsApi.getAlarmConfig(),
      ]);
      setAlarms(alarmsData);
      setConfig(configData);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error al cargar alarmas");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData(false);
    const interval = setInterval(() => fetchData(true), pollingIntervalMs);
    return () => clearInterval(interval);
  }, [fetchData, pollingIntervalMs]);

  const pendingAlarms = alarms.filter((a) => a.status === "PENDING");

  const acknowledge = async (
    alarmId: number,
    username: string,
    observation?: string
  ) => {
    try {
      const updated = await alarmsApi.acknowledgeAlarm(alarmId, username, observation);
      setAlarms((prev) =>
        prev.map((a) => (a.id === alarmId ? updated : a))
      );
      return updated;
    } catch (err: any) {
      throw err;
    }
  };

  const updateConfig = async (newConfig: Partial<AlarmConfig>) => {
    try {
      const updated = await alarmsApi.updateAlarmConfig(newConfig);
      setConfig(updated);
      return updated;
    } catch (err: any) {
      throw err;
    }
  };

  return {
    alarms,
    pendingAlarms,
    pendingCount: pendingAlarms.length,
    config,
    isLoading,
    error,
    refetch: () => fetchData(false),
    acknowledge,
    updateConfig,
  };
}
