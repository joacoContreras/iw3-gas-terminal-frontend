import { apiClient } from "@/services/api/client";
import { alarmsParams } from "@/lib/api-query";
import type {
  AlarmAckRequest,
  AlarmConfig,
  AlarmsQuery,
  Page,
  TemperatureAlarm,
} from "@/types/api";

/**
 * Servicio de alarmas contra el backend real (docs/contrato-api.md).
 * Sin datos de respaldo ni mocks. Todos los errores se propagan como ApiError.
 */
export const alarmsApi = {
  /**
   * `GET /alarms`: listado paginado de alarmas, orden descendente fijo por fecha de disparo.
   * Filtros opcionales: `status` ('PENDING' | 'ACKNOWLEDGED'), `orderNumber`, `page`, `size` (máx 100).
   */
  getAlarms(
    query: AlarmsQuery = {},
    signal?: AbortSignal
  ): Promise<Page<TemperatureAlarm>> {
    return apiClient<Page<TemperatureAlarm>>("/alarms", {
      params: alarmsParams(query),
      signal,
    });
  },

  /** Cantidad de alarmas pendientes (`totalElements` de `GET /alarms?status=PENDING&size=1`). */
  async countPending(signal?: AbortSignal): Promise<number> {
    const page = await apiClient<Page<TemperatureAlarm>>("/alarms", {
      params: alarmsParams({ status: "PENDING", size: 1 }),
      signal,
    });
    return page.page.totalElements;
  },

  /**
   * `POST /alarms/{id}/acknowledge`: acepta una alarma pendiente.
   * Roles autorizados: ADMIN y SUPERVISOR.
   * D-5: Quien acepta sale del token JWT (el backend extrae el claim `sub`).
   */
  acknowledgeAlarm(
    alarmId: number,
    observation?: string
  ): Promise<TemperatureAlarm> {
    const payload: AlarmAckRequest =
      observation && observation.trim().length > 0
        ? { observation: observation.trim() }
        : {};
    return apiClient<TemperatureAlarm>(`/alarms/${alarmId}/acknowledge`, {
      method: "POST",
      json: payload,
    });
  },

  /** `GET /alarms/config`: obtiene la configuración vigente (roles ADMIN y SUPERVISOR). */
  getAlarmConfig(signal?: AbortSignal): Promise<AlarmConfig> {
    return apiClient<AlarmConfig>("/alarms/config", { signal });
  },

  /** `PUT /alarms/config`: actualiza el umbral y destinatarios (solo rol ADMIN). */
  updateAlarmConfig(config: AlarmConfig): Promise<AlarmConfig> {
    return apiClient<AlarmConfig>("/alarms/config", {
      method: "PUT",
      json: config,
    });
  },
};
