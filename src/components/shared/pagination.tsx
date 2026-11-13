"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { hasNextPage, hasPreviousPage, pageRangeLabel } from "@/lib/api-query";
import type { PageInfo } from "@/types/api";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Paginación de los listados del backend (`page` desde 0). `shown` es la cantidad de filas de la página actual. */
export function Pagination({ info, shown, onPageChange }: { info: PageInfo; shown: number; onPageChange: (page: number) => void }) {
  if (info.totalElements === 0) return null;
  return (
    <div className="flex items-center justify-between gap-3 text-xs text-muted" data-testid="pagination">
      <span>{pageRangeLabel(info, shown)}</span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={!hasPreviousPage(info)} onClick={() => onPageChange(info.number - 1)} aria-label="Página anterior">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-mono">
          {info.number + 1} / {Math.max(1, info.totalPages)}
        </span>
        <Button variant="outline" size="sm" disabled={!hasNextPage(info)} onClick={() => onPageChange(info.number + 1)} aria-label="Página siguiente">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
