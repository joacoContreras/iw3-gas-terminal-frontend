"use client";

import * as React from "react";
import Image from "next/image";
import type { Order, Reconciliation } from "@/types/api";
import { formatKg, formatTemperature, formatDensity, formatFlowRate } from "@/lib/formatters";
import { formatBackendDateTime } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface ReconciliationTicketProps {
  reconciliation: Reconciliation;
  order: Order;
  differencePercentage: number | null;
  hasReadings: boolean;
}

export function ReconciliationTicket({
  reconciliation,
  order,
  differencePercentage,
  hasReadings,
}: ReconciliationTicketProps) {
  const handlePrint = () => {
    window.print();
  };

  const diffSign = reconciliation.difference >= 0 ? "+" : "";
  const ticketDate = order.finalWeighingDateTime ?? order.receptionDateTime;

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
          <Printer className="h-4 w-4" />
          Imprimir Remito Oficial
        </Button>
      </div>

      <div className="reconciliation-paper mx-auto max-w-2xl rounded-2xl border border-zinc-200 bg-white p-5 font-sans text-zinc-900 shadow-xs sm:p-8 print:border-none print:p-0 print:shadow-none">
        <div className="mb-5 flex items-center gap-3"><Image src="/brand/aetherload-logo.png" alt="" width={56} height={56} className="rounded-lg" /><span className="text-xl font-semibold tracking-tight text-zinc-900">AetherLoad</span></div>
        {/* Cabecera Remito */}
        <div className="flex flex-col items-start justify-between gap-4 border-b-2 border-zinc-900 pb-4 sm:flex-row">
          <div>
            <h2 className="text-base font-bold uppercase tracking-tight text-zinc-950 sm:text-lg">
              TERMINAL DE CARGA DE GAS LICUADO
            </h2>
            <p className="text-xs text-zinc-500 font-mono">
              Comprobante Oficial de Conciliación de Carga
            </p>
          </div>
          <div className="shrink-0 sm:text-right">
            <span className="font-mono text-base font-bold text-zinc-900">
              ORDEN #{reconciliation.orderNumber}
            </span>
            <div className="text-xs text-zinc-500">
              {formatBackendDateTime(ticketDate)}
            </div>
          </div>
        </div>

        {/* Datos Transporte y Cliente */}
        <div className="grid grid-cols-1 gap-4 border-b border-zinc-200 py-4 text-xs sm:grid-cols-2">
          <div>
            <span className="text-zinc-600 block font-semibold uppercase">Cliente</span>
            <span className="font-bold text-sm text-zinc-900">{order.customer.companyName}</span>
            <span className="text-zinc-500 block mt-1">Producto: {order.product.name}</span>
            <span className="text-zinc-500 block">Preset programado: {formatKg(order.preset)}</span>
          </div>
          <div>
            <span className="text-zinc-600 block font-semibold uppercase">Transporte</span>
            <span className="font-bold text-sm font-mono text-zinc-900">
              Patente: {order.truck.plate}
            </span>
            <span className="text-zinc-500 block mt-1">
              Chofer: {order.driver.name} {order.driver.lastName}
            </span>
            {order.driver.document && (
              <span className="text-zinc-500 block">
                Documento: {order.driver.document}
              </span>
            )}
          </div>
        </div>

        {/* Tabla de Balanza vs Caudalímetro */}
        <div className="py-4 border-b border-zinc-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500 text-left font-semibold uppercase">
                <th className="py-1">Parámetro</th>
                <th className="py-1 text-right">Valor Medido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-mono">
              <tr>
                <td className="py-1.5 text-zinc-600">Pesaje Inicial de Balanza (Tara)</td>
                <td className="py-1.5 text-right font-medium">{formatKg(reconciliation.tare)}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-zinc-600">Pesaje Final de Balanza (Bruto)</td>
                <td className="py-1.5 text-right font-medium">{formatKg(reconciliation.finalWeight)}</td>
              </tr>
              <tr className="font-bold bg-zinc-50">
                <td className="py-2 text-zinc-900">NETO POR BALANZA (TMS)</td>
                <td className="py-2 text-right text-blue-700">{formatKg(reconciliation.scaleNet)}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-zinc-600">Carga Medida por Caudalímetro</td>
                <td className="py-1.5 text-right font-medium text-indigo-700">
                  {hasReadings ? formatKg(reconciliation.loadedProduct) : "0 kg (sin lecturas)"}
                </td>
              </tr>
              <tr className="font-bold">
                <td className="py-2 text-zinc-900">DIFERENCIA (Balanza − Medidor)</td>
                <td className="py-2 text-right">
                  {diffSign}
                  {formatKg(reconciliation.difference)}
                  {differencePercentage !== null && (
                    <span>
                      {" "}
                      ({differencePercentage > 0 ? "+" : ""}
                      {differencePercentage}%)
                    </span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Promedios */}
        <div className="grid grid-cols-3 gap-2 py-3 border-b border-zinc-200 text-xs font-mono text-center">
          <div>
            <span className="text-zinc-600 block text-[10px]">Temp. Media</span>
            <span className="font-semibold">{formatTemperature(reconciliation.averageTemperature)}</span>
          </div>
          <div>
            <span className="text-zinc-600 block text-[10px]">Densidad Media</span>
            <span className="font-semibold">{formatDensity(reconciliation.averageDensity)}</span>
          </div>
          <div>
            <span className="text-zinc-600 block text-[10px]">Caudal Medio</span>
            <span className="font-semibold">{formatFlowRate(reconciliation.averageFlowRate)}</span>
          </div>
        </div>

        {/* Firmas */}
        <div className="grid grid-cols-2 gap-8 pt-12 pb-4 text-center text-xs text-zinc-500">
          <div className="border-t border-zinc-400 pt-1">
            Firma Operador de Terminal
          </div>
          <div className="border-t border-zinc-400 pt-1">
            Firma Chofer Receptor
          </div>
        </div>
      </div>
    </div>
  );
}
