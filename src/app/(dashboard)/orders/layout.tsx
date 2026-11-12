import * as React from "react";
import { RequirePermission } from "@/components/shared/permission-gate";

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <RequirePermission permission="orders:view">{children}</RequirePermission>;
}
