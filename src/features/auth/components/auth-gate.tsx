"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function FullScreenSpinner({ label }: { label: string }) {
  return (
    <div role="status" className="flex min-h-screen items-center justify-center gap-2 text-sm text-zinc-500">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

/**
 * Protege un grupo de rutas: sin sesión redirige a `/login` y no muestra el contenido ni un instante.
 *
 * Es reactivo a propósito: en Next un `layout` no se vuelve a renderizar al navegar, así que la comprobación no puede
 * hacerse una sola vez al entrar. Como depende del estado de `AuthProvider`, un cierre de sesión (botón, 401, vencimiento
 * del token o cierre desde otra pestaña) saca al usuario de inmediato.
 *
 * Esto cuida la interfaz, no los datos: la seguridad real es el JWT que valida el backend en cada pedido.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) return <FullScreenSpinner label="Verificando sesión…" />;
  if (!isAuthenticated) return <FullScreenSpinner label="Redirigiendo al inicio de sesión…" />;
  return <>{children}</>;
}
