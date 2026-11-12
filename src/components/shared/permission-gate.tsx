"use client";

import * as React from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import type { Permission } from "@/features/auth/lib/permissions";
import { ForbiddenView } from "./forbidden-view";

/**
 * Muestra `children` solo si el rol del usuario tiene el permiso; si no, `fallback` (nada por defecto).
 * Sirve para ocultar botones y acciones. Recordar: ocultar no es seguridad, el backend responde 403 igual.
 */
export function PermissionGate({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { can } = useAuth();
  return <>{can(permission) ? children : fallback}</>;
}

/** Protege una pantalla completa: sin el permiso muestra «sin permisos» en lugar del contenido. */
export function RequirePermission({ permission, children }: { permission: Permission; children: React.ReactNode }) {
  return (
    <PermissionGate permission={permission} fallback={<ForbiddenView />}>
      {children}
    </PermissionGate>
  );
}
