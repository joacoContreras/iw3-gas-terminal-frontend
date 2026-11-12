"use client";

import { usePolling } from "@/lib/use-polling";
import { emptyPage } from "@/lib/api-query";
import type { Order, OrderSortField, OrderStatusCode, Page, SortDirection } from "@/types/api";
import { ordersApi } from "../services/ordersApi";

export interface OrdersFilters {
  /** `undefined` = todas. */
  status?: OrderStatusCode;
  sort?: { field: OrderSortField; direction: SortDirection };
  /** Desde 0. */
  page: number;
  size: number;
}

/** Listado de órdenes del backend con filtro, orden y paginación en el servidor, actualizado por *polling*. */
export function useOrders(filters: OrdersFilters, pollingIntervalMs: number | null = 4000) {
  const { status, sort, page, size } = filters;
  const polling = usePolling<Page<Order>>(
    (signal) => ordersApi.getOrders({ status, sort, page, size }, signal),
    { intervalMs: pollingIntervalMs, resetKey: `${status ?? ""}|${sort?.field ?? ""},${sort?.direction ?? ""}|${page}|${size}` },
  );

  const result = polling.data ?? emptyPage<Order>(size);
  return { ...polling, orders: result.content, pageInfo: result.page };
}

/** Cantidad de órdenes por estado (`totalElements` de `GET /orders?status=N&size=1`): el backend no tiene un endpoint de conteo. */
export function useOrderCounts(pollingIntervalMs: number | null = 5000) {
  return usePolling<Record<OrderStatusCode, number>>(
    async (signal) => {
      const codes: OrderStatusCode[] = [1, 2, 3, 4];
      const pages = await Promise.all(codes.map((status) => ordersApi.getOrders({ status, size: 1 }, signal)));
      return { 1: pages[0].page.totalElements, 2: pages[1].page.totalElements, 3: pages[2].page.totalElements, 4: pages[3].page.totalElements };
    },
    { intervalMs: pollingIntervalMs, resetKey: "counts" },
  );
}
