import { apiClient } from "@/services/api/client";
import { Order } from "@/types/order";
import { MockStore } from "@/services/mock/mockStore";

export const ordersApi = {
  async getOrders(params?: { state?: number; search?: string }): Promise<Order[]> {
    try {
      return await apiClient<Order[]>("/orders", { params });
    } catch {
      // Offline / fallback to in-memory store
      let orders = MockStore.getOrders();
      if (params?.state) {
        orders = orders.filter((o) => o.state === Number(params.state));
      }
      if (params?.search) {
        const query = params.search.toLowerCase();
        orders = orders.filter(
          (o) =>
            o.orderNumber.toString().includes(query) ||
            o.truck.patent.toLowerCase().includes(query) ||
            o.customer.businessName.toLowerCase().includes(query) ||
            o.driver.name.toLowerCase().includes(query) ||
            o.driver.lastName.toLowerCase().includes(query)
        );
      }
      return orders;
    }
  },

  async getOrderById(id: number): Promise<Order> {
    try {
      return await apiClient<Order>(`/orders/${id}`);
    } catch {
      const order = MockStore.getOrderById(id);
      if (!order) throw new Error(`Orden #${id} no encontrada`);
      return order;
    }
  },

  async closeOrder(id: number): Promise<Order> {
    try {
      return await apiClient<Order>(`/orders/${id}/close`, {
        method: "POST",
      });
    } catch {
      return MockStore.closeOrder(id);
    }
  },
};
