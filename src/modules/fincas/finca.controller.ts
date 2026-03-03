import type { Request, Response } from "express";
import {
  createFinca,
  FincaError,
  listFincasByBodega,
  updateFinca,
} from "./finca.service.js";

function handleError(res: Response, error: unknown) {
  if (error instanceof FincaError) {
    return res.status(error.status).json({ error: error.message });
  }
  return res.status(500).json({ error: "Error interno" });
}

export async function createFincaHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const { bodegaId, nombre_finca, rut, renspa, catastro, ubicacion_texto } =
      req.body ?? {};
    const finca = await createFinca({
      bodegaId,
      nombre_finca,
      rut,
      renspa,
      catastro,
      ubicacion_texto,
      userId: req.user.userId,
    });
    return res.status(201).json(finca);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listFincasByBodegaHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const bodegaId = String(req.params.bodegaId ?? "");
    if (!bodegaId) {
      return res.status(400).json({ error: "bodegaId requerido" });
    }
    const fincas = await listFincasByBodega(bodegaId, req.user.userId);
    return res.json(fincas);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateFincaHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const fincaId = String(req.params.fincaId ?? "");
    const { nombre_finca, rut, renspa, catastro, ubicacion_texto } = req.body ?? {};
    const finca = await updateFinca(fincaId, {
      nombre_finca,
      rut,
      renspa,
      catastro,
      ubicacion_texto,
      userId: req.user.userId,
    });
    return res.json(finca);
  } catch (error) {
    return handleError(res, error);
  }
}
