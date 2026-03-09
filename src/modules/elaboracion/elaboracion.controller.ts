import type { Request, Response } from "express";
import {
  createAnalisisRecepcion,
  createCiu,
  createCiuRecepcion,
  createControlFermentacion,
  createCodigoEnvase,
  createCorte,
  createDespacho,
  createExistenciaVasija,
  createLoteFraccionamiento,
  createOperacionVasija,
  createProducto,
  createQcIngresoUva,
  createRecepcionBodega,
  createRemitoUva,
  createVasija,
  deleteAnalisisRecepcion,
  deleteCiu,
  deleteCiuRecepcion,
  deleteControlFermentacion,
  deleteCodigoEnvase,
  deleteCorte,
  deleteDespacho,
  deleteExistenciaVasija,
  deleteLoteFraccionamiento,
  deleteOperacionVasija,
  deleteProducto,
  deleteQcIngresoUva,
  deleteRecepcionBodega,
  deleteRemitoUva,
  deleteVasija,
  ElaboracionError,
  getAnalisisRecepcionById,
  getCiuById,
  getCiuRecepcionById,
  getControlFermentacionById,
  getCodigoEnvaseById,
  getCorteById,
  getDespachoById,
  getExistenciaVasijaById,
  getLoteFraccionamientoById,
  getOperacionVasijaById,
  getProductoById,
  getQcIngresoUvaById,
  getRecepcionBodegaById,
  getRemitoUvaById,
  getVasijaById,
  listAnalisisRecepcion,
  listCius,
  listCiuRecepciones,
  listControlesFermentacion,
  listCodigosEnvase,
  listCortes,
  listDespachos,
  listExistenciasVasija,
  listLotesFraccionamiento,
  listOperacionesVasija,
  listProductos,
  listQcIngresoUva,
  listRecepcionesBodega,
  listRemitosUva,
  listVasijas,
  updateAnalisisRecepcion,
  updateCiu,
  updateCiuRecepcion,
  updateControlFermentacion,
  updateCodigoEnvase,
  updateCorte,
  updateDespacho,
  updateExistenciaVasija,
  updateLoteFraccionamiento,
  updateOperacionVasija,
  updateProducto,
  updateQcIngresoUva,
  updateRecepcionBodega,
  updateRemitoUva,
  updateVasija,
} from "./elaboracion.service.js";

function handleError(res: Response, error: unknown) {
  if (error instanceof ElaboracionError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error("[elaboracion]", error);
  return res.status(500).json({ error: "Error interno" });
}

function requireUserId(req: Request, res: Response) {
  if (!req.user?.userId) {
    res.status(401).json({ error: "unauthorized" });
    return null;
  }
  return req.user.userId;
}

export async function listVasijasHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const bodegaId =
      typeof req.query.bodegaId === "string" ? req.query.bodegaId : undefined;
    return res.json(await listVasijas(userId, bodegaId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getVasijaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(await getVasijaById(String(req.params.id ?? ""), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createVasijaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const created = await createVasija({ userId, ...(req.body ?? {}) });
    return res.status(201).json(created);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateVasijaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(
      await updateVasija(String(req.params.id ?? ""), userId, req.body ?? {}),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteVasijaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(await deleteVasija(String(req.params.id ?? ""), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listCortesHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const bodegaId =
      typeof req.query.bodegaId === "string" ? req.query.bodegaId : undefined;
    return res.json(await listCortes(userId, bodegaId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getCorteHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(await getCorteById(String(req.params.id ?? ""), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createCorteHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const created = await createCorte({ userId, ...(req.body ?? {}) });
    return res.status(201).json(created);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateCorteHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(
      await updateCorte(String(req.params.id ?? ""), userId, req.body ?? {}),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteCorteHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(await deleteCorte(String(req.params.id ?? ""), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listProductosHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const bodegaId =
      typeof req.query.bodegaId === "string" ? req.query.bodegaId : undefined;
    return res.json(await listProductos(userId, bodegaId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getProductoHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(await getProductoById(String(req.params.id ?? ""), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createProductoHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const created = await createProducto({ userId, ...(req.body ?? {}) });
    return res.status(201).json(created);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateProductoHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(
      await updateProducto(String(req.params.id ?? ""), userId, req.body ?? {}),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteProductoHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(await deleteProducto(String(req.params.id ?? ""), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listLotesFraccionamientoHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const bodegaId =
      typeof req.query.bodegaId === "string" ? req.query.bodegaId : undefined;
    return res.json(await listLotesFraccionamiento(userId, bodegaId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getLoteFraccionamientoHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(
      await getLoteFraccionamientoById(String(req.params.id ?? ""), userId),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createLoteFraccionamientoHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const created = await createLoteFraccionamiento({ userId, ...(req.body ?? {}) });
    return res.status(201).json(created);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateLoteFraccionamientoHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(
      await updateLoteFraccionamiento(
        String(req.params.id ?? ""),
        userId,
        req.body ?? {},
      ),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteLoteFraccionamientoHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(
      await deleteLoteFraccionamiento(String(req.params.id ?? ""), userId),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listCodigosEnvaseHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const bodegaId =
      typeof req.query.bodegaId === "string" ? req.query.bodegaId : undefined;
    const loteFraccionamientoId =
      typeof req.query.loteFraccionamientoId === "string"
        ? req.query.loteFraccionamientoId
        : undefined;
    const options: { bodegaId?: string; loteFraccionamientoId?: string } = {};
    if (bodegaId !== undefined) options.bodegaId = bodegaId;
    if (loteFraccionamientoId !== undefined) {
      options.loteFraccionamientoId = loteFraccionamientoId;
    }
    return res.json(await listCodigosEnvase(userId, options));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getCodigoEnvaseHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(await getCodigoEnvaseById(String(req.params.id ?? ""), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createCodigoEnvaseHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const created = await createCodigoEnvase({ userId, ...(req.body ?? {}) });
    return res.status(201).json(created);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateCodigoEnvaseHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(
      await updateCodigoEnvase(String(req.params.id ?? ""), userId, req.body ?? {}),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteCodigoEnvaseHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(await deleteCodigoEnvase(String(req.params.id ?? ""), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listRemitosUvaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const bodegaId =
      typeof req.query.bodegaId === "string" ? req.query.bodegaId : undefined;
    return res.json(await listRemitosUva(userId, bodegaId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getRemitoUvaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(await getRemitoUvaById(String(req.params.id ?? ""), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createRemitoUvaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const created = await createRemitoUva({ userId, ...(req.body ?? {}) });
    return res.status(201).json(created);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateRemitoUvaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(
      await updateRemitoUva(String(req.params.id ?? ""), userId, req.body ?? {}),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteRemitoUvaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(await deleteRemitoUva(String(req.params.id ?? ""), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listRecepcionesBodegaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const bodegaId =
      typeof req.query.bodegaId === "string" ? req.query.bodegaId : undefined;
    return res.json(await listRecepcionesBodega(userId, bodegaId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getRecepcionBodegaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(
      await getRecepcionBodegaById(String(req.params.id ?? ""), userId),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createRecepcionBodegaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const created = await createRecepcionBodega({ userId, ...(req.body ?? {}) });
    return res.status(201).json(created);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateRecepcionBodegaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(
      await updateRecepcionBodega(
        String(req.params.id ?? ""),
        userId,
        req.body ?? {},
      ),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteRecepcionBodegaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(
      await deleteRecepcionBodega(String(req.params.id ?? ""), userId),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listAnalisisRecepcionHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const bodegaId =
      typeof req.query.bodegaId === "string" ? req.query.bodegaId : undefined;
    return res.json(await listAnalisisRecepcion(userId, bodegaId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getAnalisisRecepcionHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(
      await getAnalisisRecepcionById(String(req.params.id ?? ""), userId),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createAnalisisRecepcionHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const created = await createAnalisisRecepcion({ userId, ...(req.body ?? {}) });
    return res.status(201).json(created);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateAnalisisRecepcionHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(
      await updateAnalisisRecepcion(
        String(req.params.id ?? ""),
        userId,
        req.body ?? {},
      ),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteAnalisisRecepcionHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(
      await deleteAnalisisRecepcion(String(req.params.id ?? ""), userId),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listOperacionesVasijaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const bodegaId =
      typeof req.query.bodegaId === "string" ? req.query.bodegaId : undefined;
    return res.json(await listOperacionesVasija(userId, bodegaId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getOperacionVasijaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(
      await getOperacionVasijaById(String(req.params.id ?? ""), userId),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createOperacionVasijaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const created = await createOperacionVasija({ userId, ...(req.body ?? {}) });
    return res.status(201).json(created);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateOperacionVasijaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(
      await updateOperacionVasija(
        String(req.params.id ?? ""),
        userId,
        req.body ?? {},
      ),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteOperacionVasijaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(
      await deleteOperacionVasija(String(req.params.id ?? ""), userId),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listDespachosHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const bodegaId =
      typeof req.query.bodegaId === "string" ? req.query.bodegaId : undefined;
    return res.json(await listDespachos(userId, bodegaId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getDespachoHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(await getDespachoById(String(req.params.id ?? ""), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createDespachoHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const created = await createDespacho({ userId, ...(req.body ?? {}) });
    return res.status(201).json(created);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateDespachoHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(
      await updateDespacho(String(req.params.id ?? ""), userId, req.body ?? {}),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteDespachoHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(await deleteDespacho(String(req.params.id ?? ""), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listCiusHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const bodegaId =
      typeof req.query.bodegaId === "string" ? req.query.bodegaId : undefined;
    return res.json(await listCius(userId, bodegaId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getCiuHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(await getCiuById(String(req.params.id ?? ""), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createCiuHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const created = await createCiu({ userId, ...(req.body ?? {}) });
    return res.status(201).json(created);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateCiuHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(await updateCiu(String(req.params.id ?? ""), userId, req.body ?? {}));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteCiuHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(await deleteCiu(String(req.params.id ?? ""), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listCiuRecepcionesHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const bodegaId =
      typeof req.query.bodegaId === "string" ? req.query.bodegaId : undefined;
    const ciuId = typeof req.query.ciuId === "string" ? req.query.ciuId : undefined;
    const recepcionBodegaId =
      typeof req.query.recepcionBodegaId === "string"
        ? req.query.recepcionBodegaId
        : undefined;
    const opts: {
      bodegaId?: string;
      ciuId?: string;
      recepcionBodegaId?: string;
    } = {};
    if (bodegaId !== undefined) opts.bodegaId = bodegaId;
    if (ciuId !== undefined) opts.ciuId = ciuId;
    if (recepcionBodegaId !== undefined) {
      opts.recepcionBodegaId = recepcionBodegaId;
    }
    return res.json(await listCiuRecepciones(userId, opts));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getCiuRecepcionHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(
      await getCiuRecepcionById(
        String(req.params.ciuId ?? ""),
        String(req.params.recepcionBodegaId ?? ""),
        userId,
      ),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createCiuRecepcionHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const created = await createCiuRecepcion({ userId, ...(req.body ?? {}) });
    return res.status(201).json(created);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateCiuRecepcionHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(
      await updateCiuRecepcion(
        String(req.params.ciuId ?? ""),
        String(req.params.recepcionBodegaId ?? ""),
        userId,
        req.body ?? {},
      ),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteCiuRecepcionHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(
      await deleteCiuRecepcion(
        String(req.params.ciuId ?? ""),
        String(req.params.recepcionBodegaId ?? ""),
        userId,
      ),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listQcIngresoUvaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const bodegaId =
      typeof req.query.bodegaId === "string" ? req.query.bodegaId : undefined;
    return res.json(await listQcIngresoUva(userId, bodegaId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getQcIngresoUvaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(await getQcIngresoUvaById(String(req.params.id ?? ""), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createQcIngresoUvaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const created = await createQcIngresoUva({ userId, ...(req.body ?? {}) });
    return res.status(201).json(created);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateQcIngresoUvaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(
      await updateQcIngresoUva(String(req.params.id ?? ""), userId, req.body ?? {}),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteQcIngresoUvaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(await deleteQcIngresoUva(String(req.params.id ?? ""), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listExistenciasVasijaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const bodegaId =
      typeof req.query.bodegaId === "string" ? req.query.bodegaId : undefined;
    return res.json(await listExistenciasVasija(userId, bodegaId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getExistenciaVasijaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(
      await getExistenciaVasijaById(String(req.params.id ?? ""), userId),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createExistenciaVasijaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const created = await createExistenciaVasija({ userId, ...(req.body ?? {}) });
    return res.status(201).json(created);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateExistenciaVasijaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(
      await updateExistenciaVasija(
        String(req.params.id ?? ""),
        userId,
        req.body ?? {},
      ),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteExistenciaVasijaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(await deleteExistenciaVasija(String(req.params.id ?? ""), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listControlesFermentacionHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const bodegaId =
      typeof req.query.bodegaId === "string" ? req.query.bodegaId : undefined;
    return res.json(await listControlesFermentacion(userId, bodegaId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getControlFermentacionHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(
      await getControlFermentacionById(String(req.params.id ?? ""), userId),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createControlFermentacionHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const created = await createControlFermentacion({ userId, ...(req.body ?? {}) });
    return res.status(201).json(created);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateControlFermentacionHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(
      await updateControlFermentacion(
        String(req.params.id ?? ""),
        userId,
        req.body ?? {},
      ),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteControlFermentacionHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(
      await deleteControlFermentacion(String(req.params.id ?? ""), userId),
    );
  } catch (error) {
    return handleError(res, error);
  }
}
