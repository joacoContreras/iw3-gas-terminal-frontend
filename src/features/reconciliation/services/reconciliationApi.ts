import { apiClient } from "@/services/api/client";
import { ReconciliationData } from "@/types/reconciliation";
import { MockStore } from "@/services/mock/mockStore";

export const reconciliationApi = {
  async getReconciliation(orderId: number): Promise<ReconciliationData> {
    try {
      return await apiClient<ReconciliationData>(`/orders/${orderId}/reconciliation`);
    } catch {
      return MockStore.getReconciliation(orderId);
    }
  },
};
