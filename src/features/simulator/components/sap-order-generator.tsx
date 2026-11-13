"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { simulatorApi } from "../services/simulatorApi";
import { errorMessage, isApiError } from "@/services/api/client";
import type { SapOrderRequest } from "@/types/api";
import { Send, Plus, Trash2 } from "lucide-react";

export function SapOrderGenerator({ onOrderCreated }: { onOrderCreated: (orderNumber: number) => void }) {
  const [tanks, setTanks] = React.useState([{ number: 1, capacityLiters: 10000 }]);
  const [isLoading, setIsLoading] = React.useState(false);
  const submitting = React.useRef(false);
  const [createdOrderNumber, setCreatedOrderNumber] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting.current) return;
    const data = new FormData(e.currentTarget);
    const value = (name: string) => String(data.get(name) ?? "").trim();
    const plannedDate = value("plannedLoadDateTime");
    const payload: SapOrderRequest = {
      orderNumber: Number(value("orderNumber")),
      // datetime-local conserva la hora ingresada de Argentina; no convertirla a UTC.
      plannedLoadDateTime: plannedDate.length === 16 ? `${plannedDate}:00` : plannedDate,
      preset: Number(value("preset")),
      truck: { externalCode: value("truckCode"), plate: value("plate").toUpperCase(), description: value("truckDescription"), tanks },
      driver: { externalCode: value("driverCode"), name: value("driverName"), lastName: value("driverLastName"), document: value("driverDocument") },
      customer: { externalCode: value("customerCode"), companyName: value("companyName"), contact: value("contact") },
      product: { externalCode: value("productCode"), name: value("productName"), description: value("productDescription") },
    };
    submitting.current = true;
    setIsLoading(true);
    setCreatedOrderNumber(null);
    setError(null);
    try {
      const result = await simulatorApi.createSapOrder(payload);
      setCreatedOrderNumber(result.orderNumber);
      onOrderCreated(result.orderNumber);
    } catch (err) {
      const status = isApiError(err) && err.status ? `HTTP ${err.status}: ` : "";
      setError(`${status}${errorMessage(err, "Error al emitir la orden desde SAP")}`);
    } finally {
      submitting.current = false;
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Punto 1 · Orden desde SAP</CardTitle>
        <CardDescription>Creá una orden de demostración. Los códigos externos identifican y actualizan camión, chofer, cliente y producto en el backend real.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <fieldset disabled={isLoading} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input label="Número de orden" name="orderNumber" type="number" min="1" max="2147483647" step="1" required />
              <Input label="Preset (kg)" name="preset" type="number" min="0.01" step="any" defaultValue="15000" required />
              <Input label="Fecha prevista (hora de Argentina)" name="plannedLoadDateTime" type="datetime-local" required />
            </div>
            <fieldset className="space-y-3 border-t border-line pt-4">
              <legend className="text-sm font-semibold">Camión y cisternas</legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input label="Código externo del camión" name="truckCode" defaultValue="TRK-DEMO" required />
                <Input label="Patente" name="plate" defaultValue="AB123CD" required />
                <Input label="Descripción del camión" name="truckDescription" />
              </div>
              {tanks.map((tank, index) => (
                <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
                  <Input label={`Número de cisterna ${index + 1}`} type="number" min="1" step="1" value={tank.number} required
                    onChange={(e) => setTanks(tanks.map((t, i) => i === index ? { ...t, number: Number(e.target.value) } : t))} />
                  <Input label={`Capacidad de cisterna ${index + 1} (L)`} type="number" min="0.01" step="any" value={tank.capacityLiters} required
                    onChange={(e) => setTanks(tanks.map((t, i) => i === index ? { ...t, capacityLiters: Number(e.target.value) } : t))} />
                  <Button type="button" variant="ghost" disabled={tanks.length === 1} aria-label={`Quitar cisterna ${index + 1}`} onClick={() => setTanks(tanks.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setTanks([...tanks, { number: Math.max(...tanks.map((t) => t.number)) + 1, capacityLiters: 5000 }])}><Plus className="h-4 w-4" /> Agregar cisterna</Button>
            </fieldset>
            <fieldset className="space-y-3 border-t border-line pt-4">
              <legend className="text-sm font-semibold">Chofer</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Input label="Código externo del chofer" name="driverCode" defaultValue="DRV-DEMO" required />
                <Input label="Nombre del chofer" name="driverName" defaultValue="Juan" required />
                <Input label="Apellido del chofer" name="driverLastName" defaultValue="Pérez" required />
                <Input label="Documento del chofer" name="driverDocument" defaultValue="30111222" />
              </div>
            </fieldset>
            <fieldset className="space-y-3 border-t border-line pt-4">
              <legend className="text-sm font-semibold">Cliente y producto</legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input label="Código externo del cliente" name="customerCode" defaultValue="CUS-DEMO" required />
                <Input label="Razón social" name="companyName" defaultValue="Gas del Sur SA" required />
                <Input label="Contacto" name="contact" defaultValue="contacto@gas.example" />
                <Input label="Código externo del producto" name="productCode" defaultValue="PRD-DEMO" required />
                <Input label="Producto" name="productName" defaultValue="GLP" required />
                <Input label="Descripción del producto" name="productDescription" defaultValue="Gas licuado de petróleo" />
              </div>
            </fieldset>
          </fieldset>
          {error && <p role="alert" className="text-sm text-danger-ink">{error}</p>}
          {createdOrderNumber !== null && <p role="status" className="text-sm text-success">Orden #{createdOrderNumber} creada en estado 1. <Link className="underline" href={`/orders/${createdOrderNumber}`}>Ver orden</Link></p>}
          <Button type="submit" isLoading={isLoading}><Send className="h-4 w-4" /> Emitir orden desde SAP</Button>
        </form>
      </CardContent>
    </Card>
  );
}
