"use client";

import * as React from "react";
import Link from "next/link";
import { useOrders } from "@/features/orders/hooks/useOrders";
import { OrderFilters } from "@/features/orders/components/order-filters";
import { OrderTable } from "@/features/orders/components/order-table";
import { Button } from "@/components/ui/button";
import { RefreshCw, PlusCircle } from "lucide-react";

export default function OrdersListPage() {
  const {
    orders,
    isLoading,
    filterState,
    setFilterState,
    searchQuery,
    setSearchQuery,
    refetch,
  } = useOrders(4000);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Administración de Órdenes de Carga
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Control de órdenes en sus 4 estados: Pendiente de tara, En carga, Cerrada y Finalizada.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            isLoading={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className="h-4 w-4 text-zinc-500" />
            Actualizar
          </Button>
          <Link href="/simulator">
            <Button variant="primary" size="sm" className="gap-1.5">
              <PlusCircle className="h-4 w-4" />
              Nueva Orden (SAP)
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <OrderFilters
        filterState={filterState}
        setFilterState={setFilterState}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Orders Table */}
      <OrderTable orders={orders} />
    </div>
  );
}
