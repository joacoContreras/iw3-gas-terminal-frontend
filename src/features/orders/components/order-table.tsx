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
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-zinc-200 rounded-2xl dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
        <Truck className="h-10 w-10 text-zinc-300 dark:text-zinc-600 mb-3" />
        <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No se encontraron órdenes</h4>
        <p className="text-xs text-zinc-500 max-w-sm mt-1">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full text-left text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
        <thead className="bg-zinc-50/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-200/80 dark:bg-zinc-800/40 dark:border-zinc-800 dark:text-zinc-400">
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
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {orders.map((order) => {
            const progress = loadProgress(order.preset, order.lastAccumulatedMass);
            const eta = calculateEta({ status: order.status, preset: order.preset, accumulatedMass: order.lastAccumulatedMass, flowRate: order.lastFlowRate });
            const elapsed = loadingElapsedMillis(order.status, order.loadingStartDateTime, now);
            const hasReadings = order.lastTemperature !== null;

            return (
              <tr key={order.orderNumber} className="hover:bg-zinc-50/70 transition-colors dark:hover:bg-zinc-800/30" data-testid={`order-row-${order.orderNumber}`}>
                <td className="py-4 px-4 font-mono">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">#{order.orderNumber}</div>
                  <div className="text-[11px] text-zinc-400" title="Carga planificada">
                    {formatBackendDateTime(order.plannedLoadDateTime)}
                  </div>
                </td>

                <td className="py-4 px-4">
                  <StateBadge state={order.status} />
                </td>

                <td className="py-4 px-4">
                  <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs font-medium text-zinc-900 dark:text-zinc-100">{order.truck.plate}</span>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    {order.driver.name} {order.driver.lastName}
                  </div>
                </td>

                <td className="py-4 px-4">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[160px]">{order.customer.companyName}</div>
                  <div className="text-[11px] text-zinc-400 truncate max-w-[160px]">{order.product.name}</div>
                </td>

                <td className="py-4 px-4 text-right">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                    {formatKg(order.lastAccumulatedMass)} / {formatKg(order.preset)}
                  </div>
                  <div className="w-32 ml-auto mt-1">
                    <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </td>

                <td className="py-4 px-4 text-center">
                  {hasReadings ? (
                    <div className="inline-flex flex-col items-start gap-0.5 text-[11px] font-mono bg-zinc-50 dark:bg-zinc-800/60 px-2 py-1 rounded-lg border border-zinc-200/60 dark:border-zinc-700/50">
                      <span title="Temperatura" className="text-amber-600 dark:text-amber-400 font-medium">{formatTemperature(order.lastTemperature)}</span>
                      <span title="Densidad" className="text-zinc-600 dark:text-zinc-300">{formatDensity(order.lastDensity)}</span>
                      <span title="Caudal" className="text-blue-600 dark:text-blue-400">{formatFlowRate(order.lastFlowRate)}</span>
                    </div>
                  ) : (
                    <span className="text-zinc-400 text-xs">Sin lecturas</span>
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
                        <Eye className="h-3.5 w-3.5 text-zinc-500 mr-1" />
                        Detalle
                      </Button>
                    </Link>
                    {order.status === 4 && (
                      <Link href={`/orders/${order.orderNumber}/reconciliation`}>
                        <Button variant="secondary" size="sm" className="h-8 px-2.5 bg-violet-600 hover:bg-violet-700 text-white">
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
