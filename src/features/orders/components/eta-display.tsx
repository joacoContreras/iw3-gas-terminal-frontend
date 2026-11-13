"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatBackendDateTime, formatDuration, loadingElapsedMillis } from "@/lib/dates";
import { formatFlowRate, formatKg } from "@/lib/formatters";
import { useNow } from "@/lib/use-now";
import { calculateEta, etaLabel } from "../lib/order-metrics";
import type { Order } from "@/types/api";
import { Clock, Timer, CheckCircle, PauseCircle } from "lucide-react";

/**
 * ETA y tiempo transcurrido de la carga. Ambos tienen sentido solo con la orden en estado 2 (carga en curso):
 * en los demás estados se explica por qué no hay dato, en lugar de mostrar un cronómetro o una estimación vieja.
 */
export function EtaDisplay({ order }: { order: Order }) {
  const isLoading = order.status === 2;
  const now = useNow(isLoading);
  const eta = calculateEta({ status: order.status, preset: order.preset, accumulatedMass: order.lastAccumulatedMass, flowRate: order.lastFlowRate });
  const elapsed = loadingElapsedMillis(order.status, order.loadingStartDateTime, now);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="border-accent/30">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-accent flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-accent" />
            Tiempo estimado de llenado (ETA)
          </CardTitle>
          {eta.kind === "complete" && (
            <span className="flex items-center gap-1 text-xs font-semibold text-success">
              <CheckCircle className="h-3.5 w-3.5" /> Completada
            </span>
          )}
          {eta.kind === "stalled" && (
            <span className="flex items-center gap-1 text-xs font-semibold text-warning">
              <PauseCircle className="h-3.5 w-3.5" /> Sin caudal
            </span>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold font-mono text-foreground" data-testid="eta-value">
            {etaLabel(eta)}
          </div>
          <div className="flex items-center justify-between text-xs text-muted mt-2 pt-2 border-t border-line">
            {eta.kind === "not-loading" ? (
              <span>La estimación solo existe con la carga en curso (estado 2).</span>
            ) : (
              <>
                <span>Faltan: {formatKg(eta.kind === "estimate" || eta.kind === "stalled" || eta.kind === "no-readings" ? eta.remainingKg : 0)}</span>
                <span>Caudal: {formatFlowRate(order.lastFlowRate)}</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Timer className="h-4 w-4 text-muted" />
            Tiempo transcurrido de carga
          </CardTitle>
          {isLoading && elapsed !== null && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-success " />
              En vivo
            </span>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold font-mono tracking-wider text-foreground" data-testid="elapsed-value">
            {elapsed === null ? "—" : formatDuration(elapsed)}
          </div>
          <p className="text-xs text-muted mt-2 pt-2 border-t border-line">
            {!isLoading
              ? "El tiempo transcurrido solo corre con la carga en curso (estado 2)."
              : order.loadingStartDateTime
                ? `Inicio de la carga: ${formatBackendDateTime(order.loadingStartDateTime)}`
                : "Esperando la primera lectura del caudalímetro…"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
