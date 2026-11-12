"use client";

import * as React from "react";
import { Alarm, AlarmConfig } from "@/types/alarm";
import { alarmsApi } from "../services/alarmsApi";
import { useAuth } from "@/features/auth/context/AuthContext";

export function useAlarms(pollingIntervalMs: number = 5000) {
  const [alarms, setAlarms] = React.useState<Alarm[]>([]);
  const [config, setConfig] = React.useState<AlarmConfig | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Solo se piden los datos que el rol puede ver: el backend respondería 403 y el polling lo repetiría cada 5 s.
  const { can } = useAuth();
  const canViewAlarms = can("alarms:view");
  const canViewConfig = can("alarms:config:view");

  const fetchData = React.useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [alarmsData, configData] = await Promise.all([
        canViewAlarms ? alarmsApi.getAlarms() : Promise.resolve([]),
        canViewConfig ? alarmsApi.getAlarmConfig() : Promise.resolve(null),
      ]);
      setAlarms(alarmsData);
      setConfig(configData);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error al cargar alarmas");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [canViewAlarms, canViewConfig]);

  React.useEffect(() => {
    if (!canViewAlarms) {
      setIsLoading(false);
      return;
    }
    fetchData(false);
    const interval = setInterval(() => fetchData(true), pollingIntervalMs);
    return () => clearInterval(interval);
  }, [fetchData, canViewAlarms, pollingIntervalMs]);

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
