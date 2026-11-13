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
            <Scale className="h-4 w-4 text-success" />
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-success">
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
              <label htmlFor="tare-order" className="block text-xs font-semibold text-foreground mb-1">
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
                className="control-input"
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
              <div role="alert" className="p-3 bg-danger/10 border border-danger/30 rounded-xl text-xs text-danger-ink flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{taraError}</span>
              </div>
            )}

            {generatedPin !== null && (
              <div className="p-3.5 bg-success/10 rounded-xl border border-success/30 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-success">
                  <Key className="h-4 w-4 text-success" />
                  <span>Orden #{generatedPin.orderNumber}: tara guardada. PIN de activación:</span>
                </div>
                <span className="font-mono text-2xl font-bold text-success tracking-widest block pt-1">
                  {generatedPin.pin}
                </span>
                <p className="text-xs text-muted">
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
              className="w-full "
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
            <Scale className="h-4 w-4 text-accent" />
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-accent">
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
              <label htmlFor="final-order" className="block text-xs font-semibold text-foreground mb-1">
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
                className="control-input"
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
              <div role="alert" className="p-3 bg-danger/10 border border-danger/30 rounded-xl text-xs text-danger-ink flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{finalError}</span>
              </div>
            )}

            {reconciliation && (
              <div className="p-3.5 bg-accent/10 rounded-xl border border-accent/30 text-xs text-accent flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                  <span>
                    ¡Orden <b>#{reconciliation.orderNumber}</b> finalizada con éxito!
                  </span>
                </div>
                <Link
                  href={`/orders/${reconciliation.orderNumber}/reconciliation`}
                  className="text-accent font-semibold underline flex items-center gap-1 hover:text-accent"
                >
                  Ver Conciliación <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}

            {reconciliation && <dl aria-label="Conciliación recibida del pesaje final" className="grid grid-cols-2 gap-3 rounded-xl border border-line p-4 text-xs tabular-nums">
              {[
                ["Tara", formatKg(reconciliation.tare)],
                ["Pesaje final", formatKg(reconciliation.finalWeight)],
                ["Producto cargado", formatKg(reconciliation.loadedProduct)],
                ["Neto por balanza", formatKg(reconciliation.scaleNet)],
                ["Diferencia", formatKg(reconciliation.difference)],
                ["Temperatura media", reconciliation.averageTemperature === null ? "Sin datos" : formatTemperature(reconciliation.averageTemperature)],
                ["Densidad media", reconciliation.averageDensity === null ? "Sin datos" : formatDensity(reconciliation.averageDensity)],
                ["Caudal medio", reconciliation.averageFlowRate === null ? "Sin datos" : formatFlowRate(reconciliation.averageFlowRate)],
              ].map(([label, value]) => <div key={label}><dt className="text-muted">{label}</dt><dd className="font-semibold mt-1">{value}</dd></div>)}
            </dl>}

            <Button
              type="submit"
              variant="secondary"
              size="sm"
              isLoading={isFinalLoading}
              disabled={state3Orders.length === 0}
              className="w-full "
            >
              Registrar Pesaje Final & Conciliar (Punto 5)
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
