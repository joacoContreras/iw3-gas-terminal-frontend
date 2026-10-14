"use client";

import * as React from "react";
import { OrderState } from "@/types/order";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderFiltersProps {
  filterState: OrderState | "ALL";
  setFilterState: (state: OrderState | "ALL") => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function OrderFilters({
  filterState,
  setFilterState,
  searchQuery,
  setSearchQuery,
}: OrderFiltersProps) {
  const states: { label: string; value: OrderState | "ALL" }[] = [
    { label: "Todas", value: "ALL" },
    { label: "1: Pendiente", value: 1 },
    { label: "2: En Carga", value: 2 },
    { label: "3: Cerrada", value: 3 },
    { label: "4: Finalizada", value: 4 },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por # orden, patente, chofer o cliente..."
          className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-4 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl w-full sm:w-auto">
        {states.map((st) => {
          const isActive = filterState === st.value;
          return (
            <button
              key={st.value}
              onClick={() => setFilterState(st.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer",
                isActive
                  ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-white"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              )}
            >
              {st.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
