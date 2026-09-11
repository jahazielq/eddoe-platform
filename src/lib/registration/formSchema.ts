/**
 * Definición de campos del formulario de registro. El administrador
 * controla visibilidad, obligatoriedad y condicionalidad desde
 * `/admin/contenido` (o un editor dedicado en fase 2) editando esta
 * estructura almacenada en `RegistrationFormSchema.fields` — nunca
 * hardcodeada en el componente de formulario (regla #5).
 */
export type FieldType = "text" | "email" | "select" | "checkbox" | "checkboxGroup" | "number" | "textarea";

export interface RegistrationField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  visible: boolean;
  options?: string[]; // para "select" y "checkboxGroup"
  /** Si es true, "checkboxGroup"/"select" agregan la opción "Otro". */
  allowOther?: boolean;
  /**
   * Sólo se muestra si el campo `dependsOn` tiene ese valor (comparación
   * exacta) o, si es un checkboxGroup, si el arreglo lo incluye.
   */
  dependsOn?: { key: string; showWhenEquals: string | boolean };
  helpText?: string;
}

/** Configuración inicial (semilla) — ver prisma/seed.ts. */
export const DEFAULT_REGISTRATION_FIELDS: RegistrationField[] = [
  { key: "firstName", label: "Nombre(s)", type: "text", required: true, visible: true },
  { key: "lastNamePaterno", label: "Primer apellido", type: "text", required: true, visible: true },
  { key: "lastNameMaterno", label: "Segundo apellido", type: "text", required: false, visible: true },

  { key: "edad", label: "Edad (años)", type: "number", required: false, visible: true },
  {
    key: "genero",
    label: "Género",
    type: "select",
    required: false,
    visible: true,
    options: ["Masculino", "Femenino", "No binarie", "Prefiero no decir"],
  },
  { key: "antiguedad", label: "Años de antigüedad docente", type: "number", required: false, visible: true },

  {
    key: "gradoEstudios",
    label: "Grado máximo de estudios",
    type: "checkboxGroup",
    required: true,
    visible: true,
    allowOther: true,
    options: ["Licenciatura", "Maestría", "Doctorado", "Especialidad"],
    helpText: "Puede elegir más de una opción (por ejemplo, maestría y especialidad).",
  },
  {
    key: "formacionLicenciatura",
    label: "Escriba su formación profesional a nivel licenciatura",
    type: "text",
    required: true,
    visible: true,
    helpText: "Ej. Médico Cirujano",
  },

  {
    key: "nombramiento",
    label: "Nombramiento",
    type: "checkboxGroup",
    required: true,
    visible: true,
    allowOther: true,
    options: [
      "Ayudante de profesor",
      "Profesor de asignatura",
      "Profesor de carrera",
      "Profesor de tiempo completo",
      "Técnico académico",
    ],
    helpText: "Puede elegir más de una opción.",
  },

  { key: "rfc", label: "RFC con homoclave", type: "text", required: false, visible: true },
  { key: "numTrabajador", label: "Número de trabajador UNAM", type: "text", required: false, visible: true },

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

  {
    key: "correoAcceso",
    label: "Correo donde deseo recibir mis datos de acceso",
    type: "email",
    required: true,
    visible: true,
  },
];
