"use client";

import * as React from "react";
import Link from "next/link";
import { Alarm } from "@/types/alarm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTemperature, formatDateTime } from "@/lib/formatters";
import { AlertCircle, CheckCircle2, Eye, ShieldAlert } from "lucide-react";

interface AlarmTableProps {
  alarms: Alarm[];
  onOpenAckModal: (alarm: Alarm) => void;
}

export function AlarmTable({ alarms, onOpenAckModal }: AlarmTableProps) {
  if (alarms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white/50 dark:bg-zinc-900/50">
        <ShieldAlert className="h-10 w-10 text-zinc-300 dark:text-zinc-600 mb-3" />
        <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          No hay alarmas registradas
        </h4>
        <p className="text-xs text-zinc-500 max-w-sm mt-1">
          El sistema no ha detectado temperaturas que superen el umbral configurado.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full text-left text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
        <thead className="bg-zinc-50/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-200/80 dark:bg-zinc-800/40 dark:border-zinc-800 dark:text-zinc-400">
          <tr>
            <th className="py-3.5 px-4">Estado</th>
            <th className="py-3.5 px-4">Orden</th>
            <th className="py-3.5 px-4">Temp. Registrada</th>
            <th className="py-3.5 px-4">Umbral</th>
            <th className="py-3.5 px-4">Fecha y Hora</th>
            <th className="py-3.5 px-4">Auditoría / Aceptación</th>
            <th className="py-3.5 px-4 text-right">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {alarms.map((alarm) => {
            const isPending = alarm.status === "PENDING";

            return (
              <tr
                key={alarm.id}
                className={
                  isPending
                    ? "bg-rose-50/30 hover:bg-rose-50/50 dark:bg-rose-950/20 dark:hover:bg-rose-950/30 transition-colors"
                    : "hover:bg-zinc-50/60 dark:hover:bg-zinc-800/20 transition-colors"
                }
              >
                {/* Estado */}
                <td className="py-4 px-4">
                  {isPending ? (
                    <Badge variant="danger" className="gap-1 animate-pulse">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Pendiente
                    </Badge>
                  ) : (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Aceptada
                    </Badge>
                  )}
                </td>

                {/* Orden */}
                <td className="py-4 px-4 font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                  <Link
                    href={`/orders/${alarm.orderId}`}
                    className="hover:text-blue-600 underline flex items-center gap-1"
                  >
                    #{alarm.orderNumber}
                  </Link>
                </td>

                {/* Temp */}
                <td className="py-4 px-4 font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                  {formatTemperature(alarm.temperature)}
                </td>

                {/* Umbral */}
                <td className="py-4 px-4 font-mono text-zinc-500">
                  {formatTemperature(alarm.threshold)}
                </td>

                {/* Fecha */}
                <td className="py-4 px-4 font-mono text-zinc-500 text-xs">
                  {formatDateTime(alarm.triggeredAt)}
                </td>

                {/* Auditoría */}
                <td className="py-4 px-4 text-xs">
                  {!isPending && alarm.acknowledgedBy ? (
                    <div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {alarm.acknowledgedBy}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {formatDateTime(alarm.acknowledgedAt)}
                      </div>
                      {alarm.observation && (
                        <p className="text-[11px] text-zinc-500 italic mt-0.5">
                          &quot;{alarm.observation}&quot;
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-zinc-400 italic">No atendida</span>
                  )}
                </td>

                {/* Acción */}
                <td className="py-4 px-4 text-right">
                  {isPending ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onOpenAckModal(alarm)}
                      className="h-8 px-3"
                    >
                      Aceptar
                    </Button>
                  ) : (
                    <Link href={`/orders/${alarm.orderId}`}>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-zinc-400 hover:text-zinc-700">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
