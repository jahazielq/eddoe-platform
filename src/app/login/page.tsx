"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Card, Alert } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/mi-eddoe";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }
    router.push(callbackUrl);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email" required>
          Correo electrónico
        </Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="password" required>
          Contraseña
        </Label>
        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && <Alert tone="danger">{error}</Alert>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Ingresando..." : "Iniciar sesión"}
      </Button>
      <p className="text-center text-sm text-slate-600">
        <Link href="/recuperar-acceso" className="font-semibold text-navy-light underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      <main className="mx-auto max-w-md px-6 py-14">
        <h1 className="font-serif text-2xl font-bold text-navy">Iniciar sesión</h1>
        <Card className="mt-6">
          <Suspense fallback={<p className="text-sm text-slate-500">Cargando...</p>}>
            <LoginForm />
          </Suspense>
        </Card>
      </main>
    </div>
  );
}
