import type { Request, Response } from "express";
import {
  crearCorteConVasijas,
  crearLote,
  eliminarLote,
  getImpactoBorradoLote,
  getLoteById,
  getLoteCiusExport,
  getLoteGenealogia,
  getLoteHistorial,
  listLotes,
  listRecepcionesParaLote,
  LoteError,
  updateLote,
} from "./lotes.service.js";

function isPrismaForeignKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "P2003" || error.code === "P2014")
  );
}

function handleError(res: Response, error: unknown) {
  if (error instanceof LoteError) {
    return res.status(error.status).json({ error: error.message });
  }
  if (isPrismaForeignKeyError(error)) {
    return res.status(409).json({ error: "No se puede eliminar: tiene registros relacionados" });
  }
  console.error("[lotes]", error);
  return res.status(500).json({ error: "Error interno" });
}

function requireUserId(req: Request, res: Response) {
  if (!req.user?.userId) {
    res.status(401).json({ error: "unauthorized" });
    return null;
  }
  return req.user.userId;
}

export async function crearLoteHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { bodegaId, campaniaId, recepcionBodegaIds, observaciones } = req.body ?? {};
    const lote = await crearLote({
      userId,
      bodegaId: String(bodegaId ?? ""),
      campaniaId: String(campaniaId ?? ""),
      recepcionBodegaIds: Array.isArray(recepcionBodegaIds) ? recepcionBodegaIds.map(String) : [],
      ...(observaciones !== undefined ? { observaciones: String(observaciones) } : {}),
    });
    return res.status(201).json(lote);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function crearCorteConVasijasHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { bodegaId, campaniaId, fecha, objetivo, responsableUserId, observaciones, fuentes, destinos } =
      req.body ?? {};
    const corte = await crearCorteConVasijas({
      userId,
      bodegaId: String(bodegaId ?? ""),
      fecha: String(fecha ?? ""),
      ...(campaniaId !== undefined ? { campaniaId: String(campaniaId) } : {}),
      ...(objetivo !== undefined ? { objetivo: String(objetivo) } : {}),
      ...(responsableUserId !== undefined ? { responsableUserId: String(responsableUserId) } : {}),
      ...(observaciones !== undefined ? { observaciones: String(observaciones) } : {}),
      fuentes: Array.isArray(fuentes)
        ? fuentes.map((f: { vasijaId?: unknown; volumenL?: unknown }) => ({
            vasijaId: String(f.vasijaId ?? ""),
            volumenL: Number(f.volumenL ?? 0),
          }))
        : [],
      destinos: Array.isArray(destinos)
        ? destinos.map((d: { vasijaId?: unknown; volumenL?: unknown }) => ({
            vasijaId: String(d.vasijaId ?? ""),
            volumenL: Number(d.volumenL ?? 0),
          }))
        : [],
    });
    return res.status(201).json(corte);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listLotesHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const bodegaId = typeof req.query.bodegaId === "string" ? req.query.bodegaId : "";
    if (!bodegaId) {
      return res.status(400).json({ error: "bodegaId requerido" });
    }
    return res.json(await listLotes(userId, bodegaId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getLoteHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(await getLoteById(String(req.params.id ?? ""), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateLoteHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { codigo, variedad, observaciones } = req.body ?? {};
    return res.json(
      await updateLote(String(req.params.id ?? ""), userId, {
        ...(codigo !== undefined ? { codigo: String(codigo) } : {}),
        ...(variedad !== undefined ? { variedad: String(variedad) } : {}),
        ...(observaciones !== undefined ? { observaciones: String(observaciones) } : {}),
      }),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteLoteHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    await eliminarLote(String(req.params.id ?? ""), userId);
    return res.json({ deleted: true });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getImpactoBorradoLoteHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(await getImpactoBorradoLote(String(req.params.id ?? ""), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getLoteGenealogiaHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(await getLoteGenealogia(String(req.params.id ?? ""), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getLoteHistorialHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    return res.json(await getLoteHistorial(String(req.params.id ?? ""), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getLoteCiusExportHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const loteId = String(req.params.id ?? "");
    const csv = await getLoteCiusExport(loteId, userId);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="lote-${loteId}-cius.txt"`);
    return res.send(csv);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listRecepcionesParaLoteHandler(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const bodegaId = typeof req.query.bodegaId === "string" ? req.query.bodegaId : "";
    if (!bodegaId) {
      return res.status(400).json({ error: "bodegaId requerido" });
    }
    const recepciones = await listRecepcionesParaLote({ userId, bodegaId });
    return res.json(recepciones);
  } catch (error) {
    return handleError(res, error);
  }
}
