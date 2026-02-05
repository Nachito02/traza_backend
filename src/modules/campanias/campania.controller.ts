import type { Request, Response } from "express";
import { listCampanias } from "./campania.service.js";

export async function listCampaniasHandler(_req: Request, res: Response) {
  try {
    const campanias = await listCampanias();
    return res.json(campanias);
  } catch {
    return res.status(500).json({ error: "Error interno" });
  }
}
