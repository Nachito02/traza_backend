import { prisma } from '../../config/prismaClient.js';

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
    },
    orderBy: {
      protocolo_proceso: {
        orden: 'asc',
      },
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
