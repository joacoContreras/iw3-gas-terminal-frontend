"use client";

import * as React from "react";
import { ReconciliationData } from "@/types/reconciliation";
import { formatKg, formatDateTime, formatTemperature, formatDensity } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface ReconciliationTicketProps {
  data: ReconciliationData;
}

export function ReconciliationTicket({ data }: ReconciliationTicketProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
          <Printer className="h-4 w-4" />
          Imprimir Remito Oficial
        </Button>
      </div>

      <div className="p-8 bg-white text-zinc-900 rounded-2xl border border-zinc-200 shadow-sm print:border-none print:shadow-none print:p-0 max-w-2xl mx-auto font-sans">
        {/* Cabecera Remito */}
        <div className="border-b-2 border-zinc-900 pb-4 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-zinc-950">
              TERMINAL DE CARGA DE GAS LÍQUIDO
            </h2>
            <p className="text-xs text-zinc-500 font-mono">
              Comprobante Oficial de Conciliación de Carga
            </p>
          </div>
          <div className="text-right">
            <span className="font-mono text-base font-bold text-zinc-900">
              ORDEN #{data.orderNumber}
            </span>
            <div className="text-xs text-zinc-500">
              {formatDateTime(data.reconciledAt)}
            </div>
          </div>
        </div>

        {/* Datos Transporte y Cliente */}
        <div className="grid grid-cols-2 gap-4 py-4 border-b border-zinc-200 text-xs">
          <div>
            <span className="text-zinc-400 block font-semibold uppercase">Cliente</span>
            <span className="font-bold text-sm text-zinc-900">{data.customerName}</span>
            <span className="text-zinc-500 block mt-1">Producto: {data.productName}</span>
          </div>
          <div>
            <span className="text-zinc-400 block font-semibold uppercase">Transporte</span>
            <span className="font-bold text-sm font-mono text-zinc-900">
              Patente: {data.truckPatent}
            </span>
            <span className="text-zinc-500 block mt-1">Chofer: {data.driverName}</span>
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
                <td className="py-1.5 text-right font-medium">{formatKg(data.initialWeight)}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-zinc-600">Pesaje Final de Balanza (Bruto)</td>
                <td className="py-1.5 text-right font-medium">{formatKg(data.finalWeight)}</td>
              </tr>
              <tr className="font-bold bg-zinc-50">
                <td className="py-2 text-zinc-900">NETO POR BALANZA (TMS)</td>
                <td className="py-2 text-right text-blue-700">{formatKg(data.netByScale)}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-zinc-600">Carga Medida por Caudalímetro</td>
                <td className="py-1.5 text-right font-medium text-indigo-700">{formatKg(data.productLoadedByMeter)}</td>
              </tr>
              <tr className="font-bold">
                <td className="py-2 text-zinc-900">DIFERENCIA (Balanza - Medidor)</td>
                <td className="py-2 text-right">
                  {data.differenceScaleVsMeter >= 0 ? "+" : ""}
                  {formatKg(data.differenceScaleVsMeter)} ({data.differencePercentage}%)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Promedios */}
        <div className="grid grid-cols-3 gap-2 py-3 border-b border-zinc-200 text-xs font-mono text-center">
          <div>
            <span className="text-zinc-400 block text-[10px]">Temp. Media</span>
            <span className="font-semibold">{formatTemperature(data.averageTemperature)}</span>
          </div>
          <div>
            <span className="text-zinc-400 block text-[10px]">Densidad Media</span>
            <span className="font-semibold">{formatDensity(data.averageDensity)}</span>
          </div>
          <div>
            <span className="text-zinc-400 block text-[10px]">Caudal Medio</span>
            <span className="font-semibold">{data.averageFlowRate} kg/h</span>
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
