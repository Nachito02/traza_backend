import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const token = authHeader.slice(7);
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
