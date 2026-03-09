import type { Request, Response } from "express";
import {
  addTrazabilidadOrigen,
  createTrazabilidad,
  getTrazabilidadInversaByCodigoEnvase,
  getTrazabilidadById,
  TrazabilidadError,
  listTrazabilidades,
} from "./trazabilidad.service.js";

function handleError(res: Response, error: unknown) {
  if (error instanceof TrazabilidadError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error("[trazabilidad]", error);
  return res.status(500).json({ error: "Error interno" });
}

export async function createTrazabilidadHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const {
      protocoloId,
      bodegaId,
      fincaId,
      cuartelId,
      campaniaId,
      nombre_producto,
      imagen_producto,
    } = req.body ?? {};
    const trazabilidad = await createTrazabilidad({
      protocoloId,
      bodegaId,
      fincaId,
      cuartelId,
      campaniaId,
      nombre_producto,
      imagen_producto,
      userId: req.user.userId,
    });
    return res.status(201).json(trazabilidad);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listTrazabilidadesHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const bodegaId =
      typeof req.query.bodegaId === "string" ? req.query.bodegaId : undefined;
    const trazabilidades = await listTrazabilidades(
      req.user.userId,
      bodegaId,
    );
    return res.json(trazabilidades);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getTrazabilidadHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const id = String(req.params.id ?? "");
    if (!id) {
      return res.status(400).json({ error: "id requerido" });
    }
    const trazabilidad = await getTrazabilidadById(id, req.user.userId);
    return res.json(trazabilidad);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function addTrazabilidadOrigenHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const trazabilidadId = String(req.params.id ?? "");
    const { fincaId, cuartelId } = req.body ?? {};
    const origenes = await addTrazabilidadOrigen({
      trazabilidadId,
      fincaId,
      cuartelId,
      userId: req.user.userId,
    });
    return res.json(origenes);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getTrazabilidadInversaByCodigoEnvaseHandler(
  req: Request,
  res: Response,
) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const codigoQr = String(req.params.codigoQr ?? "");
    if (!codigoQr) {
      return res.status(400).json({ error: "codigoQr requerido" });
    }
    const payload = await getTrazabilidadInversaByCodigoEnvase(
      codigoQr,
      req.user.userId,
    );
    return res.json(payload);
  } catch (error) {
    return handleError(res, error);
  }
}
