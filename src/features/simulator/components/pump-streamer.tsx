"use client";

import * as React from "react";
import Link from "next/link";
import type { Order, ReadingResponse } from "@/types/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { simulatorApi } from "../services/simulatorApi";
import { massForInterval, nextAccumulatedMass } from "../lib/simulation";
import { alarmsApi } from "@/features/alarms/services/alarmsApi";
import { usePolling } from "@/lib/use-polling";
import { formatKg, formatTemperature } from "@/lib/formatters";
import { errorMessage, isApiError } from "@/services/api/client";
import { Play, Pause, Lock, Key } from "lucide-react";

const STEP_MS = 1500;

export function PumpStreamer({ orders, onOrderUpdated }: { orders: Order[]; onOrderUpdated: () => void }) {
  const activeOrders = orders.filter((order) => order.status === 2);
  const [orderNumber, setOrderNumber] = React.useState(0);
  const selected = activeOrders.find((order) => order.orderNumber === orderNumber) ?? activeOrders[0];
  const config = usePolling((signal) => alarmsApi.getAlarmConfig(signal), { intervalMs: 15000, resetKey: "simulator-alarm-config" });

  return (
    <Card className="border-l-4 border-l-warning/30">
      <CardHeader>
        <CardTitle>Puntos 3 y 4 · Sistema de carga</CardTitle>
        <CardDescription>Activá la orden con su PIN, enviá lecturas y cerrá la carga. Cada envío se procesa en el backend real.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="block text-xs font-semibold" htmlFor="pump-order">Orden con tara registrada (estado 2)</label>
        <select id="pump-order" value={selected?.orderNumber ?? 0} onChange={(e) => setOrderNumber(Number(e.target.value))}
          disabled={!activeOrders.length} className="control-input">
          {!activeOrders.length && <option value={0}>No hay órdenes con tara registrada</option>}
          {activeOrders.map((order) => <option key={order.orderNumber} value={order.orderNumber}>#{order.orderNumber} · {order.truck.plate} · Preset: {formatKg(order.preset)}</option>)}
        </select>
        {config.data && <p className="text-xs text-muted">Umbral de alarma vigente: {formatTemperature(config.data.temperatureThreshold)}. Enviá una lectura válida por encima del umbral para generar una alarma. <Link className="underline" href="/alarms">Ver alarmas y estado del correo</Link>.</p>}
        {config.error && <p role="alert" className="text-xs text-danger-ink">No se pudo actualizar el umbral: {config.error}</p>}
        {/* La clave desmonta toda la sesión de bombeo al cambiar de orden: no comparte PIN, timer ni masa. */}
        {selected && <OrderPump key={selected.orderNumber} order={selected} onOrderUpdated={onOrderUpdated} />}
      </CardContent>
    </Card>
  );
}

function OrderPump({ order, onOrderUpdated }: { order: Order; onOrderUpdated: () => void }) {
  const [pin, setPin] = React.useState("");
  const [preset, setPreset] = React.useState<number | null>(null);
  const [isAutoPumping, setIsAutoPumping] = React.useState(false);
  const [flowRate, setFlowRate] = React.useState(12000);
  const [temperature, setTemperature] = React.useState(21);
  const [density, setDensity] = React.useState(0.535);
  const [acceptedMass, setAcceptedMass] = React.useState(order.lastAccumulatedMass ?? 0);
  const acceptedMassRef = React.useRef(acceptedMass);
  const [lastReading, setLastReading] = React.useState<ReadingResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [closed, setClosed] = React.useState(false);
  const [confirmClose, setConfirmClose] = React.useState(false);
  const pending = React.useRef(false);
  const mounted = React.useRef(false);
  const automatic = React.useRef(false);

  React.useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; automatic.current = false; };
  }, []);

  const stop = React.useCallback(() => {
    automatic.current = false;
    setIsAutoPumping(false);
  }, []);

  const report = (err: unknown) => {
    const status = isApiError(err) && err.status ? `HTTP ${err.status}: ` : "";
    setError(`${status}${errorMessage(err, "No se pudo completar la operación")}`);
  };

  const activate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await simulatorApi.activateLoader(order.orderNumber, Number(pin));
      if (!mounted.current) return;
      setPreset(result.preset);
      setPin("");
      onOrderUpdated();
    } catch (err) {
      if (mounted.current) report(err);
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const sendStep = async (increment: number) => {
    if (pending.current || preset === null || closed) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    const mass = nextAccumulatedMass(order.lastAccumulatedMass, acceptedMassRef.current, increment, preset);
    try {
      const result = await simulatorApi.sendReading(order.orderNumber, { accumulatedMass: mass, density, temperature, flowRate });
      if (!mounted.current) return;
      setLastReading(result);
      if (result.saved) {
        acceptedMassRef.current = mass;
        setAcceptedMass(mass);
      }
      // Un descarte no avanza el progreso ni se reintenta automáticamente.
      if (!result.saved || mass >= preset) stop();
      onOrderUpdated();
    } catch (err) {
      if (mounted.current) { report(err); stop(); }
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  // El evento lee los controles y la orden actuales sin reiniciar el timer con cada polling.
  const automaticStep = React.useEffectEvent(() => sendStep(massForInterval(flowRate, STEP_MS)));
  React.useEffect(() => {
    if (!isAutoPumping) return;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    const run = async () => {
      if (disposed || !automatic.current) return;
      await automaticStep();
      if (!disposed && automatic.current) timer = setTimeout(run, STEP_MS);
    };
    timer = setTimeout(run, STEP_MS);
    return () => { disposed = true; clearTimeout(timer); };
  }, [isAutoPumping]);

  const close = async () => {
    if (pending.current || closed) return;
    stop();
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      await simulatorApi.closeOrder(order.orderNumber);
      if (!mounted.current) return;
      setClosed(true);
      setConfirmClose(false);
      onOrderUpdated();
    } catch (err) {
      if (mounted.current) report(err);
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const mass = Math.max(order.lastAccumulatedMass ?? 0, acceptedMass);
  const complete = preset !== null && mass >= preset;

  return (
    <div className="space-y-4">
      {preset === null ? (
        <form onSubmit={activate} className="flex flex-wrap items-end gap-3 rounded-xl bg-canvas p-4">
          <div className="grow"><Input label={`PIN de activación de la orden #${order.orderNumber}`} type="password" inputMode="numeric" pattern="[0-9]{5}" minLength={5} maxLength={5} autoComplete="off" value={pin} onChange={(e) => setPin(e.target.value)} disabled={busy} required /></div>
          <Button type="submit" isLoading={busy}><Key className="h-4 w-4" /> Validar PIN</Button>
          {order.activationDateTime && <p className="w-full text-xs text-muted">La orden ya tiene una activación registrada. Validá su PIN para continuar esta sesión de demostración.</p>}
        </form>
      ) : (
        <>
          <div className="space-y-2 rounded-xl border border-line p-4">
            <p className="text-sm font-semibold">Orden #{order.orderNumber} · Preset devuelto: {formatKg(preset)}</p>
            <p className="font-mono text-sm">Carga confirmada: {formatKg(mass)} / {formatKg(preset)}</p>
            <progress aria-label="Progreso de carga confirmado" value={mass} max={preset} className="h-3 w-full accent-accent" />
            {complete && <p role="status" className="text-sm text-success">Preset alcanzado. La carga está lista para cerrar.</p>}
          </div>
          <fieldset disabled={busy || closed} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Temperatura del gas (°C)" type="number" step="any" value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} />
            <Input label="Caudal másico (kg/h)" type="number" step="any" value={flowRate} onChange={(e) => setFlowRate(Number(e.target.value))} />
            <Input label="Densidad (entre 0 y 1)" type="number" step="any" value={density} onChange={(e) => setDensity(Number(e.target.value))} />
          </fieldset>
          <p className="text-xs text-muted">El bombeo automático convierte el caudal de kg/h a kg por intervalo de 1,5 s. Los botones de incremento aceleran la demostración.</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={closed || (!isAutoPumping && (busy || complete))} onClick={() => {
              if (isAutoPumping) stop();
              else { automatic.current = true; setIsAutoPumping(true); }
            }}>{isAutoPumping ? <><Pause className="h-4 w-4" /> Pausar bombeo</> : <><Play className="h-4 w-4" /> Iniciar bombeo automático</>}</Button>
            <Button type="button" variant="outline" disabled={busy || closed || complete || isAutoPumping} onClick={() => void sendStep(500)}>+500 kg</Button>
            <Button type="button" variant="outline" disabled={busy || closed || complete || isAutoPumping} onClick={() => void sendStep(2000)}>+2.000 kg</Button>
            <Button type="button" variant="danger" disabled={busy || closed} onClick={() => { stop(); setConfirmClose(true); }}><Lock className="h-4 w-4" /> Cerrar carga</Button>
          </div>
          {confirmClose && !closed && <div role="group" aria-label="Confirmar cierre de carga" className="space-y-3 rounded-xl border border-warning/30 p-4">
            <p className="text-sm">¿Cerrar la orden #{order.orderNumber} con {formatKg(mass)} cargados? El cierre impide enviar nuevas lecturas.</p>
            <div className="flex gap-2"><Button type="button" variant="danger" isLoading={busy} onClick={() => void close()}>Confirmar cierre</Button><Button type="button" variant="outline" disabled={busy} onClick={() => setConfirmClose(false)}>Cancelar</Button></div>
          </div>}
          {lastReading && <p role="status"className={`text-sm ${lastReading.saved ?"text-success " : "text-warning"}`}>
            saved: {String(lastReading.saved)} · reason: {lastReading.reason ?? "null"}
          </p>}
          {closed && <p role="status" className="text-sm text-success">Orden #{order.orderNumber} cerrada en estado 3. Continuá con el pesaje final.</p>}
        </>
      )}
      {error && <p role="alert" className="text-sm text-danger-ink">{error}</p>}
    </div>
  );
}
