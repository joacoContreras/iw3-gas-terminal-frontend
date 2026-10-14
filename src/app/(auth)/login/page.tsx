"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  const [username, setUsername] = React.useState("admin_terminal");
  const [password, setPassword] = React.useState("password123");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(username, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Credenciales incorrectas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (userRole: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await login(userRole, "admin123");
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Usuario:"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej: operador, admin"
              required
            />

            <Input
              label="Contraseña:"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

            <Button
              type="submit"
              variant="primary"
              className="w-full shadow-sm font-semibold"
              isLoading={isLoading}
            >
              Iniciar Sesión
            </Button>
          </form>

          {/* Quick Demo Logins */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-[11px] font-semibold text-zinc-400 block mb-2 uppercase tracking-wider text-center">
              Acceso Rápido de Demostración
            </span>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickLogin("admin")}
                className="text-xs h-8"
              >
                Admin
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickLogin("supervisor")}
                className="text-xs h-8"
              >
                Supervisor
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickLogin("operador")}
                className="text-xs h-8"
              >
                Operador
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
