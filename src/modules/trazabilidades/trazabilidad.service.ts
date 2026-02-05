import { prisma } from "../../config/prismaClient.js";

type CreateTrazabilidadInput = {
  protocoloId: string;
  bodegaId: string;
  fincaId: string;
  cuartelId: string;
  campaniaId: string;
  nombre_producto?: string;
  imagen_producto?: string;
  userId: string;
};

export class TrazabilidadError extends Error {
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
    throw new TrazabilidadError("No autorizado para esta bodega", 403);
  }
}

export async function listTrazabilidades(userId: string, bodegaId?: string) {
  if (bodegaId) {
    await ensureUserBodega(userId, bodegaId);
    return prisma.trazabilidad.findMany({ where: { bodega_id: bodegaId } });
  }

  const bodegas = await prisma.userBodega.findMany({
    where: { user_id: userId },
    select: { bodega_id: true },
  });
  const ids = bodegas.map((b) => b.bodega_id);
  if (ids.length === 0) return [];

  return prisma.trazabilidad.findMany({
    where: { bodega_id: { in: ids } },
  });
}

export async function createTrazabilidad({
  protocoloId,
  bodegaId,
  fincaId,
  cuartelId,
  campaniaId,
  nombre_producto,
  imagen_producto,
  userId,
}: CreateTrazabilidadInput) {
  if (!protocoloId || !bodegaId || !fincaId || !cuartelId || !campaniaId) {
    throw new TrazabilidadError("Datos incompletos", 400);
  }

  await ensureUserBodega(userId, bodegaId);

  const finca = await prisma.finca.findUnique({
    where: { finca_id: fincaId },
    select: { bodega_id: true },
  });
  if (!finca || finca.bodega_id !== bodegaId) {
    throw new TrazabilidadError("La finca no pertenece a la bodega", 400);
  }

  const cuartel = await prisma.cuartel.findUnique({
    where: { cuartel_id: cuartelId },
    select: { finca_id: true },
  });
  if (!cuartel || cuartel.finca_id !== fincaId) {
    throw new TrazabilidadError("El cuartel no pertenece a la finca", 400);
  }

  const protocolo = await prisma.protocolo.findUnique({
    where: { protocolo_id: protocoloId },
    select: { protocolo_id: true },
  });
  if (!protocolo) {
    throw new TrazabilidadError("Protocolo no encontrado", 404);
  }

  const campania = await prisma.campania.findUnique({
    where: { campania_id: campaniaId },
    select: { campania_id: true },
  });
  if (!campania) {
    throw new TrazabilidadError("Campaña no encontrada", 404);
  }

  const data: {
    protocolo_id: string;
    bodega_id: string;
    finca_id: string;
    cuartel_id: string;
    campania_id: string;
    nombre_producto?: string | null;
    imagen_producto?: string | null;
  } = {
    protocolo_id: protocoloId,
    bodega_id: bodegaId,
    finca_id: fincaId,
    cuartel_id: cuartelId,
    campania_id: campaniaId,
  };

  if (nombre_producto !== undefined) data.nombre_producto = nombre_producto;
  if (imagen_producto !== undefined) data.imagen_producto = imagen_producto;

  return prisma.trazabilidad.create({ data });
}
