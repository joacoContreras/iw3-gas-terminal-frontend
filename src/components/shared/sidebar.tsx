"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/context/AuthContext";
import type { Permission } from "@/features/auth/lib/permissions";
import { Brand } from "./brand";
import { LayoutDashboard, Layers, ShieldAlert, Sliders, X, Waves, ArrowUpRight } from "lucide-react";

const NAV_ITEMS: { label: string; href: string; icon: typeof Layers; exact: boolean; permission: Permission; number: string }[] = [
  { label: "Vista general", href: "/", icon: LayoutDashboard, exact: true, permission: "orders:view", number: "01" },
  { label: "Órdenes de carga", href: "/orders", icon: Layers, exact: false, permission: "orders:view", number: "02" },
  { label: "Alarmas", href: "/alarms", icon: ShieldAlert, exact: false, permission: "alarms:view", number: "03" },
  { label: "Integraciones", href: "/simulator", icon: Sliders, exact: false, permission: "simulator:use", number: "04" },
];

function SidebarContents({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { can } = useAuth();
  return <>
    <Link href="/" onClick={onNavigate} aria-label="AetherLoad · Inicio" className="mb-12 block px-4 pt-8"><Brand compact /></Link>
    <p className="eyebrow mb-4 px-5">Operación de terminal</p>
    <nav aria-label="Navegación principal" className="space-y-2 px-3">
      {NAV_ITEMS.filter((item) => can(item.permission)).map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined}
          className={cn("group relative flex items-center gap-3 rounded-lg border px-4 py-3.5 text-sm font-medium transition-colors", active ? "border-accent/20 bg-accent/10 text-accent" : "border-transparent text-muted hover:bg-elevated hover:text-foreground")}>
          {active && <span className="absolute -left-3 h-6 w-0.5 rounded-full bg-accent" />}
          <item.icon className="h-[18px] w-[18px] shrink-0" /><span>{item.label}</span><span className="ml-auto font-mono text-xs opacity-60">{item.number}</span>
        </Link>;
      })}
    </nav>
    <div className="mx-5 mt-auto space-y-4 pb-6 pt-12">
      <div className="rounded-xl border border-line bg-canvas/40 p-4">
        <Waves className="mb-3 h-6 w-6 text-accent" /><p className="text-sm font-medium text-foreground">Cada carga, bajo control.</p><p className="mt-2 text-xs leading-relaxed text-muted">Órdenes, pesajes y telemetría en un solo lugar.</p>
        {can("orders:view") && <Link href="/orders" onClick={onNavigate} className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-accent">Explorar órdenes <ArrowUpRight className="h-3.5 w-3.5" /></Link>}
      </div>
      <p className="text-xs text-muted">AetherLoad <span className="mx-1 text-muted">/</span> Terminal de gas líquido</p>
    </div>
  </>;
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = React.useRef<HTMLDialogElement>(null);
  React.useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => { if (desktop.matches) onClose(); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [onClose]);
  React.useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
    const previous = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  return <>
    <aside data-app-sidebar className="sticky top-0 hidden h-dvh min-w-0 flex-col border-r border-line bg-shell md:flex"><SidebarContents /></aside>
    <dialog ref={dialog} id="mobile-navigation" aria-label="Navegación de AetherLoad" onCancel={onClose} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-72 max-w-[85vw] border-0 border-r border-line bg-shell p-0 backdrop:bg-canvas/80 md:hidden">
      <div className="flex min-h-full flex-col"><button type="button" onClick={onClose} aria-label="Cerrar navegación" className="absolute right-3 top-3 rounded-lg p-2 text-muted"><X className="h-5 w-5" /></button><SidebarContents onNavigate={onClose} /></div>
    </dialog>
  </>;
}
