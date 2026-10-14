import { apiClient } from "@/services/api/client";
import { Order } from "@/types/order";
import { TelemetryPayload } from "@/types/telemetry";
import { MockStore } from "@/services/mock/mockStore";

export const simulatorApi = {
  async createSapOrder(payload: Partial<Order>): Promise<Order> {
    try {
      return await apiClient<Order>("/integration/sap/order", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch {
      return MockStore.createOrderFromSap(payload);
    }
  },

  async sendInitialWeight(orderId: number, initialWeight: number): Promise<Order> {
    try {
      return await apiClient<Order>("/integration/tms/tare", {
        method: "POST",
        body: JSON.stringify({ orderId, initialWeight }),
      });
    } catch {
      return MockStore.registerInitialWeight(orderId, initialWeight);
    }
  },

  async activatePumpWithPin(orderCode: string | number, password: string): Promise<{ preset: number }> {
    try {
      return await apiClient<{ preset: number }>("/integration/pump/auth", {
        method: "POST",
        body: JSON.stringify({ orderCode, password }),
      });
    } catch {
      return MockStore.activateLoadWithPassword(orderCode, password);
    }
  },

  async streamTelemetry(orderId: number, payload: TelemetryPayload): Promise<Order> {
    try {
      return await apiClient<Order>("/integration/pump/telemetry", {
        method: "POST",
        body: JSON.stringify({ orderId, ...payload }),
      });
    } catch {
      return MockStore.receiveTelemetry(orderId, payload);
    }
  },

  async sendFinalWeight(orderId: number, finalWeight: number) {
    try {
      return await apiClient(`/integration/tms/final-weight`, {
        method: "POST",
        body: JSON.stringify({ orderId, finalWeight }),
      });
    } catch {
      return MockStore.registerFinalWeight(orderId, finalWeight);
    }
  },
};
