import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS, type OrderStatusCode } from "@/types/api";
import { Clock, Lock, CheckCircle2 } from "lucide-react";

export interface StateBadgeProps {
  /** Estado de la orden (`status` del backend: 1 a 4). */
  state: OrderStatusCode;
  showIcon?: boolean;
}

/** Etiqueta del estado de la orden, con los textos oficiales del contrato (`ORDER_STATUS_LABELS`). */
export function StateBadge({ state, showIcon = true }: StateBadgeProps) {
  const label = ORDER_STATUS_LABELS[state];
  switch (state) {
    case 1:
      return (
        <Badge variant="info" className="gap-1.5 font-medium py-1">
          {showIcon && <Clock className="h-3.5 w-3.5 text-blue-500" />}
          <span>1: {label}</span>
        </Badge>
      );
    case 2:
      return (
        <Badge variant="success" className="gap-1.5 font-medium py-1">
          {showIcon && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          )}
          <span>2: {label}</span>
        </Badge>
      );
    case 3:
      return (
        <Badge variant="warning" className="gap-1.5 font-medium py-1">
          {showIcon && <Lock className="h-3.5 w-3.5 text-amber-500" />}
          <span>3: {label}</span>
        </Badge>
      );
    case 4:
      return (
        <Badge variant="default" className="gap-1.5 font-medium py-1 bg-violet-600 text-white dark:bg-violet-700">
          {showIcon && <CheckCircle2 className="h-3.5 w-3.5" />}
          <span>4: {label}</span>
        </Badge>
      );
    default:
      return <Badge variant="secondary">Estado desconocido</Badge>;
  }
}
