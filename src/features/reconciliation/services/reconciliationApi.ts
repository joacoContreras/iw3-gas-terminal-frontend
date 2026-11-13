import { apiClient } from "@/services/api/client";
import type { Reconciliation } from "@/types/api";

/**
 * Conciliación contra el backend real (`GET /orders/{orderNumber}/reconciliation`).
 * Punto 5: balanza vs. caudalímetro másico. Solo disponible para órdenes en estado 4 (finalizadas);
 * otros estados responden 409 con el mensaje del backend.
 */
export const reconciliationApi = {
  getReconciliation(orderNumber: number, signal?: AbortSignal): Promise<Reconciliation> {
    return apiClient<Reconciliation>(`/orders/${orderNumber}/reconciliation`, { signal });
  },
};
