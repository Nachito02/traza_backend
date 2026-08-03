import type { Request, Response } from "express";
import {
  createFinca,
  deleteFinca,
  FincaError,
  getFincaById,
  listFincasConDetalles,
  listFincasByBodega,
  updateFinca,
} from "./finca.service.js";

function handleError(res: Response, error: unknown) {
  if (error instanceof FincaError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error("[finca]", error);
  return res.status(500).json({ error: "Error interno" });
}

export async function createFincaHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const {
      bodegaId,
      nombre_finca,
      rut,
      renspa,
      catastro,
      ubicacion_texto,
      nro_inscripto_inv,
      cuit,
      razon_social,
    } = req.body ?? {};
    const finca = await createFinca({
      bodegaId,
      nombre_finca,
      rut,
      renspa,
      catastro,
      ubicacion_texto,
      nro_inscripto_inv,
      cuit,
      razon_social,
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

export async function listFincasConDetallesHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const bodegaId = typeof req.query.bodegaId === "string" ? req.query.bodegaId : undefined;
    const fincas = await listFincasConDetalles(req.user.userId, bodegaId);
    return res.json(fincas);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getFincaByIdHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const fincaId = String(req.params.fincaId ?? "");
    if (!fincaId) {
      return res.status(400).json({ error: "fincaId requerido" });
    }
    const finca = await getFincaById(fincaId, req.user.userId);
    return res.json(finca);
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
    const {
      nombre_finca,
      rut,
      renspa,
      catastro,
      ubicacion_texto,
      nro_inscripto_inv,
      cuit,
      razon_social,
    } = req.body ?? {};
    const finca = await updateFinca(fincaId, {
      nombre_finca,
      rut,
      renspa,
      catastro,
      ubicacion_texto,
      nro_inscripto_inv,
      cuit,
      razon_social,
      userId: req.user.userId,
    });
    return res.json(finca);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteFincaHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const fincaId = String(req.params.fincaId ?? "");
    const result = await deleteFinca(fincaId, req.user.userId);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}
