"use client";

import * as React from "react";
import { useAlarms } from "@/features/alarms/hooks/useAlarms";
import { AlarmTable } from "@/features/alarms/components/alarm-table";
import { AlarmConfigForm } from "@/features/alarms/components/alarm-config-form";
import { AlarmAckModal } from "@/features/alarms/components/alarm-ack-modal";
import { Alarm } from "@/types/alarm";
import { RefreshCw, SlidersHorizontal, List } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AlarmsManagementPage() {
  const {
    alarms,
    pendingCount,
    config,
    isLoading,
    refetch,
    acknowledge,
    updateConfig,
  } = useAlarms();

  const [selectedAlarmForAck, setSelectedAlarmForAck] =
    React.useState<Alarm | null>(null);
  const [activeTab, setActiveTab] = React.useState<"list" | "config">("list");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              Gestión de Alarmas de Temperatura
            </h1>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white animate-pulse">
                {pendingCount} Pendiente{pendingCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Supervisión de temperatura en tiempo real, aceptación con auditoría de usuario y configuración de umbrales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "list"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Historial ({alarms.length})
            </button>
            <button
              onClick={() => setActiveTab("config")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "config"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Configurar Umbral
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={() => refetch()} isLoading={isLoading}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      {activeTab === "list" ? (
        <AlarmTable
          alarms={alarms}
          onOpenAckModal={(alarm) => setSelectedAlarmForAck(alarm)}
        />
      ) : (
        <div className="max-w-2xl">
          <AlarmConfigForm config={config} onSave={updateConfig} />
        </div>
      )}

      {/* Modal Aceptación */}
      <AlarmAckModal
        isOpen={Boolean(selectedAlarmForAck)}
        alarm={selectedAlarmForAck}
        onClose={() => setSelectedAlarmForAck(null)}
        onAcknowledge={acknowledge}
      />
    </div>
  );
}
