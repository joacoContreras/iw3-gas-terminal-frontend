"use client";

import * as React from "react";
import { Order } from "@/types/order";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Truck, User, Building, Fuel } from "lucide-react";

interface TruckCisternsCardProps {
  order: Order;
}

export function TruckCisternsCard({ order }: TruckCisternsCardProps) {
  const totalCisternCapacity = order.truck.cisterns.reduce(
    (acc, c) => acc + c.capacity,
    0
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Camión y Cisternado */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <Truck className="h-4 w-4 text-blue-600" />
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Camión & Cisternado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Patente:</span>
            <span className="font-mono font-bold text-sm bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-900 dark:text-zinc-100">
              {order.truck.patent}
            </span>
          </div>
          {order.truck.description && (
            <p className="text-xs text-zinc-500">{order.truck.description}</p>
          )}

          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Detalle de Cisternas:
            </span>
            <div className="mt-1 space-y-1">
              {order.truck.cisterns.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs font-mono text-zinc-600 dark:text-zinc-300"
                >
                  <span>Cisterna {c.cisternNumber}:</span>
                  <span className="font-semibold">{c.capacity.toLocaleString()} L</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 pt-1 border-t border-dashed border-zinc-200 dark:border-zinc-700">
                <span>Capacidad Total:</span>
                <span>{totalCisternCapacity.toLocaleString()} L</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chofer */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <User className="h-4 w-4 text-indigo-600" />
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Chofer Asignado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {order.driver.name} {order.driver.lastName}
            </div>
            {order.driver.document && (
              <div className="text-xs text-zinc-400 mt-0.5">
                DNI / Doc: {order.driver.document}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5 text-xs text-zinc-500">
            <div className="flex justify-between">
              <span>Turno programado:</span>
              <span className="font-mono text-zinc-700 dark:text-zinc-300">
                {new Date(order.scheduledDate).toLocaleTimeString("es-AR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {order.activationPassword && (
              <div className="flex justify-between items-center p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800/60 mt-2">
                <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                  PIN Activación Bomba:
                </span>
                <span className="font-mono font-bold text-base text-emerald-700 dark:text-emerald-400 tracking-widest">
                  {order.activationPassword}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cliente & Producto */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <Building className="h-4 w-4 text-cyan-600" />
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Cliente & Producto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {order.customer.businessName}
            </div>
            {order.customer.contact && (
              <div className="text-xs text-zinc-400 mt-0.5">
                Contacto: {order.customer.contact}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              <Fuel className="h-3.5 w-3.5 text-amber-500" />
              <span>{order.product.name}</span>
            </div>
            {order.product.description && (
              <p className="text-[11px] text-zinc-400 mt-1">
                {order.product.description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
