import { PrismaClient, RoleCode } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ROLE_PERMISSIONS } from "../src/lib/rbac";
import { DEFAULT_REGISTRATION_FIELDS } from "../src/lib/registration/formSchema";

const prisma = new PrismaClient();

const STATIONS: Array<{ code: string; name: string; competencyCode: string; competencyName: string }> = [
  { code: "E1", name: "Enseñanza y facilitación del aprendizaje", competencyCode: "FACILITA_APRENDIZAJE", competencyName: "Facilita el aprendizaje" },
  { code: "E2", name: "Arquitectura de la clase: diseño con propósito", competencyCode: "DISENA_CURRICULUM", competencyName: "Diseña e implementa el currículum" },
  { code: "E3", name: "Diseño de Instrumentos para la Evaluación del Aprendizaje", competencyCode: "EVALUA", competencyName: "Evalúa el aprendizaje" },
  { code: "E4", name: "Transforma con evidencia: práctica docente informada", competencyCode: "INVESTIGA", competencyName: "Investiga" },
  { code: "E5", name: "Las tareas de Sofía", competencyCode: "GESTIONA", competencyName: "Gestiona procesos educativos" },
  { code: "E6", name: "Entorno de aprendizaje seguro y centrado en el alumno", competencyCode: "ES_PROFESIONAL", competencyName: "Es profesional" },
];

const PUBLIC_CONTENT: Array<{ key: string; type: string; value: unknown }> = [
  { key: "landing.hero.eyebrow", type: "text", value: "EDDOE" },
  { key: "landing.hero.title", type: "text", value: "Evaluación del Desempeño Docente Objetiva Estructurada" },
  { key: "landing.hero.tagline", type: "text", value: "Del ¿sabes enseñar? hacia: demuestra cómo enseñas" },
  {
    key: "landing.queEs",
    type: "richText",
    value:
      "La EDDOE (OSTE, por sus siglas en inglés) es una estrategia de evaluación basada en el modelo del examen clínico objetivo estructurado, diseñada para valorar de manera sistemática las competencias docentes en contextos simulados.",
  },
  {
    key: "landing.objetivo",
    type: "richText",
    value:
      "Fortalecer la calidad educativa de la Facultad de Medicina mediante una evaluación en línea, asíncrona, objetiva, masiva y estandarizada de las competencias docentes.",
  },
  { key: "landing.duracion", type: "text", value: "72 minutos (6 estaciones de 12 minutos + estación demo)" },
  {
    key: "landing.privacidad",
    type: "richText",
    value: "Tus datos se usan exclusivamente para fines de esta evaluación, conforme al aviso de privacidad institucional.",
  },
  {
    key: "landing.faq",
    type: "faqItem",
    value: [
      { question: "¿Quién debe presentar la EDDOE?", answer: "Personal docente frente a grupo de la Facultad de Medicina." },
      { question: "¿Cuántos intentos tengo?", answer: "Un intento por ciclo, en una sesión única y continua." },
    ],
  },
  { key: "evaluacion.videoUrl", type: "text", value: "https://www.youtube.com/watch?v=8IDETpXd8xY" },
  {
    key: "evaluacion.bienvenida",
    type: "richText",
    value: "Bienvenido(a) a tu Evaluación del Desempeño Docente Objetiva Estructurada. Antes de comenzar, revisa el video y las instrucciones generales.",
  },
  {
    key: "evaluacion.instrucciones",
    type: "richText",
    value: "Recorrerás una estación demo de práctica y seis estaciones. Cada una tiene un tiempo asignado; una vez iniciada una estación no podrás pausarla.",
  },
  {
    key: "evaluacion.creditos",
    type: "richText",
    value: "EDDOE — Secretaría de Educación Médica, Facultad de Medicina, UNAM.",
  },
];

async function main() {
  // Roles y permisos
  for (const code of Object.values(RoleCode)) {
    const role = await prisma.role.upsert({
      where: { code },
      update: {},
      create: { code, name: code },
    });

    for (const permCode of ROLE_PERMISSIONS[code]) {
      const permission = await prisma.permission.upsert({
        where: { code: permCode },
        update: {},
        create: { code: permCode },
      });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  // Usuario super admin inicial (cambiar contraseña tras primer login)
  const adminEmail = "admin@eddoe.local";
  const passwordHash = await bcrypt.hash("CambiaEstaContrasena!123", 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, passwordHash, emailVerified: new Date() },
  });
  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { code: "SUPER_ADMIN" } });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: superAdminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: superAdminRole.id },
  });

  // Formulario de registro (versión publicada)
  const existingSchema = await prisma.registrationFormSchema.findFirst({ where: { status: "PUBLISHED" } });
  if (!existingSchema) {
    await prisma.registrationFormSchema.create({
      data: {
        versionNumber: 1,
        status: "PUBLISHED",
        publishedAt: new Date(),
        fields: DEFAULT_REGISTRATION_FIELDS as any,
      },
    });
  }

  // Contenido público
  for (const item of PUBLIC_CONTENT) {
    await prisma.publicContent.upsert({
      where: { key: item.key },
      update: { value: item.value as any },
      create: { key: item.key, type: item.type, value: item.value as any },
    });
  }

  // Configuración del sistema
  await prisma.systemSetting.upsert({
    where: { key: "registrationApprovalMode" },
    update: {},
    create: { key: "registrationApprovalMode", value: "MANUAL" as any },
  });

  // Catálogo de competencias y estaciones
  for (const s of STATIONS) {
    await prisma.competency.upsert({
      where: { code: s.competencyCode },
      update: {},
      create: { code: s.competencyCode, name: s.competencyName },
    });
    await prisma.station.upsert({
      where: { code: s.code },
      update: { name: s.name },
      create: { code: s.code, name: s.name },
    });
  }

  // Estación Demo (práctica, no evaluada)
  await prisma.station.upsert({
    where: { code: "DEMO" },
    update: {},
    create: { code: "DEMO", name: "Estación demo" },
  });

  // Versión inicial (placeholder) de cada estación, para que el admin tenga
  // algo que editar desde /admin/estaciones y para poder armar el blueprint.
  const allStationCodes = ["DEMO", ...STATIONS.map((s) => s.code)];
  const stationVersionByCode: Record<string, string> = {};
  for (const code of allStationCodes) {
    const station = await prisma.station.findUniqueOrThrow({ where: { code } });
    let version = await prisma.stationVersion.findFirst({
      where: { stationId: station.id },
      orderBy: { versionNumber: "desc" },
    });
    if (!version) {
      version = await prisma.stationVersion.create({
        data: {
          stationId: station.id,
          versionNumber: 1,
          status: "PUBLISHED",
          durationSeconds: code === "DEMO" ? 180 : 720,
          objective: "Contenido pendiente de captura por el equipo académico.",
          publishedAt: new Date(),
        },
      });
    }
    stationVersionByCode[code] = version.id;
  }

  // Convocatoria y circuito (blueprint) inicial: demo + 6 estaciones en orden.
  let assessment = await prisma.assessment.findFirst({ where: { name: "EDDOE 2026" } });
  if (!assessment) {
    assessment = await prisma.assessment.create({ data: { name: "EDDOE 2026" } });
  }
  let blueprint = await prisma.assessmentBlueprint.findFirst({ where: { assessmentId: assessment.id } });
  if (!blueprint) {
    blueprint = await prisma.assessmentBlueprint.create({
      data: {
        assessmentId: assessment.id,
        versionNumber: 1,
        generalInstructions: "Circuito de estación demo más seis estaciones.",
      },
    });
    let order = 0;
    for (const code of allStationCodes) {
      await prisma.assessmentStation.create({
        data: {
          assessmentBlueprintId: blueprint.id,
          stationVersionId: stationVersionByCode[code]!,
          order,
          isDemo: code === "DEMO",
        },
      });
      order += 1;
    }
  }

  console.log("Seed completo. Admin:", adminEmail, "(contraseña temporal en este script — cámbiala).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
