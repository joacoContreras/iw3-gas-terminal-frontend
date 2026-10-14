"use client";

import * as React from "react";
import Link from "next/link";
import { Order } from "@/types/order";
import { StateBadge } from "@/components/shared/state-badge";
import { formatKg, formatTemperature, formatFlowRate } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Eye, FileCheck, Truck } from "lucide-react";

interface OrderTableProps {
  orders: Order[];
}

export function OrderTable({ orders }: OrderTableProps) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-zinc-200 rounded-2xl dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
        <Truck className="h-10 w-10 text-zinc-300 dark:text-zinc-600 mb-3" />
        <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          No se encontraron órdenes
        </h4>
        <p className="text-xs text-zinc-500 max-w-sm mt-1">
          No hay órdenes registradas con el criterio de búsqueda o estado seleccionado. Puedes crear una desde el simulador.
        </p>
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
            <th className="py-3.5 px-4 text-right">Preset / Carga</th>
            <th className="py-3.5 px-4 text-center">Última Telemetría</th>
            <th className="py-3.5 px-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {orders.map((order) => {
            const currentLoaded = order.lastAccumulatedMass || 0;
            const progress = order.preset > 0 ? (currentLoaded / order.preset) * 100 : 0;

            return (
              <tr
                key={order.id}
                className="hover:bg-zinc-50/70 transition-colors dark:hover:bg-zinc-800/30"
              >
                {/* Orden */}
                <td className="py-4 px-4 font-mono">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                    #{order.orderNumber}
                  </div>
                  {order.externalCode && (
                    <div className="text-[11px] text-zinc-400">
                      {order.externalCode}
                    </div>
                  )}
                </td>

                {/* Estado */}
                <td className="py-4 px-4">
                  <StateBadge state={order.state} />
                </td>

                {/* Camión & Chofer */}
                <td className="py-4 px-4">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs">
                      {order.truck.patent}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    {order.driver.name} {order.driver.lastName}
                  </div>
                </td>

                {/* Cliente & Producto */}
                <td className="py-4 px-4">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[150px]">
                    {order.customer.businessName}
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate max-w-[150px]">
                    {order.product.name}
                  </div>
                </td>

                {/* Preset & Progreso */}
                <td className="py-4 px-4 text-right">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatKg(currentLoaded)} / {formatKg(order.preset)}
                  </div>
                  <div className="w-32 ml-auto mt-1">
                    <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* Telemetría actual */}
                <td className="py-4 px-4 text-center">
                  {order.lastTemperature !== undefined ? (
                    <div className="inline-flex items-center gap-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-800/60 px-2 py-1 rounded-lg border border-zinc-200/60 dark:border-zinc-700/50">
                      <span title="Temperatura" className="text-amber-600 dark:text-amber-400 font-medium">
                        {formatTemperature(order.lastTemperature)}
                      </span>
                      <span className="text-zinc-300 dark:text-zinc-600">|</span>
                      <span title="Caudal" className="text-blue-600 dark:text-blue-400">
                        {formatFlowRate(order.lastFlowRate)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-zinc-400 text-xs">Sin telemetría</span>
                  )}
                </td>

                {/* Acciones */}
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm" className="h-8 px-2.5">
                        <Eye className="h-3.5 w-3.5 text-zinc-500 mr-1" />
                        Detalle
                      </Button>
                    </Link>

                    {order.state === 4 && (
                      <Link href={`/orders/${order.id}/reconciliation`}>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 px-2.5 bg-violet-600 hover:bg-violet-700 text-white"
                        >
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
