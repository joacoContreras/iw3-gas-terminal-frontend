import * as React from "react";
import { RequirePermission } from "@/components/shared/permission-gate";

export default function AlarmsLayout({ children }: { children: React.ReactNode }) {
  return <RequirePermission permission="alarms:view">{children}</RequirePermission>;
}
