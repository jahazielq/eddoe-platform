/**
 * Definición de campos del formulario de registro. El administrador
 * controla visibilidad, obligatoriedad y condicionalidad desde
 * `/admin/contenido` (o un editor dedicado en fase 2) editando esta
 * estructura almacenada en `RegistrationFormSchema.fields` — nunca
 * hardcodeada en el componente de formulario (regla #5).
 */
export type FieldType = "text" | "email" | "select" | "checkbox" | "number" | "textarea";

export interface RegistrationField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  visible: boolean;
  options?: string[]; // para "select"
  /** Sólo se muestra si el campo `dependsOn` tiene el valor `showWhenEquals`. */
  dependsOn?: { key: string; showWhenEquals: string | boolean };
  helpText?: string;
}

/** Configuración inicial (semilla) — ver prisma/seed.ts. */
export const DEFAULT_REGISTRATION_FIELDS: RegistrationField[] = [
  { key: "firstName", label: "Nombre(s)", type: "text", required: true, visible: true },
  { key: "lastNamePaterno", label: "Primer apellido", type: "text", required: true, visible: true },
  { key: "lastNameMaterno", label: "Segundo apellido", type: "text", required: false, visible: true },
  { key: "alternateEmail", label: "Correo alternativo", type: "email", required: false, visible: true },
  { key: "employeeNumber", label: "Número de trabajador o identificador institucional", type: "text", required: false, visible: true },
  { key: "profession", label: "Profesión / disciplina", type: "text", required: true, visible: true },
  {
    key: "academicDegree",
    label: "Grado académico",
    type: "select",
    required: true,
    visible: true,
    options: ["Licenciatura", "Maestría", "Doctorado", "Especialidad", "Otro"],
  },
  { key: "department", label: "Departamento o área", type: "text", required: false, visible: true },
  { key: "program", label: "Licenciatura / programa académico", type: "text", required: false, visible: true },
  { key: "subjectsTaught", label: "Asignatura(s) que imparte", type: "textarea", required: false, visible: true },
  { key: "campus", label: "Sede", type: "text", required: false, visible: true },
  { key: "yearsOfExperience", label: "Años de experiencia docente", type: "number", required: false, visible: true },
  {
    key: "teachingActivity",
    label: "Tipo de actividad docente",
    type: "select",
    required: true,
    visible: true,
    options: [
      "Ayudante de profesor",
      "Profesor de asignatura",
      "Profesor de carrera",
      "Profesor de tiempo completo",
      "Técnico académico",
      "Otro",
    ],
  },
  {
    key: "privacyAccepted",
    label: "Acepto el aviso de privacidad",
    type: "checkbox",
    required: true,
    visible: true,
  },
  {
    key: "termsAccepted",
    label: "Acepto las condiciones de participación",
    type: "checkbox",
    required: true,
    visible: true,
  },
];
