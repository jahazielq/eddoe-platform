"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Card, Alert } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Field";
import { DynamicField } from "@/components/forms/DynamicField";
import type { RegistrationField } from "@/lib/registration/formSchema";

interface LoadedRequest {
  id: string;
  email: string;
  status: string;
  answers: Record<string, unknown> | null;
  fields: RegistrationField[];
}

function PerfilForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [request, setRequest] = useState<LoadedRequest | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoadError("Falta el enlace de verificación. Revisa el correo que te enviamos.");
      return;
    }
    fetch(`/api/registro/by-token/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "No se pudo cargar tu solicitud.");
        return data as LoadedRequest;
      })
      .then((data) => {
        setRequest(data);
        setValues(data.answers ?? {});
      })
      .catch((err) => setLoadError(err.message));
  }, [token]);

  function updateValue(key: string, value: unknown) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!request || !token) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`/api/registro/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          answers: values,
          privacyAccepted: Boolean(values.privacyAccepted),
          termsAccepted: Boolean(values.termsAccepted),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "No se pudo enviar tu solicitud.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push(`/registro/estado?id=${request.id}`), 1500);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return <Alert tone="danger">{loadError}</Alert>;
  }

  if (!request) {
    return <p className="text-sm text-slate-500">Cargando tu solicitud...</p>;
  }

  if (done) {
    return (
      <Alert tone="info">
        Tu solicitud fue enviada. Te redirigiremos a la página de estado en un momento...
      </Alert>
    );
  }

  const nonConsentFields = request.fields.filter((f) => f.key !== "privacyAccepted" && f.key !== "termsAccepted");

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-slate-600">
        Correo verificado: <strong>{request.email}</strong>
      </p>

      {nonConsentFields.map((field) => (
        <DynamicField key={field.key} field={field} value={values[field.key]} onChange={updateValue} allValues={values} />
      ))}

      <div className="space-y-3 border-t border-slate-200 pt-4">
        <Checkbox
          id="privacyAccepted"
          label="Acepto el aviso de privacidad"
          checked={Boolean(values.privacyAccepted)}
          onChange={(e) => updateValue("privacyAccepted", e.target.checked)}
          required
        />
        <Checkbox
          id="termsAccepted"
          label="Acepto las condiciones de participación"
          checked={Boolean(values.termsAccepted)}
          onChange={(e) => updateValue("termsAccepted", e.target.checked)}
          required
        />
      </div>

      {submitError && <Alert tone="danger">{submitError}</Alert>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Enviando..." : "Enviar solicitud"}
      </Button>
    </form>
  );
}

export default function RegistroPerfilPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      <main className="mx-auto max-w-2xl px-6 py-14">
        <h1 className="font-serif text-2xl font-bold text-navy">Completa tu información</h1>
        <p className="mt-2 text-sm text-slate-600">
          Estos datos permiten identificarte como docente y contactarte con tus resultados. Consulta el
          estado de tu solicitud en{" "}
          <Link href="/registro/estado" className="font-semibold text-navy-light underline">
            /registro/estado
          </Link>
          .
        </p>
        <Card className="mt-6">
          <Suspense fallback={<p className="text-sm text-slate-500">Cargando...</p>}>
            <PerfilForm />
          </Suspense>
        </Card>
      </main>
    </div>
  );
}
