import type { Order, OrdersQuery } from "../../../types/api/order";
import type { Page } from "../../../types/api/common";

/** Evita retroceder cuando el polling todavía trae una masa anterior a la última lectura aceptada. */
export function nextAccumulatedMass(serverMass: number | null, acceptedMass: number, increment: number, preset: number): number {
  const current = Math.max(serverMass ?? 0, acceptedMass);
  // Si otro emisor ya superó el preset, no enviar una masa menor a la recibida.
  return Number(Math.max(current, Math.min(preset, current + increment)).toFixed(3));
}

/** kg/h → kg durante el intervalo simulado. Los botones manuales permiten acelerar la demostración. */
export function massForInterval(flowRate: number, intervalMs: number): number {
  return flowRate * intervalMs / 3_600_000;
}

/** Recorre todas las páginas activas: una orden nunca desaparece por quedar fuera de las primeras 100. */
export async function loadSimulatorOrders(
  getPage: (query: OrdersQuery, signal: AbortSignal) => Promise<Page<Order>>,
  signal: AbortSignal,
): Promise<Order[]> {
  const groups = await Promise.all(([1, 2, 3] as const).map(async (status) => {
    const orders: Order[] = [];
    let page = 0;
    let totalPages = 1;
    while (page < totalPages) {
      signal.throwIfAborted();
      const result = await getPage({ status, page, size: 100 }, signal);
      orders.push(...result.content);
      totalPages = result.page.totalPages;
      page++;
    }
    return orders;
  }));
  return Array.from(new Map(groups.flat().map((order) => [order.orderNumber, order])).values());
}
