import { prisma } from "../../config/prismaClient.js";
import {
  canManageBodega,
  canManageFinca,
  isSystemAdmin,
} from "../auth/scope-permissions.service.js";

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

async function ensureUserCanManageBodega(userId: string, bodegaId: string) {
  const ok = await canManageBodega(userId, bodegaId);
  if (!ok) {
    throw new FincaError("No autorizado para esta bodega", 403);
  }
}

export async function listFincasByBodega(bodegaId: string, userId: string) {
  const resolvedBodegaId = await resolveBodegaId(bodegaId);

  const [isAdminSistema, canManage] = await Promise.all([
    isSystemAdmin(userId),
    canManageBodega(userId, resolvedBodegaId),
  ]);

  if (isAdminSistema || canManage) {
    return prisma.finca.findMany({ where: { bodega_id: resolvedBodegaId, activo: true } });
  }

  return prisma.$queryRaw<Array<{
    finca_id: string;
    bodega_id: string;
    nombre_finca: string;
    rut: string | null;
    renspa: string | null;
    catastro: string | null;
    ubicacion_texto: string | null;
    created_at: Date;
    updated_at: Date;
  }>>`
    SELECT f.*
    FROM "finca" f
    JOIN "user_finca_rol" ufr ON ufr."finca_id" = f."finca_id"
    WHERE f."bodega_id" = ${resolvedBodegaId}::uuid
      AND ufr."user_id" = ${userId}::uuid
    ORDER BY f."nombre_finca" ASC
  `;
}

type FincaDetalleRow = {
  finca_id: string;
  bodega_id: string;
  nombre_finca: string;
  rut: string | null;
  renspa: string | null;
  catastro: string | null;
  ubicacion_texto: string | null;
  created_at: Date;
  updated_at: Date;
};

type VinculoRow = {
  bodega_id: string;
  finca_id: string;
  tipo_vinculo: string;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
};

function buildFincasDetalleResponse(
  fincas: FincaDetalleRow[],
  vinculos: VinculoRow[],
  filteredBodegaId?: string,
) {
  const vinculosByFinca = new Map<string, VinculoRow[]>();
  for (const vinculo of vinculos) {
    const existing = vinculosByFinca.get(vinculo.finca_id) ?? [];
    existing.push(vinculo);
    vinculosByFinca.set(vinculo.finca_id, existing);
  }

  return fincas.map((finca) => {
    const fincaVinculos = vinculosByFinca.get(finca.finca_id) ?? [];

    if (!filteredBodegaId) {
      return {
        ...finca,
        vinculos: fincaVinculos,
      };
    }

    const vinculoSeleccionado =
      fincaVinculos.find((v) => v.bodega_id === filteredBodegaId) ??
      (finca.bodega_id === filteredBodegaId
        ? {
            bodega_id: filteredBodegaId,
            finca_id: finca.finca_id,
            tipo_vinculo: "propia",
            activo: true,
            created_at: finca.created_at,
            updated_at: finca.updated_at,
          }
        : null);

    return {
      ...finca,
      vinculo: vinculoSeleccionado,
      vinculos: vinculoSeleccionado ? [vinculoSeleccionado] : [],
    };
  });
}

function buildPropiaVinculosFromFincas(fincas: FincaDetalleRow[]): VinculoRow[] {
  return fincas.map((finca) => ({
    bodega_id: finca.bodega_id,
    finca_id: finca.finca_id,
    tipo_vinculo: "propia",
    activo: true,
    created_at: finca.created_at,
    updated_at: finca.updated_at,
  }));
}

export async function listFincasConDetalles(userId: string, bodegaId?: string) {
  const normalizedBodegaId = bodegaId?.trim();

  if (normalizedBodegaId) {
    const resolvedBodegaId = await resolveBodegaId(normalizedBodegaId);

    const [isAdminSistema, canManage] = await Promise.all([
      isSystemAdmin(userId),
      canManageBodega(userId, resolvedBodegaId),
    ]);

    const fincas = isAdminSistema || canManage
      ? await prisma.$queryRaw<FincaDetalleRow[]>`
          SELECT
            f."finca_id",
            f."bodega_id",
            f."nombre_finca",
            f."rut",
            f."renspa",
            f."catastro",
            f."ubicacion_texto",
            f."created_at",
            f."updated_at"
          FROM "finca" f
          WHERE f."activo" = true
            AND f."bodega_id" = ${resolvedBodegaId}::uuid
          ORDER BY f."nombre_finca" ASC
        `
      : await prisma.$queryRaw<FincaDetalleRow[]>`
          SELECT
            f."finca_id",
            f."bodega_id",
            f."nombre_finca",
            f."rut",
            f."renspa",
            f."catastro",
            f."ubicacion_texto",
            f."created_at",
            f."updated_at"
          FROM "finca" f
          JOIN "user_finca_rol" ufr
            ON ufr."finca_id" = f."finca_id"
           AND ufr."user_id" = ${userId}::uuid
          WHERE f."activo" = true
            AND f."bodega_id" = ${resolvedBodegaId}::uuid
          ORDER BY f."nombre_finca" ASC
        `;

    const vinculos = buildPropiaVinculosFromFincas(fincas);

    return buildFincasDetalleResponse(fincas, vinculos, resolvedBodegaId);
  }

  const adminSistema = await isSystemAdmin(userId);

  const fincas = adminSistema
    ? await prisma.$queryRaw<FincaDetalleRow[]>`
        SELECT
          "finca_id",
          "bodega_id",
          "nombre_finca",
          "rut",
          "renspa",
          "catastro",
          "ubicacion_texto",
          "created_at",
          "updated_at"
        FROM "finca"
        WHERE "activo" = true
        ORDER BY "nombre_finca" ASC
      `
    : await prisma.$queryRaw<FincaDetalleRow[]>`
        SELECT DISTINCT
          f."finca_id",
          f."bodega_id",
          f."nombre_finca",
          f."rut",
          f."renspa",
          f."catastro",
          f."ubicacion_texto",
          f."created_at",
          f."updated_at"
        FROM "finca" f
        WHERE f."activo" = true
          AND (f."bodega_id" IN (
            SELECT ubr."bodega_id"
            FROM "user_bodega_rol" ubr
            WHERE ubr."user_id" = ${userId}::uuid
              AND ubr."rol" IN ('admin_bodega', 'encargado_bodega')
          )
          OR EXISTS (
            SELECT 1
            FROM "user_finca_rol" ufr
            WHERE ufr."user_id" = ${userId}::uuid
              AND ufr."finca_id" = f."finca_id"
          ))
        ORDER BY f."nombre_finca" ASC
      `;

  const vinculos = buildPropiaVinculosFromFincas(fincas);

  return buildFincasDetalleResponse(fincas, vinculos);
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
  await ensureUserCanManageBodega(userId, resolvedBodegaId);

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

  const canManage = await canManageFinca(userId, finca.finca_id);
  if (!canManage) {
    throw new FincaError("No autorizado para esta finca", 403);
  }
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

  const canManage = await canManageFinca(userId, finca.finca_id);
  if (!canManage) {
    throw new FincaError("No autorizado para esta finca", 403);
  }

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

export async function deleteFinca(fincaId: string, userId: string) {
  if (!fincaId) {
    throw new FincaError("fincaId requerido", 400);
  }

  const finca = await prisma.finca.findUnique({
    where: { finca_id: fincaId },
    select: { finca_id: true },
  });
  if (!finca) {
    throw new FincaError("Finca no encontrada", 404);
  }

  const canManage = await canManageFinca(userId, finca.finca_id);
  if (!canManage) {
    throw new FincaError("No autorizado para esta finca", 403);
  }

  await prisma.finca.update({
    where: { finca_id: finca.finca_id },
    data: { activo: false, updated_at: new Date() },
  });

  return { deleted: true };
}
