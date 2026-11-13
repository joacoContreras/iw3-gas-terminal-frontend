"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatKg } from "@/lib/formatters";
import { loadProgress } from "../lib/order-metrics";

interface LiveLoadMeterProps {
  preset: number;
  /** `lastAccumulatedMass`; `null` si todavía no hay lecturas. */
  accumulatedMass: number | null;
}

export function LiveLoadMeter({ preset, accumulatedMass }: LiveLoadMeterProps) {
  const percentage = loadProgress(preset, accumulatedMass);
  const isFilled = percentage >= 100;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted">Progreso de llenado vs. preset</CardTitle>
        <span className="font-mono text-sm font-bold text-accent" data-testid="load-percentage">
          {percentage.toFixed(1)}%
        </span>
      </CardHeader>
      <CardContent>
        <div
          role="progressbar"
          aria-label="Progreso de llenado"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(percentage)}
          className="relative h-7 w-full bg-elevated rounded-xl overflow-hidden border border-line p-0.5"
        >
          <div
            className={`h-full rounded-lg transition-all duration-700 ease-out flex items-center justify-end pr-2 text-xs font-bold text-canvas ${
              isFilled ? "bg-success" : "bg-linear-to-r from-accent to-accent-bright"
            }`}
            style={{ width: `${percentage}%` }}
          >
            {percentage > 15 && `${percentage.toFixed(0)}%`}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-mono mt-3 text-muted">
          <div>
            <span className="text-muted">Cargado: </span>
            <span className="font-semibold text-foreground">{formatKg(accumulatedMass)}</span>
          </div>
          <div>
            <span className="text-muted">Preset: </span>
            <span className="font-semibold text-foreground">{formatKg(preset)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
