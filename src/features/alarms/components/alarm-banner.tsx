"use client";

import * as React from "react";
import Link from "next/link";
import { Alarm } from "@/types/alarm";
import { formatTemperature } from "@/lib/formatters";
import { AlertOctagon, ArrowRight } from "lucide-react";

interface AlarmBannerProps {
  pendingAlarms: Alarm[];
  onOpenAckModal?: (alarm: Alarm) => void;
}

export function AlarmBanner({ pendingAlarms, onOpenAckModal }: AlarmBannerProps) {
  if (pendingAlarms.length === 0) return null;

  const first = pendingAlarms[0];

  return (
    <div className="bg-rose-600 text-white px-4 py-2.5 shadow-md animate-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5">
          <span className="p-1 bg-white/20 rounded-full animate-bounce">
            <AlertOctagon className="h-4 w-4" />
          </span>
          <span className="font-semibold">
            ¡ALERTA CRÍTICA DE TEMPERATURA!
          </span>
          <span className="hidden md:inline text-rose-100">
            Orden #{first.orderNumber} registró {formatTemperature(first.temperature)} (Umbral: {formatTemperature(first.threshold)}).
          </span>
          {pendingAlarms.length > 1 && (
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-mono">
              +{pendingAlarms.length - 1} más
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onOpenAckModal && (
            <button
              onClick={() => onOpenAckModal(first)}
              className="bg-white text-rose-700 font-bold px-3 py-1 rounded-lg text-xs hover:bg-rose-50 transition-colors shadow-xs cursor-pointer"
            >
              Aceptar Alarma
            </button>
          )}
          <Link
            href="/alarms"
            className="flex items-center gap-1 text-xs text-white/90 hover:text-white underline ml-1"
          >
            Ver todas <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
