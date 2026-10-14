"use client";

import * as React from "react";
import { Order, OrderState } from "@/types/order";
import { ordersApi } from "../services/ordersApi";

export function useOrders(pollingIntervalMs: number = 4000) {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filterState, setFilterState] = React.useState<OrderState | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");

  const fetchOrders = React.useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const data = await ordersApi.getOrders({
        state: filterState === "ALL" ? undefined : filterState,
        search: searchQuery || undefined,
      });
      setOrders(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error al cargar órdenes");
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [filterState, searchQuery]);

  React.useEffect(() => {
    fetchOrders(false);

    const interval = setInterval(() => {
      fetchOrders(true);
    }, pollingIntervalMs);

    return () => clearInterval(interval);
  }, [fetchOrders, pollingIntervalMs]);

  return {
    orders,
    isLoading,
    error,
    filterState,
    setFilterState,
    searchQuery,
    setSearchQuery,
    refetch: () => fetchOrders(false),
  };
}
