"use client";

import * as React from "react";
import Link from "next/link";
import { StateBadge } from "@/components/shared/state-badge";
import { Button } from "@/components/ui/button";
import { formatKg, formatTemperature, formatFlowRate, formatDensity } from "@/lib/formatters";
import { formatBackendDateTime, formatDuration, loadingElapsedMillis } from "@/lib/dates";
import { useNow } from "@/lib/use-now";
import { calculateEta, etaLabel, loadProgress } from "../lib/order-metrics";
import type { Order } from "@/types/api";
import { Eye, FileCheck, Truck } from "lucide-react";

interface OrderTableProps {
  orders: Order[];
  /** Mensaje cuando no hay órdenes (distinto si hay un filtro aplicado). */
  emptyMessage?: string;
}

export function OrderTable({ orders, emptyMessage = "No hay órdenes registradas con el filtro seleccionado." }: OrderTableProps) {
  // El tiempo transcurrido corre solo para las órdenes en estado 2: el reloj solo se activa si hay alguna.
  const now = useNow(orders.some((o) => o.status === 2));

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-line rounded-2xl bg-panel/50">
        <Truck className="h-10 w-10 text-muted mb-3" />
        <h4 className="text-sm font-semibold text-foreground">No se encontraron órdenes</h4>
        <p className="text-xs text-muted max-w-sm mt-1">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="aether-table">
      <table className="w-full text-left text-sm text-muted">
        <thead className="bg-canvas/80 text-xs font-semibold uppercase tracking-wider text-muted border-b border-line/80">
          <tr>
            <th className="py-3.5 px-4">Orden</th>
            <th className="py-3.5 px-4">Estado</th>
            <th className="py-3.5 px-4">Camión & Chofer</th>
            <th className="py-3.5 px-4">Cliente & Producto</th>
            <th className="py-3.5 px-4 text-right">Carga / Preset</th>
            <th className="py-3.5 px-4 text-center">Últimas lecturas</th>
            <th className="py-3.5 px-4 text-center">ETA</th>
            <th className="py-3.5 px-4 text-center">Transcurrido</th>
            <th className="py-3.5 px-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {orders.map((order) => {
            const progress = loadProgress(order.preset, order.lastAccumulatedMass);
            const eta = calculateEta({ status: order.status, preset: order.preset, accumulatedMass: order.lastAccumulatedMass, flowRate: order.lastFlowRate });
            const elapsed = loadingElapsedMillis(order.status, order.loadingStartDateTime, now);
            const hasReadings = order.lastTemperature !== null;

            return (
              <tr key={order.orderNumber} className="hover:bg-canvas/70 transition-colors" data-testid={`order-row-${order.orderNumber}`}>
                <td className="py-4 px-4 font-mono">
                  <div className="font-semibold text-foreground">#{order.orderNumber}</div>
                  <div className="text-xs text-muted" title="Carga planificada">
                    {formatBackendDateTime(order.plannedLoadDateTime)}
                  </div>
                </td>

                <td className="py-4 px-4">
                  <StateBadge state={order.status} />
                </td>

                <td className="py-4 px-4">
                  <span className="font-mono bg-elevated px-1.5 py-0.5 rounded text-xs font-medium text-foreground">{order.truck.plate}</span>
                  <div className="text-xs text-muted mt-0.5">
                    {order.driver.name} {order.driver.lastName}
                  </div>
                </td>

                <td className="py-4 px-4">
                  <div className="font-medium text-foreground truncate max-w-[160px]">{order.customer.companyName}</div>
                  <div className="text-xs text-muted truncate max-w-[160px]">{order.product.name}</div>
                </td>

                <td className="py-4 px-4 text-right">
                  <div className="font-semibold text-foreground whitespace-nowrap">
                    {formatKg(order.lastAccumulatedMass)} / {formatKg(order.preset)}
                  </div>
                  <div className="w-32 ml-auto mt-1">
                    <div className="h-1.5 w-full bg-elevated rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </td>

                <td className="py-4 px-4 text-center">
                  {hasReadings ? (
                    <div className="inline-flex flex-col items-start gap-0.5 text-xs font-mono bg-canvas px-2 py-1 rounded-lg border border-line/60">
                      <span title="Temperatura" className="text-warning font-medium">{formatTemperature(order.lastTemperature)}</span>
                      <span title="Densidad" className="text-muted">{formatDensity(order.lastDensity)}</span>
                      <span title="Caudal" className="text-accent">{formatFlowRate(order.lastFlowRate)}</span>
                    </div>
                  ) : (
                    <span className="text-muted text-xs">Sin lecturas</span>
                  )}
                </td>

                <td className="py-4 px-4 text-center font-mono text-xs" data-testid="eta-cell">{etaLabel(eta)}</td>

                <td className="py-4 px-4 text-center font-mono text-xs" data-testid="elapsed-cell">
                  {elapsed === null ? "—" : formatDuration(elapsed)}
                </td>

                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link href={`/orders/${order.orderNumber}`}>
                      <Button variant="outline" size="sm" className="h-8 px-2.5">
                        <Eye className="h-3.5 w-3.5 text-muted mr-1" />
                        Detalle
                      </Button>
                    </Link>
                    {order.status === 4 && (
                      <Link href={`/orders/${order.orderNumber}/reconciliation`}>
                        <Button variant="secondary" size="sm" className="h-8 px-2.5 ">
                          <FileCheck className="h-3.5 w-3.5 mr-1" />
                          Conciliación
                        </Button>
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
