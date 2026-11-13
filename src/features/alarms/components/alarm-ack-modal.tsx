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
        <div className="flex items-start gap-3 p-3.5 bg-danger/10 rounded-xl border border-danger/30 text-xs text-danger-ink">
          <AlertTriangle className="h-5 w-5 text-danger-ink shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">
              Temperatura registrada: {formatTemperature(alarm.temperature)}
            </span>
            <p className="mt-0.5 text-danger-ink">
              Umbral configurado: {formatTemperature(alarm.threshold)}. Al confirmar, se registrará tu usuario ({user?.username}) y fecha/hora de aceptación en la auditoría del sistema.
            </p>
          </div>
        </div>

        {/* Audit Data Preview */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-canvas rounded-xl text-xs text-muted">
          <div>
            <span className="text-muted block text-xs">Usuario responsable:</span>
            <span className="font-semibold text-foreground">
              {user?.username || "Usuario autenticado"}
            </span>
          </div>
          <div>
            <span className="text-muted block text-xs">Disparo de alarma:</span>
            <span className="font-mono text-foreground">
              {formatBackendDateTime(alarm.triggeredAt)}
            </span>
          </div>
        </div>

        {/* Observation input */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="alarm-observation" className="font-medium text-foreground">
              Observación / Medida tomada (opcional):
            </label>
            <span className="text-xs text-muted">
              {observation.length}/{MAX_OBSERVATION_LENGTH}
            </span>
          </div>
          <textarea
            id="alarm-observation"
            value={observation}
            maxLength={MAX_OBSERVATION_LENGTH}
            onChange={(e) => setObservation(e.target.value)}
            placeholder="Ej: Se verificó la válvula de retorno y se estabilizó la temperatura..."
            rows={3}
            className="control-input"
          />
        </div>

        {error && (
          <p role="alert" className="text-xs text-danger-ink font-medium">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
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
