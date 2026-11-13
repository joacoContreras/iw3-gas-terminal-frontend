"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatKg, formatTemperature, formatDensity, formatFlowRate } from "@/lib/formatters";
import { formatBackendTime } from "@/lib/dates";
import { Gauge, Thermometer, Droplet, Activity } from "lucide-react";

interface TelemetryGaugesProps {
  /** Los cuatro valores son los de la última lectura válida (`last*` de la orden); `null` si todavía no hay lecturas. */
  accumulatedMass: number | null;
  density: number | null;
  temperature: number | null;
  flowRate: number | null;
  /** `loadingEndDateTime`: estampa de la última lectura válida. */
  lastReadingAt: string | null;
}

/**
 * Las cuatro medidas de la última lectura del caudalímetro. No se afirma «bomba activa o detenida»: el backend solo
 * informa la última lectura, y con ella se muestra cuándo llegó.
 */
export function TelemetryGauges({ accumulatedMass, density, temperature, flowRate, lastReadingAt }: TelemetryGaugesProps) {
  const stamp = lastReadingAt ? `Lectura de las ${formatBackendTime(lastReadingAt)}` : "Sin lecturas todavía";
  const cards = [
    { key: "mass", label: "Masa acumulada", value: formatKg(accumulatedMass), icon: Gauge, color: "border-l-accent/30", iconColor: "text-accent" },
    { key: "flow", label: "Caudal másico", value: formatFlowRate(flowRate), icon: Activity, color: "border-l-success/30", iconColor: "text-success" },
    { key: "temp", label: "Temperatura", value: formatTemperature(temperature), icon: Thermometer, color: "border-l-warning/30", iconColor: "text-warning" },
    { key: "density", label: "Densidad", value: formatDensity(density), icon: Droplet, color: "border-l-accent/30", iconColor: "text-accent" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ key, label, value, icon: Icon, color, iconColor }) => (
        <Card key={key} className={`border-l-4 ${color}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted">
              <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
              <Icon className={`h-4 w-4 ${iconColor}`} />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-foreground" data-testid={`gauge-${key}`}>
              {value}
            </div>
            <p className="text-xs text-muted mt-1">{stamp}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
