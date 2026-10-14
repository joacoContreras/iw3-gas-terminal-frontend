"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useAlarms } from "@/features/alarms/hooks/useAlarms";
import { Flame, Bell, LogOut } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const { pendingCount } = useAlarms();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-200/80 bg-white/95 px-4 sm:px-6 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs">
            <Flame className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black leading-none uppercase tracking-wide">
              IW3 Gas Terminal
            </span>
            <span className="text-[10px] text-zinc-400 font-mono mt-0.5">
              Control & Telemetría GLP
            </span>
          </div>
        </Link>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Alarms Bell Indicator */}
        <Link
          href="/alarms"
          className="relative p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Alarmas de Temperatura"
        >
          <Bell className="h-5 w-5" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs animate-bounce">
              {pendingCount}
            </span>
          )}
        </Link>

        {/* User profile badge */}
        {user && (
          <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-col text-right hidden sm:block">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {user.username}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {user.roles[0]?.replace("ROLE_", "") || "OPERADOR"}
              </span>
            </div>

            <button
              onClick={logout}
              title="Cerrar sesión"
              className="p-2 rounded-xl text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
