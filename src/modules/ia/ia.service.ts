import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prismaClient.js";
import { userHasAnyRole } from "../../middlewares/roles.middleware.js";
import {
  botAyudarCarga,
  botContactarAsignacion,
} from "../bot/bot.service.js";

type FieldSchema = {
  type: "string" | "number" | "date" | "boolean";
  required: boolean;
  enum?: string[];
  unit?: string;
  description?: string;
};

type EventoInputSchema = Record<string, FieldSchema>;
type ProgressDraft = Record<string, unknown>;

const EVENTO_TIPO_KEYWORDS: Array<{ tipo: string; keywords: string[] }> = [
  { tipo: "riego", keywords: ["riego"] },
  { tipo: "cosecha", keywords: ["cosecha", "vendimia"] },
  { tipo: "fenologia", keywords: ["fenolog", "brotac", "floraci", "envero", "maduraci", "poda", "dormanci"] },
  { tipo: "fertilizacion", keywords: ["fertiliz", "abono", "nutrici"] },
  { tipo: "aplicacion_fitosanitaria", keywords: ["fitosanitari", "fumigaci", "aplicaci", "pesticida", "herbicida", "fungicida", "insecticida"] },
  { tipo: "monitoreo_plaga", keywords: ["plaga", "insecto", "araña"] },
  { tipo: "monitoreo_enfermedad", keywords: ["enfermedad", "hongo", "mildiu", "oidio", "botrytis"] },
  { tipo: "analisis_suelo", keywords: ["suelo", "análisis de suelo", "analisis de suelo"] },
  { tipo: "precipitacion", keywords: ["precipitaci", "lluvia"] },
  { tipo: "labor_suelo", keywords: ["labor", "arado", "subsolado", "cincelado", "rastreo", "rotovator"] },
  { tipo: "canopia", keywords: ["canopia", "canopeo", "poda verde", "despunte", "deshoje", "aclareo", "amarre"] },
  { tipo: "energia", keywords: ["energia", "energía", "consumo energético", "electricidad", "gas"] },
  { tipo: "accidente", keywords: ["accidente"] },
  { tipo: "capacitacion", keywords: ["capacitaci", "capacitación", "formaci"] },
  { tipo: "entrega_epp", keywords: ["epp", "equipo de protecci"] },
  { tipo: "limpieza_cosecha", keywords: ["limpieza", "sanitizaci"] },
  { tipo: "mantenimiento", keywords: ["mantenimiento"] },
  { tipo: "no_conforme", keywords: ["no conforme", "no-conforme", "inconformidad"] },
  { tipo: "reclamo", keywords: ["reclamo", "queja"] },
  { tipo: "residuo", keywords: ["residuo", "envase", "desecho"] },
  { tipo: "sanitizacion_banos", keywords: ["baño", "bano", "sanitizaci"] },
  { tipo: "sobrante_lavado", keywords: ["sobrante", "lavado", "caldo"] },
];

function inferEventoTipo(titulo: string, descripcion?: string | null): string | null {
  const text = `${titulo} ${descripcion ?? ""}`.toLowerCase();
  for (const { tipo, keywords } of EVENTO_TIPO_KEYWORDS) {
    if (keywords.some((kw) => text.includes(kw))) {
      return tipo;
    }
  }
  return null;
}

const EVENTO_INPUT_SCHEMAS: Record<string, EventoInputSchema> = {
  riego: {
    fecha: { type: "date", required: true },
    volumen: { type: "number", required: true, unit: "m3" },
    unidad: { type: "string", required: true, enum: ["m3", "litros", "mm"] },
    sistema_riego: { type: "string", required: false, enum: ["goteo", "aspersion", "manto", "surco", "otro"] },
    responsable_persona_id: { type: "string", required: false, description: "UUID de la persona responsable" },
  },
  cosecha: {
    fecha_cosecha: { type: "date", required: true },
    cantidad: { type: "number", required: true },
    unidad: { type: "string", required: true, enum: ["kg", "ton", "bins"] },
    destino: { type: "string", required: false },
    responsable_persona_id: { type: "string", required: false, description: "UUID de la persona responsable" },
  },
  fenologia: {
    fecha: { type: "date", required: true },
    estado_fenologico: { type: "string", required: true, enum: ["brotacion", "floracion", "cuajado", "envero", "maduracion", "poda", "dormancia"] },
    porcentaje_avance: { type: "number", required: false, unit: "%" },
    responsable_persona_id: { type: "string", required: false, description: "UUID de la persona responsable" },
  },
  fertilizacion: {
    fecha: { type: "date", required: true },
    dosis: { type: "number", required: true },
    unidad: { type: "string", required: true, enum: ["kg/ha", "l/ha", "kg", "litros"] },
    insumo_id: { type: "string", required: false, description: "UUID del insumo" },
    cantidad_total: { type: "number", required: false },
    responsable_persona_id: { type: "string", required: false, description: "UUID de la persona responsable" },
  },
  labor_suelo: {
    fecha: { type: "date", required: true },
    tipo_labor: { type: "string", required: true, enum: ["arado", "subsolado", "cincelado", "rastreado", "rotovatado", "otro"] },
    horas: { type: "number", required: false },
    hs_por_ha: { type: "number", required: false },
    responsable_persona_id: { type: "string", required: false, description: "UUID de la persona responsable" },
  },
  canopia: {
    fecha: { type: "date", required: true },
    tipo_practica: { type: "string", required: true, enum: ["poda_verde", "despunte", "deshoje", "aclareo", "amarre", "otro"] },
    intensidad: { type: "string", required: false },
    jornales: { type: "number", required: false },
    observaciones: { type: "string", required: false },
    responsable_persona_id: { type: "string", required: false, description: "UUID de la persona responsable" },
  },
  aplicacion_fitosanitaria: {
    fecha: { type: "date", required: true },
    dosis: { type: "number", required: true },
    unidad: { type: "string", required: true, enum: ["cc/hl", "g/hl", "l/ha", "kg/ha"] },
    carencia_dias: { type: "number", required: true, description: "Días de carencia del producto" },
    insumo_lote_id: { type: "string", required: false, description: "UUID del lote de insumo" },
    motivo: { type: "string", required: false },
    responsable_persona_id: { type: "string", required: false, description: "UUID de la persona responsable" },
  },
  monitoreo_enfermedad: {
    fecha: { type: "date", required: true },
    enfermedad: { type: "string", required: true },
    incidencia: { type: "number", required: false, unit: "%", description: "Porcentaje de incidencia" },
    responsable_persona_id: { type: "string", required: false, description: "UUID de la persona responsable" },
  },
  monitoreo_plaga: {
    fecha: { type: "date", required: true },
    plaga: { type: "string", required: true },
    nivel: { type: "string", required: false, enum: ["bajo", "medio", "alto", "critico"] },
    responsable_persona_id: { type: "string", required: false, description: "UUID de la persona responsable" },
  },
  analisis_suelo: {
    fecha: { type: "date", required: true },
    unidad_muestreada: { type: "string", required: true },
    laboratorio: { type: "string", required: false },
    parametros: { type: "string", required: false, description: "JSON con los parámetros analizados (pH, N, P, K, etc.)" },
  },
  precipitacion: {
    fecha: { type: "date", required: true },
    milimetros: { type: "number", required: true, unit: "mm" },
  },
  energia: {
    periodo: { type: "string", required: true, description: "Ej: 2025-03" },
    tipo: { type: "string", required: true, enum: ["electrica", "gas", "gasoil", "otro"] },
    consumo: { type: "number", required: true },
    unidad: { type: "string", required: true, enum: ["kWh", "m3", "litros"] },
  },
  accidente: {
    fecha: { type: "date", required: true },
    persona_id: { type: "string", required: true, description: "UUID de la persona accidentada" },
    accion_correctiva: { type: "string", required: false },
  },
  capacitacion: {
    fecha: { type: "date", required: true },
    tema: { type: "string", required: true },
  },
  entrega_epp: {
    fecha: { type: "date", required: true },
    persona_id: { type: "string", required: true, description: "UUID de la persona receptora" },
    epp: { type: "string", required: true, description: "Descripción del EPP entregado" },
  },
  limpieza_cosecha: {
    fecha: { type: "date", required: true },
    elemento: { type: "string", required: true, description: "Elemento o equipo limpiado" },
    metodo: { type: "string", required: false },
    responsable_persona_id: { type: "string", required: false, description: "UUID de la persona responsable" },
  },
  mantenimiento: {
    fecha: { type: "date", required: true },
    equipo: { type: "string", required: true },
    tipo: { type: "string", required: true, enum: ["preventivo", "correctivo", "predictivo"] },
    responsable_persona_id: { type: "string", required: false, description: "UUID de la persona responsable" },
  },
  no_conforme: {
    fecha: { type: "date", required: true },
    descripcion: { type: "string", required: true },
  },
  reclamo: {
    fecha: { type: "date", required: true },
    origen: { type: "string", required: true },
    descripcion: { type: "string", required: false },
  },
  residuo: {
    fecha: { type: "date", required: true },
    tipo_residuo: { type: "string", required: true },
    destino: { type: "string", required: true },
    cantidad: { type: "number", required: false },
    unidad: { type: "string", required: false, enum: ["kg", "litros", "unidades", "bolsas"] },
    responsable_persona_id: { type: "string", required: false, description: "UUID de la persona responsable" },
  },
  sanitizacion_banos: {
    fecha: { type: "date", required: true },
    tipo_bano: { type: "string", required: true, enum: ["quimico", "convencional"] },
    responsable_persona_id: { type: "string", required: false, description: "UUID de la persona responsable" },
  },
  sobrante_lavado: {
    fecha: { type: "date", required: true },
    tipo: { type: "string", required: true, enum: ["caldo_fitosanitario", "agua_lavado", "otro"] },
    volumen: { type: "number", required: false, unit: "litros" },
    disposicion: { type: "string", required: false },
    responsable_persona_id: { type: "string", required: false, description: "UUID de la persona responsable" },
  },
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function matchesFieldType(value: unknown, type: FieldSchema["type"]) {
  switch (type) {
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "boolean":
      return typeof value === "boolean";
    case "date":
      return typeof value === "string" && isDateString(value);
    default:
      return false;
  }
}

function isMissingRequired(value: unknown) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  return false;
}

function validateDraftAgainstSchema(draft: ProgressDraft, schema: EventoInputSchema) {
  const missingRequired: string[] = [];
  const invalidFields: Array<{
    field: string;
    reason: string;
    expectedType: FieldSchema["type"];
    enum?: string[];
  }> = [];
  let requiredTotal = 0;
  let requiredPresent = 0;

  for (const [field, rules] of Object.entries(schema)) {
    const value = draft[field];
    if (rules.required) {
      requiredTotal += 1;
      if (isMissingRequired(value)) {
        missingRequired.push(field);
        continue;
      }
      requiredPresent += 1;
    } else if (value === null || value === undefined) {
      continue;
    }

    if (!matchesFieldType(value, rules.type)) {
      invalidFields.push({
        field,
        reason:
          rules.type === "date"
            ? "Debe ser fecha YYYY-MM-DD"
            : `Debe ser tipo ${rules.type}`,
        expectedType: rules.type,
        ...(rules.enum ? { enum: rules.enum } : {}),
      });
      continue;
    }

    if (rules.enum && typeof value === "string" && !rules.enum.includes(value)) {
      invalidFields.push({
        field,
        reason: "Valor fuera de catálogo permitido",
        expectedType: rules.type,
        enum: rules.enum,
      });
    }
  }

  return {
    missingRequired,
    invalidFields,
    requiredTotal,
    requiredPresent,
  };
}

const IA_VISIBLE_SCOPES = [
  "tareas.ver",
  "tareas.contactar",
  "tareas.cargar_datos",
  "tareas.resolver",
] as const;

type ListIaJobsFilters = {
  botUserId: string;
  estado?: string;
  bodegaId?: string;
};

type SubmitIaResultInput = {
  tareaAsignacionId: string;
  botUserId: string;
  estado: "pendiente" | "en_progreso" | "completado" | "cancelado";
  observaciones?: string;
  outputPayload?: unknown;
};

type IaCatalogFilter = {
  botUserId: string;
  bodegaId?: string;
};

type IaConsultaInput = {
  botUserId: string;
  pregunta: string;
  bodegaId?: string;
  trazabilidadId?: string;
  limit?: number;
};

export class IaError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function normalizePayload(payload: unknown) {
  if (payload === null) {
    return Prisma.JsonNull;
  }
  if (Array.isArray(payload)) {
    return payload as Prisma.InputJsonValue;
  }
  if (payload && typeof payload === "object") {
    return payload as Prisma.InputJsonValue;
  }
  if (typeof payload === "string" || typeof payload === "number" || typeof payload === "boolean") {
    return payload;
  }
  return {} as Prisma.InputJsonObject;
}

const iaAssignmentInclude = {
  app_user: {
    select: {
      user_id: true,
      nombre: true,
      email: true,
      whatsapp_e164: true,
    },
  },
  tarea: {
    include: {
      bodega: { select: { bodega_id: true, nombre: true } },
      finca: { select: { finca_id: true, nombre_finca: true } },
      cuartel: { select: { cuartel_id: true, codigo_cuartel: true } },
    },
  },
  bot_action_log: {
    orderBy: [{ created_at: "desc" }],
    take: 20,
  },
} satisfies Prisma.TareaAsignacionInclude;

type IaAssignment = Prisma.TareaAsignacionGetPayload<{
  include: typeof iaAssignmentInclude;
}>;

async function ensureBotUser(botUserId: string) {
  const user = await prisma.appUser.findUnique({
    where: { user_id: botUserId },
    select: { user_id: true, email: true, nombre: true },
  });
  if (!user) {
    throw new IaError("Usuario bot no encontrado", 404);
  }

  const isBot = await userHasAnyRole(botUserId, ["bot_agent", "admin_sistema"]);
  if (!isBot) {
    throw new IaError("El usuario no tiene permisos de bot", 403);
  }

  return user;
}

async function getActiveDelegations(botUserId: string, bodegaId?: string) {
  return prisma.botDelegation.findMany({
    where: {
      bot_user_id: botUserId,
      activo: true,
      revoked_at: null,
      AND: [
        { OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }] },
        ...(bodegaId ? [{ OR: [{ bodega_id: null }, { bodega_id: bodegaId }] }] : []),
      ],
    },
    include: {
      bodega: {
        select: { bodega_id: true, nombre: true },
      },
      granted_by_user: {
        select: { user_id: true, nombre: true, email: true },
      },
    },
    orderBy: [{ created_at: "desc" }],
  });
}

async function getVisibleBodegaIds(botUserId: string, requestedBodegaId?: string) {
  const delegations = await getActiveDelegations(botUserId, requestedBodegaId);
  if (delegations.length === 0) {
    return [];
  }

  const directBodegaIds = new Set(
    delegations
      .map((delegation) => delegation.bodega_id)
      .filter((value): value is string => Boolean(value)),
  );

  const globalGrantorIds = Array.from(
    new Set(
      delegations
        .filter((delegation) => delegation.bodega_id === null)
        .map((delegation) => delegation.granted_by_user_id),
    ),
  );

  if (globalGrantorIds.length > 0) {
    const rels = await prisma.userBodega.findMany({
      where: { user_id: { in: globalGrantorIds } },
      select: { bodega_id: true },
    });
    for (const rel of rels) {
      directBodegaIds.add(rel.bodega_id);
    }
  }

  const ids = Array.from(directBodegaIds);
  if (requestedBodegaId) {
    return ids.includes(requestedBodegaId) ? [requestedBodegaId] : [];
  }
  return ids;
}

async function ensureVisibleBodega(botUserId: string, bodegaId: string) {
  const ids = await getVisibleBodegaIds(botUserId, bodegaId);
  if (!ids.includes(bodegaId)) {
    throw new IaError("La bodega no está visible para este bot", 403);
  }
}

async function getVisibleTrazabilidad(botUserId: string, trazabilidadId: string) {
  const trazabilidad = await prisma.trazabilidad.findUnique({
    where: { trazabilidad_id: trazabilidadId },
    include: {
      bodega: { select: { bodega_id: true, nombre: true } },
      finca: { select: { finca_id: true, nombre_finca: true } },
      cuartel: { select: { cuartel_id: true, codigo_cuartel: true } },
      campania: { select: { campania_id: true, nombre: true, estado: true } },
      protocolo: { select: { protocolo_id: true, nombre: true, version: true } },
      trazabilidad_origen: {
        include: {
          finca: { select: { finca_id: true, nombre_finca: true } },
          cuartel: { select: { cuartel_id: true, codigo_cuartel: true } },
        },
      },
    },
  });
  if (!trazabilidad) {
    throw new IaError("Trazabilidad no encontrada", 404);
  }
  await ensureVisibleBodega(botUserId, trazabilidad.bodega_id);
  return trazabilidad;
}

async function getVisibleHallazgo(botUserId: string, hallazgoId: string) {
  const hallazgo = await prisma.hallazgoCumplimiento.findUnique({
    where: { hallazgo_id: hallazgoId },
    include: {
      trazabilidad: {
        include: {
          bodega: { select: { bodega_id: true, nombre: true } },
          finca: { select: { finca_id: true, nombre_finca: true } },
          cuartel: { select: { cuartel_id: true, codigo_cuartel: true } },
          campania: { select: { campania_id: true, nombre: true } },
        },
      },
      milestone: {
        include: {
          protocolo_proceso: {
            include: { protocolo_etapa: true },
          },
        },
      },
    },
  });
  if (!hallazgo) {
    throw new IaError("Hallazgo no encontrado", 404);
  }
  if (!hallazgo.trazabilidad) {
    throw new IaError("Hallazgo sin trazabilidad asociada", 400);
  }
  await ensureVisibleBodega(botUserId, hallazgo.trazabilidad.bodega_id);
  return hallazgo;
}

async function getDelegationForAssignment(
  botUserId: string,
  tareaAsignacionId: string,
  requiredScopes: readonly string[],
) {
  const asignacion = await prisma.tareaAsignacion.findUnique({
    where: { tarea_asignacion_id: tareaAsignacionId },
    include: iaAssignmentInclude,
  });

  if (!asignacion) {
    throw new IaError("Asignación no encontrada", 404);
  }

  const delegation = await prisma.botDelegation.findFirst({
    where: {
      bot_user_id: botUserId,
      activo: true,
      revoked_at: null,
      scopes: { hasSome: [...requiredScopes] },
      OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      AND: [
        {
          OR: [
            { bodega_id: null },
            { bodega_id: asignacion.tarea.bodega_id },
          ],
        },
      ],
    },
    include: {
      granted_by_user: {
        select: { user_id: true, nombre: true, email: true },
      },
      bodega: {
        select: { bodega_id: true, nombre: true },
      },
    },
  });

  if (!delegation) {
    throw new IaError("No hay delegación activa para esta asignación", 403);
  }

  return { asignacion, delegation };
}

function summarizeJob(
  assignment: IaAssignment,
  delegation: Awaited<ReturnType<typeof getDelegationForAssignment>>["delegation"],
) {
  return {
    tareaAsignacionId: assignment.tarea_asignacion_id,
    estado: assignment.estado,
    assignedAt: assignment.assigned_at,
    updatedAt: assignment.updated_at,
    completedAt: assignment.completed_at,
    ultimaInteraccionBotAt: assignment.ultima_interaccion_bot_at,
    whatsappContactadoAt: assignment.whatsapp_contactado_at,
    operario: assignment.app_user,
    tarea: {
      tareaId: assignment.tarea.tarea_id,
      titulo: assignment.tarea.titulo,
      descripcion: assignment.tarea.descripcion,
      prioridad: assignment.tarea.prioridad,
      estado: assignment.tarea.estado,
      fechaFin: assignment.tarea.fecha_fin,
      bodega: assignment.tarea.bodega,
      finca: assignment.tarea.finca,
      cuartel: assignment.tarea.cuartel,
    },
    delegation: {
      botDelegationId: delegation.bot_delegation_id,
      grantedBy: delegation.granted_by_user,
      bodega: delegation.bodega,
      scopes: delegation.scopes,
      expiresAt: delegation.expires_at,
    },
  };
}

export async function getIaIdentity(botUserId: string) {
  const user = await ensureBotUser(botUserId);
  const [roles, delegations] = await Promise.all([
    prisma.userRol.findMany({
      where: { user_id: botUserId },
      include: { rol: true },
    }),
    getActiveDelegations(botUserId),
  ]);

  return {
    user: {
      id: user.user_id,
      nombre: user.nombre,
      email: user.email,
    },
    rolesGlobales: roles.map((r) => r.rol.nombre).sort(),
    activeDelegations: delegations.map((delegation) => ({
      botDelegationId: delegation.bot_delegation_id,
      grantedBy: delegation.granted_by_user,
      bodega: delegation.bodega,
      scopes: delegation.scopes,
      expiresAt: delegation.expires_at,
      createdAt: delegation.created_at,
    })),
  };
}

export async function listIaJobs(filters: ListIaJobsFilters) {
  await ensureBotUser(filters.botUserId);

  const delegations = await getActiveDelegations(filters.botUserId, filters.bodegaId);
  if (delegations.length === 0) {
    return [];
  }

  const visibleBodegaIds = await getVisibleBodegaIds(filters.botUserId, filters.bodegaId);
  if (visibleBodegaIds.length === 0) {
    return [];
  }

  const where: Prisma.TareaAsignacionWhereInput = {
    tarea: { bodega_id: { in: visibleBodegaIds } },
  };
  if (filters.estado) {
    where.estado = filters.estado as never;
  }
  if (filters.bodegaId) {
    where.tarea = { bodega_id: filters.bodegaId };
  }

  const assignments = await prisma.tareaAsignacion.findMany({
    where,
    include: {
      app_user: {
        select: {
          user_id: true,
          nombre: true,
          email: true,
          whatsapp_e164: true,
        },
      },
      tarea: {
        include: {
          bodega: { select: { bodega_id: true, nombre: true } },
          finca: { select: { finca_id: true, nombre_finca: true } },
          cuartel: { select: { cuartel_id: true, codigo_cuartel: true } },
        },
      },
    },
    orderBy: [{ assigned_at: "desc" }],
  });

  return assignments
    .map((assignment) => {
      const bodegaId = assignment.tarea.bodega_id;
      const delegation =
        delegations.find((d) => d.bodega_id === bodegaId) ??
        delegations.find((d) => d.bodega_id === null) ??
        null;
      if (!delegation) return null;

      const hasVisibleScope = delegation.scopes.some((scope) =>
        IA_VISIBLE_SCOPES.includes(scope as (typeof IA_VISIBLE_SCOPES)[number]),
      );
      if (!hasVisibleScope) return null;

      return {
        tareaAsignacionId: assignment.tarea_asignacion_id,
        estado: assignment.estado,
        assignedAt: assignment.assigned_at,
        updatedAt: assignment.updated_at,
        ultimaInteraccionBotAt: assignment.ultima_interaccion_bot_at,
        operario: assignment.app_user,
        tarea: {
          tareaId: assignment.tarea.tarea_id,
          titulo: assignment.tarea.titulo,
          descripcion: assignment.tarea.descripcion,
          prioridad: assignment.tarea.prioridad,
          estado: assignment.tarea.estado,
          bodega: assignment.tarea.bodega,
          finca: assignment.tarea.finca,
          cuartel: assignment.tarea.cuartel,
        },
        delegation: {
          botDelegationId: delegation.bot_delegation_id,
          scopes: delegation.scopes,
          grantedBy: delegation.granted_by_user,
        },
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
}

export async function getIaJobDetail(tareaAsignacionId: string, botUserId: string) {
  await ensureBotUser(botUserId);
  const context = await getDelegationForAssignment(botUserId, tareaAsignacionId, [
    ...IA_VISIBLE_SCOPES,
  ]);
  return summarizeJob(context.asignacion, context.delegation);
}

export async function getIaJobContext(tareaAsignacionId: string, botUserId: string) {
  await ensureBotUser(botUserId);
  const context = await getDelegationForAssignment(botUserId, tareaAsignacionId, [
    "tareas.ver",
    "tareas.cargar_datos",
    "tareas.resolver",
  ]);

  const { asignacion, delegation } = context;

  const eventoTipo = inferEventoTipo(asignacion.tarea.titulo, asignacion.tarea.descripcion);
  const inputSchema = eventoTipo ? (EVENTO_INPUT_SCHEMAS[eventoTipo] ?? null) : null;

  return {
    trabajo: summarizeJob(asignacion, delegation),
    eventoTipo,
    inputSchema,
    eventosDisponibles: inputSchema ? null : EVENTO_INPUT_SCHEMAS,
    hallazgosAbiertos: [],
    historialBot: asignacion.bot_action_log.map((log) => ({
      botActionLogId: log.bot_action_log_id,
      action: log.action,
      inputPayload: log.input_payload,
      outputPayload: log.output_payload,
      createdAt: log.created_at,
    })),
  };
}

export async function submitIaJobResult(input: SubmitIaResultInput) {
  await ensureBotUser(input.botUserId);
  const context = await getDelegationForAssignment(
    input.botUserId,
    input.tareaAsignacionId,
    ["tareas.resolver"],
  );

  const now = new Date();
  const updated = await prisma.tareaAsignacion.update({
    where: { tarea_asignacion_id: input.tareaAsignacionId },
    data: {
      estado: input.estado,
      ultima_interaccion_bot_at: now,
      updated_at: now,
      completed_at:
        input.estado === "completado" || input.estado === "cancelado" ? now : null,
    },
    include: {
      tarea: true,
      app_user: {
        select: { user_id: true, nombre: true, email: true },
      },
    },
  });
  if (input.observaciones !== undefined) {
    await prisma.tareaAsignacion.update({
      where: { tarea_asignacion_id: input.tareaAsignacionId },
      data: { observaciones: input.observaciones },
    });
    updated.observaciones = input.observaciones;
  }

  const log = await prisma.botActionLog.create({
    data: {
      bot_user_id: input.botUserId,
      on_behalf_user_id: context.asignacion.user_id,
      bot_delegation_id: context.delegation.bot_delegation_id,
      tarea_asignacion_id: input.tareaAsignacionId,
      action: "tareas.resultado",
      input_payload: {
        estado: input.estado,
        observaciones: input.observaciones ?? null,
      } as Prisma.InputJsonObject,
      output_payload: normalizePayload(input.outputPayload),
    },
  });

  return {
    assignment: {
      tareaAsignacionId: updated.tarea_asignacion_id,
      estado: updated.estado,
      observaciones: updated.observaciones,
      updatedAt: updated.updated_at,
      completedAt: updated.completed_at,
    },
    botActionLogId: log.bot_action_log_id,
  };
}

export async function listIaBodegas(botUserId: string) {
  await ensureBotUser(botUserId);
  return prisma.bodega.findMany({
    where: { activo: true },
    select: { bodega_id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });
}

export async function listIaFincas({ botUserId, bodegaId }: IaCatalogFilter) {
  await ensureBotUser(botUserId);
  return prisma.finca.findMany({
    where: { ...(bodegaId ? { bodega_id: bodegaId } : {}) },
    orderBy: [{ nombre_finca: "asc" }],
  });
}

export async function listIaCuarteles(params: { botUserId: string; fincaId?: string }) {
  await ensureBotUser(params.botUserId);
  const where: Prisma.CuartelWhereInput = { activo: true };
  if (params.fincaId) {
    where.finca_id = params.fincaId;
  }
  return prisma.cuartel.findMany({
    where,
    include: {
      finca: { select: { finca_id: true, nombre_finca: true, bodega_id: true } },
    },
    orderBy: [{ codigo_cuartel: "asc" }],
  });
}

export async function listIaCampanias({ botUserId, bodegaId }: IaCatalogFilter) {
  await ensureBotUser(botUserId);
  return prisma.campania.findMany({
    where: { ...(bodegaId ? { bodega_id: bodegaId } : {}) },
    orderBy: [{ fecha_inicio: "desc" }],
  });
}

export async function createIaCuartel({
  botUserId,
  fincaId,
  codigoCuartel,
  superficieHa,
  cultivo,
  variedad,
  sistemaProductivo,
  sistemaConduccion,
}: {
  botUserId: string;
  fincaId: string;
  codigoCuartel: string;
  superficieHa?: number;
  cultivo?: string;
  variedad?: string;
  sistemaProductivo?: string;
  sistemaConduccion?: string;
}) {
  await ensureBotUser(botUserId);

  if (!fincaId?.trim()) throw new IaError("fincaId requerido", 400);
  if (!codigoCuartel?.trim()) throw new IaError("codigoCuartel requerido", 400);

  const finca = await prisma.finca.findUnique({
    where: { finca_id: fincaId },
    select: { finca_id: true, bodega_id: true },
  });
  if (!finca) throw new IaError("Finca no encontrada", 404);

  const delegations = await getActiveDelegations(botUserId, finca.bodega_id);
  if (delegations.length === 0) {
    throw new IaError("Delegación requerida para crear cuarteles", 403);
  }

  const existing = await prisma.cuartel.findFirst({
    where: { finca_id: fincaId, codigo_cuartel: codigoCuartel.trim() },
  });
  if (existing) throw new IaError(`Ya existe un cuartel con código "${codigoCuartel}" en esta finca`, 409);

  const data: Prisma.CuartelCreateInput = {
    finca: { connect: { finca_id: fincaId } },
    codigo_cuartel: codigoCuartel.trim(),
    ...(superficieHa !== undefined ? { superficie_ha: superficieHa } : {}),
    ...(cultivo ? { cultivo } : {}),
    ...(variedad ? { variedad } : {}),
    ...(sistemaProductivo ? { sistema_productivo: sistemaProductivo } : {}),
    ...(sistemaConduccion ? { sistema_conduccion: sistemaConduccion } : {}),
  };

  return prisma.cuartel.create({ data });
}

export async function listIaTrabajadores({
  botUserId,
  bodegaId,
}: {
  botUserId: string;
  bodegaId?: string;
}) {
  await ensureBotUser(botUserId);
  const users = await prisma.appUser.findMany({
    where: {
      is_active: true,
      ...(bodegaId
        ? { user_bodega: { some: { bodega_id: bodegaId } } }
        : {}),
    },
    select: {
      user_id: true,
      nombre: true,
      email: true,
      whatsapp_e164: true,
      password_hash: true,
      user_bodega: {
        where: bodegaId ? { bodega_id: bodegaId } : {},
        select: {
          bodega_id: true,
          user_bodega_rol: { select: { rol: true } },
        },
      },
    },
    orderBy: { nombre: "asc" },
  });

  return users.map((u) => ({
    id: u.user_id,
    nombre: u.nombre,
    email: u.email,
    whatsapp: u.whatsapp_e164,
    tieneAcceso: u.password_hash !== null,
    roles: u.user_bodega.flatMap((ub) => ub.user_bodega_rol.map((r) => r.rol)),
  }));
}

export async function createIaTrabajador({
  botUserId,
  nombre,
  bodegaId,
  rol,
  whatsapp,
}: {
  botUserId: string;
  nombre: string;
  bodegaId: string;
  rol: string;
  whatsapp?: string;
}) {
  await ensureBotUser(botUserId);

  if (!nombre?.trim()) throw new IaError("nombre requerido", 400);
  if (!bodegaId?.trim()) throw new IaError("bodegaId requerido", 400);
  if (!rol?.trim()) throw new IaError("rol requerido", 400);

  const bodega = await prisma.bodega.findUnique({ where: { bodega_id: bodegaId } });
  if (!bodega) throw new IaError("Bodega no encontrada", 404);

  let whatsapp_e164: string | undefined;
  if (whatsapp) {
    const normalized = whatsapp.trim();
    if (!/^\+\d{7,15}$/.test(normalized)) {
      throw new IaError("whatsapp debe estar en formato E.164 (ej: +5491112345678)", 400);
    }
    whatsapp_e164 = normalized;
  }

  const plainPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
  const password_hash = await import("bcryptjs").then((m) => m.default.hash(plainPassword, 10));

  const user = await prisma.appUser.create({
    data: {
      nombre: nombre.trim(),
      password_hash,
      must_change_password: true,
      ...(whatsapp_e164 ? { whatsapp_e164 } : {}),
      user_bodega: {
        create: {
          bodega_id: bodegaId,
          user_bodega_rol: {
            create: { rol },
          },
        },
      },
    },
  });

  return {
    id: user.user_id,
    nombre: user.nombre,
    email: user.email,
    whatsapp: user.whatsapp_e164,
    tieneAcceso: true,
    must_change_password: true,
    passwordTemporal: plainPassword,
    roles: [rol],
  };
}

export async function listIaProtocolos(botUserId: string) {
  await ensureBotUser(botUserId);
  return prisma.protocolo.findMany({
    where: { activo: true },
    orderBy: [{ nombre: "asc" }, { version: "desc" }],
  });
}

export async function listIaProcesos(botUserId: string, protocoloId: string) {
  await ensureBotUser(botUserId);
  const protocolo = await prisma.protocolo.findUnique({
    where: { protocolo_id: protocoloId },
    include: {
      protocolo_etapa: {
        orderBy: { orden: "asc" },
        include: {
          protocolo_proceso: { orderBy: { orden: "asc" } },
        },
      },
    },
  });
  if (!protocolo) {
    throw new IaError("Protocolo no encontrado", 404);
  }
  return protocolo;
}

export async function listIaInsumos(botUserId: string, tipo?: string) {
  await ensureBotUser(botUserId);
  const where: Prisma.InsumoCatalogoWhereInput = {};
  if (tipo) where.tipo = tipo;
  return prisma.insumoCatalogo.findMany({
    where,
    include: {
      insumo_lote: {
        where: { estado: "habilitado" },
        orderBy: [{ fecha_vencimiento: "asc" }],
        take: 10,
      },
    },
    orderBy: [{ tipo: "asc" }, { nombre_comercial: "asc" }],
  });
}

export async function listIaTrazabilidades(params: {
  botUserId: string;
  bodegaId?: string;
  campaniaId?: string;
  fincaId?: string;
  cuartelId?: string;
  estado?: string;
}) {
  await ensureBotUser(params.botUserId);
  const visibleBodegaIds = await getVisibleBodegaIds(params.botUserId, params.bodegaId);
  if (visibleBodegaIds.length === 0) return [];

  const where: Prisma.TrazabilidadWhereInput = {
    bodega_id: { in: visibleBodegaIds },
  };
  if (params.campaniaId) where.campania_id = params.campaniaId;
  if (params.fincaId) where.finca_id = params.fincaId;
  if (params.cuartelId) where.cuartel_id = params.cuartelId;
  if (params.estado) where.estado = params.estado as never;

  return prisma.trazabilidad.findMany({
    where,
    include: {
      bodega: { select: { bodega_id: true, nombre: true } },
      finca: { select: { finca_id: true, nombre_finca: true } },
      cuartel: { select: { cuartel_id: true, codigo_cuartel: true } },
      campania: { select: { campania_id: true, nombre: true, estado: true } },
      protocolo: { select: { protocolo_id: true, nombre: true, version: true } },
      trazabilidad_origen: {
        include: {
          finca: { select: { finca_id: true, nombre_finca: true } },
          cuartel: { select: { cuartel_id: true, codigo_cuartel: true } },
        },
      },
    },
    orderBy: [{ created_at: "desc" }],
  });
}

export async function getIaTrazabilidad(trazabilidadId: string, botUserId: string) {
  await ensureBotUser(botUserId);
  return getVisibleTrazabilidad(botUserId, trazabilidadId);
}

export async function getIaTrazabilidadContext(trazabilidadId: string, botUserId: string) {
  await ensureBotUser(botUserId);
  const trazabilidad = await prisma.trazabilidad.findUnique({
    where: { trazabilidad_id: trazabilidadId },
    include: {
      bodega: { select: { bodega_id: true, nombre: true } },
      finca: { select: { finca_id: true, nombre_finca: true } },
      cuartel: { select: { cuartel_id: true, codigo_cuartel: true } },
      campania: { select: { campania_id: true, nombre: true, estado: true } },
      protocolo: {
        include: {
          protocolo_etapa: {
            orderBy: { orden: "asc" },
            include: { protocolo_proceso: { orderBy: { orden: "asc" } } },
          },
        },
      },
      trazabilidad_origen: {
        include: {
          finca: { select: { finca_id: true, nombre_finca: true } },
          cuartel: { select: { cuartel_id: true, codigo_cuartel: true } },
        },
      },
      milestone: {
        orderBy: [{ created_at: "asc" }],
        include: {
          protocolo_proceso: {
            include: { protocolo_etapa: true },
          },
          evidencia: { orderBy: [{ created_at: "desc" }] },
          milestone_evento: { orderBy: [{ created_at: "desc" }] },
          validacion_milestone: { orderBy: [{ created_at: "desc" }] },
        },
      },
      hallazgo_cumplimiento: {
        orderBy: [{ created_at: "desc" }],
      },
    },
  });
  if (!trazabilidad) {
    throw new IaError("Trazabilidad no encontrada", 404);
  }
  await ensureVisibleBodega(botUserId, trazabilidad.bodega_id);
  return trazabilidad;
}

export async function listIaHallazgos(params: {
  botUserId: string;
  trazabilidadId?: string;
  estado?: string;
  severidad?: string;
}) {
  await ensureBotUser(params.botUserId);

  let visibleBodegaIds: string[] = [];
  if (params.trazabilidadId) {
    const trazabilidad = await getVisibleTrazabilidad(params.botUserId, params.trazabilidadId);
    visibleBodegaIds = [trazabilidad.bodega_id];
  } else {
    visibleBodegaIds = await getVisibleBodegaIds(params.botUserId);
  }

  if (visibleBodegaIds.length === 0) return [];

  const where: Prisma.HallazgoCumplimientoWhereInput = {
    trazabilidad: { bodega_id: { in: visibleBodegaIds } },
  };
  if (params.trazabilidadId) where.trazabilidad_id = params.trazabilidadId;
  if (params.estado) where.estado = params.estado as never;
  if (params.severidad) where.severidad = params.severidad as never;

  return prisma.hallazgoCumplimiento.findMany({
    where,
    include: {
      trazabilidad: {
        select: {
          trazabilidad_id: true,
          bodega_id: true,
          finca_id: true,
          cuartel_id: true,
          campania_id: true,
          nombre_producto: true,
          estado: true,
        },
      },
      milestone: {
        include: {
          protocolo_proceso: {
            include: { protocolo_etapa: true },
          },
        },
      },
    },
    orderBy: [{ created_at: "desc" }],
  });
}

export async function getIaHallazgo(hallazgoId: string, botUserId: string) {
  await ensureBotUser(botUserId);
  return getVisibleHallazgo(botUserId, hallazgoId);
}

function parseLimit(value?: number) {
  if (!value || Number.isNaN(value)) return 50;
  return Math.min(Math.max(value, 1), 200);
}

export async function listIaEventos(params: {
  botUserId: string;
  tipo?: string;
  trazabilidadId?: string;
  bodegaId?: string;
  campaniaId?: string;
  fincaId?: string;
  cuartelId?: string;
  limit?: number;
}) {
  await ensureBotUser(params.botUserId);
  const limit = parseLimit(params.limit);
  let query = { ...params };

  let bodegaIds = await getVisibleBodegaIds(query.botUserId, query.bodegaId);
  if (query.trazabilidadId) {
    const trazabilidad = await getVisibleTrazabilidad(query.botUserId, query.trazabilidadId);
    bodegaIds = [trazabilidad.bodega_id];
    query = { ...query, bodegaId: trazabilidad.bodega_id, campaniaId: query.campaniaId ?? trazabilidad.campania_id };
    if (!query.fincaId && trazabilidad.finca_id) query.fincaId = trazabilidad.finca_id;
    if (!query.cuartelId && trazabilidad.cuartel_id) query.cuartelId = trazabilidad.cuartel_id;
  }
  if (bodegaIds.length === 0) return [];

  const byType = async (tipo: string) => {
    switch (tipo) {
      case "riego":
        return prisma.eventoRiego.findMany({
          where: {
            ...(query.campaniaId ? { campania_id: query.campaniaId } : {}),
            ...(query.cuartelId ? { cuartel_id: query.cuartelId } : {}),
            cuartel: { finca: { bodega_id: { in: bodegaIds } } },
          },
          orderBy: [{ fecha: "desc" }],
          take: limit,
        });
      case "cosecha":
        return prisma.eventoCosecha.findMany({
          where: {
            ...(query.campaniaId ? { campania_id: query.campaniaId } : {}),
            ...(query.cuartelId ? { cuartel_id: query.cuartelId } : {}),
            cuartel: { finca: { bodega_id: { in: bodegaIds } } },
          },
          orderBy: [{ fecha_cosecha: "desc" }],
          take: limit,
        });
      case "fenologia":
        return prisma.eventoFenologia.findMany({
          where: {
            ...(query.campaniaId ? { campania_id: query.campaniaId } : {}),
            ...(query.cuartelId ? { cuartel_id: query.cuartelId } : {}),
            cuartel: { finca: { bodega_id: { in: bodegaIds } } },
          },
          orderBy: [{ fecha: "desc" }],
          take: limit,
        });
      case "fertilizacion":
        return prisma.eventoFertilizacion.findMany({
          where: {
            ...(query.campaniaId ? { campania_id: query.campaniaId } : {}),
            ...(query.cuartelId ? { cuartel_id: query.cuartelId } : {}),
            cuartel: { finca: { bodega_id: { in: bodegaIds } } },
          },
          orderBy: [{ fecha: "desc" }],
          take: limit,
        });
      case "aplicacion_fitosanitaria":
        return prisma.eventoAplicacionFitosanitaria.findMany({
          where: {
            ...(query.campaniaId ? { campania_id: query.campaniaId } : {}),
            ...(query.cuartelId ? { cuartel_id: query.cuartelId } : {}),
            cuartel: { finca: { bodega_id: { in: bodegaIds } } },
          },
          orderBy: [{ fecha: "desc" }],
          take: limit,
        });
      case "monitoreo_plaga":
        return prisma.eventoMonitoreoPlaga.findMany({
          where: {
            ...(query.campaniaId ? { campania_id: query.campaniaId } : {}),
            ...(query.cuartelId ? { cuartel_id: query.cuartelId } : {}),
            cuartel: { finca: { bodega_id: { in: bodegaIds } } },
          },
          orderBy: [{ fecha: "desc" }],
          take: limit,
        });
      case "monitoreo_enfermedad":
        return prisma.eventoMonitoreoEnfermedad.findMany({
          where: {
            ...(query.campaniaId ? { campania_id: query.campaniaId } : {}),
            ...(query.cuartelId ? { cuartel_id: query.cuartelId } : {}),
            cuartel: { finca: { bodega_id: { in: bodegaIds } } },
          },
          orderBy: [{ fecha: "desc" }],
          take: limit,
        });
      case "precipitacion":
        return prisma.eventoPrecipitacion.findMany({
          where: {
            ...(query.campaniaId ? { campania_id: query.campaniaId } : {}),
            ...(query.fincaId ? { finca_id: query.fincaId } : {}),
            finca: { bodega_id: { in: bodegaIds } },
          },
          orderBy: [{ fecha: "desc" }],
          take: limit,
        });
      case "analisis_suelo":
        {
          const where: Prisma.EventoAnalisisDeSueloWhereInput = {};
          if (query.campaniaId) where.campania_id = query.campaniaId;
          if (query.cuartelId) {
            where.cuartel_id = query.cuartelId;
          } else {
            where.cuartel = { finca: { bodega_id: { in: bodegaIds } } };
          }
        return prisma.eventoAnalisisDeSuelo.findMany({
          where,
          orderBy: [{ fecha: "desc" }],
          take: limit,
        });
        }
      default:
        throw new IaError("Tipo de evento no soportado", 400);
    }
  };

  const tipos = query.tipo
    ? [query.tipo]
    : [
        "riego",
        "cosecha",
        "fenologia",
        "fertilizacion",
        "aplicacion_fitosanitaria",
        "monitoreo_plaga",
        "monitoreo_enfermedad",
        "precipitacion",
        "analisis_suelo",
      ];

  const results = await Promise.all(
    tipos.map(async (tipo) => ({
      tipo,
      items: await byType(tipo),
    })),
  );

  return results;
}

export async function iaConsultar(input: IaConsultaInput) {
  await ensureBotUser(input.botUserId);
  const term = input.pregunta.trim();
  if (!term) {
    throw new IaError("La pregunta es obligatoria", 400);
  }

  let bodegaIds = await getVisibleBodegaIds(input.botUserId, input.bodegaId);
  if (input.trazabilidadId) {
    const trazabilidad = await getVisibleTrazabilidad(input.botUserId, input.trazabilidadId);
    bodegaIds = [trazabilidad.bodega_id];
  }
  if (bodegaIds.length === 0) {
    return {
      pregunta: term,
      resumen: "Sin bodegas visibles para esta consulta.",
      resultados: {},
    };
  }

  const limit = parseLimit(input.limit);
  const [fincas, cuarteles, campanias, trazabilidades, hallazgos] = await Promise.all([
    prisma.finca.findMany({
      where: {
        bodega_id: { in: bodegaIds },
        OR: [{ nombre_finca: { contains: term, mode: "insensitive" } }],
      },
      take: limit,
      orderBy: [{ nombre_finca: "asc" }],
    }),
    prisma.cuartel.findMany({
      where: {
        finca: { bodega_id: { in: bodegaIds } },
        OR: [{ codigo_cuartel: { contains: term, mode: "insensitive" } }],
      },
      include: { finca: { select: { nombre_finca: true } } },
      take: limit,
      orderBy: [{ codigo_cuartel: "asc" }],
    }),
    prisma.campania.findMany({
      where: {
        bodega_id: { in: bodegaIds },
        OR: [{ nombre: { contains: term, mode: "insensitive" } }],
      },
      take: limit,
      orderBy: [{ fecha_inicio: "desc" }],
    }),
    prisma.trazabilidad.findMany({
      where: {
        bodega_id: { in: bodegaIds },
        OR: [{ nombre_producto: { contains: term, mode: "insensitive" } }],
      },
      take: limit,
      orderBy: [{ created_at: "desc" }],
    }),
    prisma.hallazgoCumplimiento.findMany({
      where: {
        trazabilidad: { bodega_id: { in: bodegaIds } },
        OR: [
          { titulo: { contains: term, mode: "insensitive" } },
          { mensaje: { contains: term, mode: "insensitive" } },
          { regla_codigo: { contains: term, mode: "insensitive" } },
        ],
      },
      take: limit,
      orderBy: [{ created_at: "desc" }],
    }),
  ]);

  const total =
    fincas.length +
    cuarteles.length +
    campanias.length +
    trazabilidades.length +
    hallazgos.length;

  return {
    pregunta: term,
    resumen:
      total > 0
        ? `Se encontraron ${total} coincidencias relevantes para la consulta.`
        : "No se encontraron coincidencias directas para la consulta.",
    resultados: {
      fincas,
      cuarteles,
      campanias,
      trazabilidades,
      hallazgos,
    },
  };
}

export async function contactIaJob(tareaAsignacionId: string, botUserId: string, message?: string) {
  await ensureBotUser(botUserId);
  return botContactarAsignacion(tareaAsignacionId, botUserId, message);
}

export async function helpIaJobLoad(
  tareaAsignacionId: string,
  botUserId: string,
  payload?: unknown,
) {
  await ensureBotUser(botUserId);
  const context = await getDelegationForAssignment(botUserId, tareaAsignacionId, [
    "tareas.cargar_datos",
  ]);

  const eventoTipo = inferEventoTipo(context.asignacion.tarea.titulo, context.asignacion.tarea.descripcion);
  const inputSchema = eventoTipo ? (EVENTO_INPUT_SCHEMAS[eventoTipo] ?? null) : null;

  const body = isPlainObject(payload) ? payload : {};
  const draftCandidate = isPlainObject(body.draft) ? body.draft : body;
  const draft = isPlainObject(draftCandidate) ? draftCandidate : {};

  const validation = inputSchema ? validateDraftAgainstSchema(draft, inputSchema) : null;

  const enrichedPayload: Prisma.InputJsonObject = {
    ...(body as Prisma.InputJsonObject),
    draft: draft as Prisma.InputJsonObject,
    _meta: {
      eventoTipo,
      hasInputSchema: Boolean(inputSchema),
      validation,
    } as Prisma.InputJsonObject,
  };

  const botActionLog = await botAyudarCarga(tareaAsignacionId, botUserId, enrichedPayload);

  return {
    botActionLog,
    eventoTipo,
    inputSchema,
    validation: validation
      ? {
          missingRequired: validation.missingRequired,
          invalidFields: validation.invalidFields,
          requiredPresent: validation.requiredPresent,
          requiredTotal: validation.requiredTotal,
          canClose:
            validation.missingRequired.length === 0 &&
            validation.invalidFields.length === 0 &&
            validation.requiredTotal > 0,
        }
      : null,
    nextAction: validation
      ? validation.missingRequired.length > 0 || validation.invalidFields.length > 0
        ? "ask_missing_or_fix_invalid"
        : "ready_to_submit_result"
      : "schema_not_available",
  };
}

export async function getIaUsuario(botUserId: string, targetUserId: string) {
  await ensureBotUser(botUserId);

  const visibleBodegaIds = await getVisibleBodegaIds(botUserId);
  if (visibleBodegaIds.length === 0) {
    throw new IaError("Sin delegaciones activas", 403);
  }

  const user = await prisma.appUser.findFirst({
    where: {
      user_id: targetUserId,
      user_bodega: {
        some: { bodega_id: { in: visibleBodegaIds } },
      },
    },
    select: {
      user_id: true,
      nombre: true,
      email: true,
      whatsapp_e164: true,
      is_active: true,
    },
  });

  if (!user) {
    throw new IaError("Usuario no encontrado o sin acceso", 404);
  }

  return user;
}

export async function getIaUsuarioByWhatsapp(botUserId: string, whatsapp: string) {
  await ensureBotUser(botUserId);

  const user = await prisma.appUser.findUnique({
    where: { whatsapp_e164: whatsapp },
    select: {
      user_id: true,
      nombre: true,
      email: true,
      whatsapp_e164: true,
      is_active: true,
      user_bodega: {
        include: {
          bodega: { select: { bodega_id: true, nombre: true } },
          user_bodega_rol: { select: { rol: true } },
        },
      },
    },
  });

  if (!user) {
    throw new IaError("Usuario no encontrado con ese whatsapp", 404);
  }

  const delegaciones = await prisma.botDelegation.findMany({
    where: {
      bot_user_id: botUserId,
      granted_by_user_id: user.user_id,
      activo: true,
      revoked_at: null,
      OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
    },
    select: {
      bot_delegation_id: true,
      scopes: true,
      bodega_id: true,
      bodega: { select: { bodega_id: true, nombre: true } },
      expires_at: true,
      created_at: true,
    },
  });

  return {
    user_id: user.user_id,
    nombre: user.nombre,
    email: user.email,
    whatsapp: user.whatsapp_e164,
    is_active: user.is_active,
    bodegas: user.user_bodega.map((ub) => ({
      bodega_id: ub.bodega_id,
      nombre: ub.bodega?.nombre ?? "",
      roles: ub.user_bodega_rol.map((r) => r.rol),
    })),
    delegaciones_activas: delegaciones.map((d) => ({
      bot_delegation_id: d.bot_delegation_id,
      scopes: d.scopes,
      bodega: d.bodega ?? null,
      expires_at: d.expires_at,
      created_at: d.created_at,
    })),
    tiene_delegacion: delegaciones.length > 0,
  };
}

export function getIaEventoSchema(tipo: string) {
  const schema = EVENTO_INPUT_SCHEMAS[tipo];
  if (!schema) {
    throw new IaError(`Tipo de evento desconocido: ${tipo}`, 404);
  }
  return { tipo, schema };
}

export function listIaEventoTipos() {
  return Object.keys(EVENTO_INPUT_SCHEMAS);
}
