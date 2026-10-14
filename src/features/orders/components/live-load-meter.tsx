"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatKg } from "@/lib/formatters";

interface LiveLoadMeterProps {
  preset: number;
  accumulatedMass?: number;
}

export function LiveLoadMeter({ preset, accumulatedMass = 0 }: LiveLoadMeterProps) {
  const percentage = preset > 0 ? Math.min(100, Math.max(0, (accumulatedMass / preset) * 100)) : 0;
  const isFilled = percentage >= 100;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Progreso de Llenado vs Preset
        </CardTitle>
        <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
          {percentage.toFixed(1)}%
        </span>
      </CardHeader>
      <CardContent>
        {/* Animated Cylinder / Tank filling bar */}
        <div className="relative h-7 w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700/80 p-0.5">
          <div
            className={`h-full rounded-lg transition-all duration-700 ease-out flex items-center justify-end pr-2 text-[11px] font-bold text-white ${
              isFilled ? "bg-emerald-600" : "bg-gradient-to-r from-blue-500 to-indigo-600"
            }`}
            style={{ width: `${percentage}%` }}
          >
            {percentage > 15 && `${percentage.toFixed(0)}%`}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-mono mt-3 text-zinc-600 dark:text-zinc-400">
          <div>
            <span className="text-zinc-400">Cargado: </span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {formatKg(accumulatedMass)}
            </span>
          </div>
          <div>
            <span className="text-zinc-400">Objetivo Preset: </span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {formatKg(preset)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
