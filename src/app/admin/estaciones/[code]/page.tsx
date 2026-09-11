"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Alert, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Label, Input, Textarea } from "@/components/ui/Field";

interface StationVersion {
  id: string;
  versionNumber: number;
  status: string;
  durationSeconds: number;
  objective: string | null;
  scenario: string | null;
  instructions: string | null;
}

/**
 * Editor de contenido de UNA estación. Guardar crea una nueva StationVersion
 * publicada (nunca se sobrescribe una ya usada) — esto no afecta el código
 * ni el contenido de las demás estaciones.
 */
export default function EditarEstacionPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();

  const [stationName, setStationName] = useState("");
  const [version, setVersion] = useState<StationVersion | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(12);
  const [objective, setObjective] = useState("");
  const [scenario, setScenario] = useState("");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/estaciones/${params.code}`)
      .then((res) => res.json())
      .then((data) => {
        setStationName(data.station.name);
        if (data.version) {
          setVersion(data.version);
          setDurationMinutes(Math.round(data.version.durationSeconds / 60));
          setObjective(data.version.objective ?? "");
          setScenario(data.version.scenario ?? "");
          setInstructions(data.version.instructions ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, [params.code]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/estaciones/${params.code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMinutes, objective, scenario, instructions }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar.");
        return;
      }
      setVersion(data);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Cargando...</p>;

  return (
    <div className="max-w-2xl">
      <button onClick={() => router.push("/admin/estaciones")} className="mb-3 text-sm text-navy-light underline">
        ← Volver a estaciones
      </button>
      <h1 className="font-serif text-2xl font-bold text-navy">
        {params.code === "DEMO" ? "Estación demo" : `Estación ${params.code}`}
      </h1>
      <p className="mt-1 text-sm text-slate-600">{stationName}</p>
      {version && (
        <p className="mt-1">
          <Badge tone="gold">Versión publicada actual: v{version.versionNumber}</Badge>
        </p>
      )}

      <Card className="mt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="durationMinutes">Duración (minutos)</Label>
            <Input
              id="durationMinutes"
              type="number"
              min={1}
              max={60}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="objective">Objetivo</Label>
            <Textarea id="objective" value={objective} onChange={(e) => setObjective(e.target.value)} rows={3} />
          </div>
          <div>
            <Label htmlFor="scenario">Escenario</Label>
            <Textarea id="scenario" value={scenario} onChange={(e) => setScenario(e.target.value)} rows={5} />
          </div>
          <div>
            <Label htmlFor="instructions">Instrucciones / tareas</Label>
            <Textarea id="instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={5} />
          </div>

          {error && <Alert tone="danger">{error}</Alert>}
          {saved && <Alert tone="info">Guardado. Se publicó una nueva versión de esta estación.</Alert>}

          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar y publicar"}
          </Button>
        </form>
      </Card>

      <p className="mt-4 text-xs text-slate-500">
        Guardar crea una nueva versión publicada de esta estación; no modifica ni afecta el contenido de
        las demás estaciones.
      </p>
    </div>
  );
}
