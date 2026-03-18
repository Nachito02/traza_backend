import type { Request, Response } from 'express';
import {
  AuthError,
  changePassword,
  createUser,
  deleteUser,
  getUserDetail,
  getUserBodegas,
  getUserById,
  getUserRoles,
  listUsers,
  login,
  refreshAccessToken,
  revokeRefreshToken,
  updateUserGlobalRole,
  updateUserBodegaRole,
  updateUser,
  updateUserFincaRole,
} from './auth.service.js';

function handleError(res: Response, error: unknown) {
  if (error instanceof AuthError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error('[auth] Unhandled error:', error);
  return res.status(500).json({ error: 'Error interno' });
}

function cookieOptions(req: Request) {
  const isProd = process.env.NODE_ENV === 'production';
  const forwardedProto = req.header('x-forwarded-proto');
  const isHttps = req.secure || forwardedProto?.includes('https') || false;
  const configuredSameSite = (process.env.COOKIE_SAME_SITE ?? '').toLowerCase();
  const sameSite =
    configuredSameSite === 'none' ||
    configuredSameSite === 'lax' ||
    configuredSameSite === 'strict'
      ? configuredSameSite
      : isProd || isHttps
      ? 'none'
      : 'lax';
  const secure = process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === 'true'
    : sameSite === 'none' || isProd || isHttps;

  return {
    httpOnly: true,
    secure,
    sameSite: sameSite as 'lax' | 'strict' | 'none',
    path: '/',
  };
}

export async function loginHandler(req: Request, res: Response) {
  try {
    const { email, password } = req.body ?? {};
    const result = await login({ email, password });

    if ('must_change_password' in result) {
      return res.status(200).json({ must_change_password: true, userId: result.userId });
    }

    const options = cookieOptions(req);
    res.cookie('access_token', result.token, {
      ...options,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', result.refreshToken, {
      ...options,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return res.json({
      access_token: result.token,
      refresh_token: result.refreshToken,
      user: {
        id: result.user.user_id,
        email: result.user.email,
        nombre: result.user.nombre,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function changePasswordHandler(req: Request, res: Response) {
  try {
    const { userId, currentPassword, newPassword } = req.body ?? {};
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ error: "userId, currentPassword y newPassword son requeridos" });
    }
    const result = await changePassword({ userId, currentPassword, newPassword });
    return res.json({ access_token: result.token, refresh_token: result.refreshToken });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function meHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const [user, roles] = await Promise.all([
      getUserById(req.user.userId),
      getUserRoles(req.user.userId),
    ]);
    return res.json({
      id: user.user_id,
      email: user.email,
      nombre: user.nombre,
      whatsapp: user.whatsapp_e164 ?? null,
      is_active: user.is_active,
      roles_globales: roles,
      bodegas: user.user_bodega.map((ub) => ({
        bodega_id: ub.bodega?.bodega_id,
        nombre: ub.bodega?.nombre,
        roles: ub.user_bodega_rol.map((r) => r.rol).sort(),
      })),
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createUserHandler(req: Request, res: Response) {
  try {
    const { email, password, nombre, bodegaId, bodegaNombre, rolEnBodega, rolesEnBodega, whatsapp } = req.body ?? {};
    const user = await createUser({
      ...(req.user?.userId ? { actorUserId: req.user.userId } : {}),
      email,
      password,
      nombre,
      bodegaId,
      bodegaNombre,
      rolEnBodega,
      rolesEnBodega,
      ...(whatsapp !== undefined ? { whatsapp: String(whatsapp) } : {}),
    });
    return res.status(201).json({
      id: user.user_id,
      email: user.email,
      nombre: user.nombre,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function meBodegasHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const bodegas = await getUserBodegas(req.user.userId);
    return res.json(bodegas);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function meRolesHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const roles = await getUserRoles(req.user.userId);
    return res.json({ roles });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listUsersHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const bodegaName =
      typeof req.query.name === "string" ? req.query.name : undefined;
    const users = await listUsers(req.user.userId, bodegaName);
    return res.json(users);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getUserDetailHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const userId = String(req.params.userId ?? "");
    const user = await getUserDetail(req.user.userId, userId);
    return res.json(user);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateUserHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const userId = String(req.params.userId ?? "");
    const { nombre, email, password, is_active, whatsapp } = req.body ?? {};
    const updated = await updateUser({
      actorUserId: req.user.userId,
      targetUserId: userId,
      ...(nombre !== undefined ? { nombre: String(nombre) } : {}),
      ...(email !== undefined ? { email: String(email) } : {}),
      ...(password !== undefined ? { password: String(password) } : {}),
      ...(is_active !== undefined ? { is_active: Boolean(is_active) } : {}),
      ...(whatsapp !== undefined ? { whatsapp: whatsapp === null ? null : String(whatsapp) } : {}),
    });
    return res.json(updated);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteUserHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const userId = String(req.params.userId ?? "");
    const result = await deleteUser(req.user.userId, userId);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateUserBodegaRoleHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const targetUserId = String(req.params.userId ?? "");
    const bodegaName = String(req.params.name ?? "");
    const hasRolEnBodega = req.body?.rolEnBodega !== undefined;
    const rolesEnBodega = Array.isArray(req.body?.rolesEnBodega)
      ? req.body.rolesEnBodega.map((role: unknown) => String(role))
      : undefined;
    const result = await updateUserBodegaRole({
      actorUserId: req.user.userId,
      targetUserId,
      bodegaName,
      ...(hasRolEnBodega ? { rolEnBodega: String(req.body?.rolEnBodega ?? "") } : {}),
      ...(rolesEnBodega ? { rolesEnBodega } : {}),
    });
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateUserBodegaRoleByIdHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const targetUserId = String(req.params.userId ?? "");
    const bodegaId = String(req.params.bodegaId ?? "");
    const hasRolEnBodega = req.body?.rolEnBodega !== undefined;
    const rolesEnBodega = Array.isArray(req.body?.rolesEnBodega)
      ? req.body.rolesEnBodega.map((role: unknown) => String(role))
      : undefined;
    const result = await updateUserBodegaRole({
      actorUserId: req.user.userId,
      targetUserId,
      bodegaId,
      ...(hasRolEnBodega ? { rolEnBodega: String(req.body?.rolEnBodega ?? "") } : {}),
      ...(rolesEnBodega ? { rolesEnBodega } : {}),
    });
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateUserGlobalRoleHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const targetUserId = String(req.params.userId ?? "");
    const rolGlobal = String(req.body?.rolGlobal ?? "");
    const enabled = req.body?.enabled === undefined ? true : Boolean(req.body.enabled);
    const result = await updateUserGlobalRole({
      actorUserId: req.user.userId,
      targetUserId,
      rolGlobal,
      enabled,
    });
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateUserFincaRoleHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const targetUserId = String(req.params.userId ?? "");
    const fincaId = String(req.params.fincaId ?? "");
    const hasRolEnFinca = req.body?.rolEnFinca !== undefined;
    const rolesEnFinca = Array.isArray(req.body?.rolesEnFinca)
      ? req.body.rolesEnFinca.map((role: unknown) => String(role))
      : undefined;

    const result = await updateUserFincaRole({
      actorUserId: req.user.userId,
      targetUserId,
      fincaId,
      ...(hasRolEnFinca ? { rolEnFinca: String(req.body?.rolEnFinca ?? "") } : {}),
      ...(rolesEnFinca ? { rolesEnFinca } : {}),
    });
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function refreshHandler(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies?.refresh_token;
    const result = await refreshAccessToken(refreshToken);
    const options = cookieOptions(req);
    res.cookie('access_token', result.token, {
      ...options,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', result.refreshToken, {
      ...options,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return res.json({ ok: true });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function logoutHandler(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies?.refresh_token;
    await revokeRefreshToken(refreshToken);
    const options = cookieOptions(req);
    res.clearCookie('access_token', options);
    res.clearCookie('refresh_token', options);
    return res.status(204).send();
  } catch (error) {
    return handleError(res, error);
  }
}
