/**
 * Genera un documento Markdown a partir de un spec OpenAPI ya armado (openapi.ts / openapi-ia.ts).
 * No se mantiene a mano: se recalcula desde el spec en cada request, así que siempre está
 * al día con los paths/schemas que el spec realmente declara — actualizás openapi.ts y este
 * markdown cambia solo. Pensado para pegarse directo en un chat con un bot/IA.
 */

// Los specs reales (openapi.ts / openapi-ia.ts) se declaran con `as const`, así que todo es
// profundamente readonly con tipos literales, y no todos los endpoints usan exactamente las
// mismas claves (algunos ponen `example` en vez de `schema`, etc.). Estos tipos son deliberadamente
// laxos (index signatures + todo opcional) para poder aceptar cualquiera de esos specs sin fricción —
// esto es un formateador de documentación, no lógica de negocio.
type JsonSchema = { [key: string]: unknown };

type ParamObject = { name?: string; in?: string; required?: boolean; description?: string; schema?: JsonSchema; [key: string]: unknown };

type OperationObject = {
  summary?: string;
  description?: string;
  tags?: readonly string[];
  security?: readonly unknown[];
  parameters?: readonly ParamObject[];
  requestBody?: { required?: boolean; content?: Record<string, JsonSchema> };
  responses?: Record<string, { description?: string; content?: Record<string, JsonSchema>; [key: string]: unknown }>;
  [key: string]: unknown;
};

type OpenApiSpec = {
  info: { title: string; version: string; description?: string };
  servers?: readonly { url: string; description?: string }[];
  tags?: readonly { name: string; description?: string }[];
  security?: readonly unknown[];
  components?: { schemas?: Record<string, JsonSchema>; [key: string]: unknown };
  // Cada "path item" es un diccionario laxo: además de los métodos HTTP puede traer
  // claves como `servers` a nivel de path — se filtra por HTTP_METHODS al recorrerlo.
  paths: Record<string, Record<string, unknown>>;
};

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"] as const;

function resolveRef(schema: JsonSchema | undefined): string | null {
  if (!schema) return null;
  const ref = schema["$ref"];
  if (typeof ref === "string") return ref.split("/").pop() ?? null;
  return null;
}

/** Representación corta de un schema para no repetir el árbol completo en cada endpoint. */
function describeSchema(schema: JsonSchema | undefined, depth = 0): string {
  if (!schema) return "";
  const ref = resolveRef(schema);
  if (ref) return `[\`${ref}\`](#schema-${ref.toLowerCase()})`;

  if (schema.oneOf) {
    return `uno de: ${(schema.oneOf as JsonSchema[]).map((s) => describeSchema(s, depth)).join(" | ")}`;
  }

  const type = schema.type as string | undefined;
  if (type === "array") {
    return `${describeSchema(schema.items as JsonSchema, depth)}[]`;
  }
  if (type === "object" && schema.properties && depth < 1) {
    const props = schema.properties as Record<string, JsonSchema>;
    const required = new Set((schema.required as string[] | undefined) ?? []);
    const fields = Object.entries(props)
      .map(([key, propSchema]) => `${key}${required.has(key) ? "" : "?"}: ${describeSchema(propSchema, depth + 1)}`)
      .join(", ");
    return `{ ${fields} }`;
  }
  if (type === "object") return "object";

  const enumValues = schema.enum as unknown[] | undefined;
  if (enumValues) return enumValues.map((v) => JSON.stringify(v)).join(" | ");

  const nullable = schema.nullable ? " | null" : "";
  return `${type ?? "any"}${nullable}`;
}

/** Documenta un schema con nombre (usado en la sección "Modelos de datos"). */
function renderNamedSchema(name: string, schema: JsonSchema): string {
  const lines: string[] = [`### \`${name}\` {#schema-${name.toLowerCase()}}`];
  if (schema.description) lines.push("", schema.description as string);

  if (schema.oneOf) {
    lines.push("", "Discriminado — una de estas formas:");
    for (const variant of schema.oneOf as JsonSchema[]) {
      lines.push("", "```", describeSchema(variant, 0), "```");
    }
    return lines.join("\n");
  }

  if (schema.type === "array") {
    lines.push("", `Array de ${describeSchema(schema.items as JsonSchema, 0)}.`);
    return lines.join("\n");
  }

  const props = (schema.properties as Record<string, JsonSchema> | undefined) ?? {};
  const required = new Set((schema.required as string[] | undefined) ?? []);
  if (Object.keys(props).length > 0) {
    lines.push("", "| Campo | Tipo | Descripción |", "|---|---|---|");
    for (const [key, propSchema] of Object.entries(props)) {
      const label = required.has(key) ? key : `${key} (opcional)`;
      const desc = (propSchema.description as string | undefined) ?? "";
      lines.push(`| \`${label}\` | ${describeSchema(propSchema, 1)} | ${desc} |`);
    }
  }
  return lines.join("\n");
}

function renderParams(params: OperationObject["parameters"]): string {
  if (!params || params.length === 0) return "";
  const rows = params.map((p) => {
    const type = describeSchema(p.schema, 1);
    return `| \`${p.name}\` | ${p.in} | ${p.required ? "sí" : "no"} | ${type} | ${p.description ?? ""} |`;
  });
  return ["", "| Parámetro | En | Requerido | Tipo | Descripción |", "|---|---|---|---|---|", ...rows].join("\n");
}

function renderRequestBody(body: OperationObject["requestBody"]): string {
  if (!body?.content) return "";
  const jsonSchema = body.content["application/json"]?.schema as JsonSchema | undefined;
  if (jsonSchema) {
    return ["", `**Body** (${body.required ? "requerido" : "opcional"}, JSON):`, "", "```", describeSchema(jsonSchema, 0), "```"].join("\n");
  }
  const multipart = body.content["multipart/form-data"]?.schema as JsonSchema | undefined;
  if (multipart) {
    return ["", `**Body** (${body.required ? "requerido" : "opcional"}, \`multipart/form-data\`):`, "", "```", describeSchema(multipart, 0), "```"].join("\n");
  }
  return "";
}

function renderResponses(responses: OperationObject["responses"]): string {
  if (!responses) return "";
  const rows = Object.entries(responses).map(([status, resp]) => {
    const schema = resp.content?.["application/json"]?.schema as JsonSchema | undefined;
    const shape = schema ? describeSchema(schema, 0) : "";
    return `| ${status} | ${resp.description ?? ""} | ${shape} |`;
  });
  return ["", "**Respuestas:**", "", "| Status | Descripción | Forma |", "|---|---|---|", ...rows].join("\n");
}

/** Genera el Markdown completo a partir de un spec OpenAPI. */
export function generateApiMarkdown(spec: OpenApiSpec): string {
  const lines: string[] = [];
  const baseUrl = spec.servers?.[0]?.url ?? "";

  lines.push(`# ${spec.info.title}`, "");
  if (spec.info.description) lines.push(spec.info.description, "");
  lines.push(`Versión: \`${spec.info.version}\` — Base URL: \`${baseUrl}\``, "");
  lines.push(
    "Autenticación: `Authorization: Bearer <token>` (JWT) salvo que el endpoint indique explícitamente que es público.",
    "",
    "> Este documento se genera automáticamente a partir del spec OpenAPI del backend — no se edita a mano. Si un endpoint cambia, este archivo cambia solo.",
    "",
    "---",
    "",
  );

  // Agrupar paths por tag, preservando el orden de aparición.
  const byTag = new Map<string, Array<{ path: string; method: string; op: OperationObject }>>();
  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const method of HTTP_METHODS) {
      const op = methods[method] as OperationObject | undefined;
      if (!op) continue;
      const tag = op.tags?.[0] ?? "Sin categoría";
      if (!byTag.has(tag)) byTag.set(tag, []);
      byTag.get(tag)!.push({ path, method, op });
    }
  }

  const tagDescriptions = new Map((spec.tags ?? []).map((t) => [t.name, t.description]));

  lines.push("## Índice", "");
  for (const tag of byTag.keys()) {
    lines.push(`- [${tag}](#${tag.toLowerCase().replace(/[^a-z0-9]+/g, "-")})`);
  }
  lines.push("", "---", "");

  for (const [tag, entries] of byTag) {
    lines.push(`## ${tag}`, "");
    const tagDesc = tagDescriptions.get(tag);
    if (tagDesc) lines.push(tagDesc, "");

    for (const { path, method, op } of entries) {
      const isPublic = Array.isArray(op.security) && op.security.length === 0;
      lines.push(`### \`${method.toUpperCase()} ${baseUrl}${path}\``, "");
      if (op.summary) lines.push(`**${op.summary}**`, "");
      if (op.description) lines.push(op.description, "");
      if (isPublic) lines.push("_Público — no requiere autenticación._", "");

      const params = renderParams(op.parameters);
      if (params) lines.push(params, "");

      const body = renderRequestBody(op.requestBody);
      if (body) lines.push(body, "");

      const responses = renderResponses(op.responses);
      if (responses) lines.push(responses, "");
    }
    lines.push("---", "");
  }

  const schemas = spec.components?.schemas;
  if (schemas && Object.keys(schemas).length > 0) {
    lines.push("## Modelos de datos", "");
    for (const [name, schema] of Object.entries(schemas)) {
      lines.push(renderNamedSchema(name, schema), "");
    }
  }

  return lines.join("\n");
}
