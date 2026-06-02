import { prisma } from "../../config/prismaClient.js";
import {
  canManageBodega,
  hasAnyFincaRole,
  isSystemAdmin,
} from "../auth/scope-permissions.service.js";

type CreateTareaInput = {
  bodegaId: string;
  procesoId: string;
  fincaId?: string;
  cuartelId?: string;
  descripcion?: string;
  fechaFin?: string;
  prioridad?: string;
  imagenCid?: string;
  imagenUrl?: string;
  assigneeUserIds?: string[];
};

type UpdateTareaAsignacionEstadoInput = {
  tareaAsignacionId: string;
  userId: string;
  estado: "pendiente" | "en_progreso" | "completado" | "cancelado";
  observaciones?: string;
};

type TareaEntradaDraft = Record<string, unknown>;

export class TareaError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// Tipos que exigen finca + cuartel (actividad puntual sobre un cuartel concreto).
const FINCA_PRODUCCION_EVENT_TYPES = new Set([
  "riego",
  "cosecha",
  "fenologia",
  "fertilizacion",
  "labor_suelo",
  "canopia",
  "aplicacion_fitosanitaria",
  "monitoreo_enfermedad",
  "monitoreo_plaga",
  "analisis_suelo",
  "precipitacion",
]);

// Tipos que exigen al menos una finca (el cuartel es opcional).
const FINCA_REQUERIDA_EVENT_TYPES = new Set([
  "enmienda",
  "inventario_insumos",
  "energia",
  "cobertura_erosion",
  "limpieza_cosecha",
  "mantenimiento",
  "residuo",
  "sanitizacion_banos",
  "sobrante_lavado",
  "origen_unidad_productiva",
  "entrega_epp",
  "accidente",
  "capacitacion",
  "no_conforme",
  "reclamo",
]);

type FincaRequirement = "finca_cuartel" | "finca" | "none";

function resolveFincaRequirement(eventoTipo: string | null | undefined): FincaRequirement {
  const tipo = String(eventoTipo ?? "").toLowerCase().trim();
  if (FINCA_PRODUCCION_EVENT_TYPES.has(tipo)) return "finca_cuartel";
  if (FINCA_REQUERIDA_EVENT_TYPES.has(tipo)) return "finca";
  return "none";
}

async function ensureCanManageBodega(userId: string, bodegaId: string) {
  const ok = await canManageBodega(userId, bodegaId);
  if (!ok) {
    throw new TareaError("No autorizado para administrar esta bodega", 403);
  }
}

async function ensureCanManageTareaScope(userId: string, bodegaId: string, fincaId?: string) {
  const [isAdminSistema, canManageBodegaRole] = await Promise.all([
    isSystemAdmin(userId),
    canManageBodega(userId, bodegaId),
  ]);
  if (isAdminSistema || canManageBodegaRole) return;

  if (fincaId) {
    const hasFincaManagerRole = await hasAnyFincaRole(userId, fincaId, ["encargado_finca"]);
    if (hasFincaManagerRole) return;
  }

  throw new TareaError("No autorizado para administrar este alcance", 403);
}

async function ensureUsersBelongToBodega(userIds: string[], bodegaId: string) {
  if (userIds.length === 0) return;
  const rows = await prisma.userBodega.findMany({
    where: {
      bodega_id: bodegaId,
      user_id: { in: userIds },
    },
    select: { user_id: true },
  });
  const allowed = new Set(rows.map((row) => row.user_id));
  const invalid = userIds.filter((id) => !allowed.has(id));
  if (invalid.length > 0) {
    throw new TareaError("Hay usuarios asignados fuera de la bodega", 400);
  }
}

async function ensureValidFincaTarget(input: {
  bodegaId: string;
  fincaId?: string | undefined;
  cuartelId?: string | undefined;
  requirement: FincaRequirement;
}) {
  // 1. Exigencia mínima según el tipo de evento.
  if (input.requirement === "finca_cuartel" && (!input.fincaId || !input.cuartelId)) {
    throw new TareaError("Esta tarea requiere finca y cuartel", 400);
  }
  if (input.requirement === "finca" && !input.fincaId) {
    throw new TareaError("Esta tarea requiere al menos una finca", 400);
  }

  // 2. No se puede indicar un cuartel sin su finca.
  if (input.cuartelId && !input.fincaId) {
    throw new TareaError("Para indicar un cuartel se requiere también la finca", 400);
  }

  // 3. Coherencia con la bodega.
  if (input.fincaId && input.cuartelId) {
    const cuartel = await prisma.cuartel.findFirst({
      where: {
        cuartel_id: input.cuartelId,
        finca_id: input.fincaId,
        finca: { bodega_id: input.bodegaId },
      },
      select: { cuartel_id: true },
    });
    if (!cuartel) {
      throw new TareaError("El cuartel seleccionado no pertenece a la finca/bodega indicada", 400);
    }
  } else if (input.fincaId) {
    const finca = await prisma.finca.findFirst({
      where: { finca_id: input.fincaId, bodega_id: input.bodegaId },
      select: { finca_id: true },
    });
    if (!finca) {
      throw new TareaError("La finca seleccionada no pertenece a la bodega indicada", 400);
    }
  }
}

function parseRequiredDate(value: unknown, label: string) {
  const date = new Date(String(value ?? "").trim());
  if (Number.isNaN(date.getTime())) {
    throw new TareaError(`${label} inválida`, 400);
  }
  return date;
}

function parsePositiveNumber(value: unknown, label: string) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    throw new TareaError(`${label} debe ser mayor a cero`, 400);
  }
  return numberValue;
}

function parseRequiredString(value: unknown, label: string) {
  const text = String(value ?? "").trim();
  if (!text) {
    throw new TareaError(`${label} requerido`, 400);
  }
  return text;
}

function parseOptionalString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s || null;
}

function parseOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// ── Contexto de tarea ────────────────────────────────────────────────────────

type TareaContext = {
  tarea_id: string;
  bodega_id: string;
  finca_id: string | null;
  cuartel_id: string | null;
  evento_tipo: string;
};

async function loadTareaContext(tareaId: string): Promise<TareaContext> {
  const tarea = await prisma.tarea.findUnique({
    where: { tarea_id: tareaId },
    select: {
      tarea_id: true,
      bodega_id: true,
      finca_id: true,
      cuartel_id: true,
      protocolo_proceso: { select: { evento_tipo: true } },
    },
  });
  if (!tarea) throw new TareaError("Tarea no encontrada", 404);
  return {
    tarea_id: tarea.tarea_id,
    bodega_id: tarea.bodega_id,
    finca_id: tarea.finca_id,
    cuartel_id: tarea.cuartel_id,
    evento_tipo: String(tarea.protocolo_proceso?.evento_tipo ?? "").toLowerCase().trim(),
  };
}

// Resuelve y valida una campaniaId desde el draft contra la bodega de la tarea
async function resolveCampania(
  campaniaId: unknown,
  bodegaId: string,
  required: true,
): Promise<string>;
async function resolveCampania(
  campaniaId: unknown,
  bodegaId: string,
  required?: false,
): Promise<string | null>;
async function resolveCampania(
  campaniaId: unknown,
  bodegaId: string,
  required = false,
): Promise<string | null> {
  const id = parseOptionalString(campaniaId);
  if (!id) {
    if (required) throw new TareaError("campaniaId requerido para este tipo de evento", 400);
    return null;
  }
  const campania = await prisma.campania.findFirst({
    where: { campania_id: id, bodega_id: bodegaId },
    select: { campania_id: true },
  });
  if (!campania) throw new TareaError("La campaña indicada no pertenece a la bodega de la orden", 400);
  return campania.campania_id;
}

// Valida que el cuartel de la tarea pertenece a la finca/bodega correcta
async function requireCuartelFinca(ctx: TareaContext): Promise<{ cuartel_id: string; finca_id: string }> {
  if (!ctx.cuartel_id || !ctx.finca_id) {
    throw new TareaError(`La orden de tipo "${ctx.evento_tipo}" requiere finca y cuartel asignados`, 400);
  }
  const cuartel = await prisma.cuartel.findFirst({
    where: {
      cuartel_id: ctx.cuartel_id,
      finca_id: ctx.finca_id,
      finca: { bodega_id: ctx.bodega_id },
    },
    select: { cuartel_id: true },
  });
  if (!cuartel) throw new TareaError("El cuartel de la orden no pertenece a la finca/bodega indicada", 400);
  return { cuartel_id: ctx.cuartel_id, finca_id: ctx.finca_id };
}

// ── Tipo de retorno genérico ─────────────────────────────────────────────────

type EventoMaterializado = {
  tipo: string;
  id: string;
  [key: string]: unknown;
};

// ── Materializadores por tipo de evento ─────────────────────────────────────

async function materializarCosecha(
  ctx: TareaContext,
  draft: TareaEntradaDraft,
  userId: string,
): Promise<EventoMaterializado> {
  const { cuartel_id } = await requireCuartelFinca(ctx);
  const campania_id = await resolveCampania(draft.campaniaId, ctx.bodega_id, true);

  const result = await prisma.eventoCosecha.create({
    data: {
      fecha_cosecha: parseRequiredDate(draft.fecha_cosecha, "Fecha de cosecha"),
      cuartel_id,
      campania_id,
      cantidad: parsePositiveNumber(draft.cantidad, "Cantidad"),
      unidad: parseRequiredString(draft.unidad, "Unidad"),
      destino: parseRequiredString(draft.destino, "Destino"),
      responsable_user_id: userId,
    },
    select: { lote_cosecha_id: true, fecha_cosecha: true, cantidad: true, unidad: true, destino: true },
  });
  return { tipo: "cosecha", id: result.lote_cosecha_id, ...result };
}

async function materializarRiego(
  ctx: TareaContext,
  draft: TareaEntradaDraft,
  userId: string,
): Promise<EventoMaterializado> {
  const { cuartel_id } = await requireCuartelFinca(ctx);
  const campania_id = await resolveCampania(draft.campaniaId, ctx.bodega_id, true);

  const result = await prisma.eventoRiego.create({
    data: {
      fecha: parseRequiredDate(draft.fecha, "Fecha"),
      cuartel_id,
      campania_id,
      volumen: parsePositiveNumber(draft.volumen, "Volumen"),
      unidad: parseRequiredString(draft.unidad, "Unidad"),
      tiempo_horas: parseOptionalNumber(draft.tiempo_horas),
      sistema_riego: parseOptionalString(draft.sistema_riego),
      responsable_user_id: parseOptionalString(draft.responsable_user_id) ?? userId,
    },
    select: { evento_riego_id: true, fecha: true, volumen: true, unidad: true },
  });
  return { tipo: "riego", id: result.evento_riego_id, ...result };
}

async function materializarFenologia(
  ctx: TareaContext,
  draft: TareaEntradaDraft,
  userId: string,
): Promise<EventoMaterializado> {
  const { cuartel_id } = await requireCuartelFinca(ctx);
  const campania_id = await resolveCampania(draft.campaniaId, ctx.bodega_id, true);

  const result = await prisma.eventoFenologia.create({
    data: {
      fecha: parseRequiredDate(draft.fecha, "Fecha"),
      cuartel_id,
      campania_id,
      estado_fenologico: parseRequiredString(draft.estado_fenologico, "Estado fenológico"),
      porcentaje_avance: parseOptionalNumber(draft.porcentaje_avance),
      responsable_user_id: parseOptionalString(draft.responsable_user_id) ?? userId,
    },
    select: { evento_fenologia_id: true, fecha: true, estado_fenologico: true },
  });
  return { tipo: "fenologia", id: result.evento_fenologia_id, ...result };
}

async function materializarFertilizacion(
  ctx: TareaContext,
  draft: TareaEntradaDraft,
  userId: string,
): Promise<EventoMaterializado> {
  const { cuartel_id } = await requireCuartelFinca(ctx);
  const campania_id = await resolveCampania(draft.campaniaId, ctx.bodega_id, true);

  const result = await prisma.eventoFertilizacion.create({
    data: {
      fecha: parseRequiredDate(draft.fecha, "Fecha"),
      cuartel_id,
      campania_id,
      dosis: parsePositiveNumber(draft.dosis, "Dosis"),
      unidad: parseRequiredString(draft.unidad, "Unidad"),
      metodo: parseOptionalString(draft.metodo),
      cantidad_total: parseOptionalNumber(draft.cantidad_total),
      insumo_id: parseOptionalString(draft.insumo_id),
      responsable_user_id: parseOptionalString(draft.responsable_user_id) ?? userId,
    },
    select: { evento_fertilizacion_id: true, fecha: true, dosis: true, unidad: true },
  });
  return { tipo: "fertilizacion", id: result.evento_fertilizacion_id, ...result };
}

async function materializarLaborSuelo(
  ctx: TareaContext,
  draft: TareaEntradaDraft,
  userId: string,
): Promise<EventoMaterializado> {
  const { cuartel_id } = await requireCuartelFinca(ctx);
  const campania_id = await resolveCampania(draft.campaniaId, ctx.bodega_id, true);

  const result = await prisma.eventoLaborSuelo.create({
    data: {
      fecha: parseRequiredDate(draft.fecha, "Fecha"),
      cuartel_id,
      campania_id,
      tipo_labor: parseRequiredString(draft.tipo_labor, "Tipo de labor"),
      intensidad: parseOptionalString(draft.intensidad),
      horas: parseOptionalNumber(draft.horas),
      hs_por_ha: parseOptionalNumber(draft.hs_por_ha),
      responsable_user_id: parseOptionalString(draft.responsable_user_id) ?? userId,
    },
    select: { evento_labor_suelo_id: true, fecha: true, tipo_labor: true },
  });
  return { tipo: "labor_suelo", id: result.evento_labor_suelo_id, ...result };
}

async function materializarCanopia(
  ctx: TareaContext,
  draft: TareaEntradaDraft,
  userId: string,
): Promise<EventoMaterializado> {
  const { cuartel_id } = await requireCuartelFinca(ctx);
  const campania_id = await resolveCampania(draft.campaniaId, ctx.bodega_id, true);

  const result = await prisma.eventoCanopia.create({
    data: {
      fecha: parseRequiredDate(draft.fecha, "Fecha"),
      cuartel_id,
      campania_id,
      tipo_practica: parseRequiredString(draft.tipo_practica, "Tipo de práctica"),
      intensidad: parseOptionalString(draft.intensidad),
      jornales: parseOptionalNumber(draft.jornales),
      observaciones: parseOptionalString(draft.observaciones),
      responsable_user_id: parseOptionalString(draft.responsable_user_id) ?? userId,
    },
    select: { evento_canopia_id: true, fecha: true, tipo_practica: true },
  });
  return { tipo: "canopia", id: result.evento_canopia_id, ...result };
}

async function materializarAplicacionFitosanitaria(
  ctx: TareaContext,
  draft: TareaEntradaDraft,
  userId: string,
): Promise<EventoMaterializado> {
  const { cuartel_id } = await requireCuartelFinca(ctx);
  const campania_id = await resolveCampania(draft.campaniaId, ctx.bodega_id, true);

  const carencia = parseOptionalNumber(draft.carencia_dias);
  if (carencia === null) throw new TareaError("carencia_dias requerido", 400);

  const result = await prisma.eventoAplicacionFitosanitaria.create({
    data: {
      fecha: parseRequiredDate(draft.fecha, "Fecha"),
      cuartel_id,
      campania_id,
      dosis: parsePositiveNumber(draft.dosis, "Dosis"),
      unidad: parseRequiredString(draft.unidad, "Unidad"),
      carencia_dias: carencia,
      motivo: parseOptionalString(draft.motivo),
      insumo_lote_id: parseOptionalString(draft.insumo_lote_id),
      responsable_user_id: parseOptionalString(draft.responsable_user_id) ?? userId,
    },
    select: { evento_fito_id: true, fecha: true, dosis: true, unidad: true, carencia_dias: true },
  });
  return { tipo: "aplicacion_fitosanitaria", id: result.evento_fito_id, ...result };
}

async function materializarMonitoreoEnfermedad(
  ctx: TareaContext,
  draft: TareaEntradaDraft,
  userId: string,
): Promise<EventoMaterializado> {
  const { cuartel_id } = await requireCuartelFinca(ctx);
  const campania_id = await resolveCampania(draft.campaniaId, ctx.bodega_id, true);

  const result = await prisma.eventoMonitoreoEnfermedad.create({
    data: {
      fecha: parseRequiredDate(draft.fecha, "Fecha"),
      cuartel_id,
      campania_id,
      enfermedad: parseRequiredString(draft.enfermedad, "Enfermedad"),
      incidencia: parseOptionalString(draft.incidencia),
      responsable_user_id: parseOptionalString(draft.responsable_user_id) ?? userId,
    },
    select: { evento_monitoreo_enfermedad_id: true, fecha: true, enfermedad: true },
  });
  return { tipo: "monitoreo_enfermedad", id: result.evento_monitoreo_enfermedad_id, ...result };
}

async function materializarMonitoreoPlaga(
  ctx: TareaContext,
  draft: TareaEntradaDraft,
  userId: string,
): Promise<EventoMaterializado> {
  const { cuartel_id } = await requireCuartelFinca(ctx);
  const campania_id = await resolveCampania(draft.campaniaId, ctx.bodega_id, true);

  const result = await prisma.eventoMonitoreoPlaga.create({
    data: {
      fecha: parseRequiredDate(draft.fecha, "Fecha"),
      cuartel_id,
      campania_id,
      plaga: parseRequiredString(draft.plaga, "Plaga"),
      nivel: parseOptionalString(draft.nivel),
      responsable_user_id: parseOptionalString(draft.responsable_user_id) ?? userId,
    },
    select: { evento_monitoreo_plaga_id: true, fecha: true, plaga: true },
  });
  return { tipo: "monitoreo_plaga", id: result.evento_monitoreo_plaga_id, ...result };
}

async function materializarAnalisisSuelo(
  ctx: TareaContext,
  draft: TareaEntradaDraft,
): Promise<EventoMaterializado> {
  const campania_id = await resolveCampania(draft.campaniaId, ctx.bodega_id);

  const parametros =
    draft.parametros && typeof draft.parametros === "object" && !Array.isArray(draft.parametros)
      ? (draft.parametros as import("../../generated/prisma/index.js").Prisma.InputJsonObject)
      : {};

  const result = await prisma.eventoAnalisisDeSuelo.create({
    data: {
      fecha: parseRequiredDate(draft.fecha, "Fecha"),
      ...(ctx.cuartel_id ? { cuartel_id: ctx.cuartel_id } : {}),
      ...(campania_id ? { campania_id } : {}),
      unidad_muestreada: parseRequiredString(draft.unidad_muestreada, "Unidad muestreada"),
      laboratorio: parseOptionalString(draft.laboratorio),
      parametros,
    },
    select: { evento_analisis_suelo_id: true, fecha: true, unidad_muestreada: true },
  });
  return { tipo: "analisis_suelo", id: result.evento_analisis_suelo_id, ...result };
}

async function materializarPrecipitacion(
  ctx: TareaContext,
  draft: TareaEntradaDraft,
): Promise<EventoMaterializado> {
  if (!ctx.finca_id) {
    throw new TareaError("La orden de precipitación requiere finca asignada", 400);
  }
  const campania_id = await resolveCampania(draft.campaniaId, ctx.bodega_id);

  const result = await prisma.eventoPrecipitacion.create({
    data: {
      fecha: parseRequiredDate(draft.fecha, "Fecha"),
      finca_id: ctx.finca_id,
      ...(campania_id ? { campania_id } : {}),
      milimetros: parsePositiveNumber(draft.milimetros, "Milímetros"),
    },
    select: { evento_precipitacion_id: true, fecha: true, milimetros: true },
  });
  return { tipo: "precipitacion", id: result.evento_precipitacion_id, ...result };
}

async function materializarEnergia(
  ctx: TareaContext,
  draft: TareaEntradaDraft,
): Promise<EventoMaterializado> {
  const campania_id = await resolveCampania(draft.campaniaId, ctx.bodega_id);

  // El schema usa "tipo_energia" pero la columna en DB es "tipo"
  const tipoEnergia = parseRequiredString(draft.tipo_energia ?? draft.tipo, "Tipo de energía");

  const result = await prisma.eventoEnergia.create({
    data: {
      periodo: parseRequiredString(draft.periodo, "Período"),
      tipo: tipoEnergia,
      consumo: parsePositiveNumber(draft.consumo, "Consumo"),
      unidad: parseRequiredString(draft.unidad, "Unidad"),
      ...(ctx.cuartel_id ? { cuartel_id: ctx.cuartel_id } : {}),
      ...(campania_id ? { campania_id } : {}),
    },
    select: { evento_energia_id: true, periodo: true, consumo: true, unidad: true },
  });
  return { tipo: "energia", id: result.evento_energia_id, tipo_energia: tipoEnergia, ...result };
}

// ── Dispatcher principal ─────────────────────────────────────────────────────

async function materializarEvento(
  tareaId: string,
  draft: TareaEntradaDraft,
  userId: string,
): Promise<EventoMaterializado | null> {
  const ctx = await loadTareaContext(tareaId);

  switch (ctx.evento_tipo) {
    case "cosecha":
      return materializarCosecha(ctx, draft, userId);
    case "riego":
      return materializarRiego(ctx, draft, userId);
    case "fenologia":
      return materializarFenologia(ctx, draft, userId);
    case "fertilizacion":
      return materializarFertilizacion(ctx, draft, userId);
    case "labor_suelo":
      return materializarLaborSuelo(ctx, draft, userId);
    case "canopia":
      return materializarCanopia(ctx, draft, userId);
    case "aplicacion_fitosanitaria":
      return materializarAplicacionFitosanitaria(ctx, draft, userId);
    case "monitoreo_enfermedad":
      return materializarMonitoreoEnfermedad(ctx, draft, userId);
    case "monitoreo_plaga":
      return materializarMonitoreoPlaga(ctx, draft, userId);
    case "analisis_suelo":
      return materializarAnalisisSuelo(ctx, draft);
    case "precipitacion":
      return materializarPrecipitacion(ctx, draft);
    case "energia":
      return materializarEnergia(ctx, draft);
    default:
      // Tipos sin tabla tipada aún (accidente, capacitacion, etc.)
      // el draft queda guardado en tareaEntrada.adjuntos como JSON
      return null;
  }
}

const tareaInclude = {
  finca: { select: { finca_id: true, nombre_finca: true } },
  cuartel: { select: { cuartel_id: true, codigo_cuartel: true } },
  tarea_asignacion: {
    include: {
      app_user: { select: { user_id: true, nombre: true, email: true } },
    },
  },
  protocolo_proceso: { select: { evento_tipo: true } },
};

export async function createTarea(input: CreateTareaInput, actorUserId: string) {
  if (!input.bodegaId || !input.procesoId) {
    throw new TareaError("bodegaId y procesoId son requeridos", 400);
  }
  await ensureCanManageTareaScope(actorUserId, input.bodegaId, input.fincaId);

  const proceso = await prisma.protocoloProceso.findUnique({
    where: { proceso_id: input.procesoId },
    select: { nombre: true, evento_tipo: true },
  });
  if (!proceso) {
    throw new TareaError("Proceso no encontrado", 404);
  }
  const fincaRequirement = resolveFincaRequirement(proceso.evento_tipo);
  await ensureValidFincaTarget({
    bodegaId: input.bodegaId,
    fincaId: input.fincaId,
    cuartelId: input.cuartelId,
    requirement: fincaRequirement,
  });

  const assigneeUserIds = Array.from(new Set(input.assigneeUserIds ?? []));
  await ensureUsersBelongToBodega(assigneeUserIds, input.bodegaId);

  const data: {
    bodega_id: string;
    proceso_id: string;
    finca_id?: string | null;
    cuartel_id?: string | null;
    created_by: string;
    titulo: string;
    prioridad: string;
    descripcion?: string | null;
    imagen_cid?: string | null;
    imagen_url?: string | null;
    fecha_fin?: Date | null;
    tarea_asignacion?: {
      createMany: {
        data: { user_id: string }[];
        skipDuplicates: boolean;
      };
    };
  } = {
    bodega_id: input.bodegaId,
    proceso_id: input.procesoId,
    created_by: actorUserId,
    titulo: proceso.nombre,
    prioridad: input.prioridad ?? "media",
  };
  if (input.fincaId !== undefined) {
    data.finca_id = input.fincaId;
  }
  if (input.cuartelId !== undefined) {
    data.cuartel_id = input.cuartelId;
  }
  if (input.descripcion !== undefined) {
    data.descripcion = input.descripcion;
  }
  if (input.imagenCid !== undefined) {
    data.imagen_cid = input.imagenCid;
  }
  if (input.imagenUrl !== undefined) {
    data.imagen_url = input.imagenUrl;
  }
  if (input.fechaFin) {
    data.fecha_fin = new Date(input.fechaFin);
  }
  if (assigneeUserIds.length > 0) {
    data.tarea_asignacion = {
      createMany: {
        data: assigneeUserIds.map((userId) => ({ user_id: userId })),
        skipDuplicates: true,
      },
    };
  }

  const tarea = await prisma.tarea.create({
    data,
    include: {
      finca: { select: { finca_id: true, nombre_finca: true } },
      cuartel: { select: { cuartel_id: true, codigo_cuartel: true } },
      tarea_asignacion: {
        include: { app_user: { select: { user_id: true, nombre: true, email: true, whatsapp_e164: true } } },
      },
    },
  });

  return tarea;
}

export async function listTareas(
  actorUserId: string,
  bodegaId?: string,
  fincaId?: string,
  soloPendientes = false,
) {
  const estadoFilter = soloPendientes
    ? { in: ["pendiente", "en_progreso"] as Array<"pendiente" | "en_progreso"> }
    : undefined;
  const isSystemAdminUser = await isSystemAdmin(actorUserId);
  if (isSystemAdminUser) {
    return prisma.tarea.findMany({
      where: {
        ...(bodegaId ? { bodega_id: bodegaId } : {}),
        ...(fincaId ? { finca_id: fincaId } : {}),
        ...(estadoFilter ? { estado: estadoFilter } : {}),
      },
      orderBy: [{ created_at: "desc" }],
      include: tareaInclude,
    });
  }

  const [managedBodegas, fincasAsignadas] = await Promise.all([
    prisma.userBodegaRol.findMany({
      where: { user_id: actorUserId, rol: { in: ["admin_bodega", "encargado_bodega"] } },
      select: { bodega_id: true },
    }),
    prisma.$queryRaw<Array<{ finca_id: string }>>`
      SELECT DISTINCT "finca_id"
      FROM "user_finca_rol"
      WHERE "user_id" = ${actorUserId}::uuid
    `,
  ]);

  const allowedBodegas = managedBodegas.map((m) => m.bodega_id);
  const allowedFincas = fincasAsignadas.map((f) => f.finca_id);

  if (allowedBodegas.length === 0 && allowedFincas.length === 0) {
    throw new TareaError("No autorizado para ver tareas", 403);
  }

  if (bodegaId) {
    const canSeeBodega =
      allowedBodegas.includes(bodegaId) ||
      (allowedFincas.length > 0 &&
        (await prisma.finca.count({
          where: {
            bodega_id: bodegaId,
            finca_id: { in: allowedFincas },
          },
        })) > 0);
    if (!canSeeBodega) {
      throw new TareaError("No autorizado para ver tareas de esta bodega", 403);
    }
  }

  const where = {
    ...(estadoFilter ? { estado: estadoFilter } : {}),
    ...(fincaId ? { finca_id: fincaId } : {}),
    ...(bodegaId ? { bodega_id: bodegaId } : {}),
    ...(bodegaId || fincaId
      ? {}
      : {
          OR: [
            ...(allowedBodegas.length > 0 ? [{ bodega_id: { in: allowedBodegas } }] : []),
            ...(allowedFincas.length > 0 ? [{ finca_id: { in: allowedFincas } }] : []),
          ],
        }),
  };

  return prisma.tarea.findMany({ where, orderBy: [{ created_at: "desc" }], include: tareaInclude });
}

export async function addTareaAsignaciones(
  tareaId: string,
  userIds: string[],
  actorUserId: string,
) {
  if (!tareaId || userIds.length === 0) {
    throw new TareaError("tareaId y userIds son requeridos", 400);
  }
  const tarea = await prisma.tarea.findUnique({
    where: { tarea_id: tareaId },
    select: { bodega_id: true },
  });
  if (!tarea) {
    throw new TareaError("Tarea no encontrada", 404);
  }
  await ensureCanManageTareaScope(actorUserId, tarea.bodega_id);

  const uniqueUserIds = Array.from(new Set(userIds));
  await ensureUsersBelongToBodega(uniqueUserIds, tarea.bodega_id);

  await prisma.tareaAsignacion.createMany({
    data: uniqueUserIds.map((userId) => ({
      tarea_id: tareaId,
      user_id: userId,
    })),
    skipDuplicates: true,
  });

  return prisma.tareaAsignacion.findMany({
    where: { tarea_id: tareaId },
    include: {
      app_user: {
        select: { user_id: true, nombre: true, email: true, whatsapp_e164: true },
      },
    },
    orderBy: { assigned_at: "asc" },
  });
}

export async function cancelTarea(tareaId: string, actorUserId: string) {
  if (!tareaId) {
    throw new TareaError("tareaId requerido", 400);
  }

  const tarea = await prisma.tarea.findUnique({
    where: { tarea_id: tareaId },
    select: { tarea_id: true, bodega_id: true, estado: true },
  });
  if (!tarea) {
    throw new TareaError("Tarea no encontrada", 404);
  }

  await ensureCanManageBodega(actorUserId, tarea.bodega_id);

  if (tarea.estado === "cancelado") {
    return prisma.tarea.findUnique({
      where: { tarea_id: tareaId },
      include: { tarea_asignacion: true },
    });
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.tarea.update({
      where: { tarea_id: tareaId },
      data: {
        estado: "cancelado",
        updated_at: now,
      },
    }),
    prisma.tareaAsignacion.updateMany({
      where: { tarea_id: tareaId },
      data: {
        estado: "cancelado",
        updated_at: now,
        completed_at: null,
      },
    }),
  ]);

  return prisma.tarea.findUnique({
    where: { tarea_id: tareaId },
    include: { tarea_asignacion: true },
  });
}

export async function completarTarea(tareaId: string, actorUserId: string) {
  if (!tareaId) {
    throw new TareaError("tareaId requerido", 400);
  }

  const tarea = await prisma.tarea.findUnique({
    where: { tarea_id: tareaId },
    select: { tarea_id: true, bodega_id: true, estado: true },
  });
  if (!tarea) {
    throw new TareaError("Tarea no encontrada", 404);
  }

  await ensureCanManageBodega(actorUserId, tarea.bodega_id);

  if (tarea.estado === "completado") {
    return prisma.tarea.findUnique({
      where: { tarea_id: tareaId },
      include: tareaInclude,
    });
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.tarea.update({
      where: { tarea_id: tareaId },
      data: { estado: "completado", updated_at: now },
    }),
    prisma.tareaAsignacion.updateMany({
      where: { tarea_id: tareaId, estado: { in: ["pendiente", "en_progreso"] } },
      data: { estado: "completado", updated_at: now, completed_at: now },
    }),
  ]);

  return prisma.tarea.findUnique({
    where: { tarea_id: tareaId },
    include: tareaInclude,
  });
}

export async function listMyTareaAsignaciones(userId: string) {
  return prisma.tareaAsignacion.findMany({
    where: { user_id: userId },
    include: {
      tarea: { include: tareaInclude },
    },
    orderBy: [{ assigned_at: "desc" }],
  });
}

export async function listMyPendientes(userId: string) {
  const estados = ["pendiente", "en_progreso"] as Array<
    "pendiente" | "en_progreso"
  >;
  return prisma.tareaAsignacion.findMany({
    where: {
      user_id: userId,
      estado: { in: estados },
    },
    include: {
      tarea: { include: tareaInclude },
    },
    orderBy: [{ assigned_at: "desc" }],
  });
}

export async function listPendientesByBodega(actorUserId: string, bodegaId: string) {
  return listTareas(actorUserId, bodegaId, undefined, true);
}

export async function updateMyTareaAsignacionEstado(input: UpdateTareaAsignacionEstadoInput) {
  const row = await prisma.tareaAsignacion.findUnique({
    where: { tarea_asignacion_id: input.tareaAsignacionId },
    include: {
      tarea: {
        select: {
          tarea_id: true,
          tarea_asignacion: {
            select: { estado: true },
          },
        },
      },
    },
  });
  if (!row) {
    throw new TareaError("Asignación no encontrada", 404);
  }
  if (row.user_id !== input.userId) {
    throw new TareaError("No autorizado", 403);
  }

  const data: {
    estado: "pendiente" | "en_progreso" | "completado" | "cancelado";
    updated_at: Date;
    completed_at: Date | null;
    observaciones?: string | null;
  } = {
    estado: input.estado,
    updated_at: new Date(),
    completed_at: input.estado === "completado" ? new Date() : null,
  };
  if (input.observaciones !== undefined) {
    data.observaciones = input.observaciones;
  }

  const updated = await prisma.tareaAsignacion.update({
    where: { tarea_asignacion_id: input.tareaAsignacionId },
    data,
  });

  const siblings = await prisma.tareaAsignacion.findMany({
    where: { tarea_id: row.tarea_id },
    select: { estado: true },
  });
  const allDone = siblings.length > 0 && siblings.every((s) => s.estado === "completado");
  const hasProgress = siblings.some((s) => s.estado === "en_progreso");

  await prisma.tarea.update({
    where: { tarea_id: row.tarea_id },
    data: {
      estado: allDone ? "completado" : hasProgress ? "en_progreso" : "pendiente",
      updated_at: new Date(),
    },
  });

  return updated;
}

export async function addTareaEntrada(input: {
  tareaAsignacionId: string;
  userId: string;
  descripcion?: string;
  adjuntos?: unknown;
  draft?: TareaEntradaDraft;
}) {
  const asignacion = await prisma.tareaAsignacion.findUnique({
    where: { tarea_asignacion_id: input.tareaAsignacionId },
    select: { tarea_id: true, user_id: true },
  });
  if (!asignacion) {
    throw new TareaError("Asignación no encontrada", 404);
  }
  const canManage = await canUserManageTareas(input.userId);
  if (asignacion.user_id !== input.userId && !canManage) {
    throw new TareaError("No autorizado", 403);
  }

  const evento = input.draft
    ? await materializarEvento(asignacion.tarea_id, input.draft, input.userId)
    : null;

  // Para cosecha mantenemos la referencia al lote en la descripción (compatibilidad)
  const cosechaId =
    evento?.tipo === "cosecha" ? (evento.lote_cosecha_id as string | undefined) ?? null : null;
  const descripcion =
    cosechaId && input.descripcion
      ? `${input.descripcion}\nlote_cosecha_id: ${cosechaId}`
      : input.descripcion;

  const entry = await prisma.tareaEntrada.create({
    data: {
      tarea_id: asignacion.tarea_id,
      created_by: input.userId,
      descripcion: descripcion ?? null,
      adjuntos: input.adjuntos ?? [],
    },
    select: {
      entrada_id: true,
      fecha: true,
      descripcion: true,
      adjuntos: true,
      app_user: { select: { user_id: true, nombre: true } },
    },
  });
  return {
    entradaId: entry.entrada_id,
    fecha: entry.fecha,
    descripcion: entry.descripcion,
    adjuntos: entry.adjuntos,
    creadoPor: entry.app_user,
    evento,
    // Alias de compatibilidad para cosecha
    eventoCosecha: evento?.tipo === "cosecha" ? evento : null,
    loteCosechaId: cosechaId,
  };
}

export async function listTareaEntradas(tareaAsignacionId: string, userId: string) {
  const asignacion = await prisma.tareaAsignacion.findUnique({
    where: { tarea_asignacion_id: tareaAsignacionId },
    select: { tarea_id: true, user_id: true },
  });
  if (!asignacion) throw new TareaError("Asignación no encontrada", 404);
  const canManage = await canUserManageTareas(userId);
  if (asignacion.user_id !== userId && !canManage) {
    throw new TareaError("No autorizado", 403);
  }
  const entries = await prisma.tareaEntrada.findMany({
    where: { tarea_id: asignacion.tarea_id },
    orderBy: { fecha: "asc" },
    select: {
      entrada_id: true,
      fecha: true,
      descripcion: true,
      adjuntos: true,
      app_user: { select: { user_id: true, nombre: true } },
    },
  });
  return entries.map((e) => ({
    entradaId: e.entrada_id,
    fecha: e.fecha,
    descripcion: e.descripcion,
    adjuntos: e.adjuntos,
    creadoPor: e.app_user,
  }));
}

type AdjuntoRecord = {
  cid: string;
  url: string;
  nombre: string;
  tipo: string;
  size: number;
};

/**
 * Updates the fecha (and optionally descripcion) of an existing tarea_entrada.
 * Only the creator or a manager can edit.
 */
export async function updateTareaEntrada(
  entradaId: string,
  userId: string,
  data: { fecha?: string; descripcion?: string },
) {
  const entrada = await prisma.tareaEntrada.findUnique({
    where: { entrada_id: entradaId },
    select: { entrada_id: true, created_by: true },
  });
  if (!entrada) throw new TareaError("Entrada no encontrada", 404);

  const canManage = await canUserManageTareas(userId);
  if (entrada.created_by !== userId && !canManage) {
    throw new TareaError("No autorizado para modificar esta entrada", 403);
  }

  const updateData: { fecha?: Date; descripcion?: string } = {};
  if (data.fecha) {
    const parsed = new Date(data.fecha);
    if (isNaN(parsed.getTime())) throw new TareaError("Fecha inválida", 400);
    updateData.fecha = parsed;
  }
  if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;

  const updated = await prisma.tareaEntrada.update({
    where: { entrada_id: entradaId },
    data: updateData,
    select: {
      entrada_id: true,
      fecha: true,
      descripcion: true,
      adjuntos: true,
      app_user: { select: { user_id: true, nombre: true } },
    },
  });

  return {
    entradaId: updated.entrada_id,
    fecha: updated.fecha,
    descripcion: updated.descripcion,
    adjuntos: updated.adjuntos,
    creadoPor: updated.app_user,
  };
}

/**
 * Appends an already-uploaded IPFS adjunto to a tarea_entrada's adjuntos JSON array.
 * The file upload itself is done by the controller (IPFS call) before this runs.
 */
export async function addAdjuntoToEntrada(
  entradaId: string,
  userId: string,
  adjunto: AdjuntoRecord,
) {
  const entrada = await prisma.tareaEntrada.findUnique({
    where: { entrada_id: entradaId },
    select: { entrada_id: true, created_by: true, adjuntos: true },
  });
  if (!entrada) throw new TareaError("Entrada no encontrada", 404);

  const canManage = await canUserManageTareas(userId);
  if (entrada.created_by !== userId && !canManage) {
    throw new TareaError("No autorizado para modificar esta entrada", 403);
  }

  const current: AdjuntoRecord[] = Array.isArray(entrada.adjuntos)
    ? (entrada.adjuntos as AdjuntoRecord[])
    : [];

  const updated = await prisma.tareaEntrada.update({
    where: { entrada_id: entradaId },
    data: { adjuntos: [...current, adjunto] },
    select: { entrada_id: true, adjuntos: true },
  });

  return updated;
}

export async function finalizarTareaAsignacion(tareaAsignacionId: string, userId: string) {
  const asignacion = await prisma.tareaAsignacion.findUnique({
    where: { tarea_asignacion_id: tareaAsignacionId },
    select: { tarea_id: true, user_id: true },
  });
  if (!asignacion) throw new TareaError("Asignación no encontrada", 404);
  const canManage = await canUserManageTareas(userId);
  if (asignacion.user_id !== userId && !canManage) {
    throw new TareaError("No autorizado", 403);
  }
  const updated = await prisma.tareaAsignacion.update({
    where: { tarea_asignacion_id: tareaAsignacionId },
    data: { estado: "completado", completed_at: new Date(), updated_at: new Date() },
  });
  await prisma.tarea.update({
    where: { tarea_id: asignacion.tarea_id },
    data: { estado: "completado", updated_at: new Date() },
  });
  return updated;
}

export async function canUserManageTareas(userId: string) {
  if (await isSystemAdmin(userId)) return true;
  const [bodegaRole, fincaRole] = await Promise.all([
    prisma.userBodegaRol.findFirst({
      where: { user_id: userId, rol: { in: ["admin_bodega", "encargado_bodega"] } },
      select: { user_id: true },
    }),
    prisma.$queryRaw<Array<{ user_id: string }>>`
      SELECT "user_id"
      FROM "user_finca_rol"
      WHERE "user_id" = ${userId}::uuid
        AND "rol" = 'encargado_finca'
      LIMIT 1
    `,
  ]);
  return Boolean(bodegaRole) || fincaRole.length > 0;
}
