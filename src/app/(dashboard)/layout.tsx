import * as React from "react";
import { AuthGate } from "@/features/auth/components/auth-gate";
import { DashboardShell } from "@/components/shared/dashboard-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <DashboardShell>{children}</DashboardShell>
    </AuthGate>
  );
}
