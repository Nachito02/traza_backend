import type { Request, Response } from "express";
import { getPublicTrazabilidadCuartel, PublicError } from "./public.service.js";

export async function getPublicTrazabilidadCuartelHandler(req: Request, res: Response) {
  try {
    const cuartelId = String(req.params.cuartelId ?? "");
    const data = await getPublicTrazabilidadCuartel(cuartelId);
    res.json(data);
  } catch (err) {
    if (err instanceof PublicError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error("[public] getPublicTrazabilidadCuartel error:", err);
    res.status(500).json({ error: "Error interno" });
  }
}
