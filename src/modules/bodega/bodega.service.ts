import { prisma } from "../../config/prismaClient.js";
import { canAccessBodega, canManageBodega } from "../auth/scope-permissions.service.js";

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

type UpsertBodegaFincaVinculoInput = {
  bodegaId: string;
  fincaId: string;
  userId: string;
  tipoVinculo?: string;
  activo?: boolean;
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

async function ensureUserCanAccessBodega(userId: string, bodegaId: string) {
  const ok = await canAccessBodega(userId, bodegaId);
  if (!ok) {
    throw new BodegaError("No autorizado para esta bodega", 403);
  }
}

async function ensureUserCanManageBodega(userId: string, bodegaId: string) {
  const ok = await canManageBodega(userId, bodegaId);
  if (!ok) {
    throw new BodegaError("No autorizado para esta bodega", 403);
  }
}

export async function listProductoresByBodega(bodegaId: string, userId: string) {
  await ensureUserCanAccessBodega(userId, bodegaId);

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

  await ensureUserCanManageBodega(userId, bodegaId);

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

export async function listFincaVinculosByBodega(bodegaId: string, userId: string) {
  await ensureUserCanAccessBodega(userId, bodegaId);

  const bodega = await prisma.bodega.findUnique({
    where: { bodega_id: bodegaId },
    select: { bodega_id: true },
  });
  if (!bodega) {
    throw new BodegaError("Bodega no encontrada", 404);
  }

  const rows = await prisma.$queryRaw<
    Array<{
      bodega_id: string;
      finca_id: string;
      tipo_vinculo: string;
      activo: boolean;
      created_at: Date;
      updated_at: Date;
      finca_nombre: string;
      finca_bodega_id: string;
    }>
  >`
    SELECT
      v."bodega_id",
      v."finca_id",
      v."tipo_vinculo",
      v."activo",
      v."created_at",
      v."updated_at",
      f."nombre_finca" AS "finca_nombre",
      f."bodega_id" AS "finca_bodega_id"
    FROM "bodega_finca_vinculo" v
    JOIN "finca" f ON f."finca_id" = v."finca_id"
    WHERE v."bodega_id" = ${bodegaId}::uuid
    ORDER BY f."nombre_finca" ASC
  `;

  return rows;
}

export async function upsertBodegaFincaVinculo({
  bodegaId,
  fincaId,
  userId,
  tipoVinculo,
  activo,
}: UpsertBodegaFincaVinculoInput) {
  if (!bodegaId || !fincaId) {
    throw new BodegaError("bodegaId y fincaId son requeridos", 400);
  }

  await ensureUserCanManageBodega(userId, bodegaId);

  const normalizedTipo = (tipoVinculo ?? "propia").trim().toLowerCase();
  if (!["propia", "proveedor_tercero"].includes(normalizedTipo)) {
    throw new BodegaError("tipo_vinculo inválido (propia|proveedor_tercero)", 400);
  }
  const normalizedActivo = activo ?? true;

  const [bodega, finca] = await Promise.all([
    prisma.bodega.findUnique({
      where: { bodega_id: bodegaId },
      select: { bodega_id: true, nombre: true },
    }),
    prisma.finca.findUnique({
      where: { finca_id: fincaId },
      select: { finca_id: true, nombre_finca: true, bodega_id: true },
    }),
  ]);

  if (!bodega) {
    throw new BodegaError("Bodega no encontrada", 404);
  }
  if (!finca) {
    throw new BodegaError("Finca no encontrada", 404);
  }

  await prisma.$executeRaw`
    INSERT INTO "bodega_finca_vinculo" ("bodega_id", "finca_id", "tipo_vinculo", "activo")
    VALUES (${bodegaId}::uuid, ${fincaId}::uuid, ${normalizedTipo}, ${normalizedActivo})
    ON CONFLICT ("bodega_id", "finca_id")
    DO UPDATE SET
      "tipo_vinculo" = EXCLUDED."tipo_vinculo",
      "activo" = EXCLUDED."activo",
      "updated_at" = CURRENT_TIMESTAMP
  `;

  const rows = await prisma.$queryRaw<
    Array<{
      bodega_id: string;
      finca_id: string;
      tipo_vinculo: string;
      activo: boolean;
      created_at: Date;
      updated_at: Date;
    }>
  >`
    SELECT "bodega_id", "finca_id", "tipo_vinculo", "activo", "created_at", "updated_at"
    FROM "bodega_finca_vinculo"
    WHERE "bodega_id" = ${bodegaId}::uuid
      AND "finca_id" = ${fincaId}::uuid
    LIMIT 1
  `;

  const relation = rows[0];
  if (!relation) {
    throw new BodegaError("No se pudo persistir el vínculo", 500);
  }

  return {
    ...relation,
    bodega_nombre: bodega.nombre,
    finca_nombre: finca.nombre_finca,
    finca_bodega_id: finca.bodega_id,
  };
}
