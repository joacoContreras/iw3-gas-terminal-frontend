"use client";

import * as React from "react";
import type { TemperatureAlarm } from "@/types/api";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/AuthContext";
import { formatTemperature } from "@/lib/formatters";
import { formatBackendDateTime } from "@/lib/dates";
import { errorMessage } from "@/services/api/client";
import { validateObservation, MAX_OBSERVATION_LENGTH } from "../lib/alarm-validation";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface AlarmAckModalProps {
  alarm: TemperatureAlarm | null;
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: (
    alarmId: number,
    observation?: string
  ) => Promise<TemperatureAlarm>;
}

export function AlarmAckModal({
  alarm,
  isOpen,
  onClose,
  onAcknowledge,
}: AlarmAckModalProps) {
  const { user } = useAuth();
  const [observation, setObservation] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setObservation("");
      setError(null);
    }
  }, [isOpen, alarm]);

  if (!alarm) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const obsValidation = validateObservation(observation);
    if (!obsValidation.valid) {
      setError(obsValidation.error ?? "Observación inválida");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onAcknowledge(alarm.id, observation);
      onClose();
    } catch (err: unknown) {
      setError(errorMessage(err, "Error al aceptar la alarma"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Aceptación de Alarma de Temperatura"
      description={`Orden #${alarm.orderNumber} — Registro de superación de umbral`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Warning Callout */}
        <div className="flex items-start gap-3 p-3.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">
              Temperatura registrada: {formatTemperature(alarm.temperature)}
            </span>
            <p className="mt-0.5 text-rose-700/80 dark:text-rose-300/80">
              Umbral configurado: {formatTemperature(alarm.threshold)}. Al confirmar, se registrará tu usuario ({user?.username}) y fecha/hora de aceptación en la auditoría del sistema.
            </p>
          </div>
        </div>

        {/* Audit Data Preview */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-xs text-zinc-600 dark:text-zinc-400">
          <div>
            <span className="text-zinc-400 block text-[11px]">Usuario responsable:</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {user?.username || "Usuario autenticado"}
            </span>
          </div>
          <div>
            <span className="text-zinc-400 block text-[11px]">Disparo de alarma:</span>
            <span className="font-mono text-zinc-900 dark:text-zinc-100">
              {formatBackendDateTime(alarm.triggeredAt)}
            </span>
          </div>
        </div>

        {/* Observation input */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label className="font-medium text-zinc-700 dark:text-zinc-300">
              Observación / Medida tomada (opcional):
            </label>
            <span className="text-[11px] text-zinc-400">
              {observation.length}/{MAX_OBSERVATION_LENGTH}
            </span>
          </div>
          <textarea
            value={observation}
            maxLength={MAX_OBSERVATION_LENGTH}
            onChange={(e) => setObservation(e.target.value)}
            placeholder="Ej: Se verificó la válvula de retorno y se estabilizó la temperatura..."
            rows={3}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <p role="alert" className="text-xs text-rose-600 font-medium">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="danger"
            size="sm"
            isLoading={isSubmitting}
            className="gap-1.5"
          >
            <CheckCircle className="h-4 w-4" />
            Aceptar y Confirmar Alarma
          </Button>
        </div>
      </form>
    </Modal>
  );
}
