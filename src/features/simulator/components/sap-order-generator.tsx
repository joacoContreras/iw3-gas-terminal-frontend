"use client";

import * as React from "react";
import { Order } from "@/types/order";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { simulatorApi } from "../services/simulatorApi";
import { Send, CheckCircle2 } from "lucide-react";

interface SapOrderGeneratorProps {
  onOrderCreated: (order: Order) => void;
}

export function SapOrderGenerator({ onOrderCreated }: SapOrderGeneratorProps) {
  const [patent, setPatent] = React.useState("AF-451-JK");
  const [driverName, setDriverName] = React.useState("Gonzalo");
  const [driverLastName, setDriverLastName] = React.useState("Pérez");
  const [customer, setCustomer] = React.useState("Axion Energy Gas");
  const [preset, setPreset] = React.useState(20000);
  const [isLoading, setIsLoading] = React.useState(false);
  const [createdOrder, setCreatedOrder] = React.useState<Order | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setCreatedOrder(null);
    try {
      const order = await simulatorApi.createSapOrder({
        preset: Number(preset),
        truck: {
          patent,
          description: "Scania R500 Doble Cisterna",
          cisterns: [
            { cisternNumber: 1, capacity: 12000 },
            { cisternNumber: 2, capacity: 10000 },
          ],
        },
        driver: {
          name: driverName,
          lastName: driverLastName,
          document: "33.910.123",
        },
        customer: {
          businessName: customer,
          contact: "contacto@axion.com",
        },
        product: {
          name: "GLP Propano Comercial",
          description: "Gas Licuado grado automotor/industrial",
        },
        scheduledDate: new Date().toISOString(),
      });
      setCreatedOrder(order);
      onOrderCreated(order);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Punto 1: Emulador SAP (Recepción de Orden Base)
        </CardTitle>
        <CardDescription>
          Simula el envío de datos iniciales desde el ERP SAP. Crea una orden en Estado 1 (Pendiente de tara).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Patente del Camión"
              value={patent}
              onChange={(e) => setPatent(e.target.value.toUpperCase())}
              required
            />
            <Input
              label="Preset a Cargar (kg)"
              type="number"
              step="500"
              value={preset}
              onChange={(e) => setPreset(Number(e.target.value))}
              required
            />
            <Input
              label="Nombre Chofer"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              required
            />
            <Input
              label="Apellido Chofer"
              value={driverLastName}
              onChange={(e) => setDriverLastName(e.target.value)}
              required
            />
            <div className="sm:col-span-2">
              <Input
                label="Cliente / Razón Social"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              {createdOrder && (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  Orden #{createdOrder.orderNumber} creada en Estado 1
                </span>
              )}
            </div>
            <Button type="submit" isLoading={isLoading} className="gap-1.5">
              <Send className="h-4 w-4" />
              Emitir Orden desde SAP
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
