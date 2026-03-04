import { prisma } from "../../config/prismaClient.js";
import {
  canManageBodega,
  hasAnyFincaRole,
  isSystemAdmin,
} from "../auth/scope-permissions.service.js";

type CreateEncargoInput = {
  bodegaId: string;
  fincaId?: string;
  cuartelId?: string;
  milestoneId?: string;
  titulo: string;
  descripcion?: string;
  fechaObjetivo?: string;
  prioridad?: string;
  assigneeUserIds?: string[];
};

type UpdateEncargoAsignacionEstadoInput = {
  encargoAsignacionId: string;
  userId: string;
  estado: "pendiente" | "en_progreso" | "completado" | "cancelado";
  observaciones?: string;
};

export class EncargoError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function ensureCanManageBodega(userId: string, bodegaId: string) {
  const ok = await canManageBodega(userId, bodegaId);
  if (!ok) {
    throw new EncargoError("No autorizado para administrar esta bodega", 403);
  }
}

async function ensureCanManageEncargoScope(userId: string, bodegaId: string, fincaId?: string) {
  const [isAdminSistema, canManageBodegaRole] = await Promise.all([
    isSystemAdmin(userId),
    canManageBodega(userId, bodegaId),
  ]);
  if (isAdminSistema || canManageBodegaRole) return;

  if (fincaId) {
    const hasFincaManagerRole = await hasAnyFincaRole(userId, fincaId, ["encargado_finca"]);
    if (hasFincaManagerRole) return;
  }

  throw new EncargoError("No autorizado para administrar este alcance", 403);
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
    throw new EncargoError("Hay usuarios asignados fuera de la bodega", 400);
  }
}

export async function createEncargo(input: CreateEncargoInput, actorUserId: string) {
  if (!input.bodegaId || !input.titulo) {
    throw new EncargoError("bodegaId y titulo son requeridos", 400);
  }
  await ensureCanManageEncargoScope(actorUserId, input.bodegaId, input.fincaId);

  const assigneeUserIds = Array.from(new Set(input.assigneeUserIds ?? []));
  await ensureUsersBelongToBodega(assigneeUserIds, input.bodegaId);

  const data: {
    bodega_id: string;
    finca_id?: string | null;
    cuartel_id?: string | null;
    milestone_id?: string | null;
    created_by: string;
    titulo: string;
    prioridad: string;
    descripcion?: string | null;
    fecha_objetivo?: Date | null;
    encargo_asignacion?: {
      createMany: {
        data: { user_id: string }[];
        skipDuplicates: boolean;
      };
    };
  } = {
    bodega_id: input.bodegaId,
    created_by: actorUserId,
    titulo: input.titulo,
    prioridad: input.prioridad ?? "media",
  };
  if (input.fincaId !== undefined) {
    data.finca_id = input.fincaId;
  }
  if (input.cuartelId !== undefined) {
    data.cuartel_id = input.cuartelId;
  }
  if (input.milestoneId !== undefined) {
    data.milestone_id = input.milestoneId;
  }
  if (input.descripcion !== undefined) {
    data.descripcion = input.descripcion;
  }
  if (input.fechaObjetivo) {
    data.fecha_objetivo = new Date(input.fechaObjetivo);
  }
  if (assigneeUserIds.length > 0) {
    data.encargo_asignacion = {
      createMany: {
        data: assigneeUserIds.map((userId) => ({ user_id: userId })),
        skipDuplicates: true,
      },
    };
  }

  const encargo = await prisma.encargo.create({
    data,
    include: {
      encargo_asignacion: {
        include: { app_user: { select: { user_id: true, nombre: true, email: true, whatsapp_e164: true } } },
      },
    },
  });

  return encargo;
}

export async function listEncargos(
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
    return prisma.encargo.findMany({
      where: {
        ...(bodegaId ? { bodega_id: bodegaId } : {}),
        ...(fincaId ? { finca_id: fincaId } : {}),
        ...(estadoFilter ? { estado: estadoFilter } : {}),
      },
      orderBy: [{ created_at: "desc" }],
      include: { encargo_asignacion: true },
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
    throw new EncargoError("No autorizado para ver encargos", 403);
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
      throw new EncargoError("No autorizado para ver encargos de esta bodega", 403);
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

  return prisma.encargo.findMany({ where, orderBy: [{ created_at: "desc" }], include: { encargo_asignacion: true } });
}

export async function addEncargoAsignaciones(
  encargoId: string,
  userIds: string[],
  actorUserId: string,
) {
  if (!encargoId || userIds.length === 0) {
    throw new EncargoError("encargoId y userIds son requeridos", 400);
  }
  const encargo = await prisma.encargo.findUnique({
    where: { encargo_id: encargoId },
    select: { bodega_id: true },
  });
  if (!encargo) {
    throw new EncargoError("Encargo no encontrado", 404);
  }
  await ensureCanManageEncargoScope(actorUserId, encargo.bodega_id);

  const uniqueUserIds = Array.from(new Set(userIds));
  await ensureUsersBelongToBodega(uniqueUserIds, encargo.bodega_id);

  await prisma.encargoAsignacion.createMany({
    data: uniqueUserIds.map((userId) => ({
      encargo_id: encargoId,
      user_id: userId,
    })),
    skipDuplicates: true,
  });

  return prisma.encargoAsignacion.findMany({
    where: { encargo_id: encargoId },
    include: {
      app_user: {
        select: { user_id: true, nombre: true, email: true, whatsapp_e164: true },
      },
    },
    orderBy: { assigned_at: "asc" },
  });
}

export async function cancelEncargo(encargoId: string, actorUserId: string) {
  if (!encargoId) {
    throw new EncargoError("encargoId requerido", 400);
  }

  const encargo = await prisma.encargo.findUnique({
    where: { encargo_id: encargoId },
    select: { encargo_id: true, bodega_id: true, estado: true },
  });
  if (!encargo) {
    throw new EncargoError("Encargo no encontrado", 404);
  }

  await ensureCanManageBodega(actorUserId, encargo.bodega_id);

  if (encargo.estado === "cancelado") {
    return prisma.encargo.findUnique({
      where: { encargo_id: encargoId },
      include: { encargo_asignacion: true },
    });
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.encargo.update({
      where: { encargo_id: encargoId },
      data: {
        estado: "cancelado",
        updated_at: now,
      },
    }),
    prisma.encargoAsignacion.updateMany({
      where: { encargo_id: encargoId },
      data: {
        estado: "cancelado",
        updated_at: now,
        completed_at: null,
      },
    }),
    prisma.milestoneAsignacion.updateMany({
      where: { encargo_id: encargoId },
      data: {
        estado: "cancelado",
        updated_at: now,
      },
    }),
  ]);

  return prisma.encargo.findUnique({
    where: { encargo_id: encargoId },
    include: { encargo_asignacion: true },
  });
}

export async function listMyEncargoAsignaciones(userId: string) {
  return prisma.encargoAsignacion.findMany({
    where: { user_id: userId },
    include: {
      encargo: true,
    },
    orderBy: [{ assigned_at: "desc" }],
  });
}

export async function listMyPendientes(userId: string) {
  const estados = ["pendiente", "en_progreso"] as Array<
    "pendiente" | "en_progreso"
  >;
  return prisma.encargoAsignacion.findMany({
    where: {
      user_id: userId,
      estado: { in: estados },
    },
    include: {
      encargo: true,
    },
    orderBy: [{ assigned_at: "desc" }],
  });
}

export async function listPendientesByBodega(actorUserId: string, bodegaId: string) {
  return listEncargos(actorUserId, bodegaId, undefined, true);
}

export async function updateMyEncargoAsignacionEstado(input: UpdateEncargoAsignacionEstadoInput) {
  const row = await prisma.encargoAsignacion.findUnique({
    where: { encargo_asignacion_id: input.encargoAsignacionId },
    include: {
      encargo: {
        select: {
          encargo_id: true,
          encargo_asignacion: {
            select: { estado: true },
          },
        },
      },
    },
  });
  if (!row) {
    throw new EncargoError("Asignación no encontrada", 404);
  }
  if (row.user_id !== input.userId) {
    throw new EncargoError("No autorizado", 403);
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

  const updated = await prisma.encargoAsignacion.update({
    where: { encargo_asignacion_id: input.encargoAsignacionId },
    data,
  });

  const siblings = await prisma.encargoAsignacion.findMany({
    where: { encargo_id: row.encargo_id },
    select: { estado: true },
  });
  const allDone = siblings.length > 0 && siblings.every((s) => s.estado === "completado");
  const hasProgress = siblings.some((s) => s.estado === "en_progreso");

  await prisma.encargo.update({
    where: { encargo_id: row.encargo_id },
    data: {
      estado: allDone ? "completado" : hasProgress ? "en_progreso" : "pendiente",
      updated_at: new Date(),
    },
  });

  return updated;
}

export async function canUserManageEncargos(userId: string) {
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
