"use client";

import { useState } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Card";

export default function RegistroPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");
    try {
      const res = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error ?? "Ocurrió un error. Intenta de nuevo.");
        setStatus("error");
        return;
      }
      setStatus("sent");
    } catch {
      setErrorMessage("No se pudo conectar con el servidor.");
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      <main className="mx-auto max-w-lg px-6 py-14">
        <h1 className="font-serif text-2xl font-bold text-navy">Inscripción a la EDDOE</h1>
        <p className="mt-2 text-sm text-slate-600">
          Escribe tu correo institucional; te enviaremos un enlace para verificarlo y continuar con tu registro.
        </p>

        <Card className="mt-6">
          {status === "sent" ? (
            <Alert tone="info">
              Enviamos un correo de verificación a <strong>{email}</strong>. Revisa tu bandeja de entrada
              (y spam) para continuar tu registro.
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" required>
                  Correo electrónico institucional
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@institucion.mx"
                />
              </div>
              {status === "error" && <Alert tone="danger">{errorMessage}</Alert>}
              <Button type="submit" disabled={status === "loading"} className="w-full">
                {status === "loading" ? "Enviando..." : "Continuar"}
              </Button>
            </form>
          )}
        </Card>
      </main>
    </div>
  );
}
