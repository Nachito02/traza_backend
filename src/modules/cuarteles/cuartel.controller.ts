import type { Request, Response } from "express";
import {
  createCuartel,
  CuartelError,
  listCuartelesByFinca,
} from "./cuartel.service.js";

function handleError(res: Response, error: unknown) {
  if (error instanceof CuartelError) {
    return res.status(error.status).json({ error: error.message });
  }
  return res.status(500).json({ error: "Error interno" });
}

export async function createCuartelHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const {
      fincaId,
      codigo_cuartel,
      superficie_ha,
      cultivo,
      variedad,
      sistema_productivo,
      sistema_conduccion,
    } = req.body ?? {};
    const cuartel = await createCuartel({
      fincaId,
      codigo_cuartel,
      superficie_ha,
      cultivo,
      variedad,
      sistema_productivo,
      sistema_conduccion,
      userId: req.user.userId,
    });
    return res.status(201).json(cuartel);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listCuartelesByFincaHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const fincaId = String(req.params.fincaId ?? "");
    if (!fincaId) {
      return res.status(400).json({ error: "fincaId requerido" });
    }
    const cuarteles = await listCuartelesByFinca(fincaId, req.user.userId);
    return res.json(cuarteles);
  } catch (error) {
    return handleError(res, error);
  }
}
