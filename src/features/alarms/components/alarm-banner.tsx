"use client";

import * as React from "react";
import Link from "next/link";
import type { TemperatureAlarm } from "@/types/api";
import { formatTemperature } from "@/lib/formatters";
import { AlertOctagon, ArrowRight } from "lucide-react";

interface AlarmBannerProps {
  pendingAlarms: TemperatureAlarm[];
  onOpenAckModal?: (alarm: TemperatureAlarm) => void;
}

export function AlarmBanner({ pendingAlarms, onOpenAckModal }: AlarmBannerProps) {
  if (pendingAlarms.length === 0) return null;

  const first = pendingAlarms[0];

  return (
    <div
      data-alarm-banner
      role="alert"
      className="border-b border-danger/30 bg-danger/10 px-4 py-4 text-danger-ink sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="p-1 bg-panel/20 rounded-full ">
            <AlertOctagon className="h-4 w-4" />
          </span>
          <span className="font-bold tracking-wide">
            ¡ALERTA CRÍTICA DE TEMPERATURA!
          </span>
          <span className="text-danger-ink">
            Orden #{first.orderNumber} registró {formatTemperature(first.temperature)} (Umbral: {formatTemperature(first.threshold)}).
          </span>
          {pendingAlarms.length > 1 && (
            <span className="bg-panel/20 px-2 py-0.5 rounded-full text-xs font-mono font-semibold">
              +{pendingAlarms.length - 1} más
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenAckModal && (
            <button
              type="button"
              onClick={() => onOpenAckModal(first)}
              className="rounded-lg border border-danger/50 px-3 py-2 text-xs font-semibold text-danger-ink transition-colors hover:bg-danger/10"
            >
              Aceptar Alarma
            </button>
          )}
          <Link
            href="/alarms"
            className="flex items-center gap-1 text-xs text-danger-ink hover:text-foreground underline ml-1"
          >
            Ver todas <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
