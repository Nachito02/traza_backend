import { prisma } from "../../config/prismaClient.js";
import { userHasAnyRole } from "../../middlewares/roles.middleware.js";

const MANAGER_BODEGA_ROLES = ["admin_bodega", "encargado_finca"];

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
  const isSuperAdmin = await userHasAnyRole(userId, ["super_admin"]);
  if (isSuperAdmin) return;

  const rel = await prisma.userBodegaRol.findFirst({
    where: {
      user_id: userId,
      bodega_id: bodegaId,
      rol: { in: MANAGER_BODEGA_ROLES },
    },
  });
  if (!rel) {
    throw new EncargoError("No autorizado para administrar esta bodega", 403);
  }
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
  await ensureCanManageBodega(actorUserId, input.bodegaId);

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
  const isSuperAdmin = await userHasAnyRole(actorUserId, ["super_admin"]);
  if (isSuperAdmin) {
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

  const memberships = await prisma.userBodegaRol.findMany({
    where: {
      user_id: actorUserId,
      rol: { in: MANAGER_BODEGA_ROLES },
    },
    select: { bodega_id: true },
  });
  const allowedBodegas = memberships.map((m) => m.bodega_id);
  if (allowedBodegas.length === 0) {
    throw new EncargoError("No autorizado para ver encargos", 403);
  }

  if (bodegaId && !allowedBodegas.includes(bodegaId)) {
    throw new EncargoError("No autorizado para ver encargos de esta bodega", 403);
  }

  return prisma.encargo.findMany({
    where: {
      bodega_id: bodegaId ?? { in: allowedBodegas },
      ...(fincaId ? { finca_id: fincaId } : {}),
      ...(estadoFilter ? { estado: estadoFilter } : {}),
    },
    orderBy: [{ created_at: "desc" }],
    include: { encargo_asignacion: true },
  });
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
  await ensureCanManageBodega(actorUserId, encargo.bodega_id);

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
  const isSuperAdmin = await userHasAnyRole(userId, ["super_admin"]);
  if (isSuperAdmin) return true;
  const membership = await prisma.userBodegaRol.findFirst({
    where: {
      user_id: userId,
      rol: { in: MANAGER_BODEGA_ROLES },
    },
    select: { user_id: true },
  });
  return Boolean(membership);
}
