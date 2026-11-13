"use client";

import * as React from "react";
import Link from "next/link";
import type { TemperatureAlarm } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/components/shared/permission-gate";
import { formatTemperature } from "@/lib/formatters";
import { formatBackendDateTime } from "@/lib/dates";
import { AlertCircle, CheckCircle2, Eye, ShieldAlert, Mail, MailX } from "lucide-react";

interface AlarmTableProps {
  alarms: TemperatureAlarm[];
  onOpenAckModal: (alarm: TemperatureAlarm) => void;
}

export function AlarmTable({ alarms, onOpenAckModal }: AlarmTableProps) {
  if (alarms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-line rounded-2xl bg-panel/50">
        <ShieldAlert className="h-10 w-10 text-muted mb-3" />
        <h4 className="text-sm font-semibold text-foreground">
          No hay alarmas registradas
        </h4>
        <p className="text-xs text-muted max-w-sm mt-1">
          No se registran alarmas para el filtro seleccionado.
        </p>
      </div>
    );
  }

  return (
    <div className="aether-table">
      <table className="w-full text-left text-sm text-muted">
        <thead className="bg-canvas/80 text-xs font-semibold uppercase tracking-wider text-muted border-b border-line/80">
          <tr>
            <th className="py-3.5 px-4">Estado</th>
            <th className="py-3.5 px-4">Orden</th>
            <th className="py-3.5 px-4">Temp. Registrada</th>
            <th className="py-3.5 px-4">Umbral</th>
            <th className="py-3.5 px-4">Disparo</th>
            <th className="py-3.5 px-4">Notificación E-mail</th>
            <th className="py-3.5 px-4">Aceptación / Auditoría</th>
            <th className="py-3.5 px-4 text-right">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line font-sans">
          {alarms.map((alarm) => {
            const isPending = alarm.status === "PENDING";

            return (
              <tr
                key={alarm.id}
                className={
                  isPending
                    ? "bg-danger/10 hover:bg-danger/10 transition-colors"
                    : "hover:bg-canvas/60 transition-colors"
                }
              >
                {/* Estado */}
                <td className="py-4 px-4">
                  {isPending ? (
                    <Badge variant="danger" className="gap-1 ">
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
                <td className="py-4 px-4 font-mono font-semibold text-foreground">
                  <Link
                    href={`/orders/${alarm.orderNumber}`}
                    className="hover:text-accent underline inline-flex items-center gap-1"
                    title="Ver orden asociada"
                  >
                    #{alarm.orderNumber}
                  </Link>
                </td>

                {/* Temp */}
                <td className="py-4 px-4 font-mono font-bold text-danger-ink text-sm">
                  {formatTemperature(alarm.temperature)}
                </td>

                {/* Umbral */}
                <td className="py-4 px-4 font-mono text-muted">
                  {formatTemperature(alarm.threshold)}
                </td>

                {/* Fecha de disparo */}
                <td className="py-4 px-4 font-mono text-muted text-xs">
                  {formatBackendDateTime(alarm.triggeredAt)}
                </td>

                {/* Estado del envío de e-mail */}
                <td className="py-4 px-4 text-xs">
                  {alarm.emailSentAt ? (
                    <div className="flex items-center gap-1.5 text-success font-medium">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-mono text-xs">
                        {formatBackendDateTime(alarm.emailSentAt)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-muted">
                      <MailX className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-xs italic">Correo no enviado</span>
                    </div>
                  )}
                </td>

                {/* Auditoría de Aceptación */}
                <td className="py-4 px-4 text-xs">
                  {!isPending && alarm.acknowledgedBy ? (
                    <div className="space-y-0.5">
                      <div className="font-semibold text-foreground">
                        {alarm.acknowledgedBy}
                      </div>
                      <div className="text-xs font-mono text-muted">
                        {formatBackendDateTime(alarm.acknowledgedAt)}
                      </div>
                      {alarm.observation && (
                        <p className="text-xs text-muted italic">
                          &quot;{alarm.observation}&quot;
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted italic">Sin aceptar</span>
                  )}
                </td>

                {/* Acción */}
                <td className="py-4 px-4 text-right">
                  {isPending ? (
                    <PermissionGate
                      permission="alarms:acknowledge"
                      fallback={
                        <span className="text-xs text-muted italic">
                          Requiere supervisor
                        </span>
                      }
                    >
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onOpenAckModal(alarm)}
                        className="h-8 px-3"
                      >
                        Aceptar
                      </Button>
                    </PermissionGate>
                  ) : (
                    <Link href={`/orders/${alarm.orderNumber}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-muted hover:text-foreground"
                        title="Ver detalle de la orden"
                      >
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
