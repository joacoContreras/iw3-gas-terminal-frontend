"use client";

import * as React from "react";
import { ORDER_STATUS_CODES, ORDER_STATUS_LABELS, type OrderSortField, type OrderStatusCode, type SortDirection } from "@/types/api";
import { cn } from "@/lib/utils";

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
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl w-full lg:w-auto" role="tablist" aria-label="Filtrar por estado">
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
                  ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-white"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <label className="flex items-center gap-2 text-xs text-zinc-500">
        Ordenar por
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortValue)}
          className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
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
