"use client";

import * as React from "react";
import { Order } from "@/types/order";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { simulatorApi } from "../services/simulatorApi";
import { Scale, CheckCircle2 } from "lucide-react";

interface TmsScaleControlProps {
  orders: Order[];
  onOrderUpdated: () => void;
}

export function TmsScaleControl({ orders, onOrderUpdated }: TmsScaleControlProps) {
  // Filter candidates for State 1 (Tara) and State 3 (Pesaje final)
  const state1Orders = orders.filter((o) => o.state === 1);
  const state3Orders = orders.filter((o) => o.state === 3);

  const [taraOrderId, setTaraOrderId] = React.useState<number>(0);
  const [taraWeight, setTaraWeight] = React.useState<number>(14200);
  const [generatedPin, setGeneratedPin] = React.useState<string | null>(null);
  const [isTaraLoading, setIsTaraLoading] = React.useState(false);

  const [finalOrderId, setFinalOrderId] = React.useState<number>(0);
  const [finalWeight, setFinalWeight] = React.useState<number>(34150);
  const [isFinalLoading, setIsFinalLoading] = React.useState(false);
  const [finalSuccess, setFinalSuccess] = React.useState(false);

  const effectiveTaraOrderId = taraOrderId || state1Orders[0]?.id || 0;
  const effectiveFinalOrderId = finalOrderId || state3Orders[0]?.id || 0;

  const handleSendTara = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveTaraOrderId) return;
    setIsTaraLoading(true);
    setGeneratedPin(null);
    try {
      const updated = await simulatorApi.sendInitialWeight(effectiveTaraOrderId, Number(taraWeight));
      setGeneratedPin(updated.activationPassword || "Generada");
      onOrderUpdated();
    } finally {
      setIsTaraLoading(false);
    }
  };

  const handleSendFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveFinalOrderId) return;
    setIsFinalLoading(true);
    setFinalSuccess(false);
    try {
      await simulatorApi.sendFinalWeight(effectiveFinalOrderId, Number(finalWeight));
      setFinalSuccess(true);
      onOrderUpdated();
    } finally {
      setIsFinalLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Pesaje Inicial (Tara) -> Estado 2 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-emerald-600" />
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
              Punto 2: Balanza TMS (Pesaje Inicial / Tara)
            </CardTitle>
          </div>
          <CardDescription>
            Registra el camión vacío en balanza. Transiciona a Estado 2 y genera el PIN de activación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendTara} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Seleccionar Orden en Estado 1:
              </label>
              <select
                value={effectiveTaraOrderId}
                onChange={(e) => setTaraOrderId(Number(e.target.value))}
                className="w-full h-10 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs"
                disabled={state1Orders.length === 0}
              >
                {state1Orders.length === 0 && (
                  <option value={0}>No hay órdenes en Estado 1</option>
                )}
                {state1Orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    Orden #{o.orderNumber} - {o.truck.patent} ({o.customer.businessName})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Pesaje Inicial / Tara (kg)"
              type="number"
              step="50"
              value={taraWeight}
              onChange={(e) => setTaraWeight(Number(e.target.value))}
              required
            />

            {generatedPin && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                  ¡Pesaje inicial guardado! Contraseña de Activación generada:
                </span>
                <span className="font-mono text-xl font-black text-emerald-700 dark:text-emerald-400 tracking-widest mt-1 block">
                  {generatedPin}
                </span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isTaraLoading}
              disabled={state1Orders.length === 0}
              className="w-full"
            >
              Registrar Tara y Generar PIN
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Pesaje Final -> Estado 4 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-violet-600" />
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-violet-700">
              Punto 5: Balanza TMS (Pesaje Final / Bruto)
            </CardTitle>
          </div>
          <CardDescription>
            Registra el camión cargado en balanza. Transiciona a Estado 4 y calcula la conciliación final.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendFinal} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Seleccionar Orden en Estado 3 (Cerrada):
              </label>
              <select
                value={effectiveFinalOrderId}
                onChange={(e) => setFinalOrderId(Number(e.target.value))}
                className="w-full h-10 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs"
                disabled={state3Orders.length === 0}
              >
                {state3Orders.length === 0 && (
                  <option value={0}>No hay órdenes en Estado 3</option>
                )}
                {state3Orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    Orden #{o.orderNumber} - {o.truck.patent} (Tara: {o.initialWeight} kg)
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Pesaje Final / Bruto (kg)"
              type="number"
              step="50"
              value={finalWeight}
              onChange={(e) => setFinalWeight(Number(e.target.value))}
              required
            />

            {finalSuccess && (
              <div className="p-3 bg-violet-50 dark:bg-violet-950/40 rounded-xl border border-violet-200 dark:border-violet-800 text-xs text-violet-800 dark:text-violet-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-violet-600 shrink-0" />
                <span>¡Orden #{finalOrderId} finalizada con éxito! Conciliación lista.</span>
              </div>
            )}

            <Button
              type="submit"
              variant="secondary"
              size="sm"
              isLoading={isFinalLoading}
              disabled={state3Orders.length === 0}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              Registrar Pesaje Final & Conciliar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
