"use client";

import * as React from "react";
import { Order } from "@/types/order";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { simulatorApi } from "../services/simulatorApi";
import { ordersApi } from "@/features/orders/services/ordersApi";
import { formatKg, formatTemperature } from "@/lib/formatters";
import { Play, Pause, Zap, Lock, Key, Flame } from "lucide-react";

interface PumpStreamerProps {
  orders: Order[];
  onOrderUpdated: () => void;
}

export function PumpStreamer({ orders, onOrderUpdated }: PumpStreamerProps) {
  const state2Orders = orders.filter((o) => o.state === 2);

  const [selectedOrderId, setSelectedOrderId] = React.useState<number>(0);
  const [pinInput, setPinInput] = React.useState("");
  const [isPinValidated, setIsPinValidated] = React.useState(false);
  const [pinError, setPinError] = React.useState<string | null>(null);

  // Pump variables
  const [isAutoPumping, setIsAutoPumping] = React.useState(false);
  const [flowRate, setFlowRate] = React.useState(12000); // kg/h
  const [temperature, setTemperature] = React.useState(20.5); // °C
  const [density] = React.useState(0.54); // kg/m³

  const effectiveOrderId = selectedOrderId || state2Orders[0]?.id || 0;
  const selectedOrder = orders.find((o) => o.id === effectiveOrderId);

  const handleOrderChange = (newId: number) => {
    setSelectedOrderId(newId);
    setIsPinValidated(false);
    setIsAutoPumping(false);
    setPinError(null);
    const order = orders.find((o) => o.id === newId);
    setPinInput(order?.activationPassword || "");
  };

  const handleValidatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setPinError(null);
    try {
      await simulatorApi.activatePumpWithPin(
        selectedOrder.orderNumber,
        pinInput.trim()
      );
      setIsPinValidated(true);
      onOrderUpdated();
    } catch (err: unknown) {
      setPinError(err instanceof Error ? err.message : "PIN inválido");
    }
  };

  const sendStep = React.useCallback(async (massIncrementKg: number) => {
    if (!selectedOrder) return;
    const currentMass = selectedOrder.lastAccumulatedMass || 0;
    const nextMass = Math.min(
      selectedOrder.preset,
      currentMass + massIncrementKg
    );

    try {
      await simulatorApi.streamTelemetry(selectedOrder.id, {
        accumulatedMass: nextMass,
        density,
        temperature,
        flowRate,
      });
      onOrderUpdated();

      if (nextMass >= selectedOrder.preset) {
        setIsAutoPumping(false);
      }
    } catch (err) {
      console.error(err);
      setIsAutoPumping(false);
    }
  }, [selectedOrder, density, temperature, flowRate, onOrderUpdated, setIsAutoPumping]);

  // Auto pump timer: inyecta masa cada 1.5s
  React.useEffect(() => {
    if (!isAutoPumping) return;

    // 12000 kg/h = 3.33 kg/s -> en 1.5s son aprox 500 kg
    const interval = setInterval(() => {
      sendStep(350);
    }, 1500);

    return () => clearInterval(interval);
  }, [isAutoPumping, sendStep]);

  const handleCloseOrder = async () => {
    if (!selectedOrder) return;
    setIsAutoPumping(false);
    try {
      await ordersApi.closeOrder(selectedOrder.id);
      onOrderUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card className="border-l-4 border-l-amber-500">
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-amber-700">
          Punto 3 & 4: Emulador de Bomba & Telemetría Másica en Vivo
        </CardTitle>
        <CardDescription>
          Simula el instrumento de carga, envío de telemetría progresiva y prueba de alarma de temperatura.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selector de orden en Estado 2 */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Orden en Estado 2 para Carga:
          </label>
          <select
            value={effectiveOrderId}
            onChange={(e) => handleOrderChange(Number(e.target.value))}
            className="w-full h-10 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs"
            disabled={state2Orders.length === 0}
          >
            {state2Orders.length === 0 && (
              <option value={0}>No hay órdenes en Estado 2 (Registra una tara primero)</option>
            )}
            {state2Orders.map((o) => (
              <option key={o.id} value={o.id}>
                Orden #{o.orderNumber} - Patente: {o.truck.patent} | Preset: {formatKg(o.preset)} | Cargado: {formatKg(o.lastAccumulatedMass)}
              </option>
            ))}
          </select>
        </div>

        {selectedOrder && (
          <>
            {/* Validación de PIN */}
            {!isPinValidated ? (
              <form
                onSubmit={handleValidatePin}
                className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700/60 space-y-3"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  <Key className="h-4 w-4 text-amber-600" />
                  <span>Validación de Contraseña de Activación en Cabezal de Carga</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="PIN de 5 dígitos"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="font-mono text-center text-lg font-bold tracking-widest max-w-[200px]"
                    required
                  />
                  <Button type="submit" size="sm" variant="primary">
                    Habilitar Instrumento
                  </Button>
                </div>
                {pinError && <p className="text-xs text-rose-500">{pinError}</p>}
                <p className="text-[11px] text-zinc-400">
                  PIN asignado por el backend a esta orden:{" "}
                  <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                    {selectedOrder.activationPassword || "No registrado"}
                  </span>
                </p>
              </form>
            ) : (
              <div className="space-y-4">
                {/* Controles de Bombeo */}
                <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-emerald-600" />
                      Instrumento Habilitado - Preset Obtenido: {formatKg(selectedOrder.preset)}
                    </span>
                    <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                      Actual: {formatKg(selectedOrder.lastAccumulatedMass)} (
                      {(
                        ((selectedOrder.lastAccumulatedMass || 0) /
                          selectedOrder.preset) *
                        100
                      ).toFixed(1)}
                      %)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button
                      type="button"
                      variant={isAutoPumping ? "secondary" : "primary"}
                      size="sm"
                      onClick={() => setIsAutoPumping(!isAutoPumping)}
                      className="gap-1.5"
                    >
                      {isAutoPumping ? (
                        <>
                          <Pause className="h-4 w-4 text-amber-400" /> Pausar Bombeo
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" /> Iniciar Bombeo Automático
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => sendStep(500)}
                      className="gap-1"
                    >
                      +500 kg
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => sendStep(2000)}
                      className="gap-1"
                    >
                      +2.000 kg
                    </Button>

                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={handleCloseOrder}
                      className="ml-auto gap-1"
                    >
                      <Lock className="h-4 w-4" />
                      Cerrar Carga (Pasa a Estado 3)
                    </Button>
                  </div>
                </div>

                {/* Sliders de Variables en Tiempo Real */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700">
                  {/* Slider de Temperatura - Simula Alarma */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      <span className="flex items-center gap-1">
                        <Flame className="h-3.5 w-3.5 text-amber-500" />
                        Temperatura del Gas:
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          temperature > 22 ? "text-rose-600 animate-pulse" : "text-zinc-800 dark:text-zinc-200"
                        }`}
                      >
                        {formatTemperature(temperature)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="14"
                      max="32"
                      step="0.5"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full accent-rose-600"
                    />
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Mueve el slider por encima de 22°C para disparar la alarma de temperatura.
                    </p>
                  </div>

                  {/* Caudal */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      <span>Caudal Másico:</span>
                      <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                        {flowRate} kg/h
                      </span>
                    </div>
                    <input
                      type="range"
                      min="4000"
                      max="20000"
                      step="1000"
                      value={flowRate}
                      onChange={(e) => setFlowRate(parseInt(e.target.value, 10))}
                      className="w-full accent-blue-600"
                    />
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Afecta directamente el cálculo del ETA en tiempo real.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
