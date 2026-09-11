"use client";

import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui/Card";

interface UserRow {
  id: string;
  email: string;
  status: string;
  roles: { role: { code: string; name: string } }[];
  participantProfile: { firstName: string; lastNamePaterno: string } | null;
}

export default function UsuariosPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/usuarios")
      .then((res) => res.json())
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

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
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
