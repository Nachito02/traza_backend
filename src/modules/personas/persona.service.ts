import { prisma } from "../../config/prismaClient.js";
import { canManageBodega, isSystemAdmin } from "../auth/scope-permissions.service.js";

export class PersonaError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function ensureCanManageBodega(userId: string, bodegaId: string) {
  const [isAdmin, canManage] = await Promise.all([
    isSystemAdmin(userId),
    canManageBodega(userId, bodegaId),
  ]);
  if (!isAdmin && !canManage) throw new PersonaError("No autorizado para esta bodega", 403);
}

// ─── Listar operarios de una bodega ───────────────────────────────────────────
// Devuelve todos los AppUser que pertenecen a la bodega (via user_bodega)
export async function listOperariosByBodega(bodegaId: string, actorUserId: string) {
  await ensureCanManageBodega(actorUserId, bodegaId);

  return prisma.appUser.findMany({
    where: {
      is_active: true,
      user_bodega: { some: { bodega_id: bodegaId } },
    },
    select: {
      user_id: true,
      nombre: true,
      email: true,
      whatsapp_e164: true,
      is_active: true,
      user_bodega: {
        where: { bodega_id: bodegaId },
        select: {
          user_bodega_rol: { select: { rol: true } },
        },
      },
    },
    orderBy: { nombre: "asc" },
  });
}

// ─── Crear usuario sin credenciales (operario de campo) ───────────────────────
export async function createOperario(
  bodegaId: string,
  { nombre, whatsapp_e164 }: { nombre: string; whatsapp_e164?: string },
  actorUserId: string,
) {
  await ensureCanManageBodega(actorUserId, bodegaId);
  if (!nombre?.trim()) throw new PersonaError("nombre requerido", 400);

  if (whatsapp_e164) {
    const existing = await prisma.appUser.findUnique({ where: { whatsapp_e164 }, select: { user_id: true } });
    if (existing) throw new PersonaError("Ya existe un usuario con ese WhatsApp", 409);
  }

  const bodega = await prisma.bodega.findUnique({ where: { bodega_id: bodegaId }, select: { bodega_id: true } });
  if (!bodega) throw new PersonaError("Bodega no encontrada", 404);

  // Create user + assign to bodega in one transaction
  return prisma.$transaction(async (tx) => {
    const user = await tx.appUser.create({
      data: {
        nombre: nombre.trim(),
        whatsapp_e164: whatsapp_e164 ?? null,
      },
      select: {
        user_id: true,
        nombre: true,
        email: true,
        whatsapp_e164: true,
        is_active: true,
      },
    });

    await tx.userBodega.create({
      data: { user_id: user.user_id, bodega_id: bodegaId },
    });
    await tx.userBodegaRol.create({
      data: { user_id: user.user_id, bodega_id: bodegaId, rol: "operador_campo" },
    });

    return user;
  });
}

// ─── Desactivar usuario (soft delete) ─────────────────────────────────────────
export async function deactivateOperario(targetUserId: string, actorUserId: string) {
  const isAdmin = await isSystemAdmin(actorUserId);

  const user = await prisma.appUser.findUnique({
    where: { user_id: targetUserId },
    select: { user_id: true, user_bodega: { select: { bodega_id: true } } },
  });
  if (!user) throw new PersonaError("Usuario no encontrado", 404);

  if (!isAdmin) {
    // Actor must manage at least one of the user's bodegas
    const canManageAny = await Promise.any(
      user.user_bodega.map((ub) => canManageBodega(actorUserId, ub.bodega_id)),
    ).catch(() => false);
    if (!canManageAny) throw new PersonaError("No autorizado", 403);
  }

  await prisma.appUser.update({ where: { user_id: targetUserId }, data: { is_active: false } });
  return { deactivated: true };
}
