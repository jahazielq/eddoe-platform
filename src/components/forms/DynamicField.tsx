"use client";

import type { RegistrationField } from "@/lib/registration/formSchema";
import { Input, Textarea, Select, Checkbox, Label, HelpText } from "@/components/ui/Field";

const OTRO = "Otro";

interface DynamicFieldProps {
  field: RegistrationField;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
  allValues: Record<string, unknown>;
}

function dependencyMatches(dependencyValue: unknown, expected: string | boolean): boolean {
  if (Array.isArray(dependencyValue)) return dependencyValue.includes(expected);
  return dependencyValue === expected;
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
    if (!dependencyMatches(dependencyValue, field.dependsOn.showWhenEquals)) return null;
  }

  const commonProps = {
    id: field.key,
    name: field.key,
    required: field.required,
  };

  const otroKey = `${field.key}__otro`;
  const selected: string[] = Array.isArray(value) ? value : [];

  function toggleOption(option: string, checked: boolean) {
    const next = checked ? [...selected, option] : selected.filter((o) => o !== option);
    onChange(field.key, next);
  }

  return (
    <div>
      {field.type !== "checkbox" && (
        <Label htmlFor={field.key} required={field.required}>
          {field.label}
        </Label>
      )}
      {field.helpText && field.type === "checkboxGroup" && <HelpText>{field.helpText}</HelpText>}

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
          {field.allowOther && <option value={OTRO}>Otro</option>}
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

      {field.type === "checkboxGroup" && (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
          {field.options?.map((opt) => (
            <Checkbox
              key={opt}
              id={`${field.key}__${opt}`}
              label={opt}
              checked={selected.includes(opt)}
              onChange={(e) => toggleOption(opt, e.target.checked)}
            />
          ))}
          {field.allowOther && (
            <Checkbox
              id={`${field.key}__otro-check`}
              label="Otro"
              checked={selected.includes(OTRO)}
              onChange={(e) => toggleOption(OTRO, e.target.checked)}
            />
          )}
        </div>
      )}

      {field.type === "checkboxGroup" && field.allowOther && selected.includes(OTRO) && (
        <div className="mt-2">
          <Label htmlFor={otroKey}>Especifique</Label>
          <Input
            id={otroKey}
            value={(allValues[otroKey] as string) ?? ""}
            onChange={(e) => onChange(otroKey, e.target.value)}
          />
        </div>
      )}

      {field.type === "select" && field.allowOther && value === OTRO && (
        <div className="mt-2">
          <Label htmlFor={otroKey}>Especifique</Label>
          <Input
            id={otroKey}
            value={(allValues[otroKey] as string) ?? ""}
            onChange={(e) => onChange(otroKey, e.target.value)}
          />
        </div>
      )}

      {field.helpText && field.type !== "checkboxGroup" && <HelpText>{field.helpText}</HelpText>}
    </div>
  );
}
