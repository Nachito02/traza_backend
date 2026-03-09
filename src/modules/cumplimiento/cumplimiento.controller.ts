import type { Request, Response } from "express";
import {
  aceptarHallazgo,
  CumplimientoError,
  getHistoriaLote,
  getIndicadoresByContext,
  getIndicadoresByLote,
  listHallazgos,
  resolverHallazgo,
} from "./cumplimiento.service.js";

function handleError(res: Response, error: unknown) {
  if (error instanceof CumplimientoError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error("[cumplimiento]", error);
  return res.status(500).json({ error: "Error interno" });
}

export async function listHallazgosHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const trazabilidadId =
      typeof req.query.trazabilidadId === "string" ? req.query.trazabilidadId : undefined;
    const severidad =
      typeof req.query.severidad === "string"
        ? (req.query.severidad as "bloqueo" | "alerta" | "info")
        : undefined;
    const estado =
      typeof req.query.estado === "string"
        ? (req.query.estado as
            | "abierto"
            | "en_proceso"
            | "resuelto"
            | "aceptado"
            | "anulado")
        : undefined;

    const params: {
      userId: string;
      trazabilidadId?: string;
      severidad?: "bloqueo" | "alerta" | "info";
      estado?: "abierto" | "en_proceso" | "resuelto" | "aceptado" | "anulado";
    } = { userId: req.user.userId };
    if (trazabilidadId) params.trazabilidadId = trazabilidadId;
    if (severidad) params.severidad = severidad;
    if (estado) params.estado = estado;

    const hallazgos = await listHallazgos(params);

    return res.json(hallazgos);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function resolverHallazgoHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const id = String(req.params.id ?? "");
    if (!id) return res.status(400).json({ error: "id inválido" });
    const hallazgo = await resolverHallazgo({
      userId: req.user.userId,
      hallazgoId: id,
    });

    return res.json(hallazgo);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function aceptarHallazgoHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const id = String(req.params.id ?? "");
    if (!id) return res.status(400).json({ error: "id inválido" });
    const { justificacionCategoria, justificacionTexto } = req.body ?? {};

    if (!justificacionCategoria || !justificacionTexto) {
      return res
        .status(400)
        .json({ error: "justificacionCategoria y justificacionTexto son obligatorios" });
    }

    const hallazgo = await aceptarHallazgo({
      userId: req.user.userId,
      hallazgoId: id,
      justificacionCategoria,
      justificacionTexto,
    });

    return res.json(hallazgo);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function indicadoresHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const trazabilidadId =
      typeof req.query.trazabilidadId === "string" ? req.query.trazabilidadId : undefined;
    const campaniaId =
      typeof req.query.campaniaId === "string" ? req.query.campaniaId : undefined;
    const cuartelId =
      typeof req.query.cuartelId === "string" ? req.query.cuartelId : undefined;

    const params: {
      userId: string;
      trazabilidadId?: string;
      campaniaId?: string;
      cuartelId?: string;
    } = { userId: req.user.userId };
    if (trazabilidadId) params.trazabilidadId = trazabilidadId;
    if (campaniaId) params.campaniaId = campaniaId;
    if (cuartelId) params.cuartelId = cuartelId;

    const indicadores = await getIndicadoresByContext(params);

    return res.json(indicadores);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function indicadoresLoteHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const loteId = String(req.params.loteId ?? "");
    if (!loteId) return res.status(400).json({ error: "loteId inválido" });
    const indicadores = await getIndicadoresByLote({
      userId: req.user.userId,
      loteId,
    });

    return res.json(indicadores);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function historiaLoteHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const loteId = String(req.params.loteId ?? "");
    if (!loteId) return res.status(400).json({ error: "loteId inválido" });
    const historia = await getHistoriaLote({
      userId: req.user.userId,
      loteId,
    });

    return res.json(historia);
  } catch (error) {
    return handleError(res, error);
  }
}
