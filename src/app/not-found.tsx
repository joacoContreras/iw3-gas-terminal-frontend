import Link from "next/link";
import { Brand } from "@/components/shared/brand";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return <main className="brand-grid flex min-h-dvh items-center justify-center bg-canvas p-6 text-center">
    <div className="max-w-md space-y-6">
      <Brand />
      <p className="font-mono text-7xl font-semibold text-accent">404</p>
      <h1 className="page-title">Esta página no está disponible</h1>
      <p className="text-sm leading-relaxed text-muted">Revisá la dirección o volvé al inicio para continuar con tu operación.</p>
      <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-accent bg-accent px-5 py-3 text-sm font-semibold text-canvas transition-colors hover:bg-accent-bright"><ArrowLeft className="h-4 w-4" /> Volver al inicio</Link>
    </div>
  </main>;
}
