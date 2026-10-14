"use client";

import * as React from "react";
import Link from "next/link";
import { useOrderDetail } from "@/features/orders/hooks/useOrderDetail";
import { StateBadge } from "@/components/shared/state-badge";
import { TelemetryGauges } from "@/features/orders/components/telemetry-gauges";
import { LiveLoadMeter } from "@/features/orders/components/live-load-meter";
import { EtaDisplay } from "@/features/orders/components/eta-display";
import { TruckCisternsCard } from "@/features/orders/components/truck-cisterns-card";
import { Button } from "@/components/ui/button";
import { formatKg, formatDateTime } from "@/lib/formatters";
import {
  ArrowLeft,
  Lock,
  FileCheck,
  RefreshCw,
  Calendar,
} from "lucide-react";

function OrderDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = React.use(params);
  const orderId = Number(resolvedParams.id);

  const { order, isLoading, isClosing, error, refetch, closeCurrentOrder } =
    useOrderDetail(orderId);

  if (isLoading && !order) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-center">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mb-3" />
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Cargando datos de la orden #{orderId}...
        </span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-rose-500 font-semibold">
          {error || "Orden no encontrada"}
        </p>
        <Link href="/orders">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Volver al listado
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/orders"
              className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-black font-mono tracking-tight text-zinc-900 dark:text-zinc-50">
              Orden #{order.orderNumber}
            </h1>
            <StateBadge state={order.state} />
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-500 pl-7">
            {order.externalCode && <span>Código Externo: <b>{order.externalCode}</b></span>}
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Recibida: {formatDateTime(order.receivedAt)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1">
            <RefreshCw className="h-3.5 w-3.5" />
            Refrescar
          </Button>

          {/* Estado 2: Botón de Cerrar Orden */}
          {order.state === 2 && (
            <Button
              variant="danger"
              size="sm"
              isLoading={isClosing}
              onClick={closeCurrentOrder}
              className="gap-1.5 shadow-sm"
            >
              <Lock className="h-4 w-4" />
              Cerrar Orden para Carga
            </Button>
          )}

          {/* Estado 4: Botón de Conciliación */}
          {order.state === 4 && (
            <Link href={`/orders/${order.id}/reconciliation`}>
              <Button
                variant="primary"
                size="sm"
                className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
              >
                <FileCheck className="h-4 w-4" />
                Ver Conciliación Final
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Pesajes Base Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-zinc-100/70 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 text-xs">
        <div>
          <span className="text-zinc-400 block text-[11px]">Preset Objetivo</span>
          <span className="font-mono font-bold text-base text-zinc-900 dark:text-zinc-100">
            {formatKg(order.preset)}
          </span>
        </div>
        <div>
          <span className="text-zinc-400 block text-[11px]">Pesaje Inicial (Tara)</span>
          <span className="font-mono font-bold text-base text-blue-600 dark:text-blue-400">
            {order.initialWeight ? formatKg(order.initialWeight) : "Pendiente"}
          </span>
        </div>
        <div>
          <span className="text-zinc-400 block text-[11px]">PIN Activación Carga</span>
          <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400 tracking-widest">
            {order.activationPassword || "--"}
          </span>
        </div>
        <div>
          <span className="text-zinc-400 block text-[11px]">Pesaje Final (Bruto)</span>
          <span className="font-mono font-bold text-base text-violet-600 dark:text-violet-400">
            {order.finalWeight ? formatKg(order.finalWeight) : "Pendiente"}
          </span>
        </div>
      </div>

      {/* Telemetry Gauges (Última Masa, Temperatura, Caudal, Densidad) */}
      <TelemetryGauges
        accumulatedMass={order.lastAccumulatedMass}
        density={order.lastDensity}
        temperature={order.lastTemperature}
        flowRate={order.lastFlowRate}
      />

      {/* Progress & Live ETA calculations */}
      <div className="space-y-4">
        <LiveLoadMeter
          preset={order.preset}
          accumulatedMass={order.lastAccumulatedMass}
        />

        <EtaDisplay
          preset={order.preset}
          accumulatedMass={order.lastAccumulatedMass}
          flowRate={order.lastFlowRate}
          loadStartTime={order.loadStartTime}
          loadEndTime={order.loadEndTime}
          orderState={order.state}
        />
      </div>

      {/* Camión, Chofer, Cliente y Cisternas */}
      <TruckCisternsCard order={order} />
    </div>
  );
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col items-center justify-center p-24 text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mb-3" />
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Cargando orden...
          </span>
        </div>
      }
    >
      <OrderDetailContent params={params} />
    </React.Suspense>
  );
}
