"use client";

import * as React from "react";
import { AlarmConfig } from "@/types/alarm";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings, Plus, Trash2, Check } from "lucide-react";

interface AlarmConfigFormProps {
  config: AlarmConfig | null;
  onSave: (config: Partial<AlarmConfig>) => Promise<any>;
}

export function AlarmConfigForm({ config, onSave }: AlarmConfigFormProps) {
  const [threshold, setThreshold] = React.useState<number>(
    config?.temperatureThreshold || 22.0
  );
  const [emails, setEmails] = React.useState<string[]>(
    config?.recipientEmails || ["seguridad@gas-terminal.com"]
  );
  const [newEmail, setNewEmail] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    if (config) {
      setThreshold(config.temperatureThreshold);
      setEmails(config.recipientEmails);
    }
  }, [config]);

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes("@")) return;
    if (!emails.includes(newEmail)) {
      setEmails([...emails, newEmail.trim()]);
    }
    setNewEmail("");
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter((em) => em !== emailToRemove));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccess(false);
    try {
      await onSave({
        temperatureThreshold: Number(threshold),
        recipientEmails: emails,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
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
              onChange={(e) => setThreshold(parseFloat(e.target.value) || 0)}
              className="font-mono text-base font-bold"
            />
            <span className="text-sm font-semibold text-zinc-500">°C</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Si la telemetría excede este valor, el backend disparará la alarma y enviará los correos.
          </p>
        </div>

        {/* Correos de Notificación */}
        <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Destinatarios de Alerta por Correo:
          </label>

          <div className="flex flex-wrap gap-2">
            {emails.map((email) => (
              <span
                key={email}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-mono border border-zinc-200/60 dark:border-zinc-700"
              >
                {email}
                <button
                  type="button"
                  onClick={() => handleRemoveEmail(email)}
                  className="text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          <form onSubmit={handleAddEmail} className="flex gap-2 max-w-md pt-1">
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="nuevo.destinatario@gas-terminal.com"
            />
            <Button type="submit" variant="secondary" size="sm" className="shrink-0">
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </form>
        </div>

        {/* Botón Guardar */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            {success && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <Check className="h-4 w-4" /> Configuración guardada correctamente
              </span>
            )}
          </div>
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            className="gap-2"
          >
            Guardar Configuración
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
