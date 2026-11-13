"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ROLE_LABELS, primaryRole } from "@/features/auth/lib/permissions";
import { Brand } from "./brand";
import { Bell, LogOut, Menu, ChevronRight } from "lucide-react";

export function Navbar({ pendingCount = 0, menuOpen, onOpenMenu }: { pendingCount?: number; menuOpen: boolean; onOpenMenu: () => void }) {
  const { user, logout, can } = useAuth();
  const pathname = usePathname();
  const role = user ? primaryRole(user.roles) : null;
  const section = pathname.startsWith("/orders") ? "Órdenes de carga" : pathname.startsWith("/alarms") ? "Alarmas" : pathname.startsWith("/simulator") ? "Integraciones" : "Vista general";

  return (
    <header data-app-header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-3 border-b border-line bg-canvas/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onOpenMenu} aria-label="Abrir navegación" aria-expanded={menuOpen} aria-controls="mobile-navigation" className="rounded-lg border border-line p-2.5 text-foreground md:hidden"><Menu className="h-5 w-5" /></button>
        <Link href="/" className="hidden sm:inline-flex md:hidden" aria-label="AetherLoad · Inicio"><Brand compact /></Link>
        <div className="hidden min-w-0 items-center gap-3 text-sm md:flex">
          <span className="text-muted">Centro de control</span><ChevronRight className="h-3.5 w-3.5 text-muted" /><span className="truncate font-medium text-foreground">{section}</span>
        </div>
        <span className="text-lg font-semibold tracking-tight text-foreground sm:hidden">AetherLoad<span className="text-accent">.</span></span>
      </div>
      <div className="flex shrink-0 items-center gap-3 sm:gap-5">
        {can("alarms:view") && <Link href="/alarms" aria-label={`Alarmas de temperatura${pendingCount ? `: ${pendingCount} pendientes` : ""}`} className="relative rounded-lg p-2.5 text-muted transition-colors hover:bg-elevated hover:text-foreground">
          <Bell className="h-5 w-5" />
          {pendingCount > 0 && <span className="absolute -right-1 -top-1 flex min-w-5 h-5 items-center justify-center rounded-full bg-danger px-1 text-xs font-bold text-canvas">{pendingCount > 99 ? "99+" : pendingCount}</span>}
        </Link>}
        {user && <div className="flex items-center gap-3 border-l border-line pl-3 sm:pl-5">
          <div className="hidden h-9 w-9 items-center justify-center rounded-full border border-accent/30 bg-accent/10 font-semibold text-accent lg:flex" aria-hidden="true">{user.username.slice(0, 2).toUpperCase()}</div>
          <div className="hidden flex-col sm:flex">
            <span className="text-sm font-semibold text-foreground" data-testid="navbar-user">{user.username}</span>
            <span className="text-xs text-muted" data-testid="navbar-role">{role ? ROLE_LABELS[role] : "Sin rol asignado"}</span>
          </div>
          <button type="button" onClick={logout} title="Cerrar sesión" aria-label="Cerrar sesión" className="rounded-lg p-2.5 text-muted transition-colors hover:bg-danger/10 hover:text-danger-ink"><LogOut className="h-4 w-4" /></button>
        </div>}
      </div>
    </header>
  );
}
