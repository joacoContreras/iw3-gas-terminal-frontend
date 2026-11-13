"use client";

import * as React from "react";
import { useSimulatorOrders } from "@/features/simulator/hooks/useSimulatorOrders";
import { SapOrderGenerator } from "@/features/simulator/components/sap-order-generator";
import { TmsScaleControl } from "@/features/simulator/components/tms-scale-control";
import { PumpStreamer } from "@/features/simulator/components/pump-streamer";
import { Button } from "@/components/ui/button";
import { RefreshCw, Info, ShieldCheck } from "lucide-react";

export default function IntegrationSimulatorPage() {
  const { orders, refetch, isLoading, error } = useSimulatorOrders(3000);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              Simulador de integración
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Solo Administradores
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Herramienta interactiva de demostración para inyectar eventos reales de SAP, Balanza TMS y Cabezal de Carga directamente al backend (Puntos 1 a 5).
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          isLoading={isLoading}
          className="gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Sincronizar órdenes activas ({orders.length})
        </Button>
      </div>

      {/* Info Callout */}
      <div className="flex items-start gap-3 p-4 bg-blue-50/60 dark:bg-blue-950/20 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200">
        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Guía de Demostración del Circuito Completo (Puntos 1 al 5):</span>
          <p className="opacity-90 leading-relaxed">
            1. <b>Punto 1 (SAP)</b>: Emite una orden base. Se crea en <b>Estado 1 (Pendiente de tara)</b>. <br />
            2. <b>Punto 2 (Balanza TMS)</b>: Registra pesaje inicial (tara); transiciona a <b>Estado 2</b> y entrega la contraseña de activación de 5 dígitos. <br />
            3. <b>Punto 3 (Carga)</b>: Ingresa el PIN para validar e inicia el bombeo con telemetría progresiva. Subí la temperatura para disparar la alarma por e-mail en tiempo real. <br />
            4. <b>Punto 4 (Cierre)</b>: Al completar la carga, cerrá la orden pasando a <b>Estado 3 (Cerrada para carga)</b>. <br />
            5. <b>Punto 5 (Balanza Final TMS)</b>: Registra el pesaje bruto final; transiciona a <b>Estado 4 (Finalizada)</b> y genera el remito de conciliación.
          </p>
        </div>
      </div>

      {isLoading && <p role="status" className="text-sm text-zinc-500">Cargando órdenes del backend…</p>}
      {error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{error} Los selectores conservan la última sincronización.</p>}
      {!isLoading && !error && orders.length === 0 && <p className="text-sm text-zinc-500">No hay órdenes activas. Creá una desde SAP para empezar el recorrido.</p>}

      {/* Grid de Simuladores */}
      <div className="space-y-6">
        {/* Punto 1: SAP */}
        <SapOrderGenerator onOrderCreated={refetch} />

        {/* Punto 2 y 5: Balanza TMS */}
        <TmsScaleControl orders={orders} onOrderUpdated={refetch} />

        {/* Punto 3 y 4: Bomba y Telemetría */}
        <PumpStreamer orders={orders} onOrderUpdated={refetch} />
      </div>
    </div>
  );
}
