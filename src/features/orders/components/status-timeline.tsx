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
        <History className="h-4 w-4 text-muted" />
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted">Historial de estados</CardTitle>
      </CardHeader>
      <CardContent>
        {error && !log ? (
          <p role="alert" className="text-xs text-danger-ink">{error}</p>
        ) : !log ? (
          <p className="text-xs text-muted">Cargando historial…</p>
        ) : log.length === 0 ? (
          <p className="text-xs text-muted">Sin cambios de estado registrados.</p>
        ) : (
          <ol className="relative border-l border-line ml-2 space-y-4" data-testid="status-timeline">
            {log.map((row) => (
              <li key={row.id} className="ml-4">
                <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-line bg-accent" />
                <div className="text-sm font-semibold text-foreground">
                  {row.fromStatus === null ? "Alta de la orden" : `${row.fromStatus} → ${row.toStatus}`}
                  <span className="ml-2 text-xs font-normal text-muted">{ORDER_STATUS_LABELS[row.toStatus]}</span>
                </div>
                <div className="text-xs font-mono text-muted">
                  {formatBackendDateTime(row.dateTime)} · {row.actor}
                </div>
                {row.observations && <div className="text-xs text-muted mt-0.5">{row.observations}</div>}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
