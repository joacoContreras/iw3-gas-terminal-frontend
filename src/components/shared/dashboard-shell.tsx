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
  const canAcknowledge = can("alarms:acknowledge");

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <Navbar pendingCount={pendingCount} />

      {/* Aviso global de alarma pendiente: el botón de aceptar solo aparece si el rol puede aceptar */}
      <AlarmBanner
        pendingAlarms={pendingAlarms}
        onOpenAckModal={canAcknowledge ? (alarm) => setSelectedAlarm(alarm) : undefined}
      />

      <div className="flex flex-1">
        <React.Suspense fallback={<aside className="w-64 hidden md:block" />}>
          <Sidebar />
        </React.Suspense>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">{children}</main>
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
