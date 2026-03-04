import { prisma } from "../../config/prismaClient.js";
import { canAccessFinca, canOperateFinca } from "../auth/scope-permissions.service.js";

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

type UpdateCuartelInput = {
  codigo_cuartel?: string;
  superficie_ha?: number;
  cultivo?: string | null;
  variedad?: string | null;
  sistema_productivo?: string | null;
  sistema_conduccion?: string | null;
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
    select: { finca_id: true },
  });
  if (!finca) {
    throw new CuartelError("Finca no encontrada", 404);
  }
  const canAccess = await canAccessFinca(userId, fincaId);
  if (!canAccess) {
    throw new CuartelError("No autorizado para esta finca", 403);
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

  const finca = await ensureUserFinca(userId, fincaId);
  const canOperate = await canOperateFinca(userId, fincaId);
  if (!canOperate) {
    throw new CuartelError("No autorizado para operar esta finca", 403);
  }

  const data: {
    finca_id: string;
    codigo_cuartel: string;
    superficie_ha?: number;
    cultivo?: string | null;
    variedad?: string | null;
    sistema_productivo?: string | null;
    sistema_conduccion?: string | null;
  } = { finca_id: finca.finca_id, codigo_cuartel };

  if (superficie_ha !== undefined) data.superficie_ha = superficie_ha;
  if (cultivo !== undefined) data.cultivo = cultivo;
  if (variedad !== undefined) data.variedad = variedad;
  if (sistema_productivo !== undefined) data.sistema_productivo = sistema_productivo;
  if (sistema_conduccion !== undefined) data.sistema_conduccion = sistema_conduccion;

  return prisma.cuartel.create({ data });
}

export async function getCuartelById(cuartelId: string, userId: string) {
  if (!cuartelId) {
    throw new CuartelError("cuartelId requerido", 400);
  }

  const cuartel = await prisma.cuartel.findUnique({
    where: { cuartel_id: cuartelId },
  });
  if (!cuartel) {
    throw new CuartelError("Cuartel no encontrado", 404);
  }

  await ensureUserFinca(userId, cuartel.finca_id);
  return cuartel;
}

export async function updateCuartel(
  cuartelId: string,
  {
    codigo_cuartel,
    superficie_ha,
    cultivo,
    variedad,
    sistema_productivo,
    sistema_conduccion,
    userId,
  }: UpdateCuartelInput,
) {
  const cuartel = await getCuartelById(cuartelId, userId);
  const canOperate = await canOperateFinca(userId, cuartel.finca_id);
  if (!canOperate) {
    throw new CuartelError("No autorizado para operar esta finca", 403);
  }

  const data: {
    codigo_cuartel?: string;
    superficie_ha?: number;
    cultivo?: string | null;
    variedad?: string | null;
    sistema_productivo?: string | null;
    sistema_conduccion?: string | null;
  } = {};

  if (codigo_cuartel !== undefined) data.codigo_cuartel = codigo_cuartel;
  if (superficie_ha !== undefined) data.superficie_ha = superficie_ha;
  if (cultivo !== undefined) data.cultivo = cultivo;
  if (variedad !== undefined) data.variedad = variedad;
  if (sistema_productivo !== undefined) data.sistema_productivo = sistema_productivo;
  if (sistema_conduccion !== undefined) data.sistema_conduccion = sistema_conduccion;

  if (Object.keys(data).length === 0) {
    throw new CuartelError("No hay campos para actualizar", 400);
  }

  return prisma.cuartel.update({
    where: { cuartel_id: cuartel.cuartel_id },
    data,
  });
}

export async function deleteCuartel(cuartelId: string, userId: string) {
  const cuartel = await getCuartelById(cuartelId, userId);
  const canOperate = await canOperateFinca(userId, cuartel.finca_id);
  if (!canOperate) {
    throw new CuartelError("No autorizado para operar esta finca", 403);
  }
  await prisma.cuartel.delete({ where: { cuartel_id: cuartel.cuartel_id } });
  return { deleted: true };
}
