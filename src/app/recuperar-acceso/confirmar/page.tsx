"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Card, Alert } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";

function ConfirmarForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/recuperar-acceso/confirmar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword: password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "No se pudo restablecer la contraseña.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  if (!token) return <Alert tone="danger">Falta el token de recuperación en el enlace.</Alert>;
  if (done) return <Alert tone="info">Contraseña actualizada. Redirigiendo a iniciar sesión...</Alert>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="password" required>
          Nueva contraseña
        </Label>
        <Input
          id="password"
          type="password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <Alert tone="danger">{error}</Alert>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Guardando..." : "Establecer contraseña"}
      </Button>
    </form>
  );
}

export default function ConfirmarRecuperacionPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      <main className="mx-auto max-w-md px-6 py-14">
        <h1 className="font-serif text-2xl font-bold text-navy">Establece tu nueva contraseña</h1>
        <Card className="mt-6">
          <Suspense fallback={<p className="text-sm text-slate-500">Cargando...</p>}>
            <ConfirmarForm />
          </Suspense>
        </Card>
      </main>
    </div>
  );
}
