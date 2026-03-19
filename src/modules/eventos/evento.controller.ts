import type { Request, Response } from "express";
import { createEvento, listEventosByMilestone, getEventoById, deleteEvento, EventoError } from "./evento.service.js";

function handleError(res: Response, error: unknown) {
  if (error instanceof EventoError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error("[evento]", error);
  return res.status(500).json({ error: "Error interno" });
}

export async function createEventoHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    const tipo = req.params.tipo as string;
    const body = req.body ?? {};
    const evento = await createEvento({ ...body, tipo, userId: req.user.userId });
    return res.status(201).json(evento);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listEventosHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    const milestoneId = req.params.milestoneId as string;
    const tipo = req.query.tipo as string | undefined;
    return res.json(await listEventosByMilestone(milestoneId, req.user.userId, tipo));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getEventoHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    const milestoneId = String(req.params["milestoneId"] ?? "");
    const tipo = String(req.params["tipo"] ?? "");
    const eventoId = String(req.params["eventoId"] ?? "");
    return res.json(await getEventoById(tipo, eventoId, req.user.userId, milestoneId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteEventoHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    const milestoneId = String(req.params["milestoneId"] ?? "");
    const tipo = String(req.params["tipo"] ?? "");
    const eventoId = String(req.params["eventoId"] ?? "");
    return res.json(await deleteEvento(tipo, eventoId, req.user.userId, milestoneId));
  } catch (error) {
    return handleError(res, error);
  }
}
