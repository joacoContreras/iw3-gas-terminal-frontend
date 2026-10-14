"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatKg, formatTemperature, formatDensity, formatFlowRate } from "@/lib/formatters";
import { Gauge, Thermometer, Droplet, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface TelemetryGaugesProps {
  accumulatedMass?: number;
  density?: number;
  temperature?: number;
  flowRate?: number;
  temperatureThreshold?: number;
}

export function TelemetryGauges({
  accumulatedMass,
  density,
  temperature,
  flowRate,
  temperatureThreshold = 22.0,
}: TelemetryGaugesProps) {
  const isTempHigh =
    temperature !== undefined && temperature > temperatureThreshold;
  const isPumping = flowRate !== undefined && flowRate > 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Masa Acumulada */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">
              Masa Acumulada
            </span>
            <Gauge className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
            {formatKg(accumulatedMass)}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Medición de caudalímetro másico
          </p>
        </CardContent>
      </Card>

      {/* Caudal Actual */}
      <Card
        className={cn(
          "border-l-4",
          isPumping ? "border-l-emerald-500" : "border-l-zinc-300 dark:border-l-zinc-700"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">
              Caudal Másico
            </span>
            <Activity
              className={cn(
                "h-4 w-4",
                isPumping ? "text-emerald-500 animate-pulse" : "text-zinc-400"
              )}
            />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
            {formatFlowRate(flowRate)}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isPumping ? "bg-emerald-500" : "bg-zinc-400"
              )}
            />
            <span className="text-[11px] text-zinc-500">
              {isPumping ? "Bombeo activo" : "Bomba detenida"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Temperatura */}
      <Card
        className={cn(
          "border-l-4 transition-colors",
          isTempHigh
            ? "border-l-rose-500 bg-rose-50/30 dark:bg-rose-950/20"
            : "border-l-amber-500"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">
              Temperatura
            </span>
            <Thermometer
              className={cn(
                "h-4 w-4",
                isTempHigh ? "text-rose-500 animate-bounce" : "text-amber-500"
              )}
            />
          </div>
          <div
            className={cn(
              "mt-2 text-2xl font-bold font-mono",
              isTempHigh ? "text-rose-600 dark:text-rose-400" : "text-zinc-900 dark:text-zinc-100"
            )}
          >
            {formatTemperature(temperature)}
          </div>
          <p
            className={cn(
              "text-[11px] mt-1",
              isTempHigh ? "text-rose-600 font-semibold" : "text-zinc-400"
            )}
          >
            {isTempHigh
              ? `¡SUPERÓ UMBRAL (${temperatureThreshold}°C)!`
              : `Normal (Umbral: ${temperatureThreshold}°C)`}
          </p>
        </CardContent>
      </Card>

      {/* Densidad */}
      <Card className="border-l-4 border-l-cyan-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">
              Densidad
            </span>
            <Droplet className="h-4 w-4 text-cyan-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
            {formatDensity(density)}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Gravedad específica de GLP (0 a 1)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
