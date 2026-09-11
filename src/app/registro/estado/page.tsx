"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Card, Alert, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";

const STATUS_LABEL: Record<string, { label: string; tone: "neutral" | "success" | "warning" | "danger" | "gold" }> = {
  DRAFT: { label: "Verificación pendiente", tone: "neutral" },
  SUBMITTED: { label: "Enviada, en espera de revisión", tone: "gold" },
  UNDER_REVIEW: { label: "En revisión", tone: "gold" },
  APPROVED: { label: "Aprobada", tone: "success" },
  REJECTED: { label: "Rechazada", tone: "danger" },
  NEEDS_CHANGES: { label: "Requiere correcciones", tone: "warning" },
  ACCOUNT_CREATED: { label: "Cuenta creada — revisa tu correo de acceso", tone: "success" },
};

function EstadoLookup() {
  const searchParams = useSearchParams();
  const [id, setId] = useState(searchParams.get("id") ?? "");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function consultar(e?: React.FormEvent) {
    e?.preventDefault();
    if (!id) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`/api/registro/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se encontró la solicitud.");
        return;
      }
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (searchParams.get("id")) consultar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card>
      <form onSubmit={consultar} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor="requestId">Folio de solicitud</Label>
          <Input id="requestId" value={id} onChange={(e) => setId(e.target.value)} placeholder="Pega aquí tu folio" />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Buscando..." : "Consultar"}
        </Button>
      </form>

      {error && (
        <div className="mt-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-2 border-t border-slate-200 pt-4 text-sm">
          <p>
            <span className="font-semibold text-navy">Correo:</span> {result.email}
          </p>
          <p className="flex items-center gap-2">
            <span className="font-semibold text-navy">Estado:</span>
            <Badge tone={STATUS_LABEL[result.status]?.tone ?? "neutral"}>
              {STATUS_LABEL[result.status]?.label ?? result.status}
            </Badge>
          </p>
          {result.reviewNote && (
            <p>
              <span className="font-semibold text-navy">Nota del comité:</span> {result.reviewNote}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

export default function RegistroEstadoPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      <main className="mx-auto max-w-lg px-6 py-14">
        <h1 className="font-serif text-2xl font-bold text-navy">Estado de tu solicitud</h1>
        <p className="mt-2 text-sm text-slate-600">
          Ingresa el folio que recibiste al enviar tu solicitud para consultar su estado.
        </p>
        <div className="mt-6">
          <Suspense fallback={<p className="text-sm text-slate-500">Cargando...</p>}>
            <EstadoLookup />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
