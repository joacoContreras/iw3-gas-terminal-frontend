"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { errorMessage } from "@/services/api/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";

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
    <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <Card className="w-full max-w-md shadow-xl border-zinc-200 dark:border-zinc-800">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md mb-2">
            <Flame className="h-7 w-7" />
          </div>
          <CardTitle className="text-xl font-black uppercase tracking-tight">
            IW3 Gas Terminal
          </CardTitle>
          <CardDescription className="text-xs">
            Acceso al Sistema de Control & Telemetría de Carga
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          {endReason && !error && (
            <p role="status" className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-3 py-2 text-xs font-medium text-amber-800 dark:text-amber-300">
              {END_REASON_TEXT[endReason]}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Usuario:"
              type="text"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isSubmitting || isRestoring}
            />

            <Input
              label="Contraseña:"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting || isRestoring}
            />

            {error && (
              <p role="alert" className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full shadow-sm font-semibold"
              isLoading={isSubmitting}
              disabled={isRestoring}
            >
              Iniciar Sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
