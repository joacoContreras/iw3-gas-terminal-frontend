"use client";

import * as React from "react";
import Link from "next/link";
import { useOrder, useOrderReadings, useOrderStatusLog } from "@/features/orders/hooks/useOrderDetail";
import { StateBadge } from "@/components/shared/state-badge";
import { ForbiddenView } from "@/components/shared/forbidden-view";
import { TelemetryGauges } from "@/features/orders/components/telemetry-gauges";
import { LiveLoadMeter } from "@/features/orders/components/live-load-meter";
import { EtaDisplay } from "@/features/orders/components/eta-display";
import { TruckCisternsCard } from "@/features/orders/components/truck-cisterns-card";
import { StatusTimeline } from "@/features/orders/components/status-timeline";
import { ReadingsTable } from "@/features/orders/components/readings-table";
import { CloseOrderButton } from "@/features/orders/components/close-order-button";
import { Button } from "@/components/ui/button";
import { formatKg } from "@/lib/formatters";
import { formatBackendDateTime } from "@/lib/dates";
import { ArrowLeft, FileCheck, RefreshCw, Calendar, AlertTriangle } from "lucide-react";

function Weighing({ label, value, when, color }: { label: string; value: number | null; when: string | null; color: string }) {
  return (
    <div>
      <span className="text-zinc-400 block text-[11px]">{label}</span>
      <span className={`font-mono font-bold text-base ${color}`}>{value === null ? "Pendiente" : formatKg(value)}</span>
      {when && <span className="block text-[10px] font-mono text-zinc-400">{formatBackendDateTime(when)}</span>}
    </div>
  );
}

function OrderDetailContent({ params }: { params: Promise<{ orderNumber: string }> }) {
  const resolved = React.use(params);
  // El número de orden viene de la URL: se exige un entero antes de armar ningún pedido con él.
  const orderNumber = /^\d{1,15}$/.test(resolved.orderNumber) ? Number(resolved.orderNumber) : Number.NaN;

  const order = useOrder(orderNumber);
  const statusLog = useOrderStatusLog(orderNumber, order.data?.status);
  const [readingsPage, setReadingsPage] = React.useState<number | "last">("last");
  const readings = useOrderReadings(orderNumber, readingsPage, order.data?.status === 2 && readingsPage === "last");

  const backToList = (
    <Link href="/orders">
      <Button variant="outline" size="sm">
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Volver al listado
      </Button>
    </Link>
  );

  if (Number.isNaN(orderNumber)) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-rose-600 font-semibold">«{resolved.orderNumber}» no es un número de orden válido.</p>
        {backToList}
      </div>
    );
  }

  if (order.errorStatus === 403) return <ForbiddenView message={order.error ?? undefined} />;

  if (order.isLoading && !order.data) {
    return (
      <div role="status" className="flex flex-col items-center justify-center p-24 text-center">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mb-3" />
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Cargando datos de la orden #{orderNumber}…</span>
      </div>
    );
  }

  if (!order.data) {
    return (
      <div className="p-8 text-center space-y-4">
        <p role="alert" className="text-sm text-rose-600 font-semibold">{order.error ?? "No se pudo cargar la orden"}</p>
        {backToList}
      </div>
    );
  }

  const o = order.data;
  const refreshAll = () => {
    order.refetch();
    statusLog.refetch();
    readings.refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/orders" className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors" aria-label="Volver al listado">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-black font-mono tracking-tight text-zinc-900 dark:text-zinc-50">Orden #{o.orderNumber}</h1>
            <StateBadge state={o.status} />
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-500 pl-7">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Recibida: {formatBackendDateTime(o.receptionDateTime)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshAll} className="gap-1">
            <RefreshCw className="h-3.5 w-3.5" />
            Refrescar
          </Button>
          <CloseOrderButton orderNumber={o.orderNumber} status={o.status} onClosed={refreshAll} />
          {o.status === 4 && (
            <Link href={`/orders/${o.orderNumber}/reconciliation`}>
              <Button variant="primary" size="sm" className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white shadow-sm">
                <FileCheck className="h-4 w-4" />
                Ver conciliación final
              </Button>
            </Link>
          )}
        </div>
      </div>

      {order.error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {order.error} (se muestra la última información recibida)
        </div>
      )}

      {/* Pesajes: el PIN de activación no se muestra (el backend no lo publica; solo viaja en la respuesta de la tara) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-zinc-100/70 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 text-xs">
        <Weighing label="Preset objetivo" value={o.preset} when={null} color="text-zinc-900 dark:text-zinc-100" />
        <Weighing label="Pesaje inicial (tara)" value={o.tare} when={o.initialWeighingDateTime} color="text-blue-600 dark:text-blue-400" />
        <div>
          <span className="text-zinc-400 block text-[11px]">Activación de la carga</span>
          <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">{o.activationDateTime ? "Activada" : "Pendiente"}</span>
          {o.activationDateTime && <span className="block text-[10px] font-mono text-zinc-400">{formatBackendDateTime(o.activationDateTime)}</span>}
        </div>
        <Weighing label="Pesaje final" value={o.finalWeight} when={o.finalWeighingDateTime} color="text-violet-600 dark:text-violet-400" />
      </div>

      <TelemetryGauges
        accumulatedMass={o.lastAccumulatedMass}
        density={o.lastDensity}
        temperature={o.lastTemperature}
        flowRate={o.lastFlowRate}
        lastReadingAt={o.loadingEndDateTime}
      />

      <div className="space-y-4">
        <LiveLoadMeter preset={o.preset} accumulatedMass={o.lastAccumulatedMass} />
        <EtaDisplay order={o} />
      </div>

      <TruckCisternsCard order={o} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ReadingsTable
            data={readings.data}
            error={readings.error}
            onPageChange={setReadingsPage}
            following={readingsPage === "last"}
            onFollowLatest={() => setReadingsPage("last")}
          />
        </div>
        <StatusTimeline log={statusLog.data} error={statusLog.error} />
      </div>
    </div>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col items-center justify-center p-24 text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mb-3" />
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Cargando orden…</span>
        </div>
      }
    >
      <OrderDetailContent params={params} />
    </React.Suspense>
  );
}
