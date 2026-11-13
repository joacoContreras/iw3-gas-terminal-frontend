"use client";

import * as React from "react";
import { ORDER_STATUS_CODES, ORDER_STATUS_LABELS, type OrderSortField, type OrderStatusCode, type SortDirection } from "@/types/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type SortValue = `${OrderSortField},${SortDirection}` | "";

/** Opciones de orden: los cinco campos que el backend permite (otro da 400). Vacío = la más reciente primero. */
export const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: "", label: "Más recientes primero" },
  { value: "orderNumber,asc", label: "Número de orden ↑" },
  { value: "orderNumber,desc", label: "Número de orden ↓" },
  { value: "plannedLoadDateTime,asc", label: "Carga planificada ↑" },
  { value: "plannedLoadDateTime,desc", label: "Carga planificada ↓" },
  { value: "receptionDateTime,asc", label: "Recepción ↑" },
  { value: "receptionDateTime,desc", label: "Recepción ↓" },
  { value: "status,asc", label: "Estado ↑" },
  { value: "status,desc", label: "Estado ↓" },
  { value: "preset,asc", label: "Preset ↑" },
  { value: "preset,desc", label: "Preset ↓" },
];

interface OrderFiltersProps {
  status: OrderStatusCode | undefined;
  onStatusChange: (status: OrderStatusCode | undefined) => void;
  sort: SortValue;
  onSortChange: (sort: SortValue) => void;
}

const SHORT: Record<OrderStatusCode, string> = { 1: "Pendiente", 2: "En carga", 3: "Cerrada", 4: "Finalizada" };

/** Filtro por estado y orden: ambos se aplican en el servidor (`GET /orders?status=&sort=`). */
export function OrderFilters({ status, onStatusChange, sort, onSortChange }: OrderFiltersProps) {
  const tabs: { label: string; title?: string; value: OrderStatusCode | undefined }[] = [
    { label: "Todas", value: undefined },
    ...ORDER_STATUS_CODES.map((code) => ({ label: `${code}: ${SHORT[code]}`, title: ORDER_STATUS_LABELS[code], value: code })),
  ];

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 py-2">
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-elevated rounded-xl w-full lg:w-auto" role="tablist" aria-label="Filtrar por estado">
        {tabs.map((tab) => {
          const isActive = status === tab.value;
          return (
            <button
              key={tab.label}
              role="tab"
              aria-selected={isActive}
              title={tab.title}
              onClick={() => onStatusChange(tab.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer",
                isActive
                  ? "bg-accent/10 text-accent shadow-xs ring-1 ring-accent/30"
                  : "text-muted hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {(status !== undefined || sort !== "") && <Button variant="ghost" size="sm" onClick={() => { onStatusChange(undefined); onSortChange(""); }}>Limpiar filtros</Button>}
      <label className="flex items-center gap-2 text-sm text-muted">
        Ordenar por
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortValue)}
          className="control-input"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
