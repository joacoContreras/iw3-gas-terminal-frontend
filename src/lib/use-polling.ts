"use client";

import * as React from "react";
import { errorMessage } from "@/services/api/client";

export interface PollingState<T> {
  /** Último dato recibido. Se conserva si un refresco falla (se muestra junto al error). */
  data: T | null;
  /** Mensaje real del backend (o de conexión) del último intento; `null` si salió bien. */
  error: string | null;
  /** `true` hasta que termina el primer intento con estos parámetros. */
  isLoading: boolean;
  /** Estado HTTP del último error (`0` sin respuesta), para distinguir 403 o 404 de una caída. */
  errorStatus: number | null;
  /** Cuándo llegó el último dato (milisegundos). */
  updatedAt: number | null;
  /** Pide el dato ya, sin esperar al próximo ciclo. */
  refetch: () => void;
}

interface Options<T> {
  /**
   * Milisegundos entre intentos; `null` o `0` = una sola vez (sin *polling*). Puede ser una función del último dato
   * (por ejemplo, más rápido mientras la orden está en carga) sin que cambiar el intervalo reinicie la pantalla.
   */
  intervalMs: number | null | ((data: T | null) => number | null);
  /** Al cambiar, se descarta el dato anterior y se vuelve a empezar (filtros, página, número de orden). */
  resetKey: string;
  enabled?: boolean;
}

/**
 * Tiempo real por *polling* (el backend no tiene WebSockets ni SSE; decisión D-8).
 *
 *  - Nunca hay dos pedidos a la vez: el siguiente se programa cuando termina el anterior.
 *  - Se pausa con la pestaña oculta y se pide de inmediato al volver a verla.
 *  - Al desmontar o cambiar `resetKey` se cancela el pedido en vuelo (`AbortController`).
 *  - Un fallo no borra el último dato bueno: la pantalla puede mostrar el dato y el aviso.
 *
 * `fetcher` puede cambiar en cada render (se lee por referencia); lo que dispara un reinicio es `resetKey`.
 */
export function usePolling<T>(fetcher: (signal: AbortSignal) => Promise<T>, { intervalMs, resetKey, enabled = true }: Options<T>): PollingState<T> {
  const [state, setState] = React.useState<Omit<PollingState<T>, "refetch">>({
    data: null,
    error: null,
    isLoading: true,
    errorStatus: null,
    updatedAt: null,
  });
  const fetcherRef = React.useRef(fetcher);
  fetcherRef.current = fetcher;
  const intervalRef = React.useRef(intervalMs);
  intervalRef.current = intervalMs;
  const dataRef = React.useRef<T | null>(null);
  const triggerRef = React.useRef<() => void>(() => {});

  React.useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let running = false;
    let disposed = false;

    dataRef.current = null;
    setState({ data: null, error: null, isLoading: true, errorStatus: null, updatedAt: null });

    const schedule = () => {
      const every = typeof intervalRef.current === "function" ? intervalRef.current(dataRef.current) : intervalRef.current;
      if (disposed || !every) return;
      timer = setTimeout(run, every);
    };

    async function run() {
      if (disposed || running) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        schedule(); // pestaña oculta: no se pide, pero se vuelve a mirar más tarde
        return;
      }
      running = true;
      try {
        const data = await fetcherRef.current(controller.signal);
        if (disposed) return;
        dataRef.current = data;
        setState({ data, error: null, isLoading: false, errorStatus: null, updatedAt: Date.now() });
      } catch (err) {
        if (disposed || controller.signal.aborted) return;
        const status = typeof (err as { status?: unknown })?.status === "number" ? (err as { status: number }).status : 0;
        setState((prev) => ({ ...prev, error: errorMessage(err, "No se pudo obtener la información"), errorStatus: status, isLoading: false }));
      } finally {
        running = false;
        schedule();
      }
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        clearTimeout(timer);
        void run();
      }
    };
    triggerRef.current = () => {
      clearTimeout(timer);
      void run();
    };

    void run();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      disposed = true;
      controller.abort();
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [resetKey, enabled]);

  const refetch = React.useCallback(() => triggerRef.current(), []);
  return { ...state, refetch };
}
