import { prisma } from "../../config/prismaClient.js";
import { userHasAnyRole } from "../../middlewares/roles.middleware.js";

type CreateFincaInput = {
  bodegaId: string;
  nombre_finca: string;
  rut?: string;
  renspa?: string;
  catastro?: string;
  ubicacion_texto?: string;
  userId: string;
};

type UpdateFincaInput = {
  nombre_finca?: string;
  rut?: string | null;
  renspa?: string | null;
  catastro?: string | null;
  ubicacion_texto?: string | null;
  userId: string;
};

export class FincaError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function resolveBodegaId(bodegaRef: string) {
  const ref = bodegaRef.trim();
  if (!ref) {
    throw new FincaError("bodegaId requerido", 400);
  }

  if (UUID_REGEX.test(ref)) {
    const bodega = await prisma.bodega.findUnique({
      where: { bodega_id: ref },
      select: { bodega_id: true },
    });
    if (!bodega) {
      throw new FincaError("Bodega no encontrada", 404);
    }
    return bodega.bodega_id;
  }

  const matches = await prisma.bodega.findMany({
    where: { nombre: ref, activo: true },
    select: { bodega_id: true },
    take: 2,
  });
  if (matches.length === 0) {
    throw new FincaError("Bodega no encontrada", 404);
  }
  if (matches.length > 1) {
    throw new FincaError("Nombre de bodega ambiguo; usá bodegaId", 409);
  }
  const only = matches[0];
  if (!only) {
    throw new FincaError("Bodega no encontrada", 404);
  }
  return only.bodega_id;
}

async function ensureUserBodega(userId: string, bodegaId: string) {
  const isSystemAdmin = await userHasAnyRole(userId, ["super_admin", "admin_sistema"]);
  if (isSystemAdmin) return;

  const rel = await prisma.userBodega.findFirst({
    where: { user_id: userId, bodega_id: bodegaId },
  });
  if (!rel) {
    throw new FincaError("No autorizado para esta bodega", 403);
  }
}

export async function listFincasByBodega(bodegaId: string, userId: string) {
  const resolvedBodegaId = await resolveBodegaId(bodegaId);
  await ensureUserBodega(userId, resolvedBodegaId);
  return prisma.finca.findMany({ where: { bodega_id: resolvedBodegaId } });
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

  const resolvedBodegaId = await resolveBodegaId(bodegaId);
  await ensureUserBodega(userId, resolvedBodegaId);

  const data: {
    bodega_id: string;
    nombre_finca: string;
    rut?: string | null;
    renspa?: string | null;
    catastro?: string | null;
    ubicacion_texto?: string | null;
  } = { bodega_id: resolvedBodegaId, nombre_finca };

  if (rut !== undefined) data.rut = rut;
  if (renspa !== undefined) data.renspa = renspa;
  if (catastro !== undefined) data.catastro = catastro;
  if (ubicacion_texto !== undefined) data.ubicacion_texto = ubicacion_texto;

  return prisma.finca.create({ data });
}

export async function getFincaById(fincaId: string, userId: string) {
  if (!fincaId) {
    throw new FincaError("fincaId requerido", 400);
  }

  const finca = await prisma.finca.findUnique({
    where: { finca_id: fincaId },
  });
  if (!finca) {
    throw new FincaError("Finca no encontrada", 404);
  }

  await ensureUserBodega(userId, finca.bodega_id);
  return finca;
}

export async function updateFinca(
  fincaId: string,
  { nombre_finca, rut, renspa, catastro, ubicacion_texto, userId }: UpdateFincaInput,
) {
  if (!fincaId) {
    throw new FincaError("fincaId requerido", 400);
  }

  const finca = await prisma.finca.findUnique({
    where: { finca_id: fincaId },
    select: { finca_id: true, bodega_id: true },
  });
  if (!finca) {
    throw new FincaError("Finca no encontrada", 404);
  }

  await ensureUserBodega(userId, finca.bodega_id);

  const data: {
    nombre_finca?: string;
    rut?: string | null;
    renspa?: string | null;
    catastro?: string | null;
    ubicacion_texto?: string | null;
  } = {};

  if (nombre_finca !== undefined) data.nombre_finca = nombre_finca;
  if (rut !== undefined) data.rut = rut;
  if (renspa !== undefined) data.renspa = renspa;
  if (catastro !== undefined) data.catastro = catastro;
  if (ubicacion_texto !== undefined) data.ubicacion_texto = ubicacion_texto;

  if (Object.keys(data).length === 0) {
    throw new FincaError("No hay campos para actualizar", 400);
  }

  return prisma.finca.update({
    where: { finca_id: fincaId },
    data,
  });
}
