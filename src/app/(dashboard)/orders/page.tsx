"use client";

import * as React from "react";
import Link from "next/link";
import { useOrders } from "@/features/orders/hooks/useOrders";
import { OrderFilters, type SortValue } from "@/features/orders/components/order-filters";
import { OrderTable } from "@/features/orders/components/order-table";
import { Pagination } from "@/components/shared/pagination";
import { ForbiddenView } from "@/components/shared/forbidden-view";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button } from "@/components/ui/button";
import { DEFAULT_PAGE_SIZE } from "@/lib/api-query";
import { ORDER_SORT_FIELDS, type OrderSortField, type OrderStatusCode, type SortDirection } from "@/types/api";
import { RefreshCw, PlusCircle, AlertTriangle } from "lucide-react";

function parseSort(value: SortValue): { field: OrderSortField; direction: SortDirection } | undefined {
  if (!value) return undefined;
  const [field, direction] = value.split(",") as [OrderSortField, SortDirection];
  return ORDER_SORT_FIELDS.includes(field) ? { field, direction } : undefined;
}

export default function OrdersListPage() {
  const [status, setStatus] = React.useState<OrderStatusCode | undefined>(undefined);
  const [sort, setSort] = React.useState<SortValue>("");
  const [page, setPage] = React.useState(0);

  const { orders, pageInfo, isLoading, error, errorStatus, refetch, data } = useOrders({
    status,
    sort: parseSort(sort),
    page,
    size: DEFAULT_PAGE_SIZE,
  });

  // Cambiar el filtro o el orden vuelve a la primera página.
  const changeStatus = (next: OrderStatusCode | undefined) => {
    setStatus(next);
    setPage(0);
  };
  const changeSort = (next: SortValue) => {
    setSort(next);
    setPage(0);
  };

  if (errorStatus === 403) return <ForbiddenView message={error ?? undefined} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-line/80">
        <div>
          <h1 className="page-title font-bold tracking-tight text-foreground">Administración de Órdenes de Carga</h1>
          <p className="text-xs text-muted mt-1">
            Estados: 1 Pendiente de pesaje inicial · 2 Con pesaje inicial (en carga) · 3 Cerrada para carga · 4 Finalizada. Se actualiza solo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetch} isLoading={isLoading} className="gap-1.5">
            <RefreshCw className="h-4 w-4 text-muted" />
            Actualizar
          </Button>
          <PermissionGate permission="simulator:use">
            <Link href="/simulator">
              <Button variant="primary" size="sm" className="gap-1.5">
                <PlusCircle className="h-4 w-4" />
                Nueva Orden (SAP)
              </Button>
            </Link>
          </PermissionGate>
        </div>
      </div>

      <OrderFilters status={status} onStatusChange={changeStatus} sort={sort} onSortChange={changeSort} />

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-xs font-medium text-danger-ink">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
          {data && <span className="text-danger-ink"> (se muestra la última información recibida)</span>}
        </div>
      )}

      {isLoading && !data ? (
        <div role="status" className="flex items-center justify-center gap-2 p-16 text-sm text-muted">
          <RefreshCw className="h-4 w-4 animate-spin" /> Cargando órdenes…
        </div>
      ) : (
        <>
          <OrderTable orders={orders} emptyMessage={status ? "No hay órdenes en ese estado." : "Todavía no hay órdenes registradas."} />
          <Pagination info={pageInfo} shown={orders.length} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
