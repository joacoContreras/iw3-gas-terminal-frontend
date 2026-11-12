"use client";

import * as React from "react";
import Link from "next/link";
import { useOrders, useOrderCounts } from "@/features/orders/hooks/useOrders";
import { usePolling } from "@/lib/use-polling";
import { alarmsApi } from "@/features/alarms/services/alarmsApi";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderTable } from "@/features/orders/components/order-table";
import { RequirePermission, PermissionGate } from "@/components/shared/permission-gate";
import { StateBadge } from "@/components/shared/state-badge";
import { calculateEta, etaLabel, loadProgress } from "@/features/orders/lib/order-metrics";
import { formatKg, formatTemperature, formatFlowRate } from "@/lib/formatters";
import { formatDuration, loadingElapsedMillis } from "@/lib/dates";
import { useNow } from "@/lib/use-now";
import { Layers, Activity, Clock, CheckCircle2, ArrowRight, PlusCircle, Scale, ShieldAlert, AlertTriangle } from "lucide-react";
import type { OrderStatusCode } from "@/types/api";

function Kpi({ label, value, icon, accent, testId }: { label: string; value: number | null; icon: React.ReactNode; accent: string; testId: string }) {
  return (
    <Card className={`border-l-4 ${accent}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
          {icon}
        </div>
        <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1.5" data-testid={testId}>
          {value === null ? "—" : value}
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardOverview() {
  const counts = useOrderCounts(5000);
  const alarms = usePolling<number>((signal) => alarmsApi.countPending(signal), { intervalMs: 5000, resetKey: "pending-alarms" });
  const live = useOrders({ status: 2, page: 0, size: 20 }, 3000);
  const recent = useOrders({ page: 0, size: 10 }, 5000);
  const now = useNow(live.orders.length > 0);

  const c = counts.data;
  const total = c ? c[1] + c[2] + c[3] + c[4] : null;
  const firstError = counts.error ?? live.error ?? recent.error;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Tablero de Control de Terminal</h1>
          <p className="text-xs text-zinc-500 mt-1">Supervisión del flujo de carga de gas líquido. Los datos se actualizan solos.</p>
        </div>
        <PermissionGate permission="simulator:use">
          <Link href="/simulator">
            <Button variant="primary" size="sm" className="gap-1.5 shadow-sm">
              <PlusCircle className="h-4 w-4" />
              Simulador de Carga / SAP
            </Button>
          </Link>
        </PermissionGate>
      </div>

      {firstError && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {firstError}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
        <Kpi label="Total órdenes" value={total} icon={<Layers className="h-4 w-4" />} accent="border-l-zinc-300" testId="kpi-total" />
        <Kpi label="1: Pend. pesaje" value={c?.[1] ?? null} icon={<Clock className="h-4 w-4 text-blue-500" />} accent="border-l-blue-500" testId="kpi-1" />
        <Kpi label="2: En carga" value={c?.[2] ?? null} icon={<Activity className="h-4 w-4 text-emerald-500" />} accent="border-l-emerald-500" testId="kpi-2" />
        <Kpi label="3: Cerradas" value={c?.[3] ?? null} icon={<Scale className="h-4 w-4 text-amber-500" />} accent="border-l-amber-500" testId="kpi-3" />
        <Kpi label="4: Finalizadas" value={c?.[4] ?? null} icon={<CheckCircle2 className="h-4 w-4 text-violet-600" />} accent="border-l-violet-600" testId="kpi-4" />
        <Link href="/alarms" className="contents">
          <Kpi label="Alarmas pendientes" value={alarms.data} icon={<ShieldAlert className="h-4 w-4 text-rose-500" />} accent="border-l-rose-500" testId="kpi-alarms" />
        </Link>
      </div>

      {live.orders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            Monitoreo en vivo: órdenes en carga ({live.pageInfo.totalElements})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="live-orders">
            {live.orders.map((order) => {
              const progress = loadProgress(order.preset, order.lastAccumulatedMass);
              const eta = calculateEta({ status: order.status, preset: order.preset, accumulatedMass: order.lastAccumulatedMass, flowRate: order.lastFlowRate });
              const elapsed = loadingElapsedMillis(order.status, order.loadingStartDateTime, now);
              return (
                <Card key={order.orderNumber} className="border-emerald-300/80 dark:border-emerald-800/80 bg-gradient-to-br from-white via-white to-emerald-50/20 dark:from-zinc-900 dark:to-emerald-950/20 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-zinc-900 dark:text-zinc-50">Orden #{order.orderNumber}</span>
                      <StateBadge state={order.status as OrderStatusCode} showIcon={false} />
                    </div>
                    <Link href={`/orders/${order.orderNumber}`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        Monitorear <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>Camión: <b className="text-zinc-800 dark:text-zinc-200">{order.truck.plate}</b></span>
                      <span>Cliente: <b className="text-zinc-800 dark:text-zinc-200">{order.customer.companyName}</b></span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-zinc-400">Progreso:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatKg(order.lastAccumulatedMass)} / {formatKg(order.preset)} ({progress.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-center font-mono text-xs">
                      <div className="p-1.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                        <span className="text-[10px] text-zinc-400 block">ETA</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{etaLabel(eta)}</span>
                      </div>
                      <div className="p-1.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                        <span className="text-[10px] text-zinc-400 block">Transcurrido</span>
                        <span className="font-bold text-zinc-700 dark:text-zinc-200">{elapsed === null ? "—" : formatDuration(elapsed)}</span>
                      </div>
                      <div className="p-1.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                        <span className="text-[10px] text-zinc-400 block">Temp.</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">{formatTemperature(order.lastTemperature)}</span>
                      </div>
                      <div className="p-1.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                        <span className="text-[10px] text-zinc-400 block">Caudal</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatFlowRate(order.lastFlowRate)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Últimas órdenes recibidas</h2>
          <Link href="/orders" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Ver todas, con filtros y orden <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <OrderTable orders={recent.orders} emptyMessage="Todavía no hay órdenes registradas." />
      </div>
    </div>
  );
}

export default function DashboardOverviewPage() {
  // El panel consulta las órdenes: se monta solo si el rol puede verlas (si no, no dispara pedidos que darían 403).
  return (
    <RequirePermission permission="orders:view">
      <DashboardOverview />
    </RequirePermission>
  );
}
