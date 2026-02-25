import type { Request, Response } from "express";
import { createEvento, EventoError } from "./evento.service.js";

export async function createEventoHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const tipo = req.params.tipo as string;
    const body = req.body ?? {};
    const evento = await createEvento({
      ...body,
      tipo,
      userId: req.user.userId,
    });
    return res.status(201).json(evento);
  } catch (error) {
    if (error instanceof EventoError) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(400).json({ error: "Datos inválidos" });
  }
}
