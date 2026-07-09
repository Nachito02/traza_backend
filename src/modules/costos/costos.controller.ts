import type { Request, Response } from "express";
import {
  CostoError,
  listTarifasMaquinaria,
  createTarifaMaquinaria,
  updateTarifaMaquinaria,
  deleteTarifaMaquinaria,
  listTarifasCombustible,
  createTarifaCombustible,
  updateTarifaCombustible,
  deleteTarifaCombustible,
  upsertEjecucion,
  addActividadMaquina,
  deleteActividadMaquina,
  addActividadInsumo,
  deleteActividadInsumo,
  addActividadContratista,
  deleteActividadContratista,
  recalcularCostosTarea,
  getCostosTarea,
  getResumenPorCuartel,
  getResumenPorCampania,
  getResumenPorBodega,
  listActividadesConCostoPorCuartel,
  listInsumosCatalogo,
  listActividadesSugerencias,
  getActividadSugerencia,
} from "./costos.service.js";

function handleError(res: Response, error: unknown) {
  if (error instanceof CostoError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error("[costos]", error);
  return res.status(500).json({ error: "Error interno" });
}

function requireUser(req: Request, res: Response): string | null {
  if (!req.user?.userId) {
    res.status(401).json({ error: "unauthorized" });
    return null;
  }
  return req.user.userId;
}

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

// ── Tarifas: maquinaria ──────────────────────────────────────────────────────

export async function listTarifasMaquinariaHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const bodegaId = requireBodegaId(req, res);
    if (!bodegaId) return;
    return res.json(await listTarifasMaquinaria(userId, bodegaId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createTarifaMaquinariaHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const { bodegaId, nombre, clase, costo_hora, consumo_lts_hora, vigencia_desde } = req.body ?? {};
    const row = await createTarifaMaquinaria({
      userId,
      bodegaId,
      nombre,
      clase,
      costo_hora,
      consumo_lts_hora,
      vigencia_desde,
    });
    return res.status(201).json(row);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateTarifaMaquinariaHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const row = await updateTarifaMaquinaria(String(req.params.id), userId, req.body ?? {});
    return res.json(row);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteTarifaMaquinariaHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    return res.json(await deleteTarifaMaquinaria(String(req.params.id), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

// ── Tarifas: combustible ─────────────────────────────────────────────────────

export async function listTarifasCombustibleHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const bodegaId = requireBodegaId(req, res);
    if (!bodegaId) return;
    return res.json(await listTarifasCombustible(userId, bodegaId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createTarifaCombustibleHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const { bodegaId, tipo, costo_unitario, unidad, vigencia_desde } = req.body ?? {};
    const row = await createTarifaCombustible({
      userId,
      bodegaId,
      tipo,
      costo_unitario,
      unidad,
      vigencia_desde,
    });
    return res.status(201).json(row);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateTarifaCombustibleHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const row = await updateTarifaCombustible(String(req.params.id), userId, req.body ?? {});
    return res.json(row);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteTarifaCombustibleHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    return res.json(await deleteTarifaCombustible(String(req.params.id), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

// ── Catálogo de insumos ──────────────────────────────────────────────────────

export async function listSugerenciasHandler(req: Request, res: Response) {
  try {
    if (!requireUser(req, res)) return;
    return res.json(await listActividadesSugerencias());
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getSugerenciaHandler(req: Request, res: Response) {
  try {
    if (!requireUser(req, res)) return;
    const row = await getActividadSugerencia(String(req.params.clave ?? ""));
    return res.json(row ?? null);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listInsumosCatalogoHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const bodegaId = typeof req.query.bodegaId === "string" ? req.query.bodegaId : undefined;
    return res.json(await listInsumosCatalogo(userId, bodegaId));
  } catch (error) {
    return handleError(res, error);
  }
}

// ── Captura por tarea ────────────────────────────────────────────────────────

export async function getCostosTareaHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    return res.json(await getCostosTarea(String(req.params.tareaId), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function upsertEjecucionHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const row = await upsertEjecucion(String(req.params.tareaId), userId, req.body ?? {});
    return res.status(200).json(row);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function addActividadMaquinaHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const row = await addActividadMaquina(String(req.params.tareaId), userId, req.body ?? {});
    return res.status(201).json(row);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteActividadMaquinaHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    return res.json(await deleteActividadMaquina(String(req.params.id), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function addActividadInsumoHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const row = await addActividadInsumo(String(req.params.tareaId), userId, req.body ?? {});
    return res.status(201).json(row);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteActividadInsumoHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    return res.json(await deleteActividadInsumo(String(req.params.id), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function addActividadContratistaHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const row = await addActividadContratista(String(req.params.tareaId), userId, req.body ?? {});
    return res.status(201).json(row);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteActividadContratistaHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    return res.json(await deleteActividadContratista(String(req.params.id), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function recalcularCostosTareaHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    // Valida scope leyendo la tarea primero.
    await getCostosTarea(String(req.params.tareaId), userId);
    return res.json(await recalcularCostosTarea(String(req.params.tareaId)));
  } catch (error) {
    return handleError(res, error);
  }
}

// ── Indicadores ──────────────────────────────────────────────────────────────

export async function resumenPorBodegaHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const bodegaId = requireBodegaId(req, res);
    if (!bodegaId) return;
    return res.json(await getResumenPorBodega(userId, bodegaId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function resumenPorCuartelHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    return res.json(await getResumenPorCuartel(String(req.params.cuartelId), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function actividadesPorCuartelHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    return res.json(await listActividadesConCostoPorCuartel(String(req.params.cuartelId), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function resumenPorCampaniaHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    return res.json(await getResumenPorCampania(String(req.params.campaniaId), userId));
  } catch (error) {
    return handleError(res, error);
  }
}
