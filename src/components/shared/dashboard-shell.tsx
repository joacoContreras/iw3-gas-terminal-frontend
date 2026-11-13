"use client";

import * as React from "react";
import { Navbar } from "@/components/shared/navbar";
import { Sidebar } from "@/components/shared/sidebar";
import { AlarmBanner } from "@/features/alarms/components/alarm-banner";
import { AlarmAckModal } from "@/features/alarms/components/alarm-ack-modal";
import { useAlarms } from "@/features/alarms/hooks/useAlarms";
import { useAuth } from "@/features/auth/context/AuthContext";
import type { TemperatureAlarm } from "@/types/api";

/**
 * Marco de las pantallas autenticadas. Solo se monta con sesión (lo garantiza `AuthGate`), así que lo que dispara
 * pedidos —como el *polling* de alarmas— nunca corre sin token.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { can } = useAuth();
  const { pendingAlarms, pendingCount, acknowledge } = useAlarms();
  const [selectedAlarm, setSelectedAlarm] = React.useState<TemperatureAlarm | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const closeMenu = React.useCallback(() => setMenuOpen(false), []);
  const canAcknowledge = can("alarms:acknowledge");

  return (
    <div data-app-shell className="min-h-screen bg-canvas md:grid md:grid-cols-[240px_minmax(0,1fr)]">
      <a href="#main-content" className="skip-link fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg bg-accent px-4 py-3 font-semibold text-canvas focus:translate-y-0">Saltar al contenido</a>
      <React.Suspense fallback={<aside className="hidden border-r border-line bg-shell md:block" />}>
        <Sidebar open={menuOpen} onClose={closeMenu} />
      </React.Suspense>
      <div className="min-w-0">
      <React.Suspense fallback={<div className="h-20 border-b border-line" />}>
        <Navbar pendingCount={pendingCount} menuOpen={menuOpen} onOpenMenu={() => setMenuOpen(true)} />
      </React.Suspense>

      {/* Aviso global de alarma pendiente: el botón de aceptar solo aparece si el rol puede aceptar */}
      <AlarmBanner
        pendingAlarms={pendingAlarms}
        onOpenAckModal={canAcknowledge ? (alarm) => setSelectedAlarm(alarm) : undefined}
      />

        <main id="main-content" data-page-content tabIndex={-1} className="mx-auto w-full min-w-0 max-w-[1600px] p-4 pb-12 sm:p-6 lg:p-8">{children}</main>
      </div>

      {canAcknowledge && (
        <AlarmAckModal
          isOpen={Boolean(selectedAlarm)}
          alarm={selectedAlarm}
          onClose={() => setSelectedAlarm(null)}
          onAcknowledge={acknowledge}
        />
      )}
    </div>
  );
}
