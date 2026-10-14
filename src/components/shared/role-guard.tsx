"use client";

import * as React from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { UserRole } from "@/types/auth";

export interface RoleGuardProps {
  requiredRoles: UserRole | UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({
  requiredRoles,
  children,
  fallback = null,
}: RoleGuardProps) {
  const { hasRole } = useAuth();

  if (!hasRole(requiredRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
