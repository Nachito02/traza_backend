import bcrypt from "bcryptjs";
import { prisma } from "../../config/prismaClient.js";
import { login, loginByNombre } from "../auth/auth.service.js";
import { userHasAnyRole } from "../../middlewares/roles.middleware.js";

type PendingDelegation = {
  botUserId: string;
  onBehalfUserId: string;
  scopes: string[];
  bodegaId: string | undefined;
  expiresAt: string | undefined;
  expiresCode: number;
};

const pendingDelegations = new Map<string, PendingDelegation>();

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function cleanExpiredCodes() {
  const now = Date.now();
  for (const [code, data] of pendingDelegations) {
    if (data.expiresCode < now) pendingDelegations.delete(code);
  }
}

type CreateDelegationInput = {
  botUserId: string;
  bodegaId?: string;
  scopes: string[];
  expiresAt?: string;
};

type BotActionInput = {
  tareaAsignacionId: string;
  botUserId: string;
  scopeRequired: string;
  action: string;
  inputPayload?: unknown;
  outputPayload?: unknown;
};

export class BotError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function normalizeScopes(scopes: string[]) {
  return Array.from(new Set(scopes.filter((s) => typeof s === "string" && s.trim().length > 0)));
}

async function isSuperAgent(userId: string): Promise<boolean> {
  return userHasAnyRole(userId, ["super_agent"]);
}

async function ensureBotUser(botUserId: string) {
  const exists = await prisma.appUser.findUnique({
    where: { user_id: botUserId },
    select: { user_id: true },
  });
  if (!exists) {
    throw new BotError("Usuario bot no encontrado", 404);
  }
  const isBotAgent = await userHasAnyRole(botUserId, ["bot_agent", "super_agent", "admin_sistema"]);
  if (!isBotAgent) {
    throw new BotError("El usuario indicado no tiene rol bot_agent o super_agent", 400);
  }
}

async function ensureBodegaMembership(userId: string, bodegaId?: string) {
  if (!bodegaId) return;
  const isSystemAdmin = await userHasAnyRole(userId, ["admin_sistema"]);
  if (isSystemAdmin) return;

  const rel = await prisma.userBodega.findFirst({
    where: {
      user_id: userId,
      bodega_id: bodegaId,
    },
  });
  if (!rel) {
    throw new BotError("No autorizado para delegar en esta bodega", 403);
  }
}

export async function createBotDelegation(input: CreateDelegationInput, grantedByUserId: string) {
  if (!input.botUserId) {
    throw new BotError("botUserId es requerido", 400);
  }
  const scopes = normalizeScopes(input.scopes ?? []);
  if (scopes.length === 0) {
    throw new BotError("Debe delegar al menos un scope", 400);
  }

  await ensureBotUser(input.botUserId);
  await ensureBodegaMembership(grantedByUserId, input.bodegaId);

  const data: {
    granted_by_user_id: string;
    bot_user_id: string;
    scopes: string[];
    bodega_id?: string | null;
    expires_at?: Date | null;
  } = {
    granted_by_user_id: grantedByUserId,
    bot_user_id: input.botUserId,
    scopes,
  };
  if (input.bodegaId !== undefined) {
    data.bodega_id = input.bodegaId;
  }
  if (input.expiresAt) {
    data.expires_at = new Date(input.expiresAt);
  }

  return prisma.botDelegation.create({
    data,
  });
}

export async function listMyBotDelegations(userId: string) {
  return prisma.botDelegation.findMany({
    where: {
      granted_by_user_id: userId,
      revoked_at: null,
    },
    orderBy: [{ created_at: "desc" }],
  });
}

export async function revokeBotDelegation(botDelegationId: string, userId: string) {
  const delegation = await prisma.botDelegation.findUnique({
    where: { bot_delegation_id: botDelegationId },
  });
  if (!delegation) {
    throw new BotError("Delegación no encontrada", 404);
  }

  const isSystemAdmin = await userHasAnyRole(userId, ["admin_sistema"]);
  if (!isSystemAdmin && delegation.granted_by_user_id !== userId) {
    throw new BotError("No autorizado para revocar esta delegación", 403);
  }

  return prisma.botDelegation.update({
    where: { bot_delegation_id: botDelegationId },
    data: {
      activo: false,
      revoked_at: new Date(),
    },
  });
}

async function validateBotActionAndGetContext(input: BotActionInput) {
  const isBot = await userHasAnyRole(input.botUserId, ["bot_agent", "super_agent", "admin_sistema"]);
  if (!isBot) {
    throw new BotError("El actor no tiene permisos de bot", 403);
  }

  const asignacion = await prisma.tareaAsignacion.findUnique({
    where: { tarea_asignacion_id: input.tareaAsignacionId },
    include: {
      tarea: {
        select: {
          bodega_id: true,
        },
      },
    },
  });
  if (!asignacion) {
    throw new BotError("Asignación no encontrada", 404);
  }

  if (await isSuperAgent(input.botUserId)) {
    return { asignacion, delegation: { bot_delegation_id: null as string | null } };
  }

  const delegation = await prisma.botDelegation.findFirst({
    where: {
      bot_user_id: input.botUserId,
      activo: true,
      revoked_at: null,
      scopes: { has: input.scopeRequired },
      OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      AND: [
        {
          OR: [{ bodega_id: null }, { bodega_id: asignacion.tarea.bodega_id }],
        },
      ],
    },
  });
  if (!delegation) {
    throw new BotError("No hay delegación activa para esta acción", 403);
  }

  return { asignacion, delegation };
}

export async function botContactarAsignacion(
  tareaAsignacionId: string,
  botUserId: string,
  message?: string,
) {
  const context = await validateBotActionAndGetContext({
    tareaAsignacionId,
    botUserId,
    scopeRequired: "tareas.contactar",
    action: "tareas.contactar",
    inputPayload: { message },
  });

  await prisma.tareaAsignacion.update({
    where: { tarea_asignacion_id: tareaAsignacionId },
    data: {
      whatsapp_contactado_at: new Date(),
      ultima_interaccion_bot_at: new Date(),
      updated_at: new Date(),
    },
  });

  return prisma.botActionLog.create({
    data: {
      bot_user_id: botUserId,
      on_behalf_user_id: context.asignacion.user_id,
      bot_delegation_id: context.delegation.bot_delegation_id,
      tarea_asignacion_id: tareaAsignacionId,
      action: "tareas.contactar",
      input_payload: { message: message ?? null },
      output_payload: { status: "contactado" },
    },
  });
}

export async function createBotUser(
  actorUserId: string,
  input: { email: string; password: string; nombre: string },
) {
  const isSystemAdmin = await userHasAnyRole(actorUserId, ["admin_sistema"]);
  if (!isSystemAdmin) {
    throw new BotError("Solo admin_sistema puede crear usuarios bot", 403);
  }

  if (!input.email || !input.password || !input.nombre) {
    throw new BotError("email, password y nombre son requeridos", 400);
  }

  const existing = await prisma.appUser.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new BotError("El usuario ya existe", 409);
  }

  const password_hash = await bcrypt.hash(input.password, 10);
  const user = await prisma.appUser.create({
    data: { email: input.email, password_hash, nombre: input.nombre },
  });

  const role = await prisma.rol.upsert({
    where: { nombre: "bot_agent" },
    create: { nombre: "bot_agent" },
    update: {},
  });

  await prisma.userRol.create({ data: { user_id: user.user_id, rol_id: role.rol_id } });

  return { id: user.user_id, email: user.email, nombre: user.nombre };
}

export async function botLogin(email: string, password: string) {
  const result = await login({ email, password });
  if ('must_change_password' in result) {
    return { must_change_password: true, userId: result.userId };
  }
  return {
    access_token: result.token,
    refresh_token: result.refreshToken,
    user: { id: result.user.user_id, email: result.user.email, nombre: result.user.nombre },
  };
}

export async function botGetUserByWhatsapp(whatsapp: string) {
  if (!whatsapp) {
    throw new BotError("whatsapp es requerido", 400);
  }

  const user = await prisma.appUser.findUnique({
    where: { whatsapp_e164: whatsapp },
    include: {
      user_rol: { include: { rol: true } },
      user_bodega: {
        include: {
          bodega: { select: { bodega_id: true, nombre: true } },
          user_bodega_rol: { select: { rol: true } },
        },
      },
      tareas_asignadas: {
        where: { estado: { in: ["pendiente", "en_progreso"] } },
        include: {
          tarea: {
            select: {
              tarea_id: true,
              titulo: true,
              descripcion: true,
              estado: true,
              fecha_fin: true,
              bodega: { select: { bodega_id: true, nombre: true } },
            },
          },
        },
        orderBy: { assigned_at: "desc" },
      },
    },
  });

  if (!user) {
    throw new BotError("Usuario no encontrado", 404);
  }

  return {
    id: user.user_id,
    nombre: user.nombre,
    email: user.email,
    whatsapp: user.whatsapp_e164,
    whatsapp_verified_at: user.whatsapp_verified_at,
    is_active: user.is_active,
    roles_globales: user.user_rol.map((ur) => ur.rol.nombre).sort(),
    bodegas: user.user_bodega
      .filter((ub) => ub.bodega)
      .map((ub) => ({
        bodega_id: ub.bodega_id,
        nombre: ub.bodega?.nombre ?? "",
        roles_en_bodega: ub.user_bodega_rol.map((r) => r.rol).sort(),
      })),
    trabajos_activos: user.tareas_asignadas.map((ea) => ({
      tarea_asignacion_id: ea.tarea_asignacion_id,
      estado: ea.estado,
      assigned_at: ea.assigned_at,
      tarea: {
        tarea_id: ea.tarea.tarea_id,
        titulo: ea.tarea.titulo,
        descripcion: ea.tarea.descripcion,
        estado: ea.tarea.estado,
        fecha_fin: ea.tarea.fecha_fin,
        bodega: ea.tarea.bodega,
      },
    })),
  };
}

export async function botGetTareasByWhatsapp(
  whatsapp: string,
  estados?: Array<"pendiente" | "en_progreso" | "completado" | "cancelado">,
) {
  if (!whatsapp) {
    throw new BotError("whatsapp es requerido", 400);
  }

  const user = await prisma.appUser.findUnique({
    where: { whatsapp_e164: whatsapp },
    select: { user_id: true, nombre: true, whatsapp_e164: true, is_active: true },
  });

  if (!user) {
    throw new BotError("Usuario no encontrado", 404);
  }

  const estadosFilter: Array<"pendiente" | "en_progreso" | "completado" | "cancelado"> =
    estados && estados.length > 0 ? estados : ["pendiente", "en_progreso"];

  const asignaciones = await prisma.tareaAsignacion.findMany({
    where: {
      user_id: user.user_id,
      estado: { in: estadosFilter },
    },
    select: {
      tarea_asignacion_id: true,
      estado: true,
      assigned_at: true,
      observaciones: true,
      tarea: {
        select: {
          tarea_id: true,
          titulo: true,
          descripcion: true,
          prioridad: true,
          estado: true,
          fecha_fin: true,
          bodega: { select: { bodega_id: true, nombre: true } },
          finca: { select: { finca_id: true, nombre_finca: true } },
        },
      },
    },
    orderBy: { assigned_at: "desc" },
  });

  return {
    user_id: user.user_id,
    nombre: user.nombre,
    whatsapp: user.whatsapp_e164,
    tareas: asignaciones,
  };
}

async function validateBotActionByBodega(
  botUserId: string,
  onBehalfUserId: string,
  bodegaId: string,
  scopeRequired: string,
) {
  const isBot = await userHasAnyRole(botUserId, ["bot_agent", "super_agent", "admin_sistema"]);
  if (!isBot) {
    throw new BotError("El actor no tiene permisos de bot", 403);
  }

  if (await isSuperAgent(botUserId)) {
    return { bot_delegation_id: null as string | null };
  }

  const delegation = await prisma.botDelegation.findFirst({
    where: {
      bot_user_id: botUserId,
      granted_by_user_id: onBehalfUserId,
      activo: true,
      revoked_at: null,
      scopes: { has: scopeRequired },
      OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      AND: [{ OR: [{ bodega_id: null }, { bodega_id: bodegaId }] }],
    },
  });
  if (!delegation) {
    throw new BotError("No hay delegación activa para esta acción", 403);
  }

  return delegation;
}

export async function botCrearTarea(
  input: {
    onBehalfUserId: string;
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
  },
  botUserId: string,
) {
  if (!input.onBehalfUserId || !input.bodegaId || !input.procesoId) {
    throw new BotError("onBehalfUserId, bodegaId y procesoId son requeridos", 400);
  }

  const delegation = await validateBotActionByBodega(
    botUserId,
    input.onBehalfUserId,
    input.bodegaId,
    "tareas.crear",
  );

  const proceso = await prisma.protocoloProceso.findUnique({
    where: { proceso_id: input.procesoId },
    select: { nombre: true },
  });
  if (!proceso) {
    throw new BotError("Proceso no encontrado", 404);
  }

  const assigneeUserIds = Array.from(new Set(input.assigneeUserIds ?? []));
  if (assigneeUserIds.length > 0) {
    const rows = await prisma.userBodega.findMany({
      where: { bodega_id: input.bodegaId, user_id: { in: assigneeUserIds } },
      select: { user_id: true },
    });
    const allowed = new Set(rows.map((r) => r.user_id));
    const invalid = assigneeUserIds.filter((id) => !allowed.has(id));
    if (invalid.length > 0) {
      throw new BotError("Hay usuarios asignados fuera de la bodega", 400);
    }
  }

  const data: {
    bodega_id: string;
    proceso_id: string;
    created_by: string;
    titulo: string;
    prioridad: string;
    finca_id?: string;
    cuartel_id?: string;
    descripcion?: string;
    imagen_cid?: string;
    imagen_url?: string;
    fecha_fin?: Date;
    tarea_asignacion?: {
      createMany: { data: { user_id: string }[]; skipDuplicates: boolean };
    };
  } = {
    bodega_id: input.bodegaId,
    proceso_id: input.procesoId,
    created_by: input.onBehalfUserId,
    titulo: proceso.nombre,
    prioridad: input.prioridad ?? "media",
  };
  if (input.fincaId) data.finca_id = input.fincaId;
  if (input.cuartelId) data.cuartel_id = input.cuartelId;
  if (input.descripcion) data.descripcion = input.descripcion;
  if (input.imagenCid) data.imagen_cid = input.imagenCid;
  if (input.imagenUrl) data.imagen_url = input.imagenUrl;
  if (input.fechaFin) data.fecha_fin = new Date(input.fechaFin);
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
      tarea_asignacion: {
        include: { app_user: { select: { user_id: true, nombre: true, email: true, whatsapp_e164: true } } },
      },
    },
  });

  await prisma.botActionLog.create({
    data: {
      bot_user_id: botUserId,
      on_behalf_user_id: input.onBehalfUserId,
      bot_delegation_id: delegation.bot_delegation_id,
      action: "tareas.crear",
      input_payload: { ...input, assigneeUserIds } as object,
      output_payload: { tarea_id: tarea.tarea_id },
    },
  });

  return tarea;
}

export async function botActualizarAsignacionEstado(
  tareaAsignacionId: string,
  botUserId: string,
  estado: "pendiente" | "en_progreso" | "completado" | "cancelado",
  observaciones?: string,
) {
  const context = await validateBotActionAndGetContext({
    tareaAsignacionId,
    botUserId,
    scopeRequired: "tareas.actualizar_estado",
    action: "tareas.actualizar_estado",
    inputPayload: { estado, observaciones },
  });

  const data: {
    estado: typeof estado;
    updated_at: Date;
    completed_at: Date | null;
    ultima_interaccion_bot_at: Date;
    observaciones?: string | null;
  } = {
    estado,
    updated_at: new Date(),
    completed_at: estado === "completado" ? new Date() : null,
    ultima_interaccion_bot_at: new Date(),
  };
  if (observaciones !== undefined) {
    data.observaciones = observaciones;
  }

  const updated = await prisma.tareaAsignacion.update({
    where: { tarea_asignacion_id: tareaAsignacionId },
    data,
  });

  const siblings = await prisma.tareaAsignacion.findMany({
    where: { tarea_id: context.asignacion.tarea_id },
    select: { estado: true },
  });
  const allDone = siblings.length > 0 && siblings.every((s) => s.estado === "completado");
  const hasProgress = siblings.some((s) => s.estado === "en_progreso");

  await prisma.tarea.update({
    where: { tarea_id: context.asignacion.tarea_id },
    data: {
      estado: allDone ? "completado" : hasProgress ? "en_progreso" : "pendiente",
      updated_at: new Date(),
    },
  });

  await prisma.botActionLog.create({
    data: {
      bot_user_id: botUserId,
      on_behalf_user_id: context.asignacion.user_id,
      bot_delegation_id: context.delegation.bot_delegation_id,
      tarea_asignacion_id: tareaAsignacionId,
      action: "tareas.actualizar_estado",
      input_payload: { estado, observaciones: observaciones ?? null },
      output_payload: { estado_nuevo: estado },
    },
  });

  return updated;
}

export async function botGetProtocolos() {
  return prisma.protocolo.findMany({
    where: { activo: true },
    include: {
      protocolo_etapa: {
        orderBy: { orden: "asc" },
        include: {
          protocolo_proceso: {
            orderBy: { orden: "asc" },
          },
        },
      },
    },
  });
}

export async function botGetOperariosByBodega(bodegaId: string, botUserId: string) {
  const isBot = await userHasAnyRole(botUserId, ["bot_agent", "admin_sistema"]);
  if (!isBot) {
    throw new BotError("El actor no tiene permisos de bot", 403);
  }
  if (!bodegaId) {
    throw new BotError("bodegaId es requerido", 400);
  }

  const members = await prisma.userBodega.findMany({
    where: { bodega_id: bodegaId },
    include: {
      app_user: {
        select: { user_id: true, nombre: true, email: true, whatsapp_e164: true, is_active: true },
      },
      user_bodega_rol: { select: { rol: true } },
    },
  });

  return members
    .filter((m) => m.app_user?.is_active)
    .map((m) => ({
      user_id: m.app_user.user_id,
      nombre: m.app_user.nombre,
      email: m.app_user.email,
      whatsapp: m.app_user.whatsapp_e164,
      roles: m.user_bodega_rol.map((r) => r.rol),
    }));
}

export async function botAyudarCarga(
  tareaAsignacionId: string,
  botUserId: string,
  payload?: unknown,
) {
  const context = await validateBotActionAndGetContext({
    tareaAsignacionId,
    botUserId,
    scopeRequired: "tareas.cargar_datos",
    action: "tareas.cargar_datos",
    inputPayload: payload,
  });

  await prisma.tareaAsignacion.update({
    where: { tarea_asignacion_id: tareaAsignacionId },
    data: {
      estado: "en_progreso",
      ultima_interaccion_bot_at: new Date(),
      updated_at: new Date(),
    },
  });

  return prisma.botActionLog.create({
    data: {
      bot_user_id: botUserId,
      on_behalf_user_id: context.asignacion.user_id,
      bot_delegation_id: context.delegation.bot_delegation_id,
      tarea_asignacion_id: tareaAsignacionId,
      action: "tareas.cargar_datos",
      input_payload: payload ?? {},
      output_payload: { status: "en_progreso" },
    },
  });
}

export async function botSolicitarDelegacion(
  input: {
    whatsapp: string;
    scopes: string[];
    bodegaId?: string;
    expiresAt?: string;
  },
  botUserId: string,
) {
  if (!input.whatsapp || !input.scopes?.length) {
    throw new BotError("whatsapp y scopes son requeridos", 400);
  }

  await ensureBotUser(botUserId);

  const user = await prisma.appUser.findUnique({
    where: { whatsapp_e164: input.whatsapp },
    select: { user_id: true, nombre: true, is_active: true },
  });
  if (!user) {
    throw new BotError("Usuario no encontrado con ese whatsapp", 404);
  }
  if (!user.is_active) {
    throw new BotError("Usuario inactivo", 403);
  }

  if (input.bodegaId) {
    await ensureBodegaMembership(user.user_id, input.bodegaId);
  }

  cleanExpiredCodes();

  const scopes = normalizeScopes(input.scopes);
  const code = generateCode();
  pendingDelegations.set(code, {
    botUserId,
    onBehalfUserId: user.user_id,
    scopes,
    bodegaId: input.bodegaId,
    expiresAt: input.expiresAt,
    expiresCode: Date.now() + 10 * 60 * 1000, // 10 minutos
  });

  return {
    codigo: code,
    nombre_usuario: user.nombre,
    expira_en_minutos: 10,
    mensaje: `Enviá el código ${code} al encargado para confirmar la delegación`,
  };
}

export async function botConfirmarDelegacion(whatsapp: string, codigo: string) {
  if (!whatsapp || !codigo) {
    throw new BotError("whatsapp y codigo son requeridos", 400);
  }

  cleanExpiredCodes();

  const pending = pendingDelegations.get(codigo);
  if (!pending) {
    throw new BotError("Código inválido o expirado", 400);
  }

  const user = await prisma.appUser.findUnique({
    where: { whatsapp_e164: whatsapp },
    select: { user_id: true },
  });
  if (!user || user.user_id !== pending.onBehalfUserId) {
    throw new BotError("El código no corresponde a este usuario", 403);
  }

  pendingDelegations.delete(codigo);

  const data: {
    granted_by_user_id: string;
    bot_user_id: string;
    scopes: string[];
    bodega_id?: string;
    expires_at?: Date;
  } = {
    granted_by_user_id: pending.onBehalfUserId,
    bot_user_id: pending.botUserId,
    scopes: pending.scopes,
  };
  if (pending.bodegaId) data.bodega_id = pending.bodegaId;
  if (pending.expiresAt) data.expires_at = new Date(pending.expiresAt);

  return prisma.botDelegation.create({ data });
}

export async function botIniciarCreacionTarea(
  input: {
    whatsapp: string;
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
    delegacionExpiresAt?: string;
  },
  botUserId: string,
) {
  if (!input.whatsapp || !input.bodegaId || !input.procesoId) {
    throw new BotError("whatsapp, bodegaId y procesoId son requeridos", 400);
  }

  await ensureBotUser(botUserId);

  const user = await prisma.appUser.findUnique({
    where: { whatsapp_e164: input.whatsapp },
    select: { user_id: true, nombre: true, is_active: true },
  });
  if (!user) {
    throw new BotError("Usuario no encontrado con ese whatsapp", 404);
  }
  if (!user.is_active) {
    throw new BotError("Usuario inactivo", 403);
  }

  const delegation = await prisma.botDelegation.findFirst({
    where: {
      bot_user_id: botUserId,
      granted_by_user_id: user.user_id,
      activo: true,
      revoked_at: null,
      scopes: { has: "tareas.crear" },
      OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      AND: [{ OR: [{ bodega_id: null }, { bodega_id: input.bodegaId }] }],
    },
  });

  if (delegation) {
    const tareaInput: Parameters<typeof botCrearTarea>[0] = {
      onBehalfUserId: user.user_id,
      bodegaId: input.bodegaId,
      procesoId: input.procesoId,
    };
    if (input.fincaId !== undefined) tareaInput.fincaId = input.fincaId;
    if (input.cuartelId !== undefined) tareaInput.cuartelId = input.cuartelId;
    if (input.descripcion !== undefined) tareaInput.descripcion = input.descripcion;
    if (input.fechaFin !== undefined) tareaInput.fechaFin = input.fechaFin;
    if (input.prioridad !== undefined) tareaInput.prioridad = input.prioridad;
    if (input.imagenCid !== undefined) tareaInput.imagenCid = input.imagenCid;
    if (input.imagenUrl !== undefined) tareaInput.imagenUrl = input.imagenUrl;
    // Always include the whatsapp user as assignee so the task is visible in listIaJobs
    const baseAssignees = input.assigneeUserIds ?? [];
    tareaInput.assigneeUserIds = Array.from(new Set([user.user_id, ...baseAssignees]));

    const tarea = await botCrearTarea(tareaInput, botUserId);
    return { status: "created" as const, tarea };
  }

  const delegacionInput: Parameters<typeof botSolicitarDelegacion>[0] = {
    whatsapp: input.whatsapp,
    scopes: ["tareas.crear", "tareas.ver", "tareas.contactar", "tareas.cargar_datos", "tareas.resolver"],
    bodegaId: input.bodegaId,
  };
  if (input.delegacionExpiresAt !== undefined) delegacionInput.expiresAt = input.delegacionExpiresAt;

  const delegacionResult = await botSolicitarDelegacion(delegacionInput, botUserId);

  return {
    status: "delegacion_requerida" as const,
    tarea_pendiente: {
      bodegaId: input.bodegaId,
      procesoId: input.procesoId,
      fincaId: input.fincaId,
      cuartelId: input.cuartelId,
      descripcion: input.descripcion,
      fechaFin: input.fechaFin,
      prioridad: input.prioridad,
      imagenCid: input.imagenCid,
      imagenUrl: input.imagenUrl,
      assigneeUserIds: input.assigneeUserIds,
    },
    delegacion: delegacionResult,
  };
}

export async function botCrearCuartel(
  input: {
    onBehalfUserId: string;
    fincaId: string;
    codigo_cuartel: string;
    superficie_ha?: number;
    cultivo?: string;
    variedad?: string;
    sistema_productivo?: string;
    sistema_conduccion?: string;
  },
  botUserId: string,
) {
  if (!input.onBehalfUserId || !input.fincaId || !input.codigo_cuartel) {
    throw new BotError("onBehalfUserId, fincaId y codigo_cuartel son requeridos", 400);
  }

  const finca = await prisma.finca.findUnique({
    where: { finca_id: input.fincaId },
    select: { finca_id: true, bodega_id: true },
  });
  if (!finca) {
    throw new BotError("Finca no encontrada", 404);
  }

  const delegation = await validateBotActionByBodega(
    botUserId,
    input.onBehalfUserId,
    finca.bodega_id,
    "cuarteles.crear",
  );

  const cuartel = await prisma.cuartel.create({
    data: {
      finca_id: input.fincaId,
      codigo_cuartel: input.codigo_cuartel,
      ...(input.superficie_ha !== undefined ? { superficie_ha: input.superficie_ha } : {}),
      ...(input.cultivo !== undefined ? { cultivo: input.cultivo } : {}),
      ...(input.variedad !== undefined ? { variedad: input.variedad } : {}),
      ...(input.sistema_productivo !== undefined ? { sistema_productivo: input.sistema_productivo } : {}),
      ...(input.sistema_conduccion !== undefined ? { sistema_conduccion: input.sistema_conduccion } : {}),
    },
  });

  await prisma.botActionLog.create({
    data: {
      bot_user_id: botUserId,
      on_behalf_user_id: input.onBehalfUserId,
      bot_delegation_id: delegation.bot_delegation_id,
      action: "cuarteles.crear",
      input_payload: input as object,
      output_payload: { cuartel_id: cuartel.cuartel_id },
    },
  });

  return cuartel;
}

export async function createSuperAgentUser(
  actorUserId: string,
  input: { nombre: string; password: string },
) {
  const isSystemAdmin = await userHasAnyRole(actorUserId, ["admin_sistema"]);
  if (!isSystemAdmin) {
    throw new BotError("Solo admin_sistema puede crear super agentes", 403);
  }

  if (!input.nombre || !input.password) {
    throw new BotError("nombre y password son requeridos", 400);
  }

  const existing = await prisma.appUser.findFirst({ where: { nombre: input.nombre, email: null } });
  if (existing) {
    throw new BotError("Ya existe un super agente con ese nombre", 409);
  }

  const password_hash = await bcrypt.hash(input.password, 10);
  const user = await prisma.appUser.create({
    data: { nombre: input.nombre, password_hash },
  });

  const role = await prisma.rol.upsert({
    where: { nombre: "super_agent" },
    create: { nombre: "super_agent" },
    update: {},
  });

  await prisma.userRol.create({ data: { user_id: user.user_id, rol_id: role.rol_id } });

  return { id: user.user_id, nombre: user.nombre };
}

export async function superAgentLogin(nombre: string, password: string) {
  return loginByNombre(nombre, password);
}

export async function botCrearVasija(
  input: {
    onBehalfUserId: string;
    bodegaId: string;
    codigo: string;
    tipo?: string;
    capacidad_litros?: number;
    estado?: string;
    ubicacion?: string;
  },
  botUserId: string,
) {
  if (!input.onBehalfUserId || !input.bodegaId || !input.codigo) {
    throw new BotError("onBehalfUserId, bodegaId y codigo son requeridos", 400);
  }

  const delegation = await validateBotActionByBodega(
    botUserId,
    input.onBehalfUserId,
    input.bodegaId,
    "vasijas.crear",
  );

  const vasija = await prisma.vasija.create({
    data: {
      bodega_id: input.bodegaId,
      codigo: input.codigo,
      ...(input.tipo !== undefined ? { tipo: input.tipo } : {}),
      ...(input.capacidad_litros !== undefined ? { capacidad_litros: input.capacidad_litros } : {}),
      ...(input.estado !== undefined ? { estado: input.estado } : {}),
      ...(input.ubicacion !== undefined ? { ubicacion: input.ubicacion } : {}),
    },
  });

  await prisma.botActionLog.create({
    data: {
      bot_user_id: botUserId,
      on_behalf_user_id: input.onBehalfUserId,
      bot_delegation_id: delegation.bot_delegation_id,
      action: "vasijas.crear",
      input_payload: input as object,
      output_payload: { vasija_id: vasija.vasija_id },
    },
  });

  return vasija;
}
