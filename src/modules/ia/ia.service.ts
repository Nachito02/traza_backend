import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prismaClient.js";
import { userHasAnyRole } from "../../middlewares/roles.middleware.js";
import {
  botAyudarCarga,
  botContactarAsignacion,
} from "../bot/bot.service.js";

const IA_VISIBLE_SCOPES = [
  "encargos.ver",
  "encargos.contactar",
  "encargos.cargar_datos",
  "encargos.resolver",
] as const;

type ListIaJobsFilters = {
  botUserId: string;
  estado?: string;
  bodegaId?: string;
};

type SubmitIaResultInput = {
  encargoAsignacionId: string;
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
  encargo: {
    include: {
      bodega: { select: { bodega_id: true, nombre: true } },
      finca: { select: { finca_id: true, nombre_finca: true } },
      cuartel: { select: { cuartel_id: true, codigo_cuartel: true } },
      milestone: {
        include: {
          protocolo_proceso: {
            include: {
              protocolo_etapa: true,
            },
          },
          trazabilidad: {
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
              hallazgo_cumplimiento: {
                where: { estado: { in: ["abierto", "en_proceso"] } },
                orderBy: [{ created_at: "desc" }],
                take: 10,
              },
            },
          },
          evidencia: {
            orderBy: [{ created_at: "desc" }],
          },
          milestone_evento: {
            orderBy: [{ created_at: "desc" }],
          },
          validacion_milestone: {
            orderBy: [{ created_at: "desc" }],
          },
        },
      },
    },
  },
  bot_action_log: {
    orderBy: [{ created_at: "desc" }],
    take: 20,
  },
} satisfies Prisma.EncargoAsignacionInclude;

type IaAssignment = Prisma.EncargoAsignacionGetPayload<{
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
      OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      ...(bodegaId ? { OR: [{ bodega_id: null }, { bodega_id: bodegaId }] } : {}),
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
  encargoAsignacionId: string,
  requiredScopes: readonly string[],
) {
  const asignacion = await prisma.encargoAsignacion.findUnique({
    where: { encargo_asignacion_id: encargoAsignacionId },
    include: iaAssignmentInclude,
  });

  if (!asignacion) {
    throw new IaError("Asignación no encontrada", 404);
  }

  const delegation = await prisma.botDelegation.findFirst({
    where: {
      granted_by_user_id: asignacion.user_id,
      bot_user_id: botUserId,
      activo: true,
      revoked_at: null,
      scopes: { hasSome: [...requiredScopes] },
      OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      AND: [
        {
          OR: [
            { bodega_id: null },
            { bodega_id: asignacion.encargo.bodega_id },
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
    encargoAsignacionId: assignment.encargo_asignacion_id,
    estado: assignment.estado,
    assignedAt: assignment.assigned_at,
    updatedAt: assignment.updated_at,
    completedAt: assignment.completed_at,
    ultimaInteraccionBotAt: assignment.ultima_interaccion_bot_at,
    whatsappContactadoAt: assignment.whatsapp_contactado_at,
    operario: assignment.app_user,
    encargo: {
      encargoId: assignment.encargo.encargo_id,
      titulo: assignment.encargo.titulo,
      descripcion: assignment.encargo.descripcion,
      prioridad: assignment.encargo.prioridad,
      estado: assignment.encargo.estado,
      fechaObjetivo: assignment.encargo.fecha_objetivo,
      bodega: assignment.encargo.bodega,
      finca: assignment.encargo.finca,
      cuartel: assignment.encargo.cuartel,
      milestoneId: assignment.encargo.milestone_id,
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

  const allowedUserIds = Array.from(
    new Set(delegations.map((delegation) => delegation.granted_by_user_id)),
  );

  const where: Prisma.EncargoAsignacionWhereInput = {
    user_id: { in: allowedUserIds },
  };
  if (filters.estado) {
    where.estado = filters.estado as never;
  }
  if (filters.bodegaId) {
    where.encargo = { bodega_id: filters.bodegaId };
  }

  const assignments = await prisma.encargoAsignacion.findMany({
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
      encargo: {
        include: {
          bodega: { select: { bodega_id: true, nombre: true } },
          finca: { select: { finca_id: true, nombre_finca: true } },
          cuartel: { select: { cuartel_id: true, codigo_cuartel: true } },
        },
      },
    },
    orderBy: [{ assigned_at: "desc" }],
  });

  const delegationsByKey = new Map(
    delegations.map((delegation) => [
      `${delegation.granted_by_user_id}:${delegation.bodega_id ?? "global"}`,
      delegation,
    ]),
  );

  return assignments
    .map((assignment) => {
      const key =
        `${assignment.user_id}:${assignment.encargo.bodega_id}` as const;
      const globalKey = `${assignment.user_id}:global` as const;
      const delegation =
        delegationsByKey.get(key) ?? delegationsByKey.get(globalKey) ?? null;
      if (!delegation) return null;

      const hasVisibleScope = delegation.scopes.some((scope) =>
        IA_VISIBLE_SCOPES.includes(scope as (typeof IA_VISIBLE_SCOPES)[number]),
      );
      if (!hasVisibleScope) return null;

      return {
        encargoAsignacionId: assignment.encargo_asignacion_id,
        estado: assignment.estado,
        assignedAt: assignment.assigned_at,
        updatedAt: assignment.updated_at,
        ultimaInteraccionBotAt: assignment.ultima_interaccion_bot_at,
        operario: assignment.app_user,
        encargo: {
          encargoId: assignment.encargo.encargo_id,
          titulo: assignment.encargo.titulo,
          descripcion: assignment.encargo.descripcion,
          prioridad: assignment.encargo.prioridad,
          estado: assignment.encargo.estado,
          bodega: assignment.encargo.bodega,
          finca: assignment.encargo.finca,
          cuartel: assignment.encargo.cuartel,
          milestoneId: assignment.encargo.milestone_id,
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

export async function getIaJobDetail(encargoAsignacionId: string, botUserId: string) {
  await ensureBotUser(botUserId);
  const context = await getDelegationForAssignment(botUserId, encargoAsignacionId, [
    ...IA_VISIBLE_SCOPES,
  ]);
  return summarizeJob(context.asignacion, context.delegation);
}

export async function getIaJobContext(encargoAsignacionId: string, botUserId: string) {
  await ensureBotUser(botUserId);
  const context = await getDelegationForAssignment(botUserId, encargoAsignacionId, [
    "encargos.ver",
    "encargos.cargar_datos",
    "encargos.resolver",
  ]);

  const { asignacion, delegation } = context;
  const milestone = asignacion.encargo.milestone;

  return {
    trabajo: summarizeJob(asignacion, delegation),
    milestone: milestone
      ? {
          milestoneId: milestone.milestone_id,
          estado: milestone.estado,
          eventDate: milestone.event_date,
          proceso: {
            procesoId: milestone.protocolo_proceso.proceso_id,
            nombre: milestone.protocolo_proceso.nombre,
            eventoTipo: milestone.protocolo_proceso.evento_tipo,
            obligatorio: milestone.protocolo_proceso.obligatorio,
            orden: milestone.protocolo_proceso.orden,
            etapa: {
              etapaId: milestone.protocolo_proceso.protocolo_etapa.etapa_id,
              nombre: milestone.protocolo_proceso.protocolo_etapa.nombre,
              orden: milestone.protocolo_proceso.protocolo_etapa.orden,
            },
          },
          evidencia: milestone.evidencia,
          eventos: milestone.milestone_evento,
          validaciones: milestone.validacion_milestone,
        }
      : null,
    trazabilidad: milestone
      ? {
          id: milestone.trazabilidad.trazabilidad_id,
          estado: milestone.trazabilidad.estado,
          nombreProducto: milestone.trazabilidad.nombre_producto,
          imagenProducto: milestone.trazabilidad.imagen_producto,
          bodega: milestone.trazabilidad.bodega,
          finca: milestone.trazabilidad.finca,
          cuartel: milestone.trazabilidad.cuartel,
          campania: milestone.trazabilidad.campania,
          protocolo: milestone.trazabilidad.protocolo,
          origenes: milestone.trazabilidad.trazabilidad_origen.map((origen) => ({
            finca: origen.finca,
            cuartel: origen.cuartel,
            estado: origen.estado,
          })),
        }
      : null,
    hallazgosAbiertos:
      milestone?.trazabilidad.hallazgo_cumplimiento.map((hallazgo) => ({
        hallazgoId: hallazgo.hallazgo_id,
        severidad: hallazgo.severidad,
        estado: hallazgo.estado,
        titulo: hallazgo.titulo,
        mensaje: hallazgo.mensaje,
        reglaCodigo: hallazgo.regla_codigo,
        createdAt: hallazgo.created_at,
      })) ?? [],
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
    input.encargoAsignacionId,
    ["encargos.resolver"],
  );

  const now = new Date();
  const updated = await prisma.encargoAsignacion.update({
    where: { encargo_asignacion_id: input.encargoAsignacionId },
    data: {
      estado: input.estado,
      ultima_interaccion_bot_at: now,
      updated_at: now,
      completed_at:
        input.estado === "completado" || input.estado === "cancelado" ? now : null,
    },
    include: {
      encargo: true,
      app_user: {
        select: { user_id: true, nombre: true, email: true },
      },
    },
  });
  if (input.observaciones !== undefined) {
    await prisma.encargoAsignacion.update({
      where: { encargo_asignacion_id: input.encargoAsignacionId },
      data: { observaciones: input.observaciones },
    });
    updated.observaciones = input.observaciones;
  }

  const log = await prisma.botActionLog.create({
    data: {
      bot_user_id: input.botUserId,
      on_behalf_user_id: context.asignacion.user_id,
      bot_delegation_id: context.delegation.bot_delegation_id,
      encargo_asignacion_id: input.encargoAsignacionId,
      action: "encargos.resultado",
      input_payload: {
        estado: input.estado,
        observaciones: input.observaciones ?? null,
      } as Prisma.InputJsonObject,
      output_payload: normalizePayload(input.outputPayload),
    },
  });

  return {
    assignment: {
      encargoAsignacionId: updated.encargo_asignacion_id,
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
  const delegations = await getActiveDelegations(botUserId);
  const unique = new Map<string, { bodega_id: string; nombre: string }>();

  for (const delegation of delegations) {
    if (!delegation.bodega) continue;
    unique.set(delegation.bodega.bodega_id, delegation.bodega);
  }

  return Array.from(unique.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export async function listIaFincas({ botUserId, bodegaId }: IaCatalogFilter) {
  await ensureBotUser(botUserId);
  const visibleBodegaIds = await getVisibleBodegaIds(botUserId, bodegaId);
  if (visibleBodegaIds.length === 0) return [];

  return prisma.finca.findMany({
    where: { bodega_id: { in: visibleBodegaIds } },
    orderBy: [{ nombre_finca: "asc" }],
  });
}

export async function listIaCuarteles(params: IaCatalogFilter & { fincaId?: string }) {
  await ensureBotUser(params.botUserId);
  const where: Prisma.CuartelWhereInput = {};

  if (params.fincaId) {
    const finca = await prisma.finca.findUnique({
      where: { finca_id: params.fincaId },
      select: { finca_id: true, bodega_id: true },
    });
    if (!finca) {
      throw new IaError("Finca no encontrada", 404);
    }
    await ensureVisibleBodega(params.botUserId, finca.bodega_id);
    where.finca_id = finca.finca_id;
  } else {
    const visibleBodegaIds = await getVisibleBodegaIds(params.botUserId, params.bodegaId);
    if (visibleBodegaIds.length === 0) return [];
    where.finca = { bodega_id: { in: visibleBodegaIds } };
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
  const visibleBodegaIds = await getVisibleBodegaIds(botUserId, bodegaId);
  if (visibleBodegaIds.length === 0) return [];

  return prisma.campania.findMany({
    where: { bodega_id: { in: visibleBodegaIds } },
    orderBy: [{ fecha_inicio: "desc" }],
  });
}

export async function listIaPersonas({ botUserId, bodegaId }: IaCatalogFilter) {
  await ensureBotUser(botUserId);
  const visibleBodegaIds = await getVisibleBodegaIds(botUserId, bodegaId);
  if (visibleBodegaIds.length === 0) return [];

  return prisma.persona.findMany({
    where: { bodega_id: { in: visibleBodegaIds } },
    orderBy: [{ nombre_apellido: "asc" }],
  });
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

export async function contactIaJob(encargoAsignacionId: string, botUserId: string, message?: string) {
  await ensureBotUser(botUserId);
  return botContactarAsignacion(encargoAsignacionId, botUserId, message);
}

export async function helpIaJobLoad(
  encargoAsignacionId: string,
  botUserId: string,
  payload?: unknown,
) {
  await ensureBotUser(botUserId);
  return botAyudarCarga(encargoAsignacionId, botUserId, payload);
}
