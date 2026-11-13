"use client";

import * as React from "react";
import type { AlarmConfig } from "@/types/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/services/api/client";
import {
  validateThreshold,
  validateRecipientEmails,
  isValidEmail,
  MAX_RECIPIENT_EMAILS,
} from "../lib/alarm-validation";
import { Settings, Plus, Trash2, Check, AlertCircle } from "lucide-react";

interface AlarmConfigFormProps {
  config: AlarmConfig | null;
  onSave: (config: AlarmConfig) => Promise<AlarmConfig>;
  /** Solo lectura: quien no puede editar la configuración (el backend exige ADMIN) la ve sin poder cambiarla. */
  readOnly?: boolean;
}

export function AlarmConfigForm({
  config,
  onSave,
  readOnly = false,
}: AlarmConfigFormProps) {
  const [threshold, setThreshold] = React.useState<string>(
    config ? String(config.temperatureThreshold) : "25.0"
  );
  const [emails, setEmails] = React.useState<string[]>(
    config?.recipientEmails || []
  );
  const [newEmail, setNewEmail] = React.useState("");
  const [emailInputError, setEmailInputError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    if (config) {
      setThreshold(String(config.temperatureThreshold));
      setEmails(config.recipientEmails);
    }
  }, [config]);

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailInputError(null);
    const trimmed = newEmail.trim();
    if (!trimmed) return;

    if (!isValidEmail(trimmed)) {
      setEmailInputError("Formato de correo no válido.");
      return;
    }

    if (emails.some((em) => em.toLowerCase() === trimmed.toLowerCase())) {
      setEmailInputError("Este correo ya está en la lista.");
      return;
    }

    if (emails.length >= MAX_RECIPIENT_EMAILS) {
      setEmailInputError(`Límite alcanzado: máximo ${MAX_RECIPIENT_EMAILS} destinatarios.`);
      return;
    }

    setEmails([...emails, trimmed]);
    setNewEmail("");
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter((em) => em !== emailToRemove));
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(false);

    const thresholdVal = validateThreshold(threshold);
    if (!thresholdVal.valid) {
      setError(thresholdVal.error ?? "Umbral inválido");
      return;
    }

    const emailsVal = validateRecipientEmails(emails);
    if (!emailsVal.valid) {
      setError(emailsVal.error ?? "Lista de correos inválida");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        temperatureThreshold: Number(threshold),
        recipientEmails: emailsVal.sanitized ?? emails,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err: unknown) {
      setError(errorMessage(err, "Error al guardar la configuración"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-600" />
          <CardTitle>Configuración de Alarmas de Temperatura</CardTitle>
        </div>
        <CardDescription>
          Ajusta el umbral de disparo de emergencia y los destinatarios de los correos automáticos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Umbral de Temperatura */}
        <div className="max-w-xs space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Umbral de Temperatura (°C):
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="0.5"
              value={threshold}
              onChange={(e) => {
                setThreshold(e.target.value);
                setError(null);
              }}
              className="font-mono text-base font-bold"
              disabled={readOnly}
            />
            <span className="text-sm font-semibold text-zinc-500">°C</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Cualquier lectura con temperatura superior a este valor disparará una alarma y notificará por e-mail.
          </p>
        </div>

        {/* Correos de Notificación */}
        <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Destinatarios de Alerta por Correo:
            </label>
            <span className="text-[11px] font-mono text-zinc-400">
              {emails.length}/{MAX_RECIPIENT_EMAILS}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 min-h-8">
            {emails.length === 0 ? (
              <span className="text-xs text-zinc-400 italic">
                No hay correos configurados (la alarma se registrará pero no enviará e-mails).
              </span>
            ) : (
              emails.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-mono border border-zinc-200/60 dark:border-zinc-700"
                >
                  {email}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
                      className="text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Eliminar correo"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))
            )}
          </div>

          {!readOnly && (
            <div className="space-y-1.5 pt-1">
              <form onSubmit={handleAddEmail} className="flex gap-2 max-w-md">
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setEmailInputError(null);
                  }}
                  placeholder="nuevo.destinatario@gas-terminal.com"
                  disabled={emails.length >= MAX_RECIPIENT_EMAILS}
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  className="shrink-0"
                  disabled={emails.length >= MAX_RECIPIENT_EMAILS}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </form>
              {emailInputError && (
                <p className="text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {emailInputError}
                </p>
              )}
            </div>
          )}
        </div>

        {error && (
          <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Botón Guardar */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            {success && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <Check className="h-4 w-4" /> Configuración guardada correctamente
              </span>
            )}
          </div>
          {readOnly ? (
            <span className="text-xs text-zinc-500">
              Solo un usuario con rol ADMIN puede modificar la configuración.
            </span>
          ) : (
            <Button
              onClick={handleSave}
              isLoading={isSaving}
              className="gap-2"
            >
              Guardar Configuración
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
