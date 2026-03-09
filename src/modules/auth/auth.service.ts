
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
  actorUserId?: string;
  email: string;
  password: string;
  nombre: string;
  bodegaId?: string;
  bodegaNombre?: string;
  rolEnBodega?: string;
  rolesEnBodega?: string[];
  whatsapp?: string;
};

type UpdateUserBodegaRoleInput = {
  actorUserId: string;
  targetUserId: string;
  bodegaName?: string;
  bodegaId?: string;
  rolEnBodega?: string;
  rolesEnBodega?: string[];
};

type UpdateUserFincaRoleInput = {
  actorUserId: string;
  targetUserId: string;
  fincaId: string;
  rolEnFinca?: string;
  rolesEnFinca?: string[];
};

type UpdateUserGlobalRoleInput = {
  actorUserId: string;
  targetUserId: string;
  rolGlobal: string;
  enabled?: boolean;
};

type UpdateUserInput = {
  actorUserId: string;
  targetUserId: string;
  nombre?: string;
  email?: string;
  password?: string;
  is_active?: boolean;
  whatsapp?: string | null;
};

type JwtPayload = {
  userId: string;
  email: string | null;
};

const LOCAL_BODEGA_ROLES = [
  "admin_bodega",
  "encargado_bodega",
  "productor",
  "responsable_calidad_inocuidad",
  "responsable_ssyo",
  "enologo",
] as const;

const BODEGA_MANAGER_ROLES = [
  "admin_bodega",
  "encargado_bodega",
] as const;

function normalizeLocalRolesInputForCreate(rolesEnBodega?: string[], rolEnBodega?: string): string[] {
  const source = rolesEnBodega?.length
    ? rolesEnBodega
    : rolEnBodega
      ? [rolEnBodega]
      : ["productor"];

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
      "rolesEnBodega inválido (admin_bodega|encargado_bodega|productor|responsable_calidad_inocuidad|responsable_ssyo|enologo)",
      400,
    );
  }

  return normalized;
}

function normalizeLocalRolesInputForUpdate(rolesEnBodega?: string[], rolEnBodega?: string): string[] {
  if (rolesEnBodega === undefined && rolEnBodega === undefined) {
    throw new AuthError("rolEnBodega o rolesEnBodega requerido", 400);
  }

  const source =
    rolesEnBodega !== undefined
      ? rolesEnBodega
      : rolEnBodega !== undefined
        ? [rolEnBodega]
        : [];

  const normalized = Array.from(
    new Set(
      source
        .map((role) => role.trim().toLowerCase())
        .filter((role) => role.length > 0),
    ),
  );

  if (normalized.length === 0) {
    return [];
  }

  const invalid = normalized.filter((role) => !LOCAL_BODEGA_ROLES.includes(role as (typeof LOCAL_BODEGA_ROLES)[number]));
  if (invalid.length > 0) {
    throw new AuthError(
      "rolesEnBodega inválido (admin_bodega|encargado_bodega|productor|responsable_calidad_inocuidad|responsable_ssyo|enologo)",
      400,
    );
  }

  return normalized;
}

const LOCAL_FINCA_ROLES = [
  "encargado_finca",
  "operador_campo",
] as const;

function normalizeFincaRolesInput(rolesEnFinca?: string[], rolEnFinca?: string): string[] {
  if (rolesEnFinca === undefined && rolEnFinca === undefined) {
    throw new AuthError("rolEnFinca o rolesEnFinca requerido", 400);
  }

  const source =
    rolesEnFinca !== undefined
      ? rolesEnFinca
      : rolEnFinca !== undefined
        ? [rolEnFinca]
        : [];

  const normalized = Array.from(
    new Set(
      source
        .map((role) => role.trim().toLowerCase())
        .filter((role) => role.length > 0),
    ),
  );

  if (normalized.length === 0) {
    return [];
  }

  const invalid = normalized.filter((role) => !LOCAL_FINCA_ROLES.includes(role as (typeof LOCAL_FINCA_ROLES)[number]));
  if (invalid.length > 0) {
    throw new AuthError("rolesEnFinca inválido (encargado_finca|operador_campo)", 400);
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
  const isSystemAdmin = await userHasAnyRole(actorUserId, ["admin_sistema"]);

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
      where: { user_id: actorUserId, rol: { in: [...BODEGA_MANAGER_ROLES] } },
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

async function getManagedBodegaIds(actorUserId: string) {
  const managedBodegas = await prisma.userBodegaRol.findMany({
    where: { user_id: actorUserId, rol: { in: [...BODEGA_MANAGER_ROLES] } },
    select: { bodega_id: true },
  });
  return managedBodegas.map((b) => b.bodega_id);
}

async function getTargetUserWithScopes(targetUserId: string) {
  const targetUser = await prisma.appUser.findUnique({
    where: { user_id: targetUserId },
    include: {
      user_rol: { include: { rol: true } },
      user_bodega: {
        include: {
          bodega: true,
          user_bodega_rol: true,
        },
      },
    },
  });
  if (!targetUser) {
    throw new AuthError("Usuario no encontrado", 404);
  }
  return targetUser;
}

function hasIntersection(values: string[], allowed: string[]) {
  const allowedSet = new Set(allowed);
  return values.some((value) => allowedSet.has(value));
}

function isSubset(values: string[], allowed: string[]) {
  const allowedSet = new Set(allowed);
  return values.every((value) => allowedSet.has(value));
}

async function ensureCanReadUser(actorUserId: string, targetUserId: string) {
  const isSystemAdmin = await userHasAnyRole(actorUserId, ["admin_sistema"]);
  const targetUser = await getTargetUserWithScopes(targetUserId);

  if (isSystemAdmin) {
    return { isSystemAdmin, targetUser, scopedBodegaIds: undefined as string[] | undefined };
  }

  const managedBodegaIds = await getManagedBodegaIds(actorUserId);
  if (managedBodegaIds.length === 0) {
    throw new AuthError("No autorizado", 403);
  }

  const targetBodegaIds = targetUser.user_bodega.map((ub) => ub.bodega_id);
  if (!hasIntersection(targetBodegaIds, managedBodegaIds)) {
    throw new AuthError("No autorizado para este usuario", 403);
  }

  const targetGlobalRoles = targetUser.user_rol.map((ur) => ur.rol.nombre);
  if (targetGlobalRoles.includes("admin_sistema")) {
    throw new AuthError("No autorizado para este usuario", 403);
  }

  return { isSystemAdmin, targetUser, scopedBodegaIds: managedBodegaIds };
}

async function ensureCanManageUser(actorUserId: string, targetUserId: string) {
  const isSystemAdmin = await userHasAnyRole(actorUserId, ["admin_sistema"]);
  const targetUser = await getTargetUserWithScopes(targetUserId);

  if (isSystemAdmin) {
    return { isSystemAdmin, targetUser, scopedBodegaIds: undefined as string[] | undefined };
  }

  const managedBodegaIds = await getManagedBodegaIds(actorUserId);
  if (managedBodegaIds.length === 0) {
    throw new AuthError("No autorizado", 403);
  }

  const targetBodegaIds = targetUser.user_bodega.map((ub) => ub.bodega_id);
  if (targetBodegaIds.length === 0 || !isSubset(targetBodegaIds, managedBodegaIds)) {
    throw new AuthError("No autorizado para administrar este usuario", 403);
  }

  const targetGlobalRoles = targetUser.user_rol.map((ur) => ur.rol.nombre);
  if (targetGlobalRoles.includes("admin_sistema")) {
    throw new AuthError("No autorizado para administrar este usuario", 403);
  }

  return { isSystemAdmin, targetUser, scopedBodegaIds: managedBodegaIds };
}

export async function getUserDetail(actorUserId: string, targetUserId: string) {
  if (!targetUserId) {
    throw new AuthError("userId requerido", 400);
  }

  const { targetUser, scopedBodegaIds } = await ensureCanReadUser(actorUserId, targetUserId);

  const scopedUserBodegas = scopedBodegaIds
    ? targetUser.user_bodega.filter((ub) => scopedBodegaIds.includes(ub.bodega_id))
    : targetUser.user_bodega;

  const fincas = await prisma.$queryRaw<
    Array<{
      finca_id: string;
      nombre_finca: string;
      bodega_id: string;
      rol: string;
    }>
  >`
    SELECT
      ufr."finca_id",
      f."nombre_finca",
      f."bodega_id",
      ufr."rol"
    FROM "user_finca_rol" ufr
    JOIN "finca" f ON f."finca_id" = ufr."finca_id"
    WHERE ufr."user_id" = ${targetUserId}::uuid
    ORDER BY f."nombre_finca" ASC, ufr."rol" ASC
  `;

  const filteredFincas = scopedBodegaIds
    ? fincas.filter((f) => scopedBodegaIds.includes(f.bodega_id))
    : fincas;

  const fincasById = new Map<
    string,
    {
      finca_id: string;
      nombre_finca: string;
      bodega_id: string;
      roles_en_finca: string[];
    }
  >();

  for (const row of filteredFincas) {
    const current = fincasById.get(row.finca_id);
    if (!current) {
      fincasById.set(row.finca_id, {
        finca_id: row.finca_id,
        nombre_finca: row.nombre_finca,
        bodega_id: row.bodega_id,
        roles_en_finca: [row.rol],
      });
      continue;
    }
    current.roles_en_finca.push(row.rol);
  }

  return {
    id: targetUser.user_id,
    email: targetUser.email,
    nombre: targetUser.nombre,
    is_active: targetUser.is_active,
    roles_globales: targetUser.user_rol.map((ur) => ur.rol.nombre).sort(),
    bodegas: scopedUserBodegas
      .filter((ub) => ub.bodega)
      .map((ub) => ({
        bodega_id: ub.bodega_id,
        nombre: ub.bodega?.nombre ?? "",
        roles_en_bodega: ub.user_bodega_rol.map((role) => role.rol).sort(),
      })),
    fincas: Array.from(fincasById.values()),
  };
}

export async function updateUser({
  actorUserId,
  targetUserId,
  nombre,
  email,
  password,
  is_active,
  whatsapp,
}: UpdateUserInput) {
  if (!targetUserId) {
    throw new AuthError("userId requerido", 400);
  }

  await ensureCanManageUser(actorUserId, targetUserId);

  const data: {
    nombre?: string;
    email?: string;
    password_hash?: string;
    is_active?: boolean;
    whatsapp_e164?: string | null;
  } = {};

  if (nombre !== undefined) {
    const normalizedNombre = nombre.trim();
    if (!normalizedNombre) {
      throw new AuthError("nombre inválido", 400);
    }
    data.nombre = normalizedNombre;
  }

  if (email !== undefined) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new AuthError("email inválido", 400);
    }
    data.email = normalizedEmail;
  }

  if (password !== undefined) {
    const normalizedPassword = password.trim();
    if (normalizedPassword.length < 8) {
      throw new AuthError("password debe tener al menos 8 caracteres", 400);
    }
    data.password_hash = await bcrypt.hash(normalizedPassword, 10);
  }

  if (is_active !== undefined) {
    data.is_active = is_active;
  }

  if (whatsapp !== undefined) {
    if (whatsapp === null || whatsapp === "") {
      data.whatsapp_e164 = null;
    } else {
      const normalized = whatsapp.trim();
      if (!/^\+\d{7,15}$/.test(normalized)) {
        throw new AuthError("whatsapp debe estar en formato E.164 (ej: +5491112345678)", 400);
      }
      data.whatsapp_e164 = normalized;
    }
  }

  if (Object.keys(data).length === 0) {
    throw new AuthError("No hay campos para actualizar", 400);
  }

  try {
    const updated = await prisma.appUser.update({
      where: { user_id: targetUserId },
      data,
      select: {
        user_id: true,
        email: true,
        nombre: true,
        is_active: true,
      },
    });

    return {
      id: updated.user_id,
      email: updated.email,
      nombre: updated.nombre,
      is_active: updated.is_active,
    };
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002") {
      throw new AuthError("El email ya está en uso", 409);
    }
    throw error;
  }
}

export async function deleteUser(actorUserId: string, targetUserId: string) {
  if (!targetUserId) {
    throw new AuthError("userId requerido", 400);
  }

  await ensureCanManageUser(actorUserId, targetUserId);

  await prisma.$transaction(async (tx) => {
    await tx.appUser.update({
      where: { user_id: targetUserId },
      data: { is_active: false },
    });

    await tx.refreshToken.updateMany({
      where: {
        user_id: targetUserId,
        revoked_at: null,
      },
      data: { revoked_at: new Date() },
    });
  });

  return { ok: true, user_id: targetUserId, deleted: true };
}

export async function createUser({
  actorUserId,
  email,
  password,
  nombre,
  bodegaId,
  bodegaNombre,
  rolEnBodega,
  rolesEnBodega,
  whatsapp,
}: CreateUserInput) {
  if (!email || !password || !nombre || (!bodegaId && !bodegaNombre)) {
    throw new AuthError("Datos incompletos", 400);
  }

  const existing = await prisma.appUser.findUnique({ where: { email } });
  if (existing) {
    throw new AuthError("El usuario ya existe", 409);
  }

  const normalizedRolesEnBodega = normalizeLocalRolesInputForCreate(rolesEnBodega, rolEnBodega);

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

  if (actorUserId) {
    const isSystemAdmin = await userHasAnyRole(actorUserId, ["admin_sistema"]);
    if (!isSystemAdmin) {
      const canManageBodega = await prisma.userBodegaRol.findFirst({
        where: {
          user_id: actorUserId,
          bodega_id: resolvedBodegaId,
          rol: { in: [...BODEGA_MANAGER_ROLES] },
        },
        select: { user_id: true },
      });
      if (!canManageBodega) {
        throw new AuthError("No autorizado para crear usuarios en esta bodega", 403);
      }
    }
  }

  const password_hash = await bcrypt.hash(password, 10);

  let whatsapp_e164: string | undefined = undefined;
  if (whatsapp) {
    const normalized = whatsapp.trim();
    if (!/^\+\d{7,15}$/.test(normalized)) {
      throw new AuthError("whatsapp debe estar en formato E.164 (ej: +5491112345678)", 400);
    }
    whatsapp_e164 = normalized;
  }

  const user = await prisma.appUser.create({
    data: {
      email,
      password_hash,
      nombre,
      ...(whatsapp_e164 ? { whatsapp_e164 } : {}),
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
  bodegaId,
  rolEnBodega,
  rolesEnBodega,
}: UpdateUserBodegaRoleInput) {
  const normalizedRolesEnBodega = normalizeLocalRolesInputForUpdate(rolesEnBodega, rolEnBodega);

  const bodega = bodegaId
    ? await prisma.bodega.findFirst({
        where: { bodega_id: bodegaId, activo: true },
        select: { bodega_id: true, nombre: true },
      })
    : await (async () => {
        const normalizedName = (bodegaName ?? "").trim();
        if (!normalizedName) {
          throw new AuthError("bodegaName o bodegaId requerido", 400);
        }
        const bodegas = await prisma.bodega.findMany({
          where: { nombre: normalizedName, activo: true },
          select: { bodega_id: true, nombre: true },
          take: 2,
        });
        if (bodegas.length === 0) {
          throw new AuthError("Bodega no encontrada", 404);
        }
        if (bodegas.length > 1) {
          throw new AuthError("Nombre de bodega ambiguo", 409);
        }
        return bodegas[0];
      })();
  if (!bodega) throw new AuthError("Bodega no encontrada", 404);

  const targetUser = await prisma.appUser.findUnique({
    where: { user_id: targetUserId },
    select: { user_id: true, email: true, nombre: true },
  });
  if (!targetUser) {
    throw new AuthError("Usuario destino no encontrado", 404);
  }

  const isSystemAdmin = await userHasAnyRole(actorUserId, ["admin_sistema"]);
  if (!isSystemAdmin) {
    const actorMembership = await prisma.userBodegaRol.findFirst({
      where: {
        user_id: actorUserId,
        bodega_id: bodega.bodega_id,
        rol: { in: [...BODEGA_MANAGER_ROLES] },
      },
      select: { user_id: true },
    });
    if (!actorMembership) {
      throw new AuthError("No autorizado para administrar esta bodega", 403);
    }
  }

  try {
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

    if (normalizedRolesEnBodega.length > 0) {
      await prisma.userBodegaRol.createMany({
        data: normalizedRolesEnBodega.map((role) => ({
          user_id: targetUserId,
          bodega_id: bodega.bodega_id,
          rol: role,
        })),
        skipDuplicates: true,
      });
    }

    if (normalizedRolesEnBodega.length > 0) {
      await prisma.userBodegaRol.deleteMany({
        where: {
          user_id: targetUserId,
          bodega_id: bodega.bodega_id,
          rol: { notIn: normalizedRolesEnBodega },
        },
      });
    } else {
      await prisma.userBodegaRol.deleteMany({
        where: {
          user_id: targetUserId,
          bodega_id: bodega.bodega_id,
        },
      });
    }
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error) {
      const code = (error as { code?: string }).code;
      if (code === "P2003") {
        throw new AuthError("Error de integridad al actualizar roles de bodega", 409);
      }
      if (code === "P2025") {
        throw new AuthError("Registro no encontrado al actualizar roles", 404);
      }
    }
    throw error;
  }

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
  const isSystemAdmin = await userHasAnyRole(actorUserId, ["admin_sistema"]);
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

  const forbiddenScopedRoles = new Set([
    "admin_bodega",
    "encargado_bodega",
    "encargado_finca",
    "productor",
    "operador_campo",
    "responsable_calidad_inocuidad",
    "responsable_ssyo",
    "enologo",
  ]);
  if (forbiddenScopedRoles.has(normalizedRole)) {
    throw new AuthError("Ese rol corresponde a bodega/finca, no a rol global", 400);
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

export async function updateUserFincaRole({
  actorUserId,
  targetUserId,
  fincaId,
  rolEnFinca,
  rolesEnFinca,
}: UpdateUserFincaRoleInput) {
  const normalizedRolesEnFinca = normalizeFincaRolesInput(rolesEnFinca, rolEnFinca);

  const targetUser = await prisma.appUser.findUnique({
    where: { user_id: targetUserId },
    select: { user_id: true, email: true, nombre: true },
  });
  if (!targetUser) {
    throw new AuthError("Usuario destino no encontrado", 404);
  }

  const finca = await prisma.finca.findUnique({
    where: { finca_id: fincaId },
    select: { finca_id: true, nombre_finca: true, bodega_id: true },
  });
  if (!finca) {
    throw new AuthError("Finca no encontrada", 404);
  }

  const isSystemAdmin = await userHasAnyRole(actorUserId, ["admin_sistema"]);
  if (!isSystemAdmin) {
    const [actorAdminBodega, actorEncargadoFinca] = await Promise.all([
      prisma.userBodegaRol.findFirst({
        where: {
          user_id: actorUserId,
          bodega_id: finca.bodega_id,
          rol: { in: [...BODEGA_MANAGER_ROLES] },
        },
        select: { user_id: true },
      }),
      prisma.$queryRaw<Array<{ user_id: string }>>`
        SELECT "user_id"
        FROM "user_finca_rol"
        WHERE "user_id" = ${actorUserId}::uuid
          AND "finca_id" = ${fincaId}::uuid
          AND "rol" = 'encargado_finca'
        LIMIT 1
      `,
    ]);

    if (!actorAdminBodega && actorEncargadoFinca.length === 0) {
      throw new AuthError("No autorizado para administrar esta finca", 403);
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      DELETE FROM "user_finca_rol"
      WHERE "user_id" = ${targetUserId}::uuid
        AND "finca_id" = ${fincaId}::uuid
    `;

    for (const role of normalizedRolesEnFinca) {
      await tx.$executeRaw`
        INSERT INTO "user_finca_rol" ("user_id", "finca_id", "rol")
        VALUES (${targetUserId}::uuid, ${fincaId}::uuid, ${role})
        ON CONFLICT ("user_id", "finca_id", "rol") DO NOTHING
      `;
    }
  });

  const roles = await prisma.$queryRaw<Array<{ rol: string }>>`
    SELECT "rol"
    FROM "user_finca_rol"
    WHERE "user_id" = ${targetUserId}::uuid
      AND "finca_id" = ${fincaId}::uuid
    ORDER BY "rol" ASC
  `;

  return {
    user: targetUser,
    finca: {
      finca_id: finca.finca_id,
      nombre_finca: finca.nombre_finca,
      bodega_id: finca.bodega_id,
    },
    roles_en_finca: roles.map((row) => row.rol),
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
