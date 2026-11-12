import * as React from "react";
import { RequirePermission } from "@/components/shared/permission-gate";

export default function SimulatorLayout({ children }: { children: React.ReactNode }) {
  return <RequirePermission permission="simulator:use">{children}</RequirePermission>;
}
