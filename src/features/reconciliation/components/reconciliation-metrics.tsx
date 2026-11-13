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
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted">
          Promedios Registrados Durante el Proceso de Carga
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasReadings ? (
          <div className="flex items-center gap-2.5 p-3.5 bg-canvas rounded-xl text-xs text-muted">
            <Info className="h-4 w-4 text-muted shrink-0" />
            <span>
              No se registraron lecturas válidas del caudalímetro durante la carga. Los promedios no están disponibles.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Promedio Temperatura */}
            <div className="flex items-center gap-3 p-3 bg-canvas rounded-xl border border-line">
              <div className="p-2 bg-warning/10 rounded-lg text-warning">
                <Thermometer className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-muted block">Temperatura Promedio</span>
                <span className="text-lg font-bold font-mono text-foreground">
                  {formatTemperature(reconciliation.averageTemperature)}
                </span>
              </div>
            </div>

            {/* Promedio Densidad */}
            <div className="flex items-center gap-3 p-3 bg-canvas rounded-xl border border-line">
              <div className="p-2 bg-accent/10 rounded-lg text-accent">
                <Droplet className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-muted block">Densidad Promedio</span>
                <span className="text-lg font-bold font-mono text-foreground">
                  {formatDensity(reconciliation.averageDensity)}
                </span>
              </div>
            </div>

            {/* Promedio Caudal */}
            <div className="flex items-center gap-3 p-3 bg-canvas rounded-xl border border-line">
              <div className="p-2 bg-accent/10 rounded-lg text-accent">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-muted block">Caudal Promedio</span>
                <span className="text-lg font-bold font-mono text-foreground">
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
