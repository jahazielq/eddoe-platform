"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Badge } from "@/components/ui/Card";
import { Select } from "@/components/ui/Field";

interface RequestRow {
  id: string;
  email: string;
  status: string;
  submittedAt: string | null;
  createdAt: string;
}

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "gold"> = {
  DRAFT: "neutral",
  SUBMITTED: "gold",
  UNDER_REVIEW: "gold",
  APPROVED: "success",
  REJECTED: "danger",
  NEEDS_CHANGES: "warning",
  ACCOUNT_CREATED: "success",
};

export default function SolicitudesPage() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs = statusFilter ? `?status=${statusFilter}` : "";
    fetch(`/api/admin/solicitudes${qs}`)
      .then((res) => res.json())
      .then(setRows)
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-navy">Solicitudes de registro</h1>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-56">
          <option value="">Todos los estados</option>
          <option value="SUBMITTED">Enviadas</option>
          <option value="UNDER_REVIEW">En revisión</option>
          <option value="APPROVED">Aprobadas</option>
          <option value="REJECTED">Rechazadas</option>
          <option value="NEEDS_CHANGES">Requieren corrección</option>
          <option value="ACCOUNT_CREATED">Cuenta creada</option>
        </Select>
      </div>

      <Card className="mt-6 overflow-x-auto">
        {loading ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">No hay solicitudes con este filtro.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-2">Correo</th>
                <th className="pb-2">Estado</th>
                <th className="pb-2">Enviada</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2">{r.email}</td>
                  <td className="py-2">
                    <Badge tone={STATUS_TONE[r.status] ?? "neutral"}>{r.status}</Badge>
                  </td>
                  <td className="py-2 text-slate-500">
                    {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString("es-MX") : "—"}
                  </td>
                  <td className="py-2 text-right">
                    <Link href={`/admin/solicitudes/${r.id}`} className="font-semibold text-navy-light underline">
                      Ver expediente
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
