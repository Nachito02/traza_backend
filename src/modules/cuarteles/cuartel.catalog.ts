export type TipoVariedadVid = "tinta" | "blanca" | "rosada";

const VARIEDADES_VID: Record<string, TipoVariedadVid> = {
  malbec: "tinta",
  bonarda: "tinta",
  cabernet_sauvignon: "tinta",
  syrah: "tinta",
  merlot: "tinta",
  tempranillo: "tinta",
  pinot_noir: "tinta",
  sangiovese: "tinta",
  aspiran_bouschet: "tinta",
  pedro_gimenez: "blanca",
  torrontes_riojano: "blanca",
  torrontes_sanjuanino: "blanca",
  chardonnay: "blanca",
  sauvignon_blanc: "blanca",
  chenin: "blanca",
  semillon: "blanca",
  viognier: "blanca",
  ugni_blanc: "blanca",
  cereza: "rosada",
  criolla_grande: "rosada",
  moscatel_rosado: "rosada",
};

export const TIPO_VARIEDAD_VALUES = ["tinta", "blanca", "rosada"] as const;
export const VARIEDAD_VALUES = Object.keys(VARIEDADES_VID);
export const MANEJO_CULTIVO_VALUES = [
  "convencional",
  "organico_ecologico",
  "regenerativo",
  "labranza_cero_cobertura_vegetal",
  "biodinamica",
] as const;
export const SISTEMA_RIEGO_VALUES = [
  "goteo",
  "surco",
  "aspersion",
  "microaspersion",
  "secano",
] as const;
export const SISTEMA_CONDUCCION_VALUES = [
  "espaldera",
  "parral",
  "vaso",
  "guyot",
  "cordon_bilateral_doble_cordon",
  "cordon_unilateral",
] as const;

function slugCatalogValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizeCultivo(value: unknown) {
  if (value === undefined || value === null || value === "") return "Vid";
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase() === "vid" ? "Vid" : value.trim();
}

export function isValidCultivo(value: string) {
  return value === "Vid";
}

export function normalizeTipoVariedad(value: unknown): TipoVariedadVid | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return TIPO_VARIEDAD_VALUES.includes(normalized as TipoVariedadVid)
    ? (normalized as TipoVariedadVid)
    : null;
}

export function isValidVariedad(value: unknown) {
  return typeof value === "string" && VARIEDAD_VALUES.includes(value.trim());
}

export function normalizeVariedad(value: unknown) {
  if (typeof value !== "string") return "";
  const normalized = slugCatalogValue(value);
  if (normalized === "aspirant_bouschet") return "aspiran_bouschet";
  if (normalized === "pedro_jimenez") return "pedro_gimenez";
  return normalized;
}

export function normalizeManejoCultivo(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return "";
  const normalized = slugCatalogValue(value);
  if (normalized === "organico" || normalized === "ecologico") return "organico_ecologico";
  if (normalized === "organico_ecologico") return "organico_ecologico";
  if (normalized === "viticultura_regenerativa") return "regenerativo";
  if (normalized === "labranza_cero" || normalized === "cobertura_vegetal") {
    return "labranza_cero_cobertura_vegetal";
  }
  if (normalized === "labranza_cero_cobertura_vegetal") return normalized;
  if (normalized === "biodinamico") return "biodinamica";
  return normalized;
}

export function isValidManejoCultivo(value: unknown) {
  return (
    value === null ||
    (typeof value === "string" &&
      MANEJO_CULTIVO_VALUES.includes(value as (typeof MANEJO_CULTIVO_VALUES)[number]))
  );
}

export function normalizeSistemaRiego(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return "";
  const normalized = slugCatalogValue(value);
  if (normalized === "aspersión") return "aspersion";
  if (normalized === "micro_aspersion") return "microaspersion";
  return normalized;
}

export function isValidSistemaRiego(value: unknown) {
  return (
    value === null ||
    (typeof value === "string" &&
      SISTEMA_RIEGO_VALUES.includes(value as (typeof SISTEMA_RIEGO_VALUES)[number]))
  );
}

export function normalizeSistemaConduccion(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return "";
  const normalized = slugCatalogValue(value);
  if (normalized === "doble_cordon" || normalized === "cordon_bilateral") {
    return "cordon_bilateral_doble_cordon";
  }
  if (normalized === "gobelet") return "vaso";
  return normalized;
}

export function isValidSistemaConduccion(value: unknown) {
  return (
    value === null ||
    (typeof value === "string" &&
      SISTEMA_CONDUCCION_VALUES.includes(value as (typeof SISTEMA_CONDUCCION_VALUES)[number]))
  );
}

export function getTipoVariedadForVariedad(value: string): TipoVariedadVid {
  const tipo = VARIEDADES_VID[value];
  if (!tipo) {
    throw new Error(`Variedad fuera de catalogo: ${value}`);
  }
  return tipo;
}
