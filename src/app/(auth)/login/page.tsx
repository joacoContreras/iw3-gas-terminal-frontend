"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { errorMessage } from "@/services/api/client";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, Waves } from "lucide-react";

const END_REASON_TEXT = {
  expired: "Tu sesión venció. Iniciá sesión de nuevo.",
  unauthorized: "El servidor rechazó tu sesión. Iniciá sesión de nuevo.",
} as const;

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: isRestoring, endReason } = useAuth();

  // Sin usuario ni contraseña por defecto: los datos los escribe la persona que entra.
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Quien ya tiene sesión no necesita ver el login.
  React.useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await login(username.trim(), password);
      router.replace("/");
    } catch (err) {
      // Mensaje real del backend ("Usuario o contraseña incorrectos") o del cliente (sin conexión, tiempo agotado).
      setError(errorMessage(err, "No se pudo iniciar sesión"));
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-dvh bg-canvas lg:grid-cols-[1.1fr_1fr]">
      <section className="brand-grid relative hidden min-h-dvh flex-col justify-between overflow-hidden border-r border-line p-12 lg:flex xl:p-16" aria-label="AetherLoad, control de carga de gas">
        <p className="eyebrow flex items-center gap-3"><Waves className="h-5 w-5 text-accent" /> Operación en equilibrio</p>
        <div className="relative z-10 mx-auto w-full max-w-lg py-8">
          <Image src="/brand/aetherload-logo.png" alt="AetherLoad" width={1254} height={1254} sizes="(min-width: 1280px) 380px, 300px" preload className="mx-auto w-72 rounded-3xl xl:w-[380px]" />
          <h1 className="mt-8 text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">Cada carga.<br /><span className="text-accent-bright">Todo bajo control.</span></h1>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-muted">Una visión clara de cada orden, desde SAP hasta el pesaje final.</p>
        </div>
        <div className="relative z-10 flex items-center gap-6 border-t border-line pt-6 text-xs text-muted">
          <span><span className="mr-2 font-mono text-accent">01</span>Recibir</span><span><span className="mr-2 font-mono text-accent">02</span>Cargar</span><span><span className="mr-2 font-mono text-accent">03</span>Conciliar</span>
        </div>
        <svg className="pointer-events-none absolute bottom-0 left-0 h-64 w-full text-accent/10" viewBox="0 0 800 240" fill="none" preserveAspectRatio="none" aria-hidden="true"><path d="M-80 130C150-80 350 320 880 30M-80 160C180-50 370 350 880 60M-80 190C210-20 390 380 880 90" stroke="currentColor" strokeWidth="1" /></svg>
      </section>
      <section className="flex min-h-dvh items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-10 flex items-center gap-3 lg:hidden"><Image src="/brand/aetherload-logo.png" alt="" width={64} height={64} className="rounded-xl" /><span className="text-2xl font-semibold tracking-tight">AetherLoad<span className="text-accent">.</span></span></div>
          <p className="eyebrow mb-4">Tu centro de control</p>
          <h2 className="text-3xl font-semibold tracking-tight">Ingresá a tu terminal</h2>
          <p className="mb-9 mt-3 text-sm leading-relaxed text-muted">Administrá tus órdenes y seguí cada etapa de la carga.</p>
          {endReason && !error && <p role="status" className="mb-5 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">{END_REASON_TEXT[endReason]}</p>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="Usuario:" type="text" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} onChange={(e) => setUsername(e.target.value)} required disabled={isSubmitting || isRestoring} placeholder="Tu nombre de usuario" />
            <Input label="Contraseña:" type="password" name="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isSubmitting || isRestoring} placeholder="Ingresá tu contraseña" />
            {error && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger-ink">{error}</p>}
            <Button type="submit" className="mt-2 w-full" size="lg" isLoading={isSubmitting} disabled={isRestoring}>Iniciar Sesión <ArrowRight className="h-4 w-4" /></Button>
          </form>
          <p className="mt-8 border-t border-line pt-6 text-xs leading-relaxed text-muted">AetherLoad · Administración y monitoreo de carga de gas líquido.</p>
        </div>
      </section>
    </main>
  );
}
