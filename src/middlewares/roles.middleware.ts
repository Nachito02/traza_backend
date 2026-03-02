import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prismaClient.js";

export async function getUserRoleNames(userId: string): Promise<string[]> {
  const rows = await prisma.userRol.findMany({
    where: { user_id: userId },
    include: { rol: true },
  });
  return rows.map((r) => r.rol.nombre);
}

export async function userHasAnyRole(
  userId: string,
  allowedRoles: string[],
): Promise<boolean> {
  const roles = await getUserRoleNames(userId);
  return roles.some((role) => allowedRoles.includes(role));
}

export function requireRoles(allowedRoles: string[]) {
  return async function rolesMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ error: "unauthorized" });
      }

      const ok = await userHasAnyRole(req.user.userId, allowedRoles);
      if (!ok) {
        return res.status(403).json({ error: "forbidden" });
      }

      return next();
    } catch {
      return res.status(500).json({ error: "Error interno" });
    }
  };
}
