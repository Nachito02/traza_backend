import type { Request, Response } from "express";
import { BodegaError, createBodega } from "./bodega.service.js";

function handleError(res: Response, error: unknown) {
  if (error instanceof BodegaError) {
    return res.status(error.status).json({ error: error.message });
  }
  return res.status(500).json({ error: "Error interno" });
}

export async function createBodegaHandler(req: Request, res: Response) {
  try {
    const { nombre, razon_social, cuit, productorId } = req.body ?? {};
    const bodega = await createBodega({
      nombre,
      razon_social,
      cuit,
      productorId,
    });
    return res.status(201).json(bodega);
  } catch (error) {
    return handleError(res, error);
  }
}
