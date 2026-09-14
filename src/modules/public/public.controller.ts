import type { Request, Response } from "express";
import { getPublicLote, getPublicProducto, getPublicTrazabilidadCuartel, PublicError } from "./public.service.js";

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

export async function getPublicProductoHandler(req: Request, res: Response) {
  try {
    const codigoQr = String(req.params.codigoQr ?? "");
    const data = await getPublicProducto(codigoQr);
    res.json(data);
  } catch (err) {
    if (err instanceof PublicError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error("[public] getPublicProducto error:", err);
    res.status(500).json({ error: "Error interno" });
  }
}

export async function getPublicLoteHandler(req: Request, res: Response) {
  try {
    const loteId = String(req.params.loteId ?? "");
    const data = await getPublicLote(loteId);
    res.json(data);
  } catch (err) {
    if (err instanceof PublicError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error("[public] getPublicLote error:", err);
    res.status(500).json({ error: "Error interno" });
  }
}
