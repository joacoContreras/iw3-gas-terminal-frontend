"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { calculateEta, calculateElapsedTime } from "@/lib/calculations";
import { formatKg, formatDuration } from "@/lib/formatters";
import { Clock, Timer, CheckCircle, PauseCircle } from "lucide-react";

interface EtaDisplayProps {
  preset: number;
  accumulatedMass?: number;
  flowRate?: number;
  loadStartTime?: string;
  loadEndTime?: string;
  orderState: number;
}

export function EtaDisplay({
  preset,
  accumulatedMass = 0,
  flowRate = 0,
  loadStartTime,
  loadEndTime,
  orderState,
}: EtaDisplayProps) {
  const [elapsed, setElapsed] = React.useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    formatted: "--:--:--",
  });

  // Dynamic live elapsed time counter updated every second while in State 2
  React.useEffect(() => {
    if (!loadStartTime) return;

    const updateTimer = () => {
      setElapsed(calculateElapsedTime(loadStartTime, loadEndTime));
    };

    updateTimer();

    // If order has ended, no need for interval
    if (orderState !== 2) return;

    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [loadStartTime, loadEndTime, orderState]);

  const eta = calculateEta(preset, accumulatedMass, flowRate);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* ETA Card */}
      <Card className="bg-gradient-to-br from-white to-blue-50/40 dark:from-zinc-900 dark:to-blue-950/20 border-blue-200/60 dark:border-blue-900/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Tiempo Estimado de Llenado (ETA)
          </CardTitle>
          {eta.isComplete ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-3.5 w-3.5" /> Completada
            </span>
          ) : flowRate <= 0 ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <PauseCircle className="h-3.5 w-3.5" /> En pausa
            </span>
          ) : (
            <span className="text-xs font-mono font-medium text-blue-600 dark:text-blue-400">
              {eta.remainingMinutes !== null ? formatDuration(eta.remainingMinutes) : "--"}
            </span>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold font-mono text-zinc-900 dark:text-zinc-50">
            {eta.statusText}
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-500 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <span>Faltan: {formatKg(eta.remainingKg)}</span>
            <span>Caudal: {flowRate > 0 ? `${flowRate} kg/h` : "Sin flujo"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Tiempo Transcurrido */}
      <Card className="bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-800/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
            <Timer className="h-4 w-4 text-zinc-500" />
            Tiempo Transcurrido de Carga
          </CardTitle>
          {orderState === 2 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              En vivo
            </span>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold font-mono tracking-wider text-zinc-900 dark:text-zinc-50">
            {elapsed.formatted}
          </div>
          <p className="text-xs text-zinc-400 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            {loadStartTime
              ? `Inicio de carga: ${new Date(loadStartTime).toLocaleTimeString("es-AR")}`
              : "Esperando inicio de bombeo..."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
