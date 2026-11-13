import { apiClient, apiRequest } from "@/services/api/client";
import type {
  ActivationRequest,
  ActivationResponse,
  Order,
  ReadingRequest,
  ReadingResponse,
  Reconciliation,
  SapOrderRequest,
  TareResponse,
  WeightRequest,
} from "@/types/api";

/**
 * Servicio de integración para el simulador contra el backend real (docs/contrato-api.md, sección 5).
 * Comunica con los endpoints externos (SAP, Balanza TMS y Sistema de Carga).
 * Requiere rol ADMIN (o los roles específicos de sistema).
 * Sin datos falsos ni mocks: todos los errores del backend se propagan como ApiError.
 */
export const simulatorApi = {
  /**
   * Punto 1: SAP (`POST /integration/sap/orders`).
   * Crea una orden en estado 1 (Pendiente de pesaje inicial).
   * Devuelve 201 con header Location. Si el orderNumber ya existe, el backend responde 302.
   */
  async createSapOrder(
    payload: SapOrderRequest
  ): Promise<{ orderNumber: number; location: string | null }> {
    const res = await apiRequest<void>("/integration/sap/orders", {
      method: "POST",
      json: payload,
    });
    const location = res.headers.get("Location") ?? res.headers.get("location");
    return { orderNumber: payload.orderNumber, location };
  },

  /**
   * Punto 2: Balanza TMS - Tara (`POST /integration/tms/orders/{orderNumber}/tare`).
   * Registra el pesaje inicial del camión vacío, pasa la orden a estado 2 y genera la contraseña de activación.
   */
  registerTare(orderNumber: number, weight: number): Promise<TareResponse> {
    const payload: WeightRequest = { weight };
    return apiClient<TareResponse>(`/integration/tms/orders/${orderNumber}/tare`, {
      method: "POST",
      json: payload,
    });
  },

  /**
   * Punto 3: Activación del cabezal de carga (`POST /integration/loader/activation`).
   * Valida la contraseña generada en la tara. Devuelve el preset en kg.
   * 403 si la contraseña es incorrecta; 409 si la orden no está en estado 2.
   */
  activateLoader(
    orderNumber: number,
    password: number
  ): Promise<ActivationResponse> {
    const payload: ActivationRequest = { orderNumber, password };
    return apiClient<ActivationResponse>("/integration/loader/activation", {
      method: "POST",
      json: payload,
    });
  },

  /**
   * Punto 3: Telemetría del caudalímetro (`POST /integration/loader/orders/{orderNumber}/details`).
   * Envía una lectura instantánea. Si temperatura > umbral, dispara la alarma por e-mail.
   * Devuelve siempre 200 con `{ saved, reason }`.
   */
  sendReading(
    orderNumber: number,
    reading: ReadingRequest
  ): Promise<ReadingResponse> {
    return apiClient<ReadingResponse>(
      `/integration/loader/orders/${orderNumber}/details`,
      {
        method: "POST",
        json: reading,
      }
    );
  },

  /**
   * Punto 4: Cierre de carga (`POST /integration/loader/orders/{orderNumber}/close`).
   * Pasa la orden de estado 2 a estado 3 (Cerrada para carga). No lleva cuerpo.
   */
  closeOrder(orderNumber: number): Promise<Order> {
    return apiClient<Order>(`/integration/loader/orders/${orderNumber}/close`, {
      method: "POST",
    });
  },

  /**
   * Punto 5: Balanza TMS - Pesaje final (`POST /integration/tms/orders/{orderNumber}/final-weight`).
   * Registra el camión cargado, pasa la orden a estado 4 (Finalizada) y devuelve la conciliación.
   */
  registerFinalWeight(
    orderNumber: number,
    weight: number
  ): Promise<Reconciliation> {
    const payload: WeightRequest = { weight };
    return apiClient<Reconciliation>(
      `/integration/tms/orders/${orderNumber}/final-weight`,
      {
        method: "POST",
        json: payload,
      }
    );
  },
};
