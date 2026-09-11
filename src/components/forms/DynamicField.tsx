"use client";

import type { RegistrationField } from "@/lib/registration/formSchema";
import { Input, Textarea, Select, Checkbox, Label, HelpText } from "@/components/ui/Field";

interface DynamicFieldProps {
  field: RegistrationField;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
  allValues: Record<string, unknown>;
}

/**
 * Renderiza un campo de `RegistrationFormSchema` sin conocer de antemano
 * cuáles campos existen (regla #5): agregar/quitar/reordenar preguntas es
 * un cambio de datos, no de código.
 */
export function DynamicField({ field, value, onChange, allValues }: DynamicFieldProps) {
  if (!field.visible) return null;

  if (field.dependsOn) {
    const dependencyValue = allValues[field.dependsOn.key];
    if (dependencyValue !== field.dependsOn.showWhenEquals) return null;
  }

  const commonProps = {
    id: field.key,
    name: field.key,
    required: field.required,
  };

  return (
    <div>
      {field.type !== "checkbox" && <Label htmlFor={field.key} required={field.required}>{field.label}</Label>}

      {field.type === "text" && (
        <Input {...commonProps} type="text" value={(value as string) ?? ""} onChange={(e) => onChange(field.key, e.target.value)} />
      )}

      {field.type === "email" && (
        <Input {...commonProps} type="email" value={(value as string) ?? ""} onChange={(e) => onChange(field.key, e.target.value)} />
      )}

      {field.type === "number" && (
        <Input
          {...commonProps}
          type="number"
          value={(value as number) ?? ""}
          onChange={(e) => onChange(field.key, e.target.value === "" ? "" : Number(e.target.value))}
        />
      )}

      {field.type === "textarea" && (
        <Textarea {...commonProps} value={(value as string) ?? ""} onChange={(e) => onChange(field.key, e.target.value)} />
      )}

      {field.type === "select" && (
        <Select {...commonProps} value={(value as string) ?? ""} onChange={(e) => onChange(field.key, e.target.value)}>
          <option value="" disabled>
            Selecciona una opción
          </option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </Select>
      )}

      {field.type === "checkbox" && (
        <Checkbox
          {...commonProps}
          label={field.label}
          checked={Boolean(value)}
          onChange={(e) => onChange(field.key, e.target.checked)}
        />
      )}

      {field.helpText && <HelpText>{field.helpText}</HelpText>}
    </div>
  );
}
