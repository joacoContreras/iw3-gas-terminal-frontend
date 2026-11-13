"use client";

import * as React from "react";
import Link from "next/link";
import { useReconciliation } from "@/features/reconciliation/hooks/useReconciliation";
import { ReconciliationSummary } from "@/features/reconciliation/components/reconciliation-summary";
import { ReconciliationMetrics } from "@/features/reconciliation/components/reconciliation-metrics";
import { ReconciliationTicket } from "@/features/reconciliation/components/reconciliation-ticket";
import { StateBadge } from "@/components/shared/state-badge";
import { ForbiddenView } from "@/components/shared/forbidden-view";
import { Button } from "@/components/ui/button";
import { ORDER_STATUS_LABELS } from "@/types/api";
import { ArrowLeft, RefreshCw, AlertCircle, Scale, Eye } from "lucide-react";

function OrderReconciliationContent({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const resolvedParams = React.use(params);
  const isValidNumber = /^\d{1,15}$/.test(resolvedParams.orderNumber);
  const orderNumber = isValidNumber ? Number(resolvedParams.orderNumber) : Number.NaN;

  const { data, order, isLoading, error, errorStatus, refetch } = useReconciliation(orderNumber);

  if (!isValidNumber || Number.isNaN(orderNumber)) {
    return (
      <div className="p-12 text-center space-y-4 max-w-md mx-auto">
        <div className="p-3 bg-danger/10 text-danger-ink rounded-full w-12 h-12 flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-foreground">
          Número de orden no válido
        </h3>
        <p className="text-xs text-muted">
          «{resolvedParams.orderNumber}» no corresponde a un formato válido de orden.
        </p>
        <Link href="/orders">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Volver al listado
          </Button>
        </Link>
      </div>
    );
  }

  if (errorStatus === 403) {
    return <ForbiddenView message={error ?? undefined} />;
  }

  if (isLoading) {
    return (
      <div role="status" className="flex flex-col items-center justify-center p-24 text-center">
        <RefreshCw className="h-8 w-8 animate-spin text-accent mb-3" />
        <span className="text-sm font-medium text-muted">
          Obteniendo conciliación para la orden #{orderNumber}…
        </span>
      </div>
    );
  }

  // Manejo de 409 (orden no finalizada / no en estado 4)
  if (errorStatus === 409) {
    return (
      <div className="p-12 text-center space-y-5 max-w-lg mx-auto">
        <div className="p-3 bg-warning/10 text-warning rounded-full w-14 h-14 flex items-center justify-center mx-auto">
          <Scale className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground">
            Conciliación No Disponible
          </h3>
          <p className="text-sm text-muted font-medium">
            {error || "La orden no se encuentra en estado 4 (Finalizada)."}
          </p>
          <p className="text-xs text-muted">
            {order
              ? `La orden #${orderNumber} se encuentra en estado: «${ORDER_STATUS_LABELS[order.status] ?? order.status}». La conciliación de pesajes solo está habilitada una vez concluido el pesaje final (TMS).`
              : "La conciliación sólo se encuentra disponible para órdenes que han registrado su pesaje final en balanza."}
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <Link href={`/orders/${orderNumber}`}>
            <Button variant="primary" size="sm" className="gap-1.5 ">
              <Eye className="h-4 w-4" />
              Ver Detalle de la Orden
            </Button>
          </Link>
          <Link href="/orders">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Volver al Listado
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-12 text-center space-y-4 max-w-md mx-auto">
        <div className="p-3 bg-danger/10 text-danger-ink rounded-full w-12 h-12 flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-foreground">
          Error al Cargar Conciliación
        </h3>
        <p className="text-xs text-muted">
          {error || "No fue posible obtener los datos de conciliación para esta orden."}
        </p>
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>
          <Link href={`/orders/${orderNumber}`}>
            <Button variant="ghost" size="sm">
              Volver a la orden
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-line/80 print:hidden">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/orders/${orderNumber}`}
              className="p-1 rounded-lg hover:bg-elevated text-muted transition-colors"
              aria-label="Volver al detalle de la orden"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="page-title font-bold font-mono tracking-tight text-foreground">
              Conciliación Final: Orden #{data.reconciliation.orderNumber}
            </h1>
            <StateBadge state={data.order.status} />
          </div>
          <p className="text-xs text-muted mt-1 pl-7">
            Comparativa de pesajes de balanza TMS versus medición de masa por caudalímetro másico.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Recalcular
          </Button>
          <Link href={`/orders/${orderNumber}`}>
            <Button variant="ghost" size="sm">
              Ver Detalle
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards (Neto Balanza, Producto Cargado, Diferencia y Tolerancia) */}
      <div className="print:hidden">
        <ReconciliationSummary
          reconciliation={data.reconciliation}
          differencePercentage={data.differencePercentage}
          isToleranceOk={data.isToleranceOk}
          hasReadings={data.hasReadings}
        />
      </div>

      {/* Promedios de telemetría */}
      <div className="print:hidden">
        <ReconciliationMetrics
          reconciliation={data.reconciliation}
          hasReadings={data.hasReadings}
        />
      </div>

      {/* Remito Imprimible Oficial */}
      <div>
        <ReconciliationTicket
          reconciliation={data.reconciliation}
          order={data.order}
          differencePercentage={data.differencePercentage}
          hasReadings={data.hasReadings}
        />
      </div>
    </div>
  );
}

export default function OrderReconciliationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  return (
    <React.Suspense
      fallback={
        <div role="status" className="flex flex-col items-center justify-center p-24 text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-accent mb-3" />
          <span className="text-sm font-medium text-muted">
            Cargando conciliación…
          </span>
        </div>
      }
    >
      <OrderReconciliationContent params={params} />
    </React.Suspense>
  );
}
