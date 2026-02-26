import { prisma } from "../../config/prismaClient.js";

type CreateCampaniaInput = {
  bodegaId: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado?: string;
  userId: string;
};

export class CampaniaError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function ensureUserBodega(userId: string, bodegaId: string) {
  const rel = await prisma.userBodega.findFirst({
    where: { user_id: userId, bodega_id: bodegaId },
  });
  if (!rel) {
    throw new CampaniaError("No autorizado para esta bodega", 403);
  }
}

export async function listCampanias(userId: string, bodegaId?: string) {
  if (bodegaId) {
    await ensureUserBodega(userId, bodegaId);
    return prisma.campania.findMany({ where: { bodega_id: bodegaId } });
  }

  const bodegas = await prisma.userBodega.findMany({
    where: { user_id: userId },
    select: { bodega_id: true },
  });
  const ids = bodegas.map((b) => b.bodega_id);
  if (ids.length === 0) return [];

  return prisma.campania.findMany({
    where: { bodega_id: { in: ids } },
  });
}

export async function createCampania({
  bodegaId,
  nombre,
  fecha_inicio,
  fecha_fin,
  estado,
  userId,
}: CreateCampaniaInput) {
  if (!bodegaId || !nombre || !fecha_inicio || !fecha_fin) {
    throw new CampaniaError("Datos incompletos", 400);
  }

  await ensureUserBodega(userId, bodegaId);

  const data: {
    bodega_id: string;
    nombre: string;
    fecha_inicio: Date;
    fecha_fin: Date;
    estado?: string;
  } = {
    bodega_id: bodegaId,
    nombre,
    fecha_inicio: new Date(fecha_inicio),
    fecha_fin: new Date(fecha_fin),
  };

  if (estado !== undefined) data.estado = estado;

  return prisma.campania.create({ data });
}
