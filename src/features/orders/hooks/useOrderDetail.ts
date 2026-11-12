"use client";

import * as React from "react";
import { usePolling } from "@/lib/use-polling";
import { ordersApi } from "../services/ordersApi";
import { errorMessage } from "@/services/api/client";
import type { Order, OrderReading, OrderStatusLog, Page } from "@/types/api";

/** Mientras la orden está en carga (estado 2) llegan lecturas: se refresca seguido. En los demás estados, despacio. */
const LIVE_MS = 2000;
const IDLE_MS = 10000;

export const READINGS_PAGE_SIZE = 20;

/** La orden (`GET /orders/{n}`), refrescada por *polling*. */
export function useOrder(orderNumber: number) {
  return usePolling<Order>((signal) => ordersApi.getOrder(orderNumber, signal), {
    intervalMs: (order) => (order?.status === 2 ? LIVE_MS : IDLE_MS),
    resetKey: String(orderNumber),
    enabled: Number.isSafeInteger(orderNumber),
  });
}

/** Historial de estados; se vuelve a pedir cuando cambia el estado de la orden. */
export function useOrderStatusLog(orderNumber: number, status: number | undefined) {
  return usePolling<OrderStatusLog[]>((signal) => ordersApi.getStatusLog(orderNumber, signal), {
    intervalMs: null,
    resetKey: `${orderNumber}|${status}`,
    enabled: Number.isSafeInteger(orderNumber) && status !== undefined,
  });
}

/**
 * Lecturas guardadas (`GET /orders/{n}/details`, por `id` ascendente). `page = "last"` sigue las más recientes: pide la
 * primera página para saber cuántas hay y, si hay más de una, la última. Se refresca solo mientras hay carga en curso.
 */
export function useOrderReadings(orderNumber: number, page: number | "last", live: boolean) {
  return usePolling<Page<OrderReading>>(
    async (signal) => {
      if (page !== "last") return ordersApi.getReadings(orderNumber, page, READINGS_PAGE_SIZE, signal);
      const first = await ordersApi.getReadings(orderNumber, 0, READINGS_PAGE_SIZE, signal);
      if (first.page.totalPages <= 1) return first;
      return ordersApi.getReadings(orderNumber, first.page.totalPages - 1, READINGS_PAGE_SIZE, signal);
    },
    { intervalMs: live ? LIVE_MS + 1000 : null, resetKey: `${orderNumber}|${page}`, enabled: Number.isSafeInteger(orderNumber) },
  );
}

/** Cierre de la orden para carga (Punto 4). Muestra el mensaje real del backend (409 si ya no está en estado 2). */
export function useCloseOrder(orderNumber: number, onClosed: () => void) {
  const [isClosing, setIsClosing] = React.useState(false);
  const [closeError, setCloseError] = React.useState<string | null>(null);

  const close = React.useCallback(async () => {
    setIsClosing(true);
    setCloseError(null);
    try {
      await ordersApi.closeOrder(orderNumber);
    } catch (err) {
      setCloseError(errorMessage(err, "No se pudo cerrar la orden"));
    } finally {
      setIsClosing(false);
      onClosed(); // se vuelve a leer la orden: si el 409 fue porque otra persona la cerró, se ve el estado nuevo
    }
  }, [orderNumber, onClosed]);

  return { isClosing, closeError, close, clearCloseError: () => setCloseError(null) };
}
