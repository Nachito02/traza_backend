import type { Request, Response } from 'express';
import { AuthError, createUser, getUserById, login } from './auth.service.js';

function handleError(res: Response, error: unknown) {
  if (error instanceof AuthError) {
    return res.status(error.status).json({ error: error.message });
  }
  return res.status(500).json({ error: 'Error interno' });
}

export async function loginHandler(req: Request, res: Response) {
  try {
    const { email, password } = req.body ?? {};
    const result = await login({ email, password });
    return res.json({
      token: result.token,
      user: {
        id: result.user.user_id,
        email: result.user.email,
        nombre: result.user.nombre,
        bodegaId: result.user.bodega_id,
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
      bodegaId: user.bodega_id,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createUserHandler(req: Request, res: Response) {
  try {
    const { email, password, nombre, bodegaId } = req.body ?? {};
    const user = await createUser({ email, password, nombre, bodegaId });
    return res.status(201).json({
      id: user.user_id,
      email: user.email,
      nombre: user.nombre,
      bodegaId: user.bodega_id,
    });
  } catch (error) {
    return handleError(res, error);
  }
}
