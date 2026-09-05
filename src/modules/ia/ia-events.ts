export type ProgressEventEntry = {
  entradaId: string;
  fecha: Date;
  adjuntos: unknown;
  tarea: {
    tareaId: string;
    bodegaId: string;
    fincaId: string | null;
    fincaNombre: string | null;
    cuartelId: string | null;
    cuartelCodigo: string | null;
    hasCompletedAssignment: boolean;
  };
};

type ProgressEventFilters = {
  tipo?: string;
  campaniaId?: string;
  limit?: number;
};

type OperationalContext = {
  fincaId?: string;
  cuartelId?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeOperationalText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isCompleteValidation(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const missing = Array.isArray(value.missingRequired) ? value.missingRequired : [];
  const invalid = Array.isArray(value.invalidFields) ? value.invalidFields : [];
  return missing.length === 0 && invalid.length === 0 && Number(value.requiredTotal ?? 0) > 0;
}

export function extractCompletedProgressEvents(
  entries: readonly ProgressEventEntry[],
  filters: ProgressEventFilters = {},
): Array<Record<string, unknown>> {
  const seen = new Set<string>();
  const result: Array<Record<string, unknown>> = [];
  const limit = Math.max(1, filters.limit ?? 50);

  for (const entry of entries) {
    if (result.length >= limit || !entry.tarea.hasCompletedAssignment || !isRecord(entry.adjuntos)) {
      continue;
    }

    const payload = entry.adjuntos;
    const eventoTipo = typeof payload.eventoTipo === "string" ? payload.eventoTipo : null;
    if (payload.formato !== "traza.v1.progreso" || !eventoTipo || !isRecord(payload.draft)) continue;
    if (!isCompleteValidation(payload.validation)) continue;
    if (filters.tipo && eventoTipo !== filters.tipo) continue;

    const campaniaId =
      typeof payload.draft.campaniaId === "string"
        ? payload.draft.campaniaId
        : typeof payload.draft.campania_id === "string"
          ? payload.draft.campania_id
          : null;
    if (filters.campaniaId && campaniaId !== filters.campaniaId) continue;

    const dedupeKey = `${entry.tarea.tareaId}:${eventoTipo}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    result.push({
      ...payload.draft,
      source: "tarea_progreso",
      evento_tipo: eventoTipo,
      evento_id: entry.entradaId,
      entrada_id: entry.entradaId,
      tarea_id: entry.tarea.tareaId,
      fecha_registro: entry.fecha,
      bodega_id: entry.tarea.bodegaId,
      finca_id: entry.tarea.fincaId,
      cuartel_id: entry.tarea.cuartelId,
      campania_id: campaniaId,
      finca: entry.tarea.fincaId
        ? { finca_id: entry.tarea.fincaId, nombre_finca: entry.tarea.fincaNombre }
        : null,
      cuartel: entry.tarea.cuartelId
        ? { cuartel_id: entry.tarea.cuartelId, codigo_cuartel: entry.tarea.cuartelCodigo }
        : null,
    });
  }

  return result;
}

function eventTimestamp(event: Record<string, unknown>): number {
  const candidate = event.fecha ?? event.fecha_cosecha ?? event.fecha_registro ?? event.created_at;
  if (candidate instanceof Date) return candidate.getTime();
  if (typeof candidate === "string" || typeof candidate === "number") {
    const timestamp = new Date(candidate).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }
  return 0;
}

export function mergeEventsByDate(
  typedEvents: readonly Record<string, unknown>[],
  progressEvents: readonly Record<string, unknown>[],
  limit: number,
): Array<Record<string, unknown>> {
  return [...typedEvents, ...progressEvents]
    .sort((left, right) => eventTimestamp(right) - eventTimestamp(left))
    .slice(0, Math.max(1, limit));
}

const QUESTION_EVENT_KEYWORDS: Array<{ tipo: string; keywords: string[] }> = [
  { tipo: "riego", keywords: ["riego", "regado"] },
  { tipo: "cosecha", keywords: ["cosecha", "cosecho", "vendimia"] },
  { tipo: "aplicacion_fitosanitaria", keywords: ["aplico", "aplicacion", "fitosanitario", "fumigacion"] },
  { tipo: "fertilizacion", keywords: ["fertilizacion", "fertilizante", "abono"] },
  { tipo: "fenologia", keywords: ["fenologia", "brotacion", "floracion", "envero", "maduracion"] },
  { tipo: "monitoreo_plaga", keywords: ["plaga", "insecto"] },
  { tipo: "monitoreo_enfermedad", keywords: ["enfermedad", "mildiu", "oidio", "botrytis"] },
  { tipo: "precipitacion", keywords: ["precipitacion", "lluvia"] },
  { tipo: "analisis_suelo", keywords: ["analisis de suelo", "suelo"] },
];

export function inferEventTypeFromQuestion(question: string): string | undefined {
  const normalized = normalizeOperationalText(question);
  return QUESTION_EVENT_KEYWORDS.find(({ keywords }) =>
    keywords.some((keyword) => normalized.includes(keyword)),
  )?.tipo;
}

export function findMentionedOperationalContext(
  question: string,
  fincas: readonly { id: string; nombre: string }[],
  cuarteles: readonly { id: string; codigo: string; fincaId: string }[],
): OperationalContext {
  const normalizedQuestion = normalizeOperationalText(question);
  const cuartel = cuarteles.find(({ codigo }) => {
    const normalized = normalizeOperationalText(codigo);
    return normalized.length > 0 && normalizedQuestion.includes(normalized);
  });
  const finca = fincas.find(({ nombre }) => {
    const normalized = normalizeOperationalText(nombre);
    const withoutPrefix = normalized.replace(/^finca\s+/, "");
    return normalizedQuestion.includes(normalized) ||
      (withoutPrefix.length >= 4 && normalizedQuestion.includes(withoutPrefix));
  });

  const result: OperationalContext = {};
  if (finca) result.fincaId = finca.id;
  if (cuartel) {
    result.cuartelId = cuartel.id;
    result.fincaId ??= cuartel.fincaId;
  }
  return result;
}
