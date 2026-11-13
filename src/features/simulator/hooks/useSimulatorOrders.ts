"use client";

import * as React from "react";
import { ordersApi } from "@/features/orders/services/ordersApi";
import { usePolling } from "@/lib/use-polling";
import { loadSimulatorOrders } from "../lib/simulation";
import type { Order } from "@/types/api";

/**
 * Mantiene los selectores con todas las órdenes activas, recorriendo las páginas de cada estado.
 * Utiliza polling inteligente (pausado en pestaña oculta) para refrescar los selectores.
 */
export function useSimulatorOrders(pollingIntervalMs: number = 3000) {
  const fetcher = React.useCallback((signal: AbortSignal) => {
    return loadSimulatorOrders(ordersApi.getOrders, signal);
  }, []);

  const polling = usePolling(fetcher, {
    intervalMs: pollingIntervalMs,
    resetKey: "simulator-orders",
  });

  const orders: Order[] = polling.data ?? [];

  return {
    orders,
    isLoading: polling.isLoading && !polling.data,
    error: polling.error,
    refetch: polling.refetch,
  };
}
