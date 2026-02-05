import { prisma } from "../../config/prismaClient.js";

type CreateCuartelInput = {
  fincaId: string;
  codigo_cuartel: string;
  superficie_ha?: number;
  cultivo?: string;
  variedad?: string;
  sistema_productivo?: string;
  sistema_conduccion?: string;
  userId: string;
};

export class CuartelError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function ensureUserFinca(userId: string, fincaId: string) {
  const finca = await prisma.finca.findUnique({
    where: { finca_id: fincaId },
    select: { bodega_id: true },
  });
  if (!finca) {
    throw new CuartelError("Finca no encontrada", 404);
  }
  const rel = await prisma.userBodega.findFirst({
    where: { user_id: userId, bodega_id: finca.bodega_id },
  });
  if (!rel) {
    throw new CuartelError("No autorizado para esta bodega", 403);
  }
  return finca;
}

export async function listCuartelesByFinca(fincaId: string, userId: string) {
  await ensureUserFinca(userId, fincaId);
  return prisma.cuartel.findMany({ where: { finca_id: fincaId } });
}

export async function createCuartel({
  fincaId,
  codigo_cuartel,
  superficie_ha,
  cultivo,
  variedad,
  sistema_productivo,
  sistema_conduccion,
  userId,
}: CreateCuartelInput) {
  if (!fincaId || !codigo_cuartel) {
    throw new CuartelError("Datos incompletos", 400);
  }

  await ensureUserFinca(userId, fincaId);

  const data: {
    finca_id: string;
    codigo_cuartel: string;
    superficie_ha?: number;
    cultivo?: string | null;
    variedad?: string | null;
    sistema_productivo?: string | null;
    sistema_conduccion?: string | null;
  } = { finca_id: fincaId, codigo_cuartel };

  if (superficie_ha !== undefined) data.superficie_ha = superficie_ha;
  if (cultivo !== undefined) data.cultivo = cultivo;
  if (variedad !== undefined) data.variedad = variedad;
  if (sistema_productivo !== undefined) data.sistema_productivo = sistema_productivo;
  if (sistema_conduccion !== undefined) data.sistema_conduccion = sistema_conduccion;

  return prisma.cuartel.create({ data });
}
