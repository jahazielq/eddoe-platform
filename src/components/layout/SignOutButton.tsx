"use client";

import { signOut } from "next-auth/react";

export function SignOutButton({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className={`text-sm font-medium text-white/90 underline-offset-2 hover:text-gold hover:underline ${className}`}
    >
      Cerrar sesión
    </button>
  );
}
