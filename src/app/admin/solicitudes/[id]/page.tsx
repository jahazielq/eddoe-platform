"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Badge, Alert } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea, Label } from "@/components/ui/Field";
import type { RegistrationField } from "@/lib/registration/formSchema";

interface RequestDetail {
  id: string;
  email: string;
  status: string;
  answers: Record<string, unknown> | null;
  reviewNote: string | null;
  formSchema: { fields: RegistrationField[] };
}

export default function SolicitudDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<RequestDetail | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetch(`/api/admin/solicitudes/${params.id}`)
      .then((res) => res.json())
      .then(setData);
  }, [params.id]);

  async function decide(decision: "APPROVE" | "REJECT" | "NEEDS_CHANGES") {
    setBusy(true);
    setFeedback("");
    const res = await fetch(`/api/admin/solicitudes/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, note }),
    });
    const result = await res.json();
    setBusy(false);
    if (!res.ok) {
      setFeedback(result.error ?? "No se pudo procesar la decisión.");
      return;
    }
    router.push("/admin/solicitudes");
  }

  if (!data) return <p className="text-sm text-slate-500">Cargando expediente...</p>;

  const canDecide = ["SUBMITTED", "UNDER_REVIEW"].includes(data.status);

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl font-bold text-navy">Expediente de solicitud</h1>
      <p className="mt-1 text-sm text-slate-600">{data.email}</p>
      <p className="mt-2">
        <Badge tone="gold">{data.status}</Badge>
      </p>

      <Card className="mt-6">
        <h2 className="mb-3 font-semibold text-navy">Información capturada</h2>
        <dl className="space-y-2 text-sm">
          {data.formSchema.fields
            .filter((f) => f.type !== "checkbox")
            .map((f) => (
              <div key={f.key} className="flex justify-between border-b border-slate-100 py-1">
                <dt className="text-slate-500">{f.label}</dt>
                <dd className="font-medium text-slate-800">{String(data.answers?.[f.key] ?? "—")}</dd>
              </div>
            ))}
        </dl>
      </Card>

      {canDecide ? (
        <Card className="mt-6">
          <Label htmlFor="note">Nota (opcional, visible para el participante si rechazas o pides corrección)</Label>
          <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} />
          {feedback && (
            <div className="mt-3">
              <Alert tone="danger">{feedback}</Alert>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={() => decide("APPROVE")} disabled={busy}>
              Aprobar y crear cuenta
            </Button>
            <Button variant="secondary" onClick={() => decide("NEEDS_CHANGES")} disabled={busy}>
              Pedir corrección
            </Button>
            <Button variant="danger" onClick={() => decide("REJECT")} disabled={busy}>
              Rechazar
            </Button>
          </div>
        </Card>
      ) : (
        <div className="mt-6">
          <Alert tone="info">Esta solicitud ya fue resuelta ({data.status}).</Alert>
        </div>
      )}
    </div>
  );
}
