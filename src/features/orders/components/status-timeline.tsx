"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatBackendDateTime } from "@/lib/dates";
import { ORDER_STATUS_LABELS, type OrderStatusLog } from "@/types/api";
import { History } from "lucide-react";

/** Historial de estados (`GET /orders/{n}/status-log`) como línea de tiempo, del cambio más antiguo al más reciente. */
export function StatusTimeline({ log, error }: { log: OrderStatusLog[] | null; error: string | null }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <History className="h-4 w-4 text-zinc-500" />
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Historial de estados</CardTitle>
      </CardHeader>
      <CardContent>
        {error && !log ? (
          <p role="alert" className="text-xs text-rose-600">{error}</p>
        ) : !log ? (
          <p className="text-xs text-zinc-400">Cargando historial…</p>
        ) : log.length === 0 ? (
          <p className="text-xs text-zinc-400">Sin cambios de estado registrados.</p>
        ) : (
          <ol className="relative border-l border-zinc-200 dark:border-zinc-700 ml-2 space-y-4" data-testid="status-timeline">
            {log.map((row) => (
              <li key={row.id} className="ml-4">
                <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-blue-500 dark:border-zinc-900" />
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {row.fromStatus === null ? "Alta de la orden" : `${row.fromStatus} → ${row.toStatus}`}
                  <span className="ml-2 text-xs font-normal text-zinc-500">{ORDER_STATUS_LABELS[row.toStatus]}</span>
                </div>
                <div className="text-[11px] font-mono text-zinc-400">
                  {formatBackendDateTime(row.dateTime)} · {row.actor}
                </div>
                {row.observations && <div className="text-xs text-zinc-500 mt-0.5">{row.observations}</div>}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
