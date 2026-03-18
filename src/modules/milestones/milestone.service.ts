import { prisma } from '../../config/prismaClient.js';
import {
  canManageBodega,
  hasAnyFincaRole,
  isSystemAdmin,
} from "../auth/scope-permissions.service.js";

const FIELD_ASSIGNABLE_ROLES = ["encargado_finca", "operador_campo"];

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
    select: { bodega_id: true, finca_id: true },
  });
  if (!trazabilidad) {
    throw new Error('Trazabilidad no encontrada');
  }

  const [isAdminSistema, canManageBodegaRole, hasFincaRole] = await Promise.all([
    isSystemAdmin(userId),
    canManageBodega(userId, trazabilidad.bodega_id),
    trazabilidad.finca_id ? hasAnyFincaRole(userId, trazabilidad.finca_id) : Promise.resolve(false),
  ]);

  if (!isAdminSistema && !canManageBodegaRole && !hasFincaRole) {
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
  descripcion,
  prioridad,
}: {
  milestoneId: string;
  fincaId: string;
  cuartelId: string;
  operarioUserId: string;
  actorUserId: string;
  descripcion?: string;
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

  const [isAdminSistema, canManageBodegaRole, hasFincaManagerRole] = await Promise.all([
    isSystemAdmin(actorUserId),
    canManageBodega(actorUserId, trazabilidad.bodega_id),
    hasAnyFincaRole(actorUserId, fincaId, ["encargado_finca"]),
  ]);
  if (!isAdminSistema && !canManageBodegaRole && !hasFincaManagerRole) {
    throw new Error("No autorizado para asignar milestones en esta finca");
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

  const operarioConRolEnFinca = await hasAnyFincaRole(operarioUserId, fincaId, FIELD_ASSIGNABLE_ROLES);
  if (!operarioConRolEnFinca) {
    throw new Error("El usuario asignado no tiene rol de campo en la finca");
  }

  const tareaData = {
    bodega_id: trazabilidad.bodega_id,
    proceso_id: milestone.proceso_id,
    finca_id: fincaId,
    cuartel_id: cuartelId,
    created_by: actorUserId,
    titulo: milestone.protocolo_proceso?.nombre ?? milestone.proceso_id,
    descripcion: descripcion ?? null,
    prioridad: prioridad ?? "media",
    estado: "pendiente" as const,
  };

  const createdTarea = await prisma.tarea.create({
    data: tareaData,
    select: { tarea_id: true },
  });
  const tareaId = createdTarea.tarea_id;

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
    },
    update: {
      finca_id: fincaId,
      cuartel_id: cuartelId,
      asignado_por_user_id: actorUserId,
      estado: "pendiente",
      updated_at: new Date(),
    },
  });

  await prisma.tareaAsignacion.upsert({
    where: {
      tarea_id_user_id: {
        tarea_id: tareaId,
        user_id: operarioUserId,
      },
    },
    create: {
      tarea_id: tareaId,
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
