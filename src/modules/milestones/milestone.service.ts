import { prisma } from '../../config/prismaClient.js';
import { userHasAnyRole } from "../../middlewares/roles.middleware.js";

const MANAGER_BODEGA_ROLES = ["admin_bodega", "encargado_finca"];

export async function getUserMilestones(userId: string) {
  const milestones = await prisma.milestone.findMany({
    where: {
      created_by: userId,
    },
  });
  return milestones;
}

async function ensureUserTrazabilidad(userId: string, trazabilidadId: string) {
  const trazabilidad = await prisma.trazabilidad.findUnique({
    where: { trazabilidad_id: trazabilidadId },
    select: { bodega_id: true },
  });
  if (!trazabilidad) {
    throw new Error('Trazabilidad no encontrada');
  }
  const rel = await prisma.userBodega.findFirst({
    where: { user_id: userId, bodega_id: trazabilidad.bodega_id },
  });
  if (!rel) {
    throw new Error('No autorizado');
  }
}

export async function listMilestonesByTrazabilidad(
  trazabilidadId: string,
  userId: string,
) {
  await ensureUserTrazabilidad(userId, trazabilidadId);
  return prisma.milestone.findMany({
    where: { trazabilidad_id: trazabilidadId },

    include: {
      protocolo_proceso: {
        include: {
          protocolo_etapa: true,
        },
      },
      evidencia: true,
      milestone_asignacion: {
        include: {
          operario: { select: { user_id: true, nombre: true, email: true } },
          finca: { select: { finca_id: true, nombre_finca: true } },
          cuartel: { select: { cuartel_id: true, codigo_cuartel: true } },
        },
      },
    },
    orderBy: {
      protocolo_proceso: {
        orden: 'asc',
      },
    },
  });
}

export async function assignMilestoneToOrigen({
  milestoneId,
  fincaId,
  cuartelId,
  operarioUserId,
  actorUserId,
  titulo,
  descripcion,
  fechaObjetivo,
  prioridad,
}: {
  milestoneId: string;
  fincaId: string;
  cuartelId: string;
  operarioUserId: string;
  actorUserId: string;
  titulo?: string;
  descripcion?: string;
  fechaObjetivo?: string;
  prioridad?: string;
}) {
  if (!milestoneId || !fincaId || !cuartelId || !operarioUserId) {
    throw new Error("Datos incompletos");
  }

  const milestone = await prisma.milestone.findUnique({
    where: { milestone_id: milestoneId },
    select: {
      milestone_id: true,
      trazabilidad_id: true,
      proceso_id: true,
      protocolo_proceso: { select: { nombre: true } },
    },
  });
  if (!milestone) {
    throw new Error("Milestone no encontrado");
  }

  const trazabilidad = await prisma.trazabilidad.findUnique({
    where: { trazabilidad_id: milestone.trazabilidad_id },
    select: { trazabilidad_id: true, bodega_id: true },
  });
  if (!trazabilidad) {
    throw new Error("Trazabilidad no encontrada");
  }

  const isSystemAdmin = await userHasAnyRole(actorUserId, ["super_admin", "admin_sistema"]);
  if (!isSystemAdmin) {
    const managerRel = await prisma.userBodegaRol.findFirst({
      where: {
        user_id: actorUserId,
        bodega_id: trazabilidad.bodega_id,
        rol: { in: MANAGER_BODEGA_ROLES },
      },
      select: { user_id: true },
    });
    if (!managerRel) {
      throw new Error("No autorizado para asignar milestones en esta bodega");
    }
  }

  const origen = await prisma.trazabilidadOrigen.findFirst({
    where: {
      trazabilidad_id: trazabilidad.trazabilidad_id,
      finca_id: fincaId,
      cuartel_id: cuartelId,
    },
    select: { trazabilidad_id: true },
  });
  if (!origen) {
    throw new Error("El origen (finca/cuartel) no está vinculado a la trazabilidad");
  }

  const operarioRel = await prisma.userBodegaRol.findFirst({
    where: {
      user_id: operarioUserId,
      bodega_id: trazabilidad.bodega_id,
      rol: "operador_campo",
    },
    select: { user_id: true },
  });
  if (!operarioRel) {
    throw new Error("El usuario asignado no es operario de la bodega");
  }

  const existingAssignment = await prisma.milestoneAsignacion.findUnique({
    where: {
      milestone_id_operario_user_id: {
        milestone_id: milestoneId,
        operario_user_id: operarioUserId,
      },
    },
    select: { encargo_id: true },
  });

  let encargoId = existingAssignment?.encargo_id ?? null;
  const encargoTitulo = titulo || `Milestone: ${milestone.protocolo_proceso?.nombre ?? milestone.proceso_id}`;
  const encargoData = {
    bodega_id: trazabilidad.bodega_id,
    finca_id: fincaId,
    cuartel_id: cuartelId,
    milestone_id: milestoneId,
    created_by: actorUserId,
    titulo: encargoTitulo,
    descripcion: descripcion ?? null,
    prioridad: prioridad ?? "media",
    fecha_objetivo: fechaObjetivo ? new Date(fechaObjetivo) : null,
    estado: "pendiente" as const,
  };

  if (!encargoId) {
    const createdEncargo = await prisma.encargo.create({
      data: encargoData,
      select: { encargo_id: true },
    });
    encargoId = createdEncargo.encargo_id;
  } else {
    await prisma.encargo.update({
      where: { encargo_id: encargoId },
      data: encargoData,
    });
  }

  await prisma.milestoneAsignacion.upsert({
    where: {
      milestone_id_operario_user_id: {
        milestone_id: milestoneId,
        operario_user_id: operarioUserId,
      },
    },
    create: {
      milestone_id: milestoneId,
      finca_id: fincaId,
      cuartel_id: cuartelId,
      operario_user_id: operarioUserId,
      asignado_por_user_id: actorUserId,
      estado: "pendiente",
      encargo_id: encargoId,
    },
    update: {
      finca_id: fincaId,
      cuartel_id: cuartelId,
      asignado_por_user_id: actorUserId,
      estado: "pendiente",
      encargo_id: encargoId,
      updated_at: new Date(),
    },
  });

  await prisma.encargoAsignacion.upsert({
    where: {
      encargo_id_user_id: {
        encargo_id: encargoId,
        user_id: operarioUserId,
      },
    },
    create: {
      encargo_id: encargoId,
      user_id: operarioUserId,
      estado: "pendiente",
    },
    update: {
      estado: "pendiente",
      updated_at: new Date(),
      completed_at: null,
    },
  });

  return prisma.milestoneAsignacion.findUnique({
    where: {
      milestone_id_operario_user_id: {
        milestone_id: milestoneId,
        operario_user_id: operarioUserId,
      },
    },
    include: {
      operario: { select: { user_id: true, nombre: true, email: true } },
      finca: { select: { finca_id: true, nombre_finca: true } },
      cuartel: { select: { cuartel_id: true, codigo_cuartel: true } },
      encargo: true,
    },
  });
}

export async function completeMilestone(milestoneId: string, userId: string) {
  const milestone = await prisma.milestone.findUnique({
    where: { milestone_id: milestoneId },
    select: { trazabilidad_id: true },
  });
  if (!milestone) {
    throw new Error('Milestone no encontrado');
  }
  await ensureUserTrazabilidad(userId, milestone.trazabilidad_id);

  return prisma.milestone.update({
    where: { milestone_id: milestoneId },
    data: {
      estado: 'completado',
      event_date: new Date(),
    },
  });
}

export async function createMilestone({
  trazabilidadId,
  procesoId,
  userId,
}: {
  trazabilidadId: string;
  procesoId: string;
  userId: string;
}) {
  if (!trazabilidadId || !procesoId) {
    throw new Error('Datos incompletos');
  }

  return prisma.milestone.create({
    data: {
      trazabilidad_id: trazabilidadId,
      proceso_id: procesoId,
      created_by: userId,
      event_date: new Date(),
    },
  });
}

export async function addEvidence({
  milestoneId,
  url,
  tipo = 'imagen',
  userId,
}: {
  milestoneId: string;
  url: string;
  tipo?: 'imagen' | 'pdf' | 'planilla' | 'otro';
  userId: string;
}) {
  const milestone = await prisma.milestone.findUnique({
    where: { milestone_id: milestoneId },
    select: { trazabilidad_id: true },
  });

  if (!milestone) {
    throw new Error('Milestone no encontrado');
  }

  await ensureUserTrazabilidad(userId, milestone.trazabilidad_id);

  return prisma.evidencia.create({
    data: {
      milestone_id: milestoneId,
      url,
      tipo,
    },
  });
}
