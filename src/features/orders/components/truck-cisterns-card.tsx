"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatLiters } from "@/lib/formatters";
import { formatBackendDateTime } from "@/lib/dates";
import type { Order } from "@/types/api";
import { Truck, User, Building, Fuel } from "lucide-react";

/** Camión con sus cisternas, chofer, cliente y producto de la orden (datos de SAP). */
export function TruckCisternsCard({ order }: { order: Order }) {
  const totalCapacity = order.truck.tanks.reduce((acc, t) => acc + t.capacityLiters, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <Truck className="h-4 w-4 text-accent" />
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted">Camión y cisternas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Patente:</span>
            <span className="font-mono font-bold text-sm bg-elevated px-2 py-0.5 rounded text-foreground">{order.truck.plate}</span>
          </div>
          {order.truck.description && <p className="text-xs text-muted">{order.truck.description}</p>}

          <div className="pt-2 border-t border-line">
            <span className="text-xs font-medium text-muted uppercase tracking-wider">Cisternas:</span>
            <div className="mt-1 space-y-1">
              {order.truck.tanks.map((tank) => (
                <div key={tank.id} className="flex items-center justify-between text-xs font-mono text-muted">
                  <span>Cisterna {tank.number}:</span>
                  <span className="font-semibold">{formatLiters(tank.capacityLiters)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-xs font-mono font-bold text-foreground pt-1 border-t border-dashed border-line">
                <span>Capacidad total:</span>
                <span>{formatLiters(totalCapacity)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <User className="h-4 w-4 text-accent" />
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted">Chofer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-sm font-semibold text-foreground">
              {order.driver.name} {order.driver.lastName}
            </div>
            {order.driver.document && <div className="text-xs text-muted mt-0.5">Documento: {order.driver.document}</div>}
          </div>
          <div className="pt-2 border-t border-line flex justify-between text-xs text-muted">
            <span>Carga planificada:</span>
            <span className="font-mono text-foreground">{formatBackendDateTime(order.plannedLoadDateTime)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <Building className="h-4 w-4 text-accent" />
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted">Cliente y producto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <div className="text-sm font-semibold text-foreground">{order.customer.companyName}</div>
            {order.customer.contact && <div className="text-xs text-muted mt-0.5">Contacto: {order.customer.contact}</div>}
          </div>
          <div className="pt-2 border-t border-line">
            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Fuel className="h-3.5 w-3.5 text-warning" />
              <span>{order.product.name}</span>
            </div>
            {order.product.description && <p className="text-xs text-muted mt-1">{order.product.description}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
