"use client";

import * as React from "react";
import { alarmsApi } from "../services/alarmsApi";
import { useAuth } from "@/features/auth/context/AuthContext";
import { usePolling } from "@/lib/use-polling";
import type {
  AlarmConfig,
  AlarmStatus,
  AlarmsQuery,
  Page,
  TemperatureAlarm,
} from "@/types/api";

export interface UseAlarmsOptions {
  /** Filtro de estado: 'ALL' (todas las alarmas), 'PENDING' o 'ACKNOWLEDGED'. */
  status?: AlarmStatus | "ALL";
  orderNumber?: number;
  page?: number;
  size?: number;
  /** Intervalo en ms para el refresco en segundo plano (por defecto 5000 ms). */
  pollingIntervalMs?: number | null;
  /** Cargar configuración global si el rol lo permite (por defecto true). */
  loadConfig?: boolean;
}

interface AlarmsAggregateData {
  alarmsPage: Page<TemperatureAlarm>;
  pendingPage: Page<TemperatureAlarm>;
  config: AlarmConfig | null;
}

export function useAlarms(options: UseAlarmsOptions = {}) {
  const {
    status = "ALL",
    orderNumber,
    page = 0,
    size = 20,
    pollingIntervalMs = 5000,
    loadConfig = true,
  } = options;

  const { can } = useAuth();
  const canViewAlarms = can("alarms:view");
  const canViewConfig = can("alarms:config:view");

  const queryStatus: AlarmStatus | undefined =
    status === "ALL" ? undefined : status;

  const resetKey = `${canViewAlarms ? "view" : "no"}-${status}-${page}-${size}-${orderNumber ?? ""}`;

  const fetcher = React.useCallback(
    async (signal: AbortSignal): Promise<AlarmsAggregateData> => {
      if (!canViewAlarms) {
        return {
          alarmsPage: {
            content: [],
            page: { size, number: 0, totalElements: 0, totalPages: 0 },
          },
          pendingPage: {
            content: [],
            page: { size: 10, number: 0, totalElements: 0, totalPages: 0 },
          },
          config: null,
        };
      }

      const query: AlarmsQuery = {
        status: queryStatus,
        orderNumber,
        page,
        size,
      };

      const [alarmsPage, pendingPage, config] = await Promise.all([
        alarmsApi.getAlarms(query, signal),
        // Consultamos las pendientes para el banner global y la campana de notificación
        queryStatus === "PENDING" && page === 0
          ? Promise.resolve({ content: [], page: { size: 10, number: 0, totalElements: 0, totalPages: 0 } })
          : alarmsApi.getAlarms({ status: "PENDING", page: 0, size: 10 }, signal),
        canViewConfig && loadConfig
          ? alarmsApi.getAlarmConfig(signal).catch(() => null)
          : Promise.resolve(null),
      ]);

      return {
        alarmsPage,
        pendingPage: queryStatus === "PENDING" && page === 0 ? alarmsPage : pendingPage,
        config,
      };
    },
    [canViewAlarms, canViewConfig, queryStatus, orderNumber, page, size, loadConfig]
  );

  const polling = usePolling<AlarmsAggregateData>(fetcher, {
    intervalMs: pollingIntervalMs,
    resetKey,
    enabled: canViewAlarms,
  });

  const alarmsPage = polling.data?.alarmsPage ?? null;
  const alarms = alarmsPage?.content ?? [];
  const pendingPage = polling.data?.pendingPage ?? null;
  const pendingAlarms = pendingPage?.content ?? [];
  const pendingCount = pendingPage?.page.totalElements ?? 0;
  const config = polling.data?.config ?? null;

  const acknowledge = React.useCallback(
    async (alarmId: number, observation?: string): Promise<TemperatureAlarm> => {
      const updated = await alarmsApi.acknowledgeAlarm(alarmId, observation);
      polling.refetch();
      return updated;
    },
    [polling]
  );

  const updateConfig = React.useCallback(
    async (newConfig: AlarmConfig): Promise<AlarmConfig> => {
      const updated = await alarmsApi.updateAlarmConfig(newConfig);
      polling.refetch();
      return updated;
    },
    [polling]
  );

  return {
    alarms,
    alarmsPage,
    pendingAlarms,
    pendingCount,
    config,
    isLoading: polling.isLoading && !polling.data,
    isRefreshing: polling.isLoading,
    error: polling.error,
    errorStatus: polling.errorStatus,
    updatedAt: polling.updatedAt,
    refetch: polling.refetch,
    acknowledge,
    updateConfig,
  };
}
