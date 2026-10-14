"use client";

import * as React from "react";
import { Order } from "@/types/order";
import { ordersApi } from "../services/ordersApi";

export function useOrderDetail(orderId: number) {
  const [order, setOrder] = React.useState<Order | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isClosing, setIsClosing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchOrder = React.useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      try {
        const data = await ordersApi.getOrderById(orderId);
        setOrder(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Error al cargar el detalle de la orden");
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [orderId]
  );

  React.useEffect(() => {
    fetchOrder(false);

    // If order is active in state 2 (loading), poll every 1.5 seconds for live telemetry!
    let interval: NodeJS.Timeout | null = null;
    interval = setInterval(() => {
      fetchOrder(true);
    }, 1500);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchOrder]);

  const closeCurrentOrder = async () => {
    if (!order) return;
    setIsClosing(true);
    try {
      const updated = await ordersApi.closeOrder(order.id);
      setOrder(updated);
    } catch (err: any) {
      setError(err.message || "No se pudo cerrar la orden");
      throw err;
    } finally {
      setIsClosing(false);
    }
  };

  return {
    order,
    isLoading,
    isClosing,
    error,
    refetch: () => fetchOrder(false),
    closeCurrentOrder,
  };
}
