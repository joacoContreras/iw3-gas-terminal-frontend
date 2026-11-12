import { apiClient } from "@/services/api/client";
import { ordersParams } from "@/lib/api-query";
import type { Order, OrderReading, OrderStatusLog, OrdersQuery, Page } from "@/types/api";

/**
 * Órdenes contra el backend real (contrato: `docs/contrato-api.md`). Sin datos de respaldo: si algo falla, el error
 * (`ApiError` con el mensaje real) llega a la pantalla. Las órdenes se identifican por `orderNumber`, no por `id`.
 */
export const ordersApi = {
  /** `GET /orders`: filtro por `status`, orden `campo,dirección`, `page` y `size` (máx. 100). */
  getOrders(query: OrdersQuery = {}, signal?: AbortSignal): Promise<Page<Order>> {
    return apiClient<Page<Order>>("/orders", { params: ordersParams(query), signal });
  },

  /** `GET /orders/{orderNumber}`. 404 si no existe. */
  getOrder(orderNumber: number, signal?: AbortSignal): Promise<Order> {
    return apiClient<Order>(`/orders/${orderNumber}`, { signal });
  },

  /** `GET /orders/{orderNumber}/status-log`: del cambio más antiguo al más reciente. */
  getStatusLog(orderNumber: number, signal?: AbortSignal): Promise<OrderStatusLog[]> {
    return apiClient<OrderStatusLog[]>(`/orders/${orderNumber}/status-log`, { signal });
  },

  /** `GET /orders/{orderNumber}/details`: lecturas guardadas, por `id` ascendente. */
  getReadings(orderNumber: number, page: number, size: number, signal?: AbortSignal): Promise<Page<OrderReading>> {
    return apiClient<Page<OrderReading>>(`/orders/${orderNumber}/details`, { params: { page, size }, signal });
  },

  /**
   * `POST /integration/loader/orders/{orderNumber}/close` (Punto 4): sin cuerpo; devuelve la orden en estado 3.
   * 409 si la orden no está en estado 2 (por ejemplo, ya la cerró otra persona).
   */
  closeOrder(orderNumber: number): Promise<Order> {
    return apiClient<Order>(`/integration/loader/orders/${orderNumber}/close`, { method: "POST" });
  },
};
