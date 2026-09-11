# EDDOE — Plataforma web institucional (Fase 1)

Portal público, inscripción/registro, autenticación y panel administrativo
para la Evaluación del Desempeño Docente Objetiva Estructurada. Ver
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) para la arquitectura completa.

> **Nota:** este proyecto fue generado en un entorno sin Node.js instalado,
> así que no se pudo ejecutar `npm install` / `next dev` / `prisma migrate`
> aquí. Sigue los pasos de abajo en tu máquina con Node.js 20+ instalado.

## Requisitos

* Node.js 20 o superior
* Docker (para levantar PostgreSQL localmente) — o una base de datos Postgres propia

## Puesta en marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Variables de entorno
cp .env.example .env
# Edita NEXTAUTH_SECRET con una cadena aleatoria larga.

# 3. Base de datos local (opcional si ya tienes Postgres propio)
docker compose up -d

# 4. Generar el cliente de Prisma y aplicar el esquema
npm run prisma:generate
npm run prisma:migrate

# 5. Sembrar datos iniciales (roles, permisos, admin, formulario, contenido)
npm run prisma:seed

# 6. Levantar la app
npm run dev
```

Abre http://localhost:3000.

* Portal público: `/`
* Inscripción: `/registro`
* Panel administrativo: `/admin` — inicia sesión con `admin@eddoe.local` y la
  contraseña definida en `prisma/seed.ts` (cámbiala de inmediato).

## Pruebas

```bash
npm test           # unitarias (Vitest)
npm run test:e2e   # end-to-end (Playwright, requiere la app corriendo)
```

## Estructura

Ver la sección 14 de `docs/ARCHITECTURE.md`. Resumen rápido:

* `prisma/schema.prisma` — modelo de datos completo (fuente de verdad).
* `src/lib/station-engine/` — motor único de estaciones (no expuesto a
  participantes todavía; ver sección 11 de la arquitectura).
* `src/lib/ai/` — capa `AIProvider` desacoplada de Gemini/OpenAI.
* `src/lib/rbac.ts` — matriz de permisos y validación server-side.
* `src/app/admin/` — panel administrativo (dashboard, solicitudes, usuarios, contenido).
* `src/app/(registro, login, recuperar-acceso, mi-eddoe)` — portal público y de participante.

## Qué falta para Fase 2 (a propósito, ver `docs/ARCHITECTURE.md` #30)

* Exponer el `StationEngine` a participantes (`/evaluacion/:sessionId/estacion/:stationId`).
* Editor de `StationVersion` en `/admin/estaciones/:id/version/:versionId`.
* Implementación real de `GeminiProvider` / `OpenAIProvider`.
* Reportes (`FeedbackReport`) y publicación controlada de resultados.
* Almacenamiento S3 real para evidencias (`Evidence.storageLocation`).
