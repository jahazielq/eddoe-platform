# EDDOE — Arquitectura general (Fase 1)

> Plataforma web institucional para administrar y aplicar la Evaluación del Desempeño Docente Objetiva Estructurada (EDDOE). Este documento cubre los entregables 1–17 solicitados antes de la implementación.

## 1. Arquitectura general del sistema

Monolito modular (un solo despliegue, separación interna por dominios), no microservicios:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js App (TypeScript)                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────┐ │
│  │  Portal        │  │  Portal        │  │  Panel Administrativo │ │
│  │  Público       │  │  Participante  │  │  (/admin)              │ │
│  │  (/)           │  │  (/mi-eddoe)   │  │                       │ │
│  └───────┬───────┘  └───────┬───────┘  └───────────┬───────────┘ │
│          │                  │                       │             │
│  ┌───────▼──────────────────▼───────────────────────▼───────────┐ │
│  │              API Layer (Route Handlers / Server Actions)      │ │
│  └───────┬─────────────┬─────────────┬─────────────┬────────────┘ │
│          │             │             │             │              │
│  ┌───────▼───┐  ┌──────▼─────┐ ┌─────▼──────┐ ┌────▼──────────┐   │
│  │ Auth /    │  │ Station    │ │ AI Adapter │ │ Storage /      │   │
│  │ RBAC      │  │ Engine     │ │ (Provider) │ │ Notifications  │   │
│  └───────┬───┘  └──────┬─────┘ └─────┬──────┘ └────┬──────────┘   │
│          │             │             │             │              │
│  ┌───────▼─────────────▼─────────────▼─────────────▼───────────┐ │
│  │                    Prisma ORM (data access)                   │ │
│  └───────────────────────────┬─────────────────────────────────┘ │
└──────────────────────────────┼───────────────────────────────────┘
                                │
                        ┌───────▼────────┐
                        │  PostgreSQL     │
                        └────────────────┘
```

Servicios compartidos (nunca duplicados por estación): `Authentication`, `StationEngine`, `Storage`, `Notifications`, `AI Adapter`, `Reporting Engine`, `Audit Service`.

## 2. Diagrama de módulos (dominios)

```
identity/        User, Role, Permission, ParticipantProfile, RBAC
registration/    RegistrationRequest, RegistrationFormSchema
assessment/      Assessment, AssessmentBlueprint, AssessmentStation, AssessmentSession
competency/      Competency, LearningOutcome
station/         Station, StationVersion, StationBlock, StationAsset, StationAttempt
response/        Response, Evidence
rubric/          Rubric, RubricVersion, RubricCriterion, RubricLevel, Score
ai/              AIConfig, AIEvaluation, AIProvider (interfaz)
feedback/        FeedbackReport
platform/        Notification, AuditEvent, SystemSetting, PublicContent
```

Cada dominio vive en `src/lib/<dominio>/` con sus propios tipos, acceso a datos y reglas — sin lógica de negocio dentro de componentes visuales (regla #32).

## 3. Sitemap público

| Ruta | Propósito |
|---|---|
| `/` | Información EDDOE (contenido editable vía `PublicContent`) |
| `/registro` | Inicia solicitud: captura de correo y verificación |
| `/registro/perfil` | Formulario dinámico (`RegistrationFormSchema`) |
| `/registro/estado` | Consulta de estado de la solicitud |
| `/login` | Inicio de sesión |
| `/recuperar-acceso` | Recuperación de acceso |

## 4. Sitemap participante

| Ruta | Propósito |
|---|---|
| `/mi-eddoe` | Dashboard: estado, próxima evaluación, consentimientos, botón "Iniciar EDDOE" |
| `/mi-eddoe/historial` | Resultados y realimentación disponibles (stub Fase 1) |
| `/evaluacion/:sessionId/estacion/:stationId` | Motor de estaciones (no expuesto en Fase 1) |

## 5. Sitemap administrador

| Ruta | Propósito |
|---|---|
| `/admin` | Dashboard: solicitudes pendientes, participantes, evaluaciones activas |
| `/admin/solicitudes` | Lista, filtra, aprueba, rechaza, pide corrección |
| `/admin/solicitudes/:id` | Expediente individual |
| `/admin/usuarios` | Catálogo de usuarios por rol |
| `/admin/contenido` | Editor de `PublicContent` (landing, FAQ, avisos) |
| `/admin/evaluaciones` | (Fase 2) Convocatorias y blueprints |
| `/admin/estaciones` | (Fase 2, estructura ya preparada) Tarjetas E1–E6 |

## 6. Modelo entidad-relación (resumen)

Ver `prisma/schema.prisma` como fuente de verdad. Relaciones clave:

```
User 1─1 ParticipantProfile
User *─* Role (vía UserRole)      Role *─* Permission (vía RolePermission)
RegistrationRequest *─1 User (solicitante, opcional hasta aprobación)
RegistrationRequest 1─1 RegistrationFormSchema (versión usada)

Assessment 1─* AssessmentBlueprint (histórico) ── AssessmentBlueprint *─* Station (vía AssessmentStation, con orden)
AssessmentSession *─1 Assessment
AssessmentSession *─1 User (participante)
StationAttempt *─1 AssessmentSession
StationAttempt *─1 StationVersion   ← nunca Station directamente (trazabilidad)

Station 1─* StationVersion
StationVersion 1─* StationBlock
StationVersion *─1 RubricVersion
StationVersion *─* Competency (vía StationVersionCompetency)
StationVersion *─* LearningOutcome

StationAttempt 1─* Response
Response 1─* Evidence
StationAttempt 1─1 AIEvaluation (opcional)
AIEvaluation *─1 AIConfig
AIEvaluation 1─* Score ── Score *─1 RubricCriterion

AuditEvent *─1 User (actor, opcional)
```

## 7. Esquema Prisma inicial

Ver [`prisma/schema.prisma`](../prisma/schema.prisma). Todos los IDs técnicos son UUID (`@default(uuid())`); ninguna entidad usa el número de estación como llave primaria (regla #21).

## 8. Matriz de roles / permisos (RBAC)

| Permiso | SUPER_ADMIN | ACADEMIC_ADMIN | STATION_EDITOR | EVALUATOR | SUPPORT | PARTICIPANT |
|---|---|---|---|---|---|---|
| `registration.review` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `registration.approve` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `user.manage` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `content.edit` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `station.editDraft` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `station.publish` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `rubric.editPublished` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `evidence.view` | ✅ | ✅ | ❌ | ✅ (asignada) | ❌ | propia |
| `audit.view` | ✅ | ✅ | ❌ | ❌ | parcial (técnica) | ❌ |
| `assessment.take` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

La autorización se valida siempre en servidor (Route Handlers / Server Actions), nunca solo ocultando botones en el cliente — ver `src/lib/rbac.ts`.

## 9. Flujo de inscripción

```
Visitante → "/" → Inscribirme → "/registro" (correo)
  → verificación de correo (token)
  → "/registro/perfil" (RegistrationFormSchema dinámico)
  → aceptación de avisos
  → enviar solicitud → RegistrationRequest(SUBMITTED)
  → "/registro/estado" (consulta)
  → [Admin] UNDER_REVIEW → APPROVED | REJECTED | NEEDS_CHANGES
  → si APPROVED: se crea/activa User + envío de correo de acceso
  → participante establece contraseña → RegistrationRequest(ACCOUNT_CREATED)
  → acceso a "/mi-eddoe"
```

`registrationApprovalMode` (en `SystemSetting`) determina si `UNDER_REVIEW → APPROVED` ocurre automáticamente, manualmente o solo por invitación. Fase 1 usa `MANUAL`.

## 10. Flujo de evaluación (preparado, no expuesto en Fase 1)

```
AssessmentSession creada → StationAttempt por cada AssessmentStation del blueprint
  → participante entra a /evaluacion/:sessionId/estacion/:stationId
  → StationEngine resuelve stationVersionId vigente para esa sesión (fijado al iniciar, no al publicar)
  → renderiza StationBlock[] en orden
  → autosave de Response/Evidence
  → al expirar tiempo o enviar: StationAttempt.status = SUBMITTED → PROCESSING
  → AIProvider (o ManualEvaluationProvider) evalúa contra RubricVersion → AIEvaluation + Score
  → StationAttempt.status = EVALUATED
  → al completar todas las estaciones: cálculo agregado → FeedbackReport (RawEvaluationData primero, publicación controlada después)
```

## 11. Arquitectura del StationEngine

```
StationEngine.render(stationVersionId, attemptContext)
  1. Carga StationVersion + StationBlock[] (ordenados) desde Prisma.
  2. Por cada StationBlock, resuelve su `type` contra un registro de componentes
     (BlockRegistry: type → React component), pasando `config` (JSON) y el
     `ResponseSchema` correspondiente si el bloque captura respuesta.
  3. Los bloques de captura reportan cambios a un `AttemptStateStore` que
     dispara autosave (debounced) hacia POST /api/attempts/:id/responses.
  4. El temporizador se calcula desde `StationAttempt.expiresAt` (servidor),
     no desde un contador local — recargar la página no lo reinicia.
  5. Al enviar, el motor congela el `stationVersionId` usado en el intento
     (ya estaba fijado desde el inicio del intento, no desde la versión
     "publicada actual" de la estación).
```

Ningún bloque conoce a qué estación pertenece: son componentes puros `(config, value, onChange) => JSX`. Esto garantiza el aislamiento de la regla #22: modificar la configuración de E5 sólo cambia las filas de `StationBlock` de esa `StationVersion`, nunca el código compartido.

## 12. JSON Schema de ejemplo (Estación E2)

```json
{
  "stationCode": "E2",
  "version": 3,
  "status": "PUBLISHED",
  "durationSeconds": 720,
  "competencyCodes": ["DISENA_CURRICULUM"],
  "blocks": [
    { "type": "instructions", "config": { "text": "Instrucciones de la estación..." } },
    { "type": "scenario", "config": { "text": "Extracto de planeación con un RA por ajustar." } },
    { "type": "richText", "config": { "html": "<p>Contexto adicional...</p>" } },
    {
      "type": "textResponse",
      "config": { "label": "RA ajustado", "maxLength": 600 },
      "responseSchema": { "kind": "text", "required": true }
    },
    {
      "type": "audioRecorder",
      "config": { "minSeconds": 60, "maxSeconds": 180, "label": "Explique y justifique su RA" },
      "responseSchema": { "kind": "audio", "required": true }
    },
    { "type": "checklist", "config": { "items": ["Revisé mi propuesta", "Grabé mi audio"] } }
  ],
  "rubricVersionId": "rubric-diseno-curriculum-v2",
  "aiEvaluationConfigId": "ai-config-diseno-curriculum-v1"
}
```

## 13. Estrategia de versionado

* Una `Station` nunca se edita en sitio una vez que tiene una `StationVersion` con status `PUBLISHED` y aplicaciones asociadas.
* Editar genera una nueva fila `StationVersion` (`versionNumber + 1`, `status = DRAFT`).
* Transiciones válidas: `DRAFT → REVIEW → PUBLISHED → ARCHIVED`, con `Restaurar versión` (clona una versión archivada como nuevo `DRAFT`).
* `StationAttempt.stationVersionId` es inmutable una vez creado: garantiza reproducibilidad — un cambio posterior a la estación no altera intentos ya iniciados.
* Lo mismo aplica a `RubricVersion` y a `AIConfig` (versionado independiente, referenciado por `AIEvaluation`).

## 14. Estructura de carpetas

```
eddoe-platform/
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts
├─ src/
│  ├─ app/
│  │  ├─ page.tsx                      (/ landing pública)
│  │  ├─ layout.tsx
│  │  ├─ globals.css
│  │  ├─ registro/{page.tsx, perfil/page.tsx, estado/page.tsx}
│  │  ├─ login/page.tsx
│  │  ├─ recuperar-acceso/page.tsx
│  │  ├─ mi-eddoe/page.tsx
│  │  ├─ admin/
│  │  │  ├─ layout.tsx
│  │  │  ├─ page.tsx
│  │  │  ├─ solicitudes/{page.tsx, [id]/page.tsx}
│  │  │  ├─ usuarios/page.tsx
│  │  │  └─ contenido/page.tsx
│  │  └─ api/
│  │     ├─ auth/[...nextauth]/route.ts
│  │     ├─ registro/route.ts
│  │     ├─ registro/[id]/route.ts
│  │     └─ admin/solicitudes/{route.ts, [id]/route.ts}
│  ├─ components/
│  │  ├─ ui/ (Button, Input, Card, Badge, Textarea, Select)
│  │  ├─ forms/DynamicField.tsx
│  │  └─ layout/{PublicHeader.tsx, AdminSidebar.tsx}
│  ├─ lib/
│  │  ├─ prisma.ts
│  │  ├─ auth.ts
│  │  ├─ rbac.ts
│  │  ├─ audit.ts
│  │  ├─ email.ts
│  │  ├─ ai/{AIProvider.ts, ManualEvaluationProvider.ts, GeminiProvider.ts, OpenAIProvider.ts}
│  │  ├─ station-engine/{StationEngine.ts, types.ts, blocks/registry.ts}
│  │  └─ registration/formSchema.ts
│  └─ types/next-auth.d.ts
├─ docs/ARCHITECTURE.md
├─ docker-compose.yml
├─ .env.example
├─ package.json
└─ README.md
```

## 15. APIs / endpoints (Fase 1)

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/api/public-content` | Contenido publicado de la landing | pública |
| POST | `/api/registro` | Crea `RegistrationRequest` (DRAFT) + envía verificación | pública |
| PATCH | `/api/registro/:id` | Completa perfil y envía (`SUBMITTED`) | token de verificación |
| GET | `/api/registro/:id` | Estado de la solicitud | token o sesión |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth (login/logout/sesión) | pública/sesión |
| GET | `/api/admin/solicitudes` | Lista/filtra solicitudes | `registration.review` |
| PATCH | `/api/admin/solicitudes/:id` | Aprobar/rechazar/pedir corrección | `registration.approve` |
| GET/PUT | `/api/admin/contenido` | Leer/editar `PublicContent` | `content.edit` |
| GET | `/api/admin/usuarios` | Lista de usuarios por rol | `user.manage` |

Todas las rutas `/admin/*` y `/api/admin/*` pasan por `requireRole()` en servidor (`src/lib/rbac.ts`), además de la sesión de NextAuth.

## 16. Componentes UI (Fase 1)

`Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Card`, `Badge`, `Alert`, `Table`, `Tabs` — estilo accesible (roles/labels ARIA, foco visible), Tailwind + tokens de color institucional. `DynamicField` interpreta un campo de `RegistrationFormSchema` (texto, select, checkbox, condicional) sin código nuevo por campo.

## 17. Pruebas necesarias

* **Unitarias**: reglas de RBAC (`rbac.ts`), transición de estados de `RegistrationRequest`, resolución de `RegistrationFormSchema` → validación Zod.
* **Integración**: `POST /api/registro` → fila creada; `PATCH /api/admin/solicitudes/:id` (approve) → crea `User` + `AuditEvent` + dispara `email.ts`.
* **E2E (Playwright)**: flujo completo visitante → registro → estado; flujo admin → login → aprobar solicitud → usuario creado.
* **Aislamiento** (regla #22, diferida a cuando existan varias `StationVersion`): test que publica una nueva versión de E5 y verifica que `StationVersion` de E1–E4 y E6 no cambian de `id` ni de contenido.

---

*Fuente de verdad estructural: `prisma/schema.prisma`. Este documento se actualiza si el esquema cambia.*
