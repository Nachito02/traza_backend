import { prisma } from "../../config/prismaClient.js";
import { userHasAnyRole } from "../../middlewares/roles.middleware.js";

type CreateDelegationInput = {
  botUserId: string;
  bodegaId?: string;
  scopes: string[];
  expiresAt?: string;
};

type BotActionInput = {
  encargoAsignacionId: string;
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

async function ensureBotUser(botUserId: string) {
  const exists = await prisma.appUser.findUnique({
    where: { user_id: botUserId },
    select: { user_id: true },
  });
  if (!exists) {
    throw new BotError("Usuario bot no encontrado", 404);
  }
  const isBotAgent = await userHasAnyRole(botUserId, ["bot_agent", "admin_sistema"]);
  if (!isBotAgent) {
    throw new BotError("El usuario indicado no tiene rol bot_agent", 400);
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
  const isBot = await userHasAnyRole(input.botUserId, ["bot_agent", "admin_sistema"]);
  if (!isBot) {
    throw new BotError("El actor no tiene permisos de bot", 403);
  }

  const asignacion = await prisma.encargoAsignacion.findUnique({
    where: { encargo_asignacion_id: input.encargoAsignacionId },
    include: {
      encargo: {
        select: {
          bodega_id: true,
        },
      },
    },
  });
  if (!asignacion) {
    throw new BotError("Asignación no encontrada", 404);
  }

  const delegation = await prisma.botDelegation.findFirst({
    where: {
      granted_by_user_id: asignacion.user_id,
      bot_user_id: input.botUserId,
      activo: true,
      revoked_at: null,
      scopes: { has: input.scopeRequired },
      OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      AND: [
        {
          OR: [{ bodega_id: null }, { bodega_id: asignacion.encargo.bodega_id }],
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
  encargoAsignacionId: string,
  botUserId: string,
  message?: string,
) {
  const context = await validateBotActionAndGetContext({
    encargoAsignacionId,
    botUserId,
    scopeRequired: "encargos.contactar",
    action: "encargos.contactar",
    inputPayload: { message },
  });

  await prisma.encargoAsignacion.update({
    where: { encargo_asignacion_id: encargoAsignacionId },
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
      encargo_asignacion_id: encargoAsignacionId,
      action: "encargos.contactar",
      input_payload: { message: message ?? null },
      output_payload: { status: "contactado" },
    },
  });
}

export async function botAyudarCarga(
  encargoAsignacionId: string,
  botUserId: string,
  payload?: unknown,
) {
  const context = await validateBotActionAndGetContext({
    encargoAsignacionId,
    botUserId,
    scopeRequired: "encargos.cargar_datos",
    action: "encargos.cargar_datos",
    inputPayload: payload,
  });

  await prisma.encargoAsignacion.update({
    where: { encargo_asignacion_id: encargoAsignacionId },
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
      encargo_asignacion_id: encargoAsignacionId,
      action: "encargos.cargar_datos",
      input_payload: payload ?? {},
      output_payload: { status: "en_progreso" },
    },
  });
}
