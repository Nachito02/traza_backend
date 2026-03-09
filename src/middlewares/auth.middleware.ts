import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const devApiKey = process.env.DEV_API_KEY;
  if (devApiKey) {
    const authHeader = req.headers.authorization;
    const bearerValue = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
    if (bearerValue?.startsWith("devkey:")) {
      const parts = bearerValue.slice(7).split(":");
      if (parts.length === 2 && parts[0] === devApiKey) {
        req.user = { userId: parts[1] };
        return next();
      }
      return res.status(401).json({ error: "dev api key inválida" });
    }
  }

  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : undefined;

  const token = bearerToken ?? req.cookies?.access_token;
  if (!token) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "JWT_SECRET no configurado" });
  }

  try {
    const payload = jwt.verify(token, secret);
    if (typeof payload !== "object" || payload === null) {
      return res.status(401).json({ error: "unauthorized" });
    }
    req.user = payload as { userId: string; email?: string | null };
    return next();
  } catch {
    return res.status(401).json({ error: "unauthorized" });
  }
}
