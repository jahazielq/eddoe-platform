"use client";

import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface UserRow {
  id: string;
  email: string;
  status: string;
  roles: { role: { code: string; name: string } }[];
  participantProfile: { firstName: string; lastNamePaterno: string } | null;
  assessmentSessions: { id: string; status: string }[];
}

const SESSION_LABEL: Record<string, string> = {
  NOT_STARTED: "Activado, no iniciado",
  IN_PROGRESS: "En curso",
  SUBMITTED: "Enviado",
  PROCESSING: "Procesando",
  EVALUATED: "Evaluado",
  ERROR: "Error",
  INVALIDATED: "Invalidado",
};

export default function UsuariosPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/usuarios")
      .then((res) => res.json())
      .then(setRows)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function activar(userId: string) {
    setActivatingId(userId);
    try {
      const res = await fetch(`/api/admin/usuarios/${userId}/activar-examen`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "No se pudo activar el examen.");
        return;
      }
      load();
    } finally {
      setActivatingId(null);
    }
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-navy">Usuarios</h1>
      <Card className="mt-6 overflow-x-auto">
        {loading ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-2">Nombre</th>
                <th className="pb-2">Correo</th>
                <th className="pb-2">Rol(es)</th>
                <th className="pb-2">Estado</th>
                <th className="pb-2">Examen</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const isParticipant = u.roles.some((r) => r.role.code === "PARTICIPANT");
                const session = u.assessmentSessions[0];
                return (
                  <tr key={u.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2">
                      {u.participantProfile
                        ? `${u.participantProfile.firstName} ${u.participantProfile.lastNamePaterno}`
                        : "—"}
                    </td>
                    <td className="py-2">{u.email}</td>
                    <td className="py-2 space-x-1">
                      {u.roles.map((r) => (
                        <Badge key={r.role.code} tone="gold">
                          {r.role.name}
                        </Badge>
                      ))}
                    </td>
                    <td className="py-2 text-slate-600">{u.status}</td>
                    <td className="py-2">
                      {isParticipant ? (
                        session ? (
                          <Badge tone="success">{SESSION_LABEL[session.status] ?? session.status}</Badge>
                        ) : (
                          <Badge tone="neutral">Sin examen activado</Badge>
                        )
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {isParticipant && !session && (
                        <Button
                          variant="secondary"
                          className="!px-3 !py-1.5 text-xs"
                          disabled={activatingId === u.id}
                          onClick={() => activar(u.id)}
                        >
                          {activatingId === u.id ? "Activando..." : "Activar examen"}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
