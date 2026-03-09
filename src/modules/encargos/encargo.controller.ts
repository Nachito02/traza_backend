import type { Request, Response } from "express";
import {
  addEncargoAsignaciones,
  canUserManageEncargos,
  cancelEncargo,
  createEncargo,
  EncargoError,
  listEncargos,
  listMyEncargoAsignaciones,
  listMyPendientes,
  listPendientesByBodega,
  updateMyEncargoAsignacionEstado,
} from "./encargo.service.js";

function handleError(res: Response, error: unknown) {
  if (error instanceof EncargoError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error("[encargo]", error);
  return res.status(500).json({ error: "Error interno" });
}

export async function createEncargoHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const {
      bodegaId,
      fincaId,
      cuartelId,
      milestoneId,
      titulo,
      descripcion,
      fechaObjetivo,
      prioridad,
      assigneeUserIds,
    } =
      req.body ?? {};
    const encargo = await createEncargo(
      {
        bodegaId,
        fincaId,
        cuartelId,
        milestoneId,
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
    const fincaId = typeof req.query.fincaId === "string" ? req.query.fincaId : undefined;
    const soloPendientes =
      req.query.pendientes === "1" ||
      req.query.pendientes === "true";
    const items = await listEncargos(req.user.userId, bodegaId, fincaId, Boolean(soloPendientes));
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

export async function cancelEncargoHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const encargoId = String(req.params.encargoId ?? "");
    const row = await cancelEncargo(encargoId, req.user.userId);
    return res.json(row);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function assignEncargoCompatHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const encargoId = String(req.params.encargoId ?? "");

    const userIdsFromArray = Array.isArray(req.body?.userIds)
      ? req.body.userIds.filter((id: unknown) => typeof id === "string")
      : [];
    const userId =
      typeof req.body?.userId === "string"
        ? req.body.userId
        : typeof req.body?.assigneeUserId === "string"
          ? req.body.assigneeUserId
          : undefined;

    const userIds =
      userIdsFromArray.length > 0
        ? userIdsFromArray
        : userId
          ? [userId]
          : [];

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

export async function listMyPendientesHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const rows = await listMyPendientes(req.user.userId);
    return res.json(rows);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listBodegaPendientesHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const bodegaId = String(req.params.bodegaId ?? "");
    if (!bodegaId) {
      return res.status(400).json({ error: "bodegaId requerido" });
    }
    const rows = await listPendientesByBodega(req.user.userId, bodegaId);
    return res.json(rows);
  } catch (error) {
    return handleError(res, error);
  }
}
