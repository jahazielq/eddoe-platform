import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getAllPublicContent } from "@/lib/publicContent";

interface FaqItem {
  question: string;
  answer: string;
}

export const dynamic = "force-dynamic"; // el contenido puede cambiar desde /admin/contenido

export default async function LandingPage() {
  const content = await getAllPublicContent();

  const eyebrow = (content["landing.hero.eyebrow"] as string) ?? "EDDOE";
  const title =
    (content["landing.hero.title"] as string) ??
    "Evaluación del Desempeño Docente Objetiva Estructurada";
  const tagline =
    (content["landing.hero.tagline"] as string) ??
    "Del ¿sabes enseñar? hacia: demuestra cómo enseñas";
  const queEs = content["landing.queEs"] as string | undefined;
  const objetivo = content["landing.objetivo"] as string | undefined;
  const duracion = content["landing.duracion"] as string | undefined;
  const privacidad = content["landing.privacidad"] as string | undefined;
  const faq = (content["landing.faq"] as FaqItem[] | undefined) ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />

      <section className="border-b-4 border-gold bg-gradient-to-br from-navy to-navy-light py-20 text-center text-white">
        <div className="mx-auto max-w-3xl px-6">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-gold">{eyebrow}</p>
          <h1 className="font-serif text-3xl font-bold sm:text-4xl">{title}</h1>
          <p className="mt-5 text-lg text-white/90">{tagline}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/registro">
              <Button variant="primary">Inscribirme</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" className="!text-white !border-white/60 hover:!bg-white/10">
                Iniciar sesión
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-4xl space-y-10 px-6 py-14">
        {queEs && (
          <section>
            <h2 className="font-serif text-2xl font-bold text-navy">¿Qué es la EDDOE?</h2>
            <p className="mt-3 leading-relaxed text-slate-700">{queEs}</p>
          </section>
        )}

        {objetivo && (
          <section>
            <h2 className="font-serif text-2xl font-bold text-navy">Objetivo</h2>
            <p className="mt-3 leading-relaxed text-slate-700">{objetivo}</p>
          </section>
        )}

        <section className="grid gap-4 sm:grid-cols-2">
          {duracion && (
            <Card>
              <h3 className="font-semibold text-navy">Duración y modalidad</h3>
              <p className="mt-2 text-sm text-slate-600">{duracion}</p>
            </Card>
          )}
          <Card>
            <h3 className="font-semibold text-navy">A quién está dirigida</h3>
            <p className="mt-2 text-sm text-slate-600">
              Personal docente frente a grupo de la Facultad de Medicina, sin importar su nombramiento
              o años de experiencia.
            </p>
          </Card>
        </section>

        {privacidad && (
          <section>
            <h2 className="font-serif text-2xl font-bold text-navy">Privacidad</h2>
            <p className="mt-3 leading-relaxed text-slate-700">{privacidad}</p>
          </section>
        )}

        {faq.length > 0 && (
          <section>
            <h2 className="font-serif text-2xl font-bold text-navy">Preguntas frecuentes</h2>
            <div className="mt-4 space-y-3">
              {faq.map((item) => (
                <Card key={item.question}>
                  <p className="font-semibold text-navy">{item.question}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.answer}</p>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-lg bg-gold-light p-8 text-center">
          <h2 className="font-serif text-xl font-bold text-navy">¿Listo para comenzar?</h2>
          <p className="mt-2 text-sm text-slate-700">
            Regístrate para recibir tus datos de acceso a la plataforma EDDOE.
          </p>
          <div className="mt-5">
            <Link href="/registro">
              <Button variant="primary">Inscribirme</Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        EDDOE — Secretaría de Educación Médica, Facultad de Medicina, UNAM
      </footer>
    </div>
  );
}
