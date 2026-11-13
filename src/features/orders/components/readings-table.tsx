"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/shared/pagination";
import { formatBackendTime } from "@/lib/dates";
import { formatKg, formatTemperature, formatDensity, formatFlowRate } from "@/lib/formatters";
import type { OrderReading, Page } from "@/types/api";
import { Table2 } from "lucide-react";

/** Lecturas guardadas del caudalímetro (`GET /orders/{n}/details`), más recientes al final. */
export function ReadingsTable({
  data,
  error,
  onPageChange,
  following,
  onFollowLatest,
}: {
  data: Page<OrderReading> | null;
  error: string | null;
  onPageChange: (page: number) => void;
  /** `true` mientras se muestran las últimas lecturas (la pantalla las sigue sola). */
  following: boolean;
  onFollowLatest: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-2">
          <Table2 className="h-4 w-4 text-muted" />
          Lecturas guardadas {data && <span className="font-mono text-muted">({data.page.totalElements})</span>}
        </CardTitle>
        {!following && (
          <button onClick={onFollowLatest} className="text-xs font-semibold text-accent hover:text-accent cursor-pointer">
            Ir a las últimas
          </button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {error && !data ? (
          <p role="alert" className="text-xs text-danger-ink">{error}</p>
        ) : !data ? (
          <p className="text-xs text-muted">Cargando lecturas…</p>
        ) : data.content.length === 0 ? (
          <p className="text-xs text-muted">La orden todavía no tiene lecturas guardadas.</p>
        ) : (
          <>
            <div className="aether-table">
              <table className="w-full text-left text-xs font-mono text-muted" data-testid="readings-table">
                <thead className="text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="py-2 pr-4">Hora</th>
                    <th className="py-2 pr-4 text-right">Masa acumulada</th>
                    <th className="py-2 pr-4 text-right">Caudal</th>
                    <th className="py-2 pr-4 text-right">Temperatura</th>
                    <th className="py-2 text-right">Densidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.content.map((r) => (
                    <tr key={r.id}>
                      <td className="py-1.5 pr-4">{formatBackendTime(r.timestamp)}</td>
                      <td className="py-1.5 pr-4 text-right">{formatKg(r.accumulatedMass)}</td>
                      <td className="py-1.5 pr-4 text-right">{formatFlowRate(r.flowRate)}</td>
                      <td className="py-1.5 pr-4 text-right">{formatTemperature(r.temperature)}</td>
                      <td className="py-1.5 text-right">{formatDensity(r.density)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination info={data.page} shown={data.content.length} onPageChange={onPageChange} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
