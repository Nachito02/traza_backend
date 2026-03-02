import type { Request, Response } from 'express';
import {
  AuthError,
  createUser,
  getUserBodegas,
  getUserById,
  getUserRoles,
  listUsers,
  login,
  refreshAccessToken,
  revokeRefreshToken,
  updateUserGlobalRole,
  updateUserBodegaRole,
} from './auth.service.js';

function handleError(res: Response, error: unknown) {
  if (error instanceof AuthError) {
    return res.status(error.status).json({ error: error.message });
  }
  return res.status(500).json({ error: 'Error interno' });
}

function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
  };
}

export async function loginHandler(req: Request, res: Response) {
  try {
    const { email, password } = req.body ?? {};
    const result = await login({ email, password });
    const options = cookieOptions();
    res.cookie('access_token', result.token, {
      ...options,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', result.refreshToken, {
      ...options,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return res.json({
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

export async function meHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const user = await getUserById(req.user.userId);
    return res.json({
      id: user.user_id,
      email: user.email,
      nombre: user.nombre,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createUserHandler(req: Request, res: Response) {
  try {
    const { email, password, nombre, bodegaId, bodegaNombre, rolEnBodega, rolesEnBodega } = req.body ?? {};
    const user = await createUser({
      email,
      password,
      nombre,
      bodegaId,
      bodegaNombre,
      rolEnBodega,
      rolesEnBodega,
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

export async function refreshHandler(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies?.refresh_token;
    const result = await refreshAccessToken(refreshToken);
    const options = cookieOptions();
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
    const options = cookieOptions();
    res.clearCookie('access_token', options);
    res.clearCookie('refresh_token', options);
    return res.status(204).send();
  } catch (error) {
    return handleError(res, error);
  }
}
