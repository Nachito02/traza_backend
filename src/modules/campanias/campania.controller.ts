import type { Request, Response } from "express";
import { CampaniaError, createCampania, listCampanias } from "./campania.service.js";

export async function listCampaniasHandler(_req: Request, res: Response) {
  try {
    const campanias = await listCampanias();
    return res.json(campanias);
  } catch {
    return res.status(500).json({ error: "Error interno" });
  }
}

export async function createCampaniaHandler(req: Request, res: Response) {
  try {
    const { nombre, fecha_inicio, fecha_fin, estado } = req.body ?? {};
    const campania = await createCampania({
      nombre,
      fecha_inicio,
      fecha_fin,
      estado,
    });
    return res.status(201).json(campania);
  } catch (error) {
    if (error instanceof CampaniaError) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: "Error interno" });
  }
}
