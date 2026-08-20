import type { Request, Response } from "express";
import {
  addAdjuntoToEntrada,
  addTareaAsignaciones,
  addTareaEntrada,
  canUserManageTareas,
  cancelTarea,
  completarTarea,
  createTarea,
  registrarActividadDirecta,
  validarTarea,
  eliminarTarea,
  finalizarTareaAsignacion,
  listTareaEntradas,
  TareaError,
  listTareas,
  listMyTareaAsignaciones,
  listMyPendientes,
  listPendientesByBodega,
  updateMyTareaAsignacionEstado,
  updateTareaEntrada,
} from "./tarea.service.js";
import {
  uploadToIpfs,
  IpfsNotConfiguredError,
  IpfsUploadError,
} from "../../lib/ipfs.js";

function handleError(res: Response, error: unknown) {
  if (error instanceof TareaError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error("[tarea]", error);
  return res.status(500).json({ error: "Error interno" });
}

export async function createTareaHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const {
      bodegaId,
      procesoId,
      fincaId,
      cuartelId,
      vasijaId,
      descripcion,
      fechaFin,
      prioridad,
      imagenCid,
      imagenUrl,
      assigneeUserIds,
    } =
      req.body ?? {};
    const tarea = await createTarea(
      {
        bodegaId,
        procesoId,
        fincaId,
        cuartelId,
        vasijaId,
        descripcion,
        fechaFin,
        prioridad,
        imagenCid,
        imagenUrl,
        assigneeUserIds,
      },
      req.user.userId,
    );
    return res.status(201).json(tarea);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function registrarActividadHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const {
      bodegaId,
      procesoId,
      fincaId,
      cuartelId,
      vasijaId,
      descripcion,
      draft,
      ejecucion,
      maquinas,
      insumos,
      contratistas,
    } = req.body ?? {};
    const result = await registrarActividadDirecta(
      { bodegaId, procesoId, fincaId, cuartelId, vasijaId, descripcion, draft, ejecucion, maquinas, insumos, contratistas },
      req.user.userId,
    );
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listTareasHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const bodegaId = typeof req.query.bodegaId === "string" ? req.query.bodegaId : undefined;
    const fincaId = typeof req.query.fincaId === "string" ? req.query.fincaId : undefined;
    const soloPendientes =
      req.query.pendientes === "1" ||
      req.query.pendientes === "true";
    const items = await listTareas(req.user.userId, bodegaId, fincaId, Boolean(soloPendientes));
    return res.json(items);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function addTareaAsignacionesHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const tareaId = String(req.params.tareaId ?? "");
    const userIds = Array.isArray(req.body?.userIds) ? req.body.userIds : [];
    const rows = await addTareaAsignaciones(tareaId, userIds, req.user.userId);
    return res.json(rows);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function cancelTareaHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const tareaId = String(req.params.tareaId ?? "");
    const row = await cancelTarea(tareaId, req.user.userId);
    return res.json(row);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function completarTareaHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const tareaId = String(req.params.tareaId ?? "");
    const row = await completarTarea(tareaId, req.user.userId);
    return res.json(row);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function eliminarTareaHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const tareaId = String(req.params.tareaId ?? "");
    return res.json(await eliminarTarea(tareaId, req.user.userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function validarTareaHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const tareaId = String(req.params.tareaId ?? "");
    const row = await validarTarea(tareaId, req.user.userId);
    return res.json(row);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function assignTareaCompatHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const tareaId = String(req.params.tareaId ?? "");

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

    const rows = await addTareaAsignaciones(tareaId, userIds, req.user.userId);
    return res.json(rows);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listMyTareasHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const rows = await listMyTareaAsignaciones(req.user.userId);
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
    const tareaAsignacionId = String(req.params.tareaAsignacionId ?? "");
    const estado = req.body?.estado;
    const observaciones = req.body?.observaciones;
    const row = await updateMyTareaAsignacionEstado({
      tareaAsignacionId,
      userId: req.user.userId,
      estado,
      observaciones,
    });
    return res.json(row);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function addTareaEntradaHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const tareaAsignacionId = String(req.params.tareaAsignacionId ?? "");
    const body = req.body ?? {};
    const descripcion =
      typeof body.descripcion === "string" ? body.descripcion :
      typeof body.notas === "string" ? body.notas :
      body.draft ? JSON.stringify(body.draft) : undefined;
    const adjuntos = body.adjuntos ?? body.documentos ?? [];
    const entry = await addTareaEntrada({
      tareaAsignacionId,
      userId: req.user.userId,
      descripcion,
      adjuntos,
      draft: body.draft && typeof body.draft === "object" ? body.draft : undefined,
    });
    return res.status(201).json(entry);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listTareaEntradasHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    const tareaAsignacionId = String(req.params.tareaAsignacionId ?? "");
    const entries = await listTareaEntradas(tareaAsignacionId, req.user.userId);
    return res.json(entries);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function finalizarTareaAsignacionHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    const tareaAsignacionId = String(req.params.tareaAsignacionId ?? "");
    const result = await finalizarTareaAsignacion(tareaAsignacionId, req.user.userId);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function canManageTareasHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const canManage = await canUserManageTareas(req.user.userId);
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

export async function updateTareaEntradaHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    const { entradaId } = req.params;
    const { fecha, descripcion } = req.body ?? {};
    const updated = await updateTareaEntrada(String(entradaId), req.user.userId, { fecha, descripcion });
    return res.json(updated);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function uploadEntradaAdjuntoHandler(req: Request, res: Response) {
  try {
    const { entradaId } = req.params;
    const file = (req as Request & { file?: Express.Multer.File }).file;

    if (!file) {
      return res.status(400).json({ error: "No se recibió ningún archivo." });
    }

    const adjunto = await uploadToIpfs(file.buffer, file.originalname, file.mimetype);
    const updated = await addAdjuntoToEntrada(String(entradaId), req.user!.userId, adjunto);

    return res.status(201).json({ adjunto, adjuntos: updated.adjuntos });
  } catch (error) {
    if (error instanceof IpfsNotConfiguredError) {
      return res.status(503).json({ error: error.message });
    }
    if (error instanceof IpfsUploadError) {
      return res.status(502).json({ error: error.message });
    }
    if (error instanceof TareaError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error("[uploadEntradaAdjunto]", error);
    return res.status(500).json({ error: "Error interno al subir el archivo." });
  }
}
