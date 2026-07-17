import type { Request, Response } from "express";
import {
  InventarioError,
  listInsumos,
  createInsumo,
  updateInsumo,
  deleteInsumo,
  listCategoriasMaestro,
  listMaestro,
  registrarIngreso,
  registrarAjuste,
  getExistencias,
  listMovimientos,
  getAlertas,
} from "./inventario.service.js";
import type { AmbitoInsumo } from "../../generated/prisma/index.js";

function requireBodegaId(req: Request, res: Response): string | null {
  const bodegaId =
    typeof req.query.bodegaId === "string"
      ? req.query.bodegaId
      : typeof req.body?.bodegaId === "string"
        ? req.body.bodegaId
        : "";
  if (!bodegaId) {
    res.status(400).json({ error: "bodegaId requerido" });
    return null;
  }
  return bodegaId;
}

function handleError(res: Response, error: unknown) {
  if (error instanceof InventarioError) {
    return res.status(error.status).json({ error: error.message });
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  ) {
    return res.status(409).json({ error: "Ya existe un insumo con ese tipo y nombre." });
  }
  console.error("[inventario]", error);
  return res.status(500).json({ error: "Error interno" });
}

function requireUser(req: Request, res: Response): string | null {
  if (!req.user?.userId) {
    res.status(401).json({ error: "unauthorized" });
    return null;
  }
  return req.user.userId;
}

export async function listInsumosHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const bodegaId = typeof req.query.bodegaId === "string" ? req.query.bodegaId : undefined;
    const incluirInactivos = req.query.incluirInactivos === "true";
    const ambito = typeof req.query.ambito === "string" ? (req.query.ambito as AmbitoInsumo) : undefined;
    return res.json(await listInsumos(userId, bodegaId, incluirInactivos, ambito));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function categoriasMaestroHandler(req: Request, res: Response) {
  try {
    if (!requireUser(req, res)) return;
    return res.json(await listCategoriasMaestro(req.query.ambito));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function maestroHandler(req: Request, res: Response) {
  try {
    if (!requireUser(req, res)) return;
    const categoria = typeof req.query.categoria === "string" ? req.query.categoria : undefined;
    return res.json(await listMaestro(req.query.ambito, categoria));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createInsumoHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const {
      bodegaId,
      ambito,
      tipo,
      familia,
      nombre_comercial,
      principio_activo,
      unidad_base,
      dosis_min,
      dosis_max,
      unidad_dosis,
      proveedor,
      costo_unitario,
      vigencia,
      stock_minimo,
      marca,
      fabricante,
      presentacion,
    } = req.body ?? {};
    const row = await createInsumo({
      userId,
      bodegaId,
      ambito,
      tipo,
      familia,
      nombre_comercial,
      principio_activo,
      unidad_base,
      dosis_min,
      dosis_max,
      unidad_dosis,
      proveedor,
      costo_unitario,
      vigencia,
      stock_minimo,
      marca,
      fabricante,
      presentacion,
    });
    return res.status(201).json(row);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateInsumoHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const row = await updateInsumo(String(req.params.id), userId, req.body ?? {});
    return res.json(row);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteInsumoHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    return res.json(await deleteInsumo(String(req.params.id), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

// ── Stock ──

export async function existenciasHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const bodegaId = requireBodegaId(req, res);
    if (!bodegaId) return;
    return res.json(await getExistencias(userId, bodegaId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function ingresoHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const { bodegaId, insumoId, cantidad, costo_unitario, motivo } = req.body ?? {};
    const row = await registrarIngreso({ userId, bodegaId, insumoId, cantidad, costo_unitario, motivo });
    return res.status(201).json(row);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function ajusteHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const { bodegaId, insumoId, cantidad, motivo } = req.body ?? {};
    const row = await registrarAjuste({ userId, bodegaId, insumoId, cantidad, motivo });
    return res.status(201).json(row);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function movimientosHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const bodegaId = requireBodegaId(req, res);
    if (!bodegaId) return;
    return res.json(await listMovimientos(userId, bodegaId, String(req.params.insumoId)));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function alertasHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const bodegaId = requireBodegaId(req, res);
    if (!bodegaId) return;
    return res.json(await getAlertas(userId, bodegaId));
  } catch (error) {
    return handleError(res, error);
  }
}
