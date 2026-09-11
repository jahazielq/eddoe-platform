"use client";

import { useState } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Card, Alert } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";

export default function RecuperarAccesoPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/recuperar-acceso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      <main className="mx-auto max-w-md px-6 py-14">
        <h1 className="font-serif text-2xl font-bold text-navy">Recuperar acceso</h1>
        <Card className="mt-6">
          {sent ? (
            <Alert tone="info">
              Si el correo está registrado, te enviamos instrucciones para restablecer tu contraseña.
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" required>
                  Correo electrónico
                </Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Enviando..." : "Enviar instrucciones"}
              </Button>
            </form>
          )}
        </Card>
      </main>
    </div>
  );
}
