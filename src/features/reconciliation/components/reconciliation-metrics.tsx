"use client";

import * as React from "react";
import type { Reconciliation } from "@/types/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatTemperature, formatDensity, formatFlowRate } from "@/lib/formatters";
import { Thermometer, Droplet, Activity, Info } from "lucide-react";

interface ReconciliationMetricsProps {
  reconciliation: Reconciliation;
  hasReadings: boolean;
}

export function ReconciliationMetrics({
  reconciliation,
  hasReadings,
}: ReconciliationMetricsProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Promedios Registrados Durante el Proceso de Carga
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasReadings ? (
          <div className="flex items-center gap-2.5 p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-xs text-zinc-500">
            <Info className="h-4 w-4 text-zinc-400 shrink-0" />
            <span>
              No se registraron lecturas válidas del caudalímetro durante la carga. Los promedios no están disponibles.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Promedio Temperatura */}
            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg text-amber-600 dark:text-amber-400">
                <Thermometer className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-zinc-400 block">Temperatura Promedio</span>
                <span className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100">
                  {formatTemperature(reconciliation.averageTemperature)}
                </span>
              </div>
            </div>

            {/* Promedio Densidad */}
            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900/40 rounded-lg text-cyan-600 dark:text-cyan-400">
                <Droplet className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-zinc-400 block">Densidad Promedio</span>
                <span className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100">
                  {formatDensity(reconciliation.averageDensity)}
                </span>
              </div>
            </div>

            {/* Promedio Caudal */}
            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-blue-600 dark:text-blue-400">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-zinc-400 block">Caudal Promedio</span>
                <span className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100">
                  {formatFlowRate(reconciliation.averageFlowRate)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
