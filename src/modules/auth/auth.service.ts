
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { prisma } from "../../config/prismaClient.js";
import { userHasAnyRole } from "../../middlewares/roles.middleware.js";

type LoginInput = {
  email: string;
  password: string;
};

type CreateUserInput = {
  email: string;
  password: string;
  nombre: string;
  bodegaId?: string;
  bodegaNombre?: string;
  rolEnBodega?: string;
  rolesEnBodega?: string[];
};

type UpdateUserBodegaRoleInput = {
  actorUserId: string;
  targetUserId: string;
  bodegaName: string;
  rolEnBodega?: string;
  rolesEnBodega?: string[];
};

type UpdateUserGlobalRoleInput = {
  actorUserId: string;
  targetUserId: string;
  rolGlobal: string;
  enabled?: boolean;
};

type JwtPayload = {
  userId: string;
  email: string | null;
};

const LOCAL_BODEGA_ROLES = [
  "admin_bodega",
  "encargado_finca",
  "productor",
  "operador_campo",
  "responsable_calidad_inocuidad",
  "responsable_ssyo",
] as const;

function normalizeLocalRolesInput(rolesEnBodega?: string[], rolEnBodega?: string): string[] {
  const source = rolesEnBodega?.length
    ? rolesEnBodega
    : rolEnBodega
      ? [rolEnBodega]
      : ["operador_campo"];

  const normalized = Array.from(
    new Set(
      source
        .map((role) => role.trim().toLowerCase())
        .filter((role) => role.length > 0),
    ),
  );

  if (normalized.length === 0) {
    throw new AuthError("rolesEnBodega inválido", 400);
  }

  const invalid = normalized.filter((role) => !LOCAL_BODEGA_ROLES.includes(role as (typeof LOCAL_BODEGA_ROLES)[number]));
  if (invalid.length > 0) {
    throw new AuthError(
      "rolesEnBodega inválido (admin_bodega|encargado_finca|productor|operador_campo|responsable_calidad_inocuidad|responsable_ssyo)",
      400,
    );
  }

  return normalized;
}

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AuthError("JWT_SECRET no configurado", 500);
  }
  return secret;
}

function signToken(payload: JwtPayload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "15m" });
}

function getRefreshTtlDays() {
  const value = process.env.REFRESH_TOKEN_TTL_DAYS;
  const days = value ? Number(value) : 30;
  if (Number.isNaN(days) || days <= 0) {
    throw new AuthError("REFRESH_TOKEN_TTL_DAYS inválido", 500);
  }
  return days;
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function issueRefreshToken(userId: string) {
  const refreshToken = crypto.randomBytes(48).toString("base64url");
  const token_hash = hashToken(refreshToken);
  const expires_at = new Date(Date.now() + getRefreshTtlDays() * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      user_id: userId,
      token_hash,
      expires_at,
    },
  });

  return refreshToken;
}

export async function login({ email, password }: LoginInput) {
  if (!email || !password) {
    throw new AuthError("Email y password son requeridos", 400);
  }

  const user = await prisma.appUser.findUnique({
    where: { email },
    include: {
      user_bodega: {
        include: {
          bodega: true,
          user_bodega_rol: true,
        },
      },
    },
  });
  if (!user || !user.password_hash) {
    throw new AuthError("Credenciales inválidas", 401);
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    throw new AuthError("Credenciales inválidas", 401);
  }

  const token = signToken({ userId: user.user_id, email: user.email });
  const refreshToken = await issueRefreshToken(user.user_id);
  return { token, refreshToken, user };
}

export async function getUserById(userId: string) {
  const user = await prisma.appUser.findUnique({
    where: { user_id: userId },
    include: {
      user_bodega: {
        include: {
          bodega: true,
          user_bodega_rol: true,
        },
      },
    },
  });
  if (!user) {
    throw new AuthError("Usuario no encontrado", 404);
  }
  return user;
}

export async function getUserBodegas(userId: string) {
  const user = await prisma.appUser.findUnique({ where: { user_id: userId }, select: { user_id: true } });
  if (!user) throw new AuthError("Usuario no encontrado", 404);

  const memberships = await prisma.userBodega.findMany({
    where: { user_id: userId },
    include: { bodega: true, user_bodega_rol: true },
  });

  return memberships
    .filter((m) => m.bodega)
    .map((m) => ({
      ...m.bodega,
      roles_en_bodega: m.user_bodega_rol.map((role) => role.rol).sort(),
    }));
}

export async function getUserRoles(userId: string) {
  const rows = await prisma.userRol.findMany({
    where: { user_id: userId },
    include: { rol: true },
  });
  return rows.map((row) => row.rol.nombre);
}

export async function listUsers(actorUserId: string, bodegaName?: string) {
  const isSystemAdmin = await userHasAnyRole(actorUserId, ["super_admin", "admin_sistema"]);

  let scopedBodegaIds: string[] | undefined;
  let filteredBodegaId: string | undefined;

  if (bodegaName) {
    const bodegas = await prisma.bodega.findMany({
      where: { nombre: bodegaName, activo: true },
      select: { bodega_id: true },
      take: 2,
    });
    if (bodegas.length === 0) {
      throw new AuthError("Bodega no encontrada", 404);
    }
    if (bodegas.length > 1) {
      throw new AuthError("Nombre de bodega ambiguo; enviá un nombre más específico", 409);
    }
    filteredBodegaId = bodegas[0]?.bodega_id;
  }

  if (!isSystemAdmin) {
    const managedBodegas = await prisma.userBodegaRol.findMany({
      where: { user_id: actorUserId, rol: "admin_bodega" },
      select: { bodega_id: true },
    });
    const ids = managedBodegas.map((m) => m.bodega_id);
    if (ids.length === 0) {
      throw new AuthError("No autorizado", 403);
    }
    if (filteredBodegaId && !ids.includes(filteredBodegaId)) {
      throw new AuthError("No autorizado para esta bodega", 403);
    }
    scopedBodegaIds = filteredBodegaId ? [filteredBodegaId] : ids;
  } else if (filteredBodegaId) {
    scopedBodegaIds = [filteredBodegaId];
  }

  const users = await prisma.appUser.findMany({
    where: scopedBodegaIds
      ? { user_bodega: { some: { bodega_id: { in: scopedBodegaIds } } } }
      : {},
    include: {
      user_rol: { include: { rol: true } },
      user_bodega: scopedBodegaIds
        ? {
            where: { bodega_id: { in: scopedBodegaIds } },
            include: { bodega: true, user_bodega_rol: true },
          }
        : { include: { bodega: true, user_bodega_rol: true } },
    },
    orderBy: { created_at: "desc" },
  });

  return users.map((u) => ({
    id: u.user_id,
    email: u.email,
    nombre: u.nombre,
    is_active: u.is_active,
    roles_globales: u.user_rol.map((r) => r.rol.nombre),
    bodegas: u.user_bodega
      .filter((ub) => ub.bodega)
      .map((ub) => ({
        bodega_id: ub.bodega_id,
        nombre: ub.bodega?.nombre ?? "",
        roles_en_bodega: ub.user_bodega_rol.map((role) => role.rol).sort(),
      })),
  }));
}

export async function createUser({
  email,
  password,
  nombre,
  bodegaId,
  bodegaNombre,
  rolEnBodega,
  rolesEnBodega,
}: CreateUserInput) {
  if (!email || !password || !nombre || (!bodegaId && !bodegaNombre)) {
    throw new AuthError("Datos incompletos", 400);
  }

  const existing = await prisma.appUser.findUnique({ where: { email } });
  if (existing) {
    throw new AuthError("El usuario ya existe", 409);
  }

  const normalizedRolesEnBodega = normalizeLocalRolesInput(rolesEnBodega, rolEnBodega);

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  const maybeId = bodegaId?.trim();
  const maybeNombre = bodegaNombre?.trim() || (maybeId && !uuidRegex.test(maybeId) ? maybeId : undefined);

  let resolvedBodegaId = "";

  if (maybeId && uuidRegex.test(maybeId)) {
    const bodega = await prisma.bodega.findUnique({
      where: { bodega_id: maybeId },
    });
    if (!bodega) {
      throw new AuthError("Bodega no encontrada", 404);
    }
    resolvedBodegaId = bodega.bodega_id;
  } else if (maybeNombre) {
    const bodegas = await prisma.bodega.findMany({
      where: { nombre: maybeNombre, activo: true },
      select: { bodega_id: true },
      take: 2,
    });
    if (bodegas.length === 0) {
      throw new AuthError("Bodega no encontrada", 404);
    }
    if (bodegas.length > 1) {
      throw new AuthError("Nombre de bodega ambiguo; enviá bodegaId", 409);
    }
    const selectedBodega = bodegas[0];
    if (!selectedBodega) {
      throw new AuthError("Bodega no encontrada", 404);
    }
    resolvedBodegaId = selectedBodega.bodega_id;
  } else {
    throw new AuthError("bodegaId inválido", 400);
  }

  const password_hash = await bcrypt.hash(password, 10);
  const user = await prisma.appUser.create({
    data: {
      email,
      password_hash,
      nombre,
    },
  });

  await prisma.userBodega.create({
    data: {
      user_id: user.user_id,
      bodega_id: resolvedBodegaId,
      user_bodega_rol: {
        createMany: {
          data: normalizedRolesEnBodega.map((role) => ({ rol: role })),
          skipDuplicates: true,
        },
      },
    },
  });

  return user;
}

export async function updateUserBodegaRole({
  actorUserId,
  targetUserId,
  bodegaName,
  rolEnBodega,
  rolesEnBodega,
}: UpdateUserBodegaRoleInput) {
  const normalizedRolesEnBodega = normalizeLocalRolesInput(rolesEnBodega, rolEnBodega);

  const bodegas = await prisma.bodega.findMany({
    where: { nombre: bodegaName, activo: true },
    select: { bodega_id: true, nombre: true },
    take: 2,
  });
  if (bodegas.length === 0) {
    throw new AuthError("Bodega no encontrada", 404);
  }
  if (bodegas.length > 1) {
    throw new AuthError("Nombre de bodega ambiguo", 409);
  }
  const bodega = bodegas[0];
  if (!bodega) {
    throw new AuthError("Bodega no encontrada", 404);
  }

  const targetUser = await prisma.appUser.findUnique({
    where: { user_id: targetUserId },
    select: { user_id: true, email: true, nombre: true },
  });
  if (!targetUser) {
    throw new AuthError("Usuario destino no encontrado", 404);
  }

  const isSystemAdmin = await userHasAnyRole(actorUserId, ["super_admin", "admin_sistema"]);
  if (!isSystemAdmin) {
    const actorMembership = await prisma.userBodegaRol.findFirst({
      where: {
        user_id: actorUserId,
        bodega_id: bodega.bodega_id,
        rol: "admin_bodega",
      },
      select: { user_id: true },
    });
    if (!actorMembership) {
      throw new AuthError("No autorizado para administrar esta bodega", 403);
    }
  }

  await prisma.userBodega.upsert({
    where: {
      user_id_bodega_id: {
        user_id: targetUserId,
        bodega_id: bodega.bodega_id,
      },
    },
    create: {
      user_id: targetUserId,
      bodega_id: bodega.bodega_id,
    },
    update: {},
  });

  await prisma.userBodegaRol.createMany({
    data: normalizedRolesEnBodega.map((role) => ({
      user_id: targetUserId,
      bodega_id: bodega.bodega_id,
      rol: role,
    })),
    skipDuplicates: true,
  });

  await prisma.userBodegaRol.deleteMany({
    where: {
      user_id: targetUserId,
      bodega_id: bodega.bodega_id,
      rol: { notIn: normalizedRolesEnBodega },
    },
  });

  const roles = await prisma.userBodegaRol.findMany({
    where: {
      user_id: targetUserId,
      bodega_id: bodega.bodega_id,
    },
    select: { rol: true },
    orderBy: { rol: "asc" },
  });

  return {
    user: targetUser,
    bodega: {
      bodega_id: bodega.bodega_id,
      nombre: bodega.nombre,
    },
    roles_en_bodega: roles.map((role) => role.rol),
  };
}

export async function updateUserGlobalRole({
  actorUserId,
  targetUserId,
  rolGlobal,
  enabled = true,
}: UpdateUserGlobalRoleInput) {
  const isSystemAdmin = await userHasAnyRole(actorUserId, ["super_admin", "admin_sistema"]);
  if (!isSystemAdmin) {
    throw new AuthError("No autorizado", 403);
  }

  const targetUser = await prisma.appUser.findUnique({
    where: { user_id: targetUserId },
    select: { user_id: true, email: true, nombre: true },
  });
  if (!targetUser) {
    throw new AuthError("Usuario destino no encontrado", 404);
  }

  const normalizedRole = rolGlobal.trim().toLowerCase();
  if (!normalizedRole) {
    throw new AuthError("rolGlobal requerido", 400);
  }

  const forbiddenBodegaRoles = new Set([
    "admin_bodega",
    "encargado_finca",
    "productor",
    "operador_campo",
    "responsable_calidad_inocuidad",
    "responsable_ssyo",
  ]);
  if (forbiddenBodegaRoles.has(normalizedRole)) {
    throw new AuthError("Ese rol corresponde a bodega (user_bodega), no a rol global", 400);
  }

  const role = await prisma.rol.findUnique({
    where: { nombre: normalizedRole },
    select: { rol_id: true, nombre: true },
  });
  if (!role) {
    throw new AuthError("Rol global no encontrado", 404);
  }

  if (enabled) {
    await prisma.userRol.upsert({
      where: {
        user_id_rol_id: {
          user_id: targetUserId,
          rol_id: role.rol_id,
        },
      },
      create: {
        user_id: targetUserId,
        rol_id: role.rol_id,
      },
      update: {},
    });
  } else {
    await prisma.userRol.deleteMany({
      where: { user_id: targetUserId, rol_id: role.rol_id },
    });
  }

  const updatedRoles = await getUserRoles(targetUserId);

  return {
    user: targetUser,
    rol_global: role.nombre,
    enabled,
    roles_globales: updatedRoles,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  if (!refreshToken) {
    throw new AuthError("Refresh token requerido", 400);
  }

  const token_hash = hashToken(refreshToken);
  const record = await prisma.refreshToken.findFirst({
    where: {
      token_hash,
      revoked_at: null,
      expires_at: { gt: new Date() },
    },
    include: { app_user: true },
  });

  if (!record) {
    throw new AuthError("Refresh token inválido", 401);
  }

  // Rotación: revoca el actual y emite uno nuevo
  await prisma.refreshToken.update({
    where: { token_id: record.token_id },
    data: { revoked_at: new Date() },
  });

  const newAccessToken = signToken({
    userId: record.app_user.user_id,
    email: record.app_user.email,
  });
  const newRefreshToken = await issueRefreshToken(record.app_user.user_id);

  return { token: newAccessToken, refreshToken: newRefreshToken };
}

export async function revokeRefreshToken(refreshToken: string) {
  if (!refreshToken) {
    throw new AuthError("Refresh token requerido", 400);
  }

  const token_hash = hashToken(refreshToken);
  const record = await prisma.refreshToken.findFirst({
    where: { token_hash, revoked_at: null },
  });

  if (!record) {
    return;
  }

  await prisma.refreshToken.update({
    where: { token_id: record.token_id },
    data: { revoked_at: new Date() },
  });
}
