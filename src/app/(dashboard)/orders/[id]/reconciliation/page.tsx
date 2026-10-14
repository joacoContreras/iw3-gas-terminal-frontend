"use client";

import * as React from "react";
import Link from "next/link";
import { useReconciliation } from "@/features/reconciliation/hooks/useReconciliation";
import { ReconciliationSummary } from "@/features/reconciliation/components/reconciliation-summary";
import { ReconciliationMetrics } from "@/features/reconciliation/components/reconciliation-metrics";
import { ReconciliationTicket } from "@/features/reconciliation/components/reconciliation-ticket";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";

function OrderReconciliationContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = React.use(params);
  const orderId = Number(resolvedParams.id);

  const { data, isLoading, error, refetch } = useReconciliation(orderId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-center">
        <RefreshCw className="h-8 w-8 animate-spin text-violet-600 mb-3" />
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Calculando conciliación para la orden #{orderId}...
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-12 text-center space-y-4 max-w-md mx-auto">
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Conciliación No Disponible
        </h3>
        <p className="text-xs text-zinc-500">
          {error || "La conciliación sólo se encuentra disponible para órdenes que se encuentren en Estado 4 (Finalizadas con pesaje final registrado)."}
        </p>
        <Link href={`/orders/${orderId}`}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Volver al Detalle de la Orden
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={`/orders/${orderId}`}
              className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-black font-mono tracking-tight text-zinc-900 dark:text-zinc-50">
              Conciliación Final: Orden #{data.orderNumber}
            </h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1 pl-7">
            Comparativa de pesajes de balanza TMS versus medición de masa por caudalímetro másico.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetch} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Recalcular
          </Button>
          <Link href={`/orders/${orderId}`}>
            <Button variant="ghost" size="sm">
              Ver Detalle
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards (Neto Balanza, Producto Cargado, Diferencia y Tolerancia) */}
      <div className="print:hidden">
        <ReconciliationSummary data={data} />
      </div>

      {/* Promedios de telemetría */}
      <div className="print:hidden">
        <ReconciliationMetrics data={data} />
      </div>

      {/* Remito Imprimible Oficial */}
      <div>
        <ReconciliationTicket data={data} />
      </div>
    </div>
  );
}

export default function OrderReconciliationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col items-center justify-center p-24 text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-violet-600 mb-3" />
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Cargando conciliación...
          </span>
        </div>
      }
    >
      <OrderReconciliationContent params={params} />
    </React.Suspense>
  );
}
