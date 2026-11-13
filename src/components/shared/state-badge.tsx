import * as React from "react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS, type OrderStatusCode } from "@/types/api";
import { Clock, Lock, CheckCircle2, Activity } from "lucide-react";

export interface StateBadgeProps { state: OrderStatusCode; showIcon?: boolean }
const STYLES: Record<OrderStatusCode, { variant: BadgeProps["variant"]; icon: typeof Clock }> = {
  1: { variant: "warning", icon: Clock },
  2: { variant: "info", icon: Activity },
  3: { variant: "secondary", icon: Lock },
  4: { variant: "success", icon: CheckCircle2 },
};

/** Color semántico y etiqueta oficial del backend: el color nunca reemplaza al texto. */
export function StateBadge({ state, showIcon = true }: StateBadgeProps) {
  const style = STYLES[state];
  if (!style) return <Badge variant="secondary">Estado desconocido</Badge>;
  const Icon = style.icon;
  return <Badge variant={style.variant} className="gap-1.5 whitespace-nowrap py-1 font-medium">{showIcon && <Icon className="h-3.5 w-3.5 shrink-0" />}<span>{state}: {ORDER_STATUS_LABELS[state]}</span></Badge>;
}
