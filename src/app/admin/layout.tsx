import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { SignOutButton } from "@/components/layout/SignOutButton";

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
        <header className="flex items-center gap-3 border-b-4 border-gold bg-navy px-6 py-4 text-white">
          <img src="/logo-eddoe.png" alt="Logotipo EDDOE" className="h-8 w-8" />
          <p className="font-serif text-sm font-bold tracking-wide text-gold">EDDOE — Panel administrativo</p>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-white/80">{session.user.email}</span>
            <SignOutButton />
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
