"use client";

import * as React from "react";
import { ReconciliationData } from "@/types/reconciliation";
import { reconciliationApi } from "../services/reconciliationApi";

export function useReconciliation(orderId: number) {
  const [data, setData] = React.useState<ReconciliationData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchReconciliation = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await reconciliationApi.getReconciliation(orderId);
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error al obtener conciliación");
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  React.useEffect(() => {
    fetchReconciliation();
  }, [fetchReconciliation]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchReconciliation,
  };
}
