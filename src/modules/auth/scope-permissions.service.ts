import { prisma } from "../../config/prismaClient.js";
import { userHasAnyRole } from "../../middlewares/roles.middleware.js";

export async function isSystemAdmin(userId: string) {
  return userHasAnyRole(userId, ["admin_sistema"]);
}

export async function hasBodegaRole(userId: string, bodegaId: string, roles: string[]) {
  const rel = await prisma.userBodegaRol.findFirst({
    where: {
      user_id: userId,
      bodega_id: bodegaId,
      rol: { in: roles },
    },
    select: { user_id: true },
  });
  return Boolean(rel);
}

export async function hasAnyFincaRole(userId: string, fincaId: string, roles?: string[]) {
  if (roles && roles.length > 0) {
    const rows = await prisma.$queryRaw<Array<{ user_id: string }>>`
      SELECT "user_id"
      FROM "user_finca_rol"
      WHERE "user_id" = ${userId}::uuid
        AND "finca_id" = ${fincaId}::uuid
        AND "rol" = ANY(${roles}::text[])
      LIMIT 1
    `;
    return rows.length > 0;
  }

  const rows = await prisma.$queryRaw<Array<{ user_id: string }>>`
    SELECT "user_id"
    FROM "user_finca_rol"
    WHERE "user_id" = ${userId}::uuid
      AND "finca_id" = ${fincaId}::uuid
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function getFincaOwnerBodegaId(fincaId: string) {
  const finca = await prisma.finca.findUnique({
    where: { finca_id: fincaId },
    select: { finca_id: true, bodega_id: true },
  });
  return finca ?? null;
}

export async function canManageBodega(userId: string, bodegaId: string) {
  if (await isSystemAdmin(userId)) return true;
  return hasBodegaRole(userId, bodegaId, ["admin_bodega", "encargado_bodega"]);
}

export async function canAccessBodega(userId: string, bodegaId: string) {
  if (await isSystemAdmin(userId)) return true;
  const rel = await prisma.userBodega.findFirst({
    where: { user_id: userId, bodega_id: bodegaId },
    select: { user_id: true },
  });
  return Boolean(rel);
}

export async function canAccessFinca(userId: string, fincaId: string) {
  if (await isSystemAdmin(userId)) return true;

  const finca = await getFincaOwnerBodegaId(fincaId);
  if (!finca) return false;

  const [isBodegaAdmin, hasFincaRole] = await Promise.all([
    hasBodegaRole(userId, finca.bodega_id, ["admin_bodega", "encargado_bodega"]),
    hasAnyFincaRole(userId, fincaId),
  ]);
  return isBodegaAdmin || hasFincaRole;
}

export async function canManageFinca(userId: string, fincaId: string) {
  if (await isSystemAdmin(userId)) return true;

  const finca = await getFincaOwnerBodegaId(fincaId);
  if (!finca) return false;

  const [isBodegaAdmin, isEncargado] = await Promise.all([
    hasBodegaRole(userId, finca.bodega_id, ["admin_bodega", "encargado_bodega"]),
    hasAnyFincaRole(userId, fincaId, ["encargado_finca"]),
  ]);
  return isBodegaAdmin || isEncargado;
}

export async function canOperateFinca(userId: string, fincaId: string) {
  if (await isSystemAdmin(userId)) return true;

  const finca = await getFincaOwnerBodegaId(fincaId);
  if (!finca) return false;

  const [isBodegaAdmin, hasFieldRole] = await Promise.all([
    hasBodegaRole(userId, finca.bodega_id, ["admin_bodega", "encargado_bodega"]),
    hasAnyFincaRole(userId, fincaId, ["encargado_finca", "operador_campo"]),
  ]);
  return isBodegaAdmin || hasFieldRole;
}
