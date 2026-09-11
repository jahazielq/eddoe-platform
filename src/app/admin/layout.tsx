import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

/**
 * Guardia de acceso a TODO /admin/*. La validación real (por acción) vuelve
 * a ocurrir en cada Route Handler (regla #19: no confiar únicamente en
 * ocultar botones) — esto sólo evita que alguien sin ningún permiso
 * administrativo vea el layout.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/admin");

  const isAdmin = hasPermission(session.user.roles, "registration.review") || hasPermission(session.user.roles, "content.edit");
  if (!isAdmin) redirect("/mi-eddoe");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex-1">
        <header className="border-b-4 border-gold bg-navy px-6 py-4 text-white">
          <p className="font-serif text-sm font-bold tracking-wide text-gold">EDDOE — Panel administrativo</p>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
