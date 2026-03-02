import { prisma } from "../../config/prismaClient.js";

type CreateBodegaInput = {
  nombre: string;
  razon_social?: string;
  cuit?: string;
  productorId?: string;
  productorIds?: string[];
};

type LinkProductorInput = {
  bodegaId: string;
  userId: string;
  productorId?: string;
  razon_social?: string;
  cuit?: string;
  tipo_relacion?: string;
};

export class BodegaError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function createBodega({
  nombre,
  razon_social,
  cuit,
  productorId,
  productorIds,
}: CreateBodegaInput) {
  if (!nombre) {
    throw new BodegaError("Nombre es requerido", 400);
  }

  const data: {
    nombre: string;
    razon_social?: string | null;
    cuit?: string | null;
    productor_id?: string | null;
  } = { nombre };

  if (razon_social !== undefined) data.razon_social = razon_social;
  if (cuit !== undefined) data.cuit = cuit;
  if (productorId !== undefined) data.productor_id = productorId;

  const uniqueProductorIds = Array.from(
    new Set(
      [productorId, ...(productorIds ?? [])].filter(
        (id): id is string => typeof id === "string" && id.trim() !== "",
      ),
    ),
  );

  if (uniqueProductorIds.length > 0) {
    const found = await prisma.productor.findMany({
      where: { productor_id: { in: uniqueProductorIds } },
      select: { productor_id: true },
    });
    if (found.length !== uniqueProductorIds.length) {
      throw new BodegaError("Uno o más productores no existen", 404);
    }
  }

  const bodega = await prisma.$transaction(async (tx) => {
    const created = await tx.bodega.create({ data });

    if (uniqueProductorIds.length > 0) {
      const primaryProductorId = uniqueProductorIds[0];
      if (!primaryProductorId) {
        throw new BodegaError("Productor inválido", 400);
      }
      // El esquema actual soporta un productor principal por bodega.
      await tx.bodega.update({
        where: { bodega_id: created.bodega_id },
        data: { productor_id: primaryProductorId },
      });
    }

    return created;
  });

  return bodega;
}

async function ensureUserBodega(userId: string, bodegaId: string) {
  const rel = await prisma.userBodega.findFirst({
    where: { user_id: userId, bodega_id: bodegaId },
    select: { user_id: true },
  });
  if (!rel) {
    throw new BodegaError("No autorizado para esta bodega", 403);
  }
}

export async function listProductoresByBodega(bodegaId: string, userId: string) {
  await ensureUserBodega(userId, bodegaId);

  const bodega = await prisma.bodega.findUnique({
    where: { bodega_id: bodegaId },
    include: { productor: true },
  });
  if (!bodega) {
    throw new BodegaError("Bodega no encontrada", 404);
  }
  if (!bodega.productor) return [];
  return [
    {
      bodega_id: bodega.bodega_id,
      productor_id: bodega.productor.productor_id,
      productor: bodega.productor,
    },
  ];
}

export async function linkProductorToBodega({
  bodegaId,
  userId,
  productorId,
  razon_social,
  cuit,
  tipo_relacion,
}: LinkProductorInput) {
  if (!bodegaId) {
    throw new BodegaError("bodegaId es requerido", 400);
  }

  await ensureUserBodega(userId, bodegaId);

  const bodega = await prisma.bodega.findUnique({
    where: { bodega_id: bodegaId },
    select: { bodega_id: true },
  });
  if (!bodega) {
    throw new BodegaError("Bodega no encontrada", 404);
  }

  let resolvedProductorId = productorId;
  if (!resolvedProductorId) {
    if (!razon_social) {
      throw new BodegaError(
        "Debes enviar productorId o datos para crear productor",
        400,
      );
    }
    const productor = await prisma.productor.create({
      data: { razon_social, ...(cuit ? { cuit } : {}) },
      select: { productor_id: true },
    });
    resolvedProductorId = productor.productor_id;
  }

  const productor = await prisma.productor.findUnique({
    where: { productor_id: resolvedProductorId },
    select: { productor_id: true },
  });
  if (!productor) {
    throw new BodegaError("Productor no encontrado", 404);
  }

  const updated = await prisma.bodega.update({
    where: { bodega_id: bodegaId },
    data: { productor_id: resolvedProductorId },
    include: { productor: true },
  });

  return {
    bodega_id: updated.bodega_id,
    productor_id: resolvedProductorId,
    productor: updated.productor,
    tipo_relacion: tipo_relacion ?? null,
  };
}
