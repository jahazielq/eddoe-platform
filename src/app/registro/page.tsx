"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Card, Alert } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DynamicField } from "@/components/forms/DynamicField";
import type { RegistrationField } from "@/lib/registration/formSchema";

export default function RegistroPage() {
  const router = useRouter();
  const [fields, setFields] = useState<RegistrationField[] | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/registro/schema")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "No se pudo cargar el formulario.");
        return data;
      })
      .then((data) => setFields(data.fields))
      .catch((err) => setLoadError(err.message));
  }, []);

  function updateValue(key: string, value: unknown) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: values }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "No se pudo enviar tu solicitud.");
        return;
      }
      router.push(`/registro/estado?id=${data.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      <main className="mx-auto max-w-2xl px-6 py-14">
        <h1 className="font-serif text-2xl font-bold text-navy">Inscripción a la EDDOE</h1>
        <p className="mt-2 text-sm text-slate-600">
          Completa tus datos para recibir tu usuario y contraseña de acceso a la plataforma.
        </p>

        {loadError && (
          <div className="mt-6">
            <Alert tone="danger">{loadError}</Alert>
          </div>
        )}

        {!loadError && !fields && <p className="mt-6 text-sm text-slate-500">Cargando formulario...</p>}

        {fields && (
          <Card className="mt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {fields
                .filter((f) => f.key !== "privacyAccepted" && f.key !== "termsAccepted")
                .map((field) => (
                  <DynamicField key={field.key} field={field} value={values[field.key]} onChange={updateValue} allValues={values} />
                ))}

              <div className="space-y-3 border-t border-slate-200 pt-4">
                {fields
                  .filter((f) => f.key === "privacyAccepted" || f.key === "termsAccepted")
                  .map((field) => (
                    <DynamicField key={field.key} field={field} value={values[field.key]} onChange={updateValue} allValues={values} />
                  ))}
              </div>

              {submitError && <Alert tone="danger">{submitError}</Alert>}

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Enviando..." : "Enviar solicitud"}
              </Button>
            </form>
          </Card>
        )}
      </main>
    </div>
  );
}
