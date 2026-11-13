"use client";

import * as React from "react";
import type { Reconciliation } from "@/types/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatKg } from "@/lib/formatters";
import { Scale, Gauge, ArrowRightLeft, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReconciliationSummaryProps {
  reconciliation: Reconciliation;
  differencePercentage: number | null;
  isToleranceOk: boolean;
  hasReadings: boolean;
}

export function ReconciliationSummary({
  reconciliation,
  differencePercentage,
  isToleranceOk,
  hasReadings,
}: ReconciliationSummaryProps) {
  const diffSign = reconciliation.difference >= 0 ? "+" : "";

  return (
    <div className="space-y-6">
      {/* Tolerancia Callout */}
      {!hasReadings ? (
        <div className="flex items-center justify-between p-4 rounded-2xl border bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-3">
            <Info className="h-6 w-6 text-amber-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">
                Sin Lecturas de Caudalímetro Registradas
              </h4>
              <p className="text-xs opacity-90">
                La orden finalizó con pesaje en balanza pero el caudalímetro no registró producto cargado (0 kg).
              </p>
            </div>
          </div>
          <span className="font-mono font-bold text-sm px-3 py-1 bg-white/70 dark:bg-zinc-900/70 rounded-xl shadow-xs">
            Sin telemetría
          </span>
        </div>
      ) : (
        <div
          className={cn(
            "flex items-center justify-between p-4 rounded-2xl border",
            isToleranceOk
              ? "bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-amber-50/60 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 text-amber-800 dark:text-amber-300"
          )}
        >
          <div className="flex items-center gap-3">
            {isToleranceOk ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
            )}
            <div>
              <h4 className="font-bold text-sm">
                {isToleranceOk
                  ? "Conciliación Dentro de Tolerancia Aceptable (±1.0%)"
                  : "Desvío por Fuera de Tolerancia Estándar (±1.0%)"}
              </h4>
              <p className="text-xs opacity-90">
                Diferencia Balanza vs. Caudalímetro: {diffSign}
                {formatKg(reconciliation.difference)}
                {differencePercentage !== null && (
                  <span>
                    {" "}({differencePercentage > 0 ? "+" : ""}
                    {differencePercentage}%)
                  </span>
                )}
              </p>
            </div>
          </div>

          <span className="font-mono font-bold text-sm px-3 py-1 bg-white/70 dark:bg-zinc-900/70 rounded-xl shadow-xs">
            {differencePercentage !== null
              ? `Δ ${Math.abs(differencePercentage).toFixed(2)}%`
              : "Δ —"}
          </span>
        </div>
      )}

      {/* Grid Principal de Pesajes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Balanza (TMS) */}
        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Balanza de Entrada / Salida (TMS)
            </CardTitle>
            <Scale className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Pesaje Inicial (Tara):</span>
              <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                {formatKg(reconciliation.tare)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Pesaje Final (Bruto):</span>
              <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                {formatKg(reconciliation.finalWeight)}
              </span>
            </div>
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-baseline">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Neto por Balanza:
              </span>
              <span className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
                {formatKg(reconciliation.scaleNet)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Caudalímetro Másico */}
        <Card className="border-l-4 border-l-indigo-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Caudalímetro Másico
            </CardTitle>
            <Gauge className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xs text-zinc-500">
              Medición directa en boca de carga (última masa acumulada):
            </div>
            <div className="pt-5 flex justify-between items-baseline">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Producto Cargado:
              </span>
              <span className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {hasReadings ? formatKg(reconciliation.loadedProduct) : "0 kg (sin lecturas)"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Comparativa y Desvío */}
        <Card className="border-l-4 border-l-violet-600 bg-gradient-to-br from-white to-violet-50/20 dark:from-zinc-900 dark:to-violet-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Diferencia Neta
            </CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-violet-600" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs text-zinc-500">
              Neto por Balanza − Medidor:
            </div>
            <div className="text-2xl font-bold font-mono text-violet-700 dark:text-violet-300">
              {diffSign}
              {formatKg(reconciliation.difference)}
            </div>
            <p className="text-xs text-zinc-400">
              Porcentaje de desvío:{" "}
              <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                {differencePercentage !== null
                  ? `${differencePercentage > 0 ? "+" : ""}${differencePercentage}%`
                  : "—"}
              </span>{" "}
              <span className="text-[10px] text-zinc-400 block sm:inline">
                (cálculo derivado)
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
