"use client";

import * as React from "react";
import { useAlarms } from "@/features/alarms/hooks/useAlarms";
import { AlarmTable } from "@/features/alarms/components/alarm-table";
import { AlarmConfigForm } from "@/features/alarms/components/alarm-config-form";
import { AlarmAckModal } from "@/features/alarms/components/alarm-ack-modal";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/AuthContext";
import type { AlarmStatus, TemperatureAlarm } from "@/types/api";
import { RefreshCw, SlidersHorizontal, List, AlertTriangle } from "lucide-react";

export default function AlarmsManagementPage() {
  const [activeTab, setActiveTab] = React.useState<"list" | "config">("list");
  const [statusFilter, setStatusFilter] = React.useState<AlarmStatus | "ALL">("ALL");
  const [page, setPage] = React.useState(0);
  const [selectedAlarmForAck, setSelectedAlarmForAck] =
    React.useState<TemperatureAlarm | null>(null);

  const { can } = useAuth();
  const canViewConfig = can("alarms:config:view");
  const canEditConfig = can("alarms:config:edit");
  const canAcknowledge = can("alarms:acknowledge");

  const {
    alarms,
    alarmsPage,
    pendingCount,
    config,
    isLoading,
    isRefreshing,
    error,
    refetch,
    acknowledge,
    updateConfig,
  } = useAlarms({
    status: statusFilter,
    page,
    size: 20,
    loadConfig: canViewConfig,
  });

  const handleStatusChange = (newStatus: AlarmStatus | "ALL") => {
    setStatusFilter(newStatus);
    setPage(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-line/80">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="page-title font-bold tracking-tight text-foreground">
              Gestión de Alarmas de Temperatura
            </h1>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-danger text-canvas ">
                {pendingCount} Pendiente{pendingCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-xs text-muted mt-1">
            Supervisión de temperatura en tiempo real, aceptación con auditoría de usuario y configuración de umbrales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-elevated p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "list"
                  ? "bg-accent/10 text-accent shadow-xs ring-1 ring-accent/30"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Historial {alarmsPage ? `(${alarmsPage.page.totalElements})` : ""}
            </button>
            {canViewConfig && (
              <button
                type="button"
                onClick={() => setActiveTab("config")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "config"
                    ? "bg-accent/10 text-accent shadow-xs ring-1 ring-accent/30"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Configurar Umbral
              </button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            isLoading={isRefreshing}
            title="Refrescar datos"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-xs font-medium text-warning"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error} (se muestra la última información recibida)
        </div>
      )}

      {/* Tabs */}
      {activeTab === "list" || !canViewConfig ? (
        <div className="space-y-4">
          {/* Filtros de estado */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 p-1 bg-elevated/80 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => handleStatusChange("ALL")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  statusFilter === "ALL"
                    ? "bg-accent/10 text-accent shadow-xs ring-1 ring-accent/30 font-semibold"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange("PENDING")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === "PENDING"
                    ? "bg-panel text-danger-ink shadow-xs font-semibold"
                    : "text-muted hover:text-danger-ink"
                }`}
              >
                Pendientes
                {pendingCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-xs bg-danger text-canvas font-mono">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange("ACKNOWLEDGED")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  statusFilter === "ACKNOWLEDGED"
                    ? "bg-panel text-success shadow-xs font-semibold"
                    : "text-muted hover:text-success"
                }`}
              >
                Aceptadas
              </button>
            </div>
          </div>

          {/* Tabla de alarmas */}
          {isLoading ? (
            <div role="status" className="flex flex-col items-center justify-center p-16 text-center">
              <RefreshCw className="h-7 w-7 animate-spin text-accent mb-2" />
              <span className="text-xs text-muted">Cargando alarmas de temperatura…</span>
            </div>
          ) : (
            <AlarmTable
              alarms={alarms}
              onOpenAckModal={(alarm) => setSelectedAlarmForAck(alarm)}
            />
          )}

          {/* Paginación */}
          {alarmsPage && (
            <Pagination
              info={alarmsPage.page}
              shown={alarms.length}
              onPageChange={setPage}
            />
          )}
        </div>
      ) : (
        <div className="max-w-2xl">
          <AlarmConfigForm
            config={config}
            onSave={updateConfig}
            readOnly={!canEditConfig}
          />
        </div>
      )}

      {/* Modal Aceptación */}
      {canAcknowledge && (
        <AlarmAckModal
          isOpen={Boolean(selectedAlarmForAck)}
          alarm={selectedAlarmForAck}
          onClose={() => setSelectedAlarmForAck(null)}
          onAcknowledge={acknowledge}
        />
      )}
    </div>
  );
}
