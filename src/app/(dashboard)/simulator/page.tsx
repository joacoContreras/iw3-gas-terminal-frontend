"use client";

import * as React from "react";
import { useOrders } from "@/features/orders/hooks/useOrders";
import { SapOrderGenerator } from "@/features/simulator/components/sap-order-generator";
import { TmsScaleControl } from "@/features/simulator/components/tms-scale-control";
import { PumpStreamer } from "@/features/simulator/components/pump-streamer";
import { Button } from "@/components/ui/button";
import { RefreshCw, Info } from "lucide-react";

export default function IntegrationSimulatorPage() {
  const { orders, refetch } = useOrders(2500);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Suite de Simulación de Sistemas Externos
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Herramienta interactiva para simular e inyectar eventos de SAP, Balanza TMS y Bomba de Carga en tiempo real.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Sincronizar Órdenes
        </Button>
      </div>

      {/* Info Callout */}
      <div className="flex items-start gap-3 p-4 bg-blue-50/60 dark:bg-blue-950/20 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200">
        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Guía de Demostración del Circuito Completo:</span>
          <p className="opacity-90 leading-relaxed">
            1. <b>SAP</b>: Emite una orden base (se crea en <b>Estado 1</b>). <br />
            2. <b>Balanza TMS</b>: Registra pesaje inicial (tara); transiciona a <b>Estado 2</b> y genera el PIN de 5 dígitos. <br />
            3. <b>Bomba</b>: Ingresa el PIN para validar e inicia el bombeo automático. Mueve el control de temperatura para probar el disparo de alarmas. Cuando termine, haz clic en <i>Cerrar Carga</i> (<b>Estado 3</b>). <br />
            4. <b>Balanza Final</b>: Registra el pesaje bruto final; transiciona a <b>Estado 4</b> y genera la conciliación.
          </p>
        </div>
      </div>

      {/* Grid de Simuladores */}
      <div className="space-y-6">
        {/* Punto 1: SAP */}
        <SapOrderGenerator onOrderCreated={() => refetch()} />

        {/* Punto 2 y 5: Balanza TMS */}
        <TmsScaleControl orders={orders} onOrderUpdated={() => refetch()} />

        {/* Punto 3 y 4: Bomba y Telemetría */}
        <PumpStreamer orders={orders} onOrderUpdated={() => refetch()} />
      </div>
    </div>
  );
}
