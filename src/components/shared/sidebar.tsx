"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/context/AuthContext";
import type { Permission } from "@/features/auth/lib/permissions";
import {
  LayoutDashboard,
  Layers,
  ShieldAlert,
  Sliders,
} from "lucide-react";

/** Cada módulo exige un permiso: el menú solo muestra lo que el rol puede usar. */
const NAV_ITEMS: { label: string; href: string; icon: typeof Layers; exact: boolean; permission: Permission }[] = [
  { label: "Dashboard General", href: "/", icon: LayoutDashboard, exact: true, permission: "orders:view" },
  { label: "Órdenes de Carga", href: "/orders", icon: Layers, exact: false, permission: "orders:view" },
  { label: "Alarmas de Temperatura", href: "/alarms", icon: ShieldAlert, exact: false, permission: "alarms:view" },
  { label: "Simulador de Integración", href: "/simulator", icon: Sliders, exact: false, permission: "simulator:use" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { can } = useAuth();
  const navItems = NAV_ITEMS.filter((item) => can(item.permission));

  return (
    <aside className="w-64 shrink-0 hidden md:block border-r border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
      <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-3 mb-2">
        Módulos del Sistema
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors",
                isActive
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Info card at bottom of sidebar */}
      <div className="mt-8 p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-[11px] text-blue-900 dark:text-blue-300">
        <span className="font-bold block">Backend Spring Boot</span>
        <span className="text-[10px] text-blue-700/80 dark:text-blue-400/80 block mt-0.5 font-mono">
          API: /api/v1 (REST + JWT)
        </span>
        <span className="text-[10px] text-blue-700/80 dark:text-blue-400/80 block font-mono">
          Máquina de estados 1 → 4
        </span>
      </div>
    </aside>
  );
}
