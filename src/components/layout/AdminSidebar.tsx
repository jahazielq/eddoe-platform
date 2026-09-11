"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/solicitudes", label: "Solicitudes" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/contenido", label: "Contenido" },
  { href: "/admin/evaluaciones", label: "Evaluaciones (fase 2)" },
  { href: "/admin/estaciones", label: "Estaciones (fase 2)" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-56 shrink-0 border-r border-slate-200 bg-white py-6">
      <p className="mb-4 px-4 font-serif text-sm font-bold uppercase tracking-widest text-gold-dark">
        Admin EDDOE
      </p>
      <ul className="space-y-1">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={clsx(
                  "block px-4 py-2 text-sm font-medium",
                  active ? "border-l-4 border-gold bg-gold-light text-navy" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
