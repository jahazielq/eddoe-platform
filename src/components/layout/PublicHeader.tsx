import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function PublicHeader() {
  return (
    <header className="border-b-4 border-gold bg-navy text-white">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
        <Link href="/" className="font-serif text-lg font-bold tracking-wide text-gold">
          EDDOE
        </Link>
        <span className="hidden text-sm text-white/80 sm:inline">
          Facultad de Medicina, UNAM
        </span>
        <nav className="ml-auto flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-white/90 hover:text-gold">
            Iniciar sesión
          </Link>
          <Link href="/registro">
            <Button variant="primary" className="!py-2">Inscribirme</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
