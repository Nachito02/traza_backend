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

export class TareaError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
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

export async function createTarea(input: CreateTareaInput, actorUserId: string) {
  if (!input.bodegaId || !input.procesoId) {
    throw new TareaError("bodegaId y procesoId son requeridos", 400);
  }
  await ensureCanManageTareaScope(actorUserId, input.bodegaId, input.fincaId);

  const proceso = await prisma.protocoloProceso.findUnique({
    where: { proceso_id: input.procesoId },
    select: { nombre: true },
  });
  if (!proceso) {
    throw new TareaError("Proceso no encontrado", 404);
  }

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
      include: { tarea_asignacion: true },
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

  return prisma.tarea.findMany({ where, orderBy: [{ created_at: "desc" }], include: { tarea_asignacion: true } });
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

export async function listMyTareaAsignaciones(userId: string) {
  return prisma.tareaAsignacion.findMany({
    where: { user_id: userId },
    include: {
      tarea: true,
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
      tarea: true,
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
