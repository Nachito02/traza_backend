import { prisma } from "../../config/prismaClient.js";

type CreateFincaInput = {
  bodegaId: string;
  nombre_finca: string;
  rut?: string;
  renspa?: string;
  catastro?: string;
  ubicacion_texto?: string;
  userId: string;
};

export class FincaError extends Error {
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
    throw new FincaError("No autorizado para esta bodega", 403);
  }
}

export async function listFincasByBodega(bodegaId: string, userId: string) {
  await ensureUserBodega(userId, bodegaId);
  return prisma.finca.findMany({ where: { bodega_id: bodegaId } });
}

export async function createFinca({
  bodegaId,
  nombre_finca,
  rut,
  renspa,
  catastro,
  ubicacion_texto,
  userId,
}: CreateFincaInput) {
  if (!bodegaId || !nombre_finca) {
    throw new FincaError("Datos incompletos", 400);
  }

  await ensureUserBodega(userId, bodegaId);

  const data: {
    bodega_id: string;
    nombre_finca: string;
    rut?: string | null;
    renspa?: string | null;
    catastro?: string | null;
    ubicacion_texto?: string | null;
  } = { bodega_id: bodegaId, nombre_finca };

  if (rut !== undefined) data.rut = rut;
  if (renspa !== undefined) data.renspa = renspa;
  if (catastro !== undefined) data.catastro = catastro;
  if (ubicacion_texto !== undefined) data.ubicacion_texto = ubicacion_texto;

  return prisma.finca.create({ data });
}
