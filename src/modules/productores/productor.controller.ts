import type { Request, Response } from "express";
import {
  createProductor,
  deleteProductor,
  getProductorById,
  listProductores,
  ProductorError,
  updateProductor,
} from "./productor.service.js";

function handleError(res: Response, error: unknown) {
  if (error instanceof ProductorError) {
    return res.status(error.status).json({ error: error.message });
  }
  return res.status(500).json({ error: "Error interno" });
}

export async function createProductorHandler(req: Request, res: Response) {
  try {
    const { razon_social, cuit, activo } = req.body ?? {};
    const productor = await createProductor({ razon_social, cuit, activo });
    return res.status(201).json(productor);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listProductoresHandler(req: Request, res: Response) {
  try {
    const activoQuery =
      typeof req.query.activo === "string" ? req.query.activo : undefined;
    const activo =
      activoQuery !== undefined
        ? activoQuery.toLowerCase() === "true"
          ? true
          : activoQuery.toLowerCase() === "false"
            ? false
            : undefined
        : undefined;
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

    const input: { activo?: boolean; search?: string } = {};
    if (activo !== undefined) input.activo = activo;
    if (search !== undefined) input.search = search;
    const productores = await listProductores(input);
    return res.json(productores);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getProductorHandler(req: Request, res: Response) {
  try {
    const productorId = String(req.params.productorId ?? "");
    if (!productorId) {
      return res.status(400).json({ error: "productorId requerido" });
    }
    const productor = await getProductorById(productorId);
    return res.json(productor);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateProductorHandler(req: Request, res: Response) {
  try {
    const productorId = String(req.params.productorId ?? "");
    if (!productorId) {
      return res.status(400).json({ error: "productorId requerido" });
    }

    const { razon_social, cuit, activo } = req.body ?? {};
    const productor = await updateProductor({
      productorId,
      razon_social,
      cuit,
      activo,
    });

    return res.json(productor);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteProductorHandler(req: Request, res: Response) {
  try {
    const productorId = String(req.params.productorId ?? "");
    if (!productorId) {
      return res.status(400).json({ error: "productorId requerido" });
    }

    const productor = await deleteProductor(productorId);
    return res.json(productor);
  } catch (error) {
    return handleError(res, error);
  }
}
