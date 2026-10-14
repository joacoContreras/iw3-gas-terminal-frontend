"use client";

import * as React from "react";
import { Navbar } from "@/components/shared/navbar";
import { Sidebar } from "@/components/shared/sidebar";
import { AlarmBanner } from "@/features/alarms/components/alarm-banner";
import { AlarmAckModal } from "@/features/alarms/components/alarm-ack-modal";
import { useAlarms } from "@/features/alarms/hooks/useAlarms";
import { Alarm } from "@/types/alarm";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { pendingAlarms, acknowledge } = useAlarms();
  const [selectedAlarm, setSelectedAlarm] = React.useState<Alarm | null>(null);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      {/* Global Critical Alarm Banner */}
      <AlarmBanner
        pendingAlarms={pendingAlarms}
        onOpenAckModal={(alarm) => setSelectedAlarm(alarm)}
      />

      <div className="flex flex-1">
        <React.Suspense fallback={<aside className="w-64 hidden md:block" />}>
          <Sidebar />
        </React.Suspense>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Global Alarm Acknowledgment Modal */}
      <AlarmAckModal
        isOpen={Boolean(selectedAlarm)}
        alarm={selectedAlarm}
        onClose={() => setSelectedAlarm(null)}
        onAcknowledge={acknowledge}
      />
    </div>
  );
}
