export type FieldType = "string" | "number" | "date" | "boolean";

export type EventoSchemaField = {
  type: FieldType;
  required: boolean;
  enum?: string[];
  unit?: string;
  description?: string;
};

export type EventoInputSchema = Record<string, EventoSchemaField>;

export type PlantillaCampo = {
  campo: string;
  type: FieldType;
  enum?: string[];
  unit?: string;
  description?: string;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isFieldType(value: unknown): value is FieldType {
  return value === "string" || value === "number" || value === "date" || value === "boolean";
}

function normalizeField(field: unknown): { key: string; value: EventoSchemaField } | null {
  if (!isPlainObject(field)) return null;
  if (typeof field.campo !== "string" || !field.campo.trim()) return null;
  if (!isFieldType(field.type)) return null;

  const out: EventoSchemaField = {
    type: field.type,
    required: Boolean(field.required),
  };

  if (Array.isArray(field.enum)) {
    out.enum = field.enum.filter((v): v is string => typeof v === "string" && v.length > 0);
  }
  if (typeof field.unit === "string" && field.unit.trim()) out.unit = field.unit.trim();
  if (typeof field.description === "string" && field.description.trim()) out.description = field.description.trim();

  return { key: field.campo.trim(), value: out };
}

export function schemaFromProcesoTemplate(plantilla: unknown): EventoInputSchema | null {
  if (!isPlainObject(plantilla)) return null;

  // Formato nuevo: { version, campos: [{ campo, type, required, ... }] }
  if (Array.isArray(plantilla.campos)) {
    const schema: EventoInputSchema = {};
    for (const field of plantilla.campos) {
      const normalized = normalizeField(field);
      if (normalized) schema[normalized.key] = normalized.value;
    }
    return Object.keys(schema).length > 0 ? schema : null;
  }

  // Formato legacy: { fecha: { type, required, ... }, ... }
  const maybeLegacy: EventoInputSchema = {};
  for (const [key, value] of Object.entries(plantilla)) {
    if (!isPlainObject(value) || !isFieldType(value.type) || typeof value.required !== "boolean") continue;
    const field: EventoSchemaField = {
      type: value.type,
      required: value.required,
    };
    if (Array.isArray(value.enum)) {
      field.enum = value.enum.filter((v): v is string => typeof v === "string" && v.length > 0);
    }
    if (typeof value.unit === "string" && value.unit.trim()) field.unit = value.unit.trim();
    if (typeof value.description === "string" && value.description.trim()) field.description = value.description.trim();
    maybeLegacy[key] = field;
  }

  return Object.keys(maybeLegacy).length > 0 ? maybeLegacy : null;
}

export function schemaToCampos(schema: EventoInputSchema | null) {
  const camposObligatorios: PlantillaCampo[] = [];
  const camposOpcionales: PlantillaCampo[] = [];
  if (!schema) return { camposObligatorios, camposOpcionales };

  for (const [campo, rules] of Object.entries(schema)) {
    const field: PlantillaCampo = {
      campo,
      type: rules.type,
    };
    if (rules.enum !== undefined) field.enum = rules.enum;
    if (rules.unit !== undefined) field.unit = rules.unit;
    if (rules.description !== undefined) field.description = rules.description;
    if (rules.required) camposObligatorios.push(field);
    else camposOpcionales.push(field);
  }

  return { camposObligatorios, camposOpcionales };
}
