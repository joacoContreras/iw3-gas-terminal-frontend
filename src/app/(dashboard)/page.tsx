"use client";

import * as React from "react";
import Link from "next/link";
import { useOrders } from "@/features/orders/hooks/useOrders";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderTable } from "@/features/orders/components/order-table";
import { StateBadge } from "@/components/shared/state-badge";
import { calculateEta } from "@/lib/calculations";
import { formatKg, formatTemperature, formatFlowRate } from "@/lib/formatters";
import {
  Layers,
  Activity,
  Clock,
  CheckCircle2,
  ArrowRight,
  PlusCircle,
  Scale,
} from "lucide-react";

export default function DashboardOverviewPage() {
  const { orders } = useOrders(3000);

  const countState1 = orders.filter((o) => o.state === 1).length;
  const countState2 = orders.filter((o) => o.state === 2).length;
  const countState3 = orders.filter((o) => o.state === 3).length;
  const countState4 = orders.filter((o) => o.state === 4).length;

  const activeLoadingOrders = orders.filter((o) => o.state === 2);

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Tablero de Control de Terminal
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Supervisión integral de flujo de carga de gas líquido en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/simulator">
            <Button variant="primary" size="sm" className="gap-1.5 shadow-sm">
              <PlusCircle className="h-4 w-4" />
              Simulador de Carga / SAP
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Órdenes */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Total Órdenes
              </span>
              <Layers className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1.5">
              {orders.length}
            </div>
          </CardContent>
        </Card>

        {/* Estado 1: Pendientes */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                1: Pend. Tara
              </span>
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1.5">
              {countState1}
            </div>
          </CardContent>
        </Card>

        {/* Estado 2: En Carga Activa */}
        <Card className="border-l-4 border-l-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                2: En Carga
              </span>
              <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-2">
              {countState2}
              {countState2 > 0 && (
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Estado 3: Cerradas */}
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                3: Cerradas
              </span>
              <Scale className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1.5">
              {countState3}
            </div>
          </CardContent>
        </Card>

        {/* Estado 4: Conciliadas */}
        <Card className="border-l-4 border-l-violet-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                4: Finalizadas
              </span>
              <CheckCircle2 className="h-4 w-4 text-violet-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1.5">
              {countState4}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Órdenes Activas en Proceso de Carga (Estado 2) */}
      {activeLoadingOrders.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              Monitoreo en Vivo: Órdenes en Carga Activa
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeLoadingOrders.map((order) => {
              const currentLoaded = order.lastAccumulatedMass || 0;
              const progress =
                order.preset > 0 ? (currentLoaded / order.preset) * 100 : 0;
              const eta = calculateEta(
                order.preset,
                currentLoaded,
                order.lastFlowRate || 0
              );

              return (
                <Card
                  key={order.id}
                  className="border-emerald-300/80 dark:border-emerald-800/80 bg-gradient-to-br from-white via-white to-emerald-50/20 dark:from-zinc-900 dark:to-emerald-950/20 shadow-sm"
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-zinc-900 dark:text-zinc-50">
                        Orden #{order.orderNumber}
                      </span>
                      <StateBadge state={order.state} showIcon={false} />
                    </div>
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        Monitorear en Vivo <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>Camión: <b className="text-zinc-800 dark:text-zinc-200">{order.truck.patent}</b></span>
                      <span>Cliente: <b className="text-zinc-800 dark:text-zinc-200">{order.customer.businessName}</b></span>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-zinc-400">Progreso:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatKg(currentLoaded)} / {formatKg(order.preset)} ({progress.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                        />
                      </div>
                    </div>

                    {/* Telemetría rápida */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-center font-mono text-xs">
                      <div className="p-1.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                        <span className="text-[10px] text-zinc-400 block">ETA</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {eta.remainingMinutes !== null ? `${eta.remainingMinutes} min` : "--"}
                        </span>
                      </div>
                      <div className="p-1.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                        <span className="text-[10px] text-zinc-400 block">Temp.</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {formatTemperature(order.lastTemperature)}
                        </span>
                      </div>
                      <div className="p-1.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                        <span className="text-[10px] text-zinc-400 block">Caudal</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatFlowRate(order.lastFlowRate)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabla Global de Órdenes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
            Registro General de Órdenes
          </h2>
          <Link
            href="/orders"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Ver vista completa con filtros <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <OrderTable orders={orders} />
      </div>
    </div>
  );
}
