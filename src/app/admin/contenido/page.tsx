"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea, Label } from "@/components/ui/Field";

interface ContentItem {
  id: string;
  key: string;
  type: string;
  value: unknown;
}

/**
 * Editor mínimo de PublicContent: cada fila es texto/JSON crudo por ahora.
 * Un editor más rico (WYSIWYG, editor de FAQ estructurado) es una mejora
 * de UI sobre la misma API — no requiere cambios de esquema.
 */
export default function ContenidoPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/contenido")
      .then((res) => res.json())
      .then((data: ContentItem[]) => {
        setItems(data);
        setDrafts(Object.fromEntries(data.map((i) => [i.key, JSON.stringify(i.value, null, 2)])));
      });
  }, []);

  async function save(item: ContentItem) {
    setSavingKey(item.key);
    setSavedKey(null);
    try {
      const value = JSON.parse(drafts[item.key] ?? "null");
      await fetch("/api/admin/contenido", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: item.key, value, type: item.type }),
      });
      setSavedKey(item.key);
    } catch {
      alert("El valor debe ser JSON válido (para texto simple, usa comillas: \"texto\").");
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-navy">Contenido del portal público</h1>
      <p className="mt-1 text-sm text-slate-600">
        Edita los textos de la landing sin desplegar código nuevo.
      </p>

      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <Card key={item.key}>
            <Label htmlFor={item.key}>{item.key}</Label>
            <Textarea
              id={item.key}
              value={drafts[item.key] ?? ""}
              onChange={(e) => setDrafts((prev) => ({ ...prev, [item.key]: e.target.value }))}
              className="font-mono text-xs"
              rows={4}
            />
            <div className="mt-2 flex items-center gap-3">
              <Button onClick={() => save(item)} disabled={savingKey === item.key}>
                {savingKey === item.key ? "Guardando..." : "Guardar"}
              </Button>
              {savedKey === item.key && <span className="text-sm text-emerald-700">Guardado ✓</span>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
