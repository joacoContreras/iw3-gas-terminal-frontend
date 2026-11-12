import * as React from "react";
import { ShieldOff } from "lucide-react";

/**
 * Pantalla de «sin permisos»: se muestra cuando el rol no permite la pantalla o cuando el backend respondió 403.
 * No cierra la sesión (el usuario sigue autenticado, solo le falta el rol).
 */
export function ForbiddenView({
  title = "No tenés permisos para ver esta sección",
  message = "Tu rol no habilita esta pantalla. Si lo necesitás, pedile acceso a un administrador.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
        <ShieldOff className="h-6 w-6" />
      </div>
      <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h1>
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  );
}
