import type { Request, Response } from "express";
import {
  BodegaError,
  createBodega,
  linkProductorToBodega,
  listFincaVinculosByBodega,
  listProductoresByBodega,
  upsertBodegaFincaVinculo,
} from "./bodega.service.js";

function handleError(res: Response, error: unknown) {
  if (error instanceof BodegaError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error("[bodega]", error);
  return res.status(500).json({ error: "Error interno" });
}

export async function createBodegaHandler(req: Request, res: Response) {
  try {
    const { nombre, razon_social, cuit, productorId, productorIds } = req.body ?? {};
    const bodega = await createBodega({
      nombre,
      razon_social,
      cuit,
      productorId,
      productorIds,
    });
    return res.status(201).json(bodega);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listBodegaProductoresHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const bodegaId = String(req.params.bodegaId ?? "");
    if (!bodegaId) {
      return res.status(400).json({ error: "bodegaId requerido" });
    }
    const productores = await listProductoresByBodega(bodegaId, req.user.userId);
    return res.json(productores);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function linkProductorToBodegaHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const bodegaId = String(req.params.bodegaId ?? "");
    const { productorId, razon_social, cuit, tipo_relacion } = req.body ?? {};
    const relation = await linkProductorToBodega({
      bodegaId,
      userId: req.user.userId,
      productorId,
      razon_social,
      cuit,
      tipo_relacion,
    });
    return res.status(201).json(relation);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listBodegaFincaVinculosHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const bodegaId = String(req.params.bodegaId ?? "");
    if (!bodegaId) {
      return res.status(400).json({ error: "bodegaId requerido" });
    }

    const vinculos = await listFincaVinculosByBodega(bodegaId, req.user.userId);
    return res.json(vinculos);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function upsertBodegaFincaVinculoHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const bodegaId = String(req.params.bodegaId ?? "");
    const fincaId = String(req.params.fincaId ?? "");
    const { tipo_vinculo, activo } = req.body ?? {};

    const relation = await upsertBodegaFincaVinculo({
      bodegaId,
      fincaId,
      userId: req.user.userId,
      ...(tipo_vinculo !== undefined ? { tipoVinculo: String(tipo_vinculo) } : {}),
      ...(activo !== undefined ? { activo: Boolean(activo) } : {}),
    });
    return res.status(200).json(relation);
  } catch (error) {
    return handleError(res, error);
  }
}
