import type { Request, Response } from "express";
import {
  addEncargoAsignaciones,
  canUserManageEncargos,
  createEncargo,
  EncargoError,
  listEncargos,
  listMyEncargoAsignaciones,
  updateMyEncargoAsignacionEstado,
} from "./encargo.service.js";

function handleError(res: Response, error: unknown) {
  if (error instanceof EncargoError) {
    return res.status(error.status).json({ error: error.message });
  }
  return res.status(500).json({ error: "Error interno" });
}

export async function createEncargoHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const { bodegaId, titulo, descripcion, fechaObjetivo, prioridad, assigneeUserIds } =
      req.body ?? {};
    const encargo = await createEncargo(
      {
        bodegaId,
        titulo,
        descripcion,
        fechaObjetivo,
        prioridad,
        assigneeUserIds,
      },
      req.user.userId,
    );
    return res.status(201).json(encargo);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listEncargosHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const bodegaId = typeof req.query.bodegaId === "string" ? req.query.bodegaId : undefined;
    const items = await listEncargos(req.user.userId, bodegaId);
    return res.json(items);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function addEncargoAsignacionesHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const encargoId = String(req.params.encargoId ?? "");
    const userIds = Array.isArray(req.body?.userIds) ? req.body.userIds : [];
    const rows = await addEncargoAsignaciones(encargoId, userIds, req.user.userId);
    return res.json(rows);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listMyEncargosHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const rows = await listMyEncargoAsignaciones(req.user.userId);
    return res.json(rows);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateMyAsignacionEstadoHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const encargoAsignacionId = String(req.params.encargoAsignacionId ?? "");
    const estado = req.body?.estado;
    const observaciones = req.body?.observaciones;
    const row = await updateMyEncargoAsignacionEstado({
      encargoAsignacionId,
      userId: req.user.userId,
      estado,
      observaciones,
    });
    return res.json(row);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function canManageEncargosHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const canManage = await canUserManageEncargos(req.user.userId);
    return res.json({ canManage });
  } catch (error) {
    return handleError(res, error);
  }
}
