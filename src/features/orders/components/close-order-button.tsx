"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PermissionGate } from "@/components/shared/permission-gate";
import { useCloseOrder } from "../hooks/useOrderDetail";
import { Lock } from "lucide-react";

/**
 * «Cerrar orden para carga» (Punto 4). Solo se ofrece con la orden en estado 2 y a los roles que el backend permite
 * (ADMIN, SUPERVISOR, OPERADOR, LOADER). Pide confirmación porque el cambio de estado es irreversible, y si el backend
 * responde 409 (otra persona ya la cerró) muestra su mensaje y vuelve a leer la orden.
 */
export function CloseOrderButton({ orderNumber, status, onClosed }: { orderNumber: number; status: number; onClosed: () => void }) {
  const [open, setOpen] = React.useState(false);
  const { isClosing, closeError, close, clearCloseError } = useCloseOrder(orderNumber, onClosed);

  if (status !== 2) return null;

  const handleConfirm = async () => {
    await close();
    setOpen(false);
  };

  return (
    <PermissionGate permission="orders:close">
      <Button variant="danger" size="sm" onClick={() => { clearCloseError(); setOpen(true); }} className="gap-1.5 shadow-sm">
        <Lock className="h-4 w-4" />
        Cerrar orden para carga
      </Button>
      {closeError && !open && (
        <p role="alert" className="basis-full text-xs font-medium text-danger-ink" data-testid="close-error">{closeError}</p>
      )}
      <Modal
        isOpen={open}
        onClose={() => !isClosing && setOpen(false)}
        title={`Cerrar la orden #${orderNumber}`}
        description="La orden pasa al estado 3 y deja de aceptar lecturas. No se puede deshacer."
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={isClosing}>
            Cancelar
          </Button>
          <Button variant="danger" size="sm" onClick={handleConfirm} isLoading={isClosing}>
            Sí, cerrar la orden
          </Button>
        </div>
      </Modal>
    </PermissionGate>
  );
}
