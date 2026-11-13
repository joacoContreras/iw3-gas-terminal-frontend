"use client";

import * as React from "react";
import Link from "next/link";
import type { Order, Reconciliation } from "@/types/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { simulatorApi } from "../services/simulatorApi";
import { formatKg, formatTemperature, formatDensity, formatFlowRate } from "@/lib/formatters";
import { errorMessage } from "@/services/api/client";
import { Scale, CheckCircle2, AlertCircle, ExternalLink, Key } from "lucide-react";

interface TmsScaleControlProps {
  orders: Order[];
  onOrderUpdated: () => void;
}

export function TmsScaleControl({ orders, onOrderUpdated }: TmsScaleControlProps) {
  const state1Orders = orders.filter((o) => o.status === 1);
  const state3Orders = orders.filter((o) => o.status === 3);

  const [taraOrderNumber, setTaraOrderNumber] = React.useState<number>(0);
  const [taraWeight, setTaraWeight] = React.useState<number>(14500);
  const [generatedPin, setGeneratedPin] = React.useState<{ orderNumber: number; pin: number } | null>(null);
  const taraPending = React.useRef(false);
  const finalPending = React.useRef(false);
  const [isTaraLoading, setIsTaraLoading] = React.useState(false);
  const [taraError, setTaraError] = React.useState<string | null>(null);

  const [finalOrderNumber, setFinalOrderNumber] = React.useState<number>(0);
  const [finalWeight, setFinalWeight] = React.useState<number>(29500);
  const [isFinalLoading, setIsFinalLoading] = React.useState(false);
  const [reconciliation, setReconciliation] = React.useState<Reconciliation | null>(null);
  const [finalError, setFinalError] = React.useState<string | null>(null);

  const effectiveTaraOrderNumber = state1Orders.find((o) => o.orderNumber === taraOrderNumber)?.orderNumber ?? state1Orders[0]?.orderNumber ?? 0;
  const effectiveFinalOrderNumber = state3Orders.find((o) => o.orderNumber === finalOrderNumber)?.orderNumber ?? state3Orders[0]?.orderNumber ?? 0;

  const handleSendTara = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveTaraOrderNumber || taraPending.current) return;
    taraPending.current = true;
    setIsTaraLoading(true);
    setGeneratedPin(null);
    setTaraError(null);

    try {
      const res = await simulatorApi.registerTare(
        effectiveTaraOrderNumber,
        Number(taraWeight)
      );
      setGeneratedPin({ orderNumber: effectiveTaraOrderNumber, pin: res.activationPassword });
      onOrderUpdated();
    } catch (err: unknown) {
      setTaraError(errorMessage(err, "Error al registrar pesaje de tara"));
    } finally {
      taraPending.current = false;
      setIsTaraLoading(false);
    }
  };

  const handleSendFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveFinalOrderNumber || finalPending.current) return;
    finalPending.current = true;
    setIsFinalLoading(true);
    setReconciliation(null);
    setFinalError(null);

    try {
      const result = await simulatorApi.registerFinalWeight(
        effectiveFinalOrderNumber,
        Number(finalWeight)
      );
      setReconciliation(result);
      onOrderUpdated();
    } catch (err: unknown) {
      setFinalError(errorMessage(err, "Error al registrar pesaje final"));
    } finally {
      finalPending.current = false;
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
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Punto 2: Balanza TMS (Pesaje Inicial / Tara)
            </CardTitle>
          </div>
          <CardDescription>
            Registra el peso del camión vacío.
            Transiciona la orden a <b>Estado 2</b> y entrega la contraseña de activación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendTara} className="space-y-3">
            <div>
              <label htmlFor="tare-order" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Seleccionar Orden en Estado 1:
              </label>
              <select
                id="tare-order"
                value={effectiveTaraOrderNumber}
                onChange={(e) => {
                  setTaraOrderNumber(Number(e.target.value));
                  setGeneratedPin(null);
                  setTaraError(null);
                }}
                className="w-full h-10 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs"
                disabled={state1Orders.length === 0 || isTaraLoading}
              >
                {state1Orders.length === 0 && (
                  <option value={0}>No hay órdenes en Estado 1</option>
                )}
                {state1Orders.map((o) => (
                  <option key={o.orderNumber} value={o.orderNumber}>
                    Orden #{o.orderNumber} — Patente: {o.truck.plate} ({o.customer.companyName})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Pesaje Inicial / Tara (kg)"
              type="number"
              min="0.01"
              step="any"
              disabled={isTaraLoading}
              value={taraWeight}
              onChange={(e) => setTaraWeight(Number(e.target.value))}
              required
            />

            {taraError && (
              <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{taraError}</span>
              </div>
            )}

            {generatedPin !== null && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                  <Key className="h-4 w-4 text-emerald-600" />
                  <span>Orden #{generatedPin.orderNumber}: tara guardada. PIN de activación:</span>
                </div>
                <span className="font-mono text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-widest block pt-1">
                  {generatedPin.pin}
                </span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Copiá esta clave: la requerirás en el Punto 3 para activar el cabezal de carga.
                </p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isTaraLoading}
              disabled={state1Orders.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Registrar Tara y Generar PIN (Punto 2)
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Pesaje Final -> Estado 4 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-violet-600" />
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-400">
              Punto 5: Balanza TMS (Pesaje Final / Bruto)
            </CardTitle>
          </div>
          <CardDescription>
            Registra el peso del camión cargado.
            Pasa la orden a <b>Estado 4 (Finalizada)</b> y genera la conciliación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendFinal} className="space-y-3">
            <div>
              <label htmlFor="final-order" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Seleccionar Orden en Estado 3 (Cerrada para carga):
              </label>
              <select
                id="final-order"
                value={effectiveFinalOrderNumber}
                onChange={(e) => {
                  setFinalOrderNumber(Number(e.target.value));
                  setReconciliation(null);
                  setFinalError(null);
                }}
                className="w-full h-10 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs"
                disabled={state3Orders.length === 0 || isFinalLoading}
              >
                {state3Orders.length === 0 && (
                  <option value={0}>No hay órdenes en Estado 3 (Cerrá una orden en carga primero)</option>
                )}
                {state3Orders.map((o) => (
                  <option key={o.orderNumber} value={o.orderNumber}>
                    Orden #{o.orderNumber} — {o.truck.plate} (Tara: {formatKg(o.tare)} | Cargado: {formatKg(o.lastAccumulatedMass)})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Pesaje Final / Bruto (kg)"
              type="number"
              min="0.01"
              step="any"
              disabled={isFinalLoading}
              value={finalWeight}
              onChange={(e) => setFinalWeight(Number(e.target.value))}
              required
            />

            {finalError && (
              <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{finalError}</span>
              </div>
            )}

            {reconciliation && (
              <div className="p-3.5 bg-violet-50 dark:bg-violet-950/40 rounded-xl border border-violet-200 dark:border-violet-800 text-xs text-violet-800 dark:text-violet-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-violet-600 shrink-0" />
                  <span>
                    ¡Orden <b>#{reconciliation.orderNumber}</b> finalizada con éxito!
                  </span>
                </div>
                <Link
                  href={`/orders/${reconciliation.orderNumber}/reconciliation`}
                  className="text-violet-700 dark:text-violet-300 font-semibold underline flex items-center gap-1 hover:text-violet-900"
                >
                  Ver Conciliación <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}

            {reconciliation && <dl aria-label="Conciliación recibida del pesaje final" className="grid grid-cols-2 gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 text-xs tabular-nums">
              {[
                ["Tara", formatKg(reconciliation.tare)],
                ["Pesaje final", formatKg(reconciliation.finalWeight)],
                ["Producto cargado", formatKg(reconciliation.loadedProduct)],
                ["Neto por balanza", formatKg(reconciliation.scaleNet)],
                ["Diferencia", formatKg(reconciliation.difference)],
                ["Temperatura media", reconciliation.averageTemperature === null ? "Sin datos" : formatTemperature(reconciliation.averageTemperature)],
                ["Densidad media", reconciliation.averageDensity === null ? "Sin datos" : formatDensity(reconciliation.averageDensity)],
                ["Caudal medio", reconciliation.averageFlowRate === null ? "Sin datos" : formatFlowRate(reconciliation.averageFlowRate)],
              ].map(([label, value]) => <div key={label}><dt className="text-zinc-500">{label}</dt><dd className="font-semibold mt-1">{value}</dd></div>)}
            </dl>}

            <Button
              type="submit"
              variant="secondary"
              size="sm"
              isLoading={isFinalLoading}
              disabled={state3Orders.length === 0}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              Registrar Pesaje Final & Conciliar (Punto 5)
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
