"use client";

import * as React from "react";

/** Reloj para tiempos transcurridos «en vivo»: devuelve la hora actual y se actualiza cada `everyMs` mientras `active`. */
export function useNow(active: boolean, everyMs = 1000): number {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(timer);
  }, [active, everyMs]);
  return now;
}
