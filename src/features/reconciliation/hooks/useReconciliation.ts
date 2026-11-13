"use client";

import * as React from "react";
import { ordersApi } from "@/features/orders/services/ordersApi";
import { reconciliationApi } from "../services/reconciliationApi";
import {
  calculateDifferencePercentage,
  isWithinTolerance,
} from "@/lib/calculations";
import { errorMessage, isApiError } from "@/services/api/client";
import type { Order, Reconciliation } from "@/types/api";

export interface ReconciliationDataBundle {
  reconciliation: Reconciliation;
  order: Order;
  differencePercentage: number | null;
  isToleranceOk: boolean;
  hasReadings: boolean;
}

export function useReconciliation(orderNumber: number) {
  const [data, setData] = React.useState<ReconciliationDataBundle | null>(null);
  const [order, setOrder] = React.useState<Order | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [errorStatus, setErrorStatus] = React.useState<number | null>(null);

  const fetchReconciliation = React.useCallback(async () => {
    if (Number.isNaN(orderNumber) || orderNumber <= 0) {
      setIsLoading(false);
      setError("Número de orden inválido");
      setErrorStatus(400);
      return;
    }

    setIsLoading(true);
    setError(null);
    setErrorStatus(null);

    const controller = new AbortController();

    try {
      const [orderRes, reconciliationRes] = await Promise.all([
        ordersApi.getOrder(orderNumber, controller.signal),
        reconciliationApi.getReconciliation(orderNumber, controller.signal),
      ]);

      setOrder(orderRes);

      const diffPct = calculateDifferencePercentage(
        reconciliationRes.difference,
        reconciliationRes.scaleNet
      );
      const toleranceOk = isWithinTolerance(diffPct);
      const hasReadings =
        reconciliationRes.loadedProduct > 0 ||
        reconciliationRes.averageTemperature !== null;

      setData({
        reconciliation: reconciliationRes,
        order: orderRes,
        differencePercentage: diffPct,
        isToleranceOk: toleranceOk,
        hasReadings,
      });
    } catch (err) {
      if (controller.signal.aborted) return;
      const status = isApiError(err) ? err.status : 0;
      setErrorStatus(status);
      setError(errorMessage(err));
      setData(null);

      // Si falló la conciliación (por ejemplo 409 porque no está en estado 4),
      // intentamos cargar la orden por separado para dar contexto de su estado real.
      try {
        const fallbackOrder = await ordersApi.getOrder(orderNumber);
        setOrder(fallbackOrder);
      } catch {
        // Ignorar si la orden tampoco pudo cargarse (p. ej. 404)
      }
    } finally {
      setIsLoading(false);
    }
  }, [orderNumber]);

  React.useEffect(() => {
    fetchReconciliation();
  }, [fetchReconciliation]);

  return {
    data,
    order,
    isLoading,
    error,
    errorStatus,
    refetch: fetchReconciliation,
  };
}
