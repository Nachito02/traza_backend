import type { Request, Response } from "express";
import { listOperariosByBodega, createOperario, deactivateOperario, PersonaError } from "./persona.service.js";

function handleError(res: Response, error: unknown) {
  if (error instanceof PersonaError) return res.status(error.status).json({ error: error.message });
  console.error("[operarios]", error);
  return res.status(500).json({ error: "Error interno" });
}

export async function listOperariosHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    return res.json(await listOperariosByBodega(String(req.params["bodegaId"] ?? ""), req.user.userId));
  } catch (e) {
    return handleError(res, e);
  }
}

export async function createOperarioHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    const bodegaId = String(req.params["bodegaId"] ?? "");
    const user = await createOperario(bodegaId, req.body, req.user.userId);
    return res.status(201).json(user);
  } catch (e) {
    return handleError(res, e);
  }
}

export async function deactivateOperarioHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    return res.json(await deactivateOperario(String(req.params["userId"] ?? ""), req.user.userId));
  } catch (e) {
    return handleError(res, e);
  }
}
