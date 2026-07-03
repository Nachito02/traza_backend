import type { Request, Response } from "express";
import {
  getIaHallazgo,
  contactIaJob,
  getIaTrazabilidad,
  getIaTrazabilidadContext,
  getIaIdentity,
  getIaJobContext,
  getIaJobDetail,
  helpIaJobLoad,
  iaConsultar,
  IaError,
  listIaBodegas,
  listIaCampanias,
  listIaCuarteles,
  listIaEventos,
  listIaFincas,
  listIaHallazgos,
  listIaInsumos,
  listIaJobs,
  listIaTrabajadores,
  createIaTrabajador,
  createIaCuartel,
  addIaEntrada,
  listIaProcesos,
  listIaProtocolos,
  listIaTrazabilidades,
  submitIaJobResult,
  getIaUsuario,
  getIaUsuarioByWhatsapp,
  getIaEventoSchema,
  listIaEventoTipos,
} from "./ia.service.js";
import { BotError } from "../bot/bot.service.js";
import { listActividadesSugerencias } from "../costos/costos.service.js";

function handleError(res: Response, error: unknown) {
  if (error instanceof IaError) {
    return res.status(error.status).json({ error: error.message });
  }
  if (error instanceof BotError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error("[ia]", error);
  return res.status(500).json({ error: "Error interno" });
}

export async function iaMeHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    return res.json(await getIaIdentity(req.user.userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listIaJobsHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const estado =
      typeof req.query.estado === "string" ? req.query.estado : undefined;
    const bodegaId =
      typeof req.query.bodegaId === "string" ? req.query.bodegaId : undefined;
    const whatsapp =
      typeof req.query.whatsapp === "string" ? req.query.whatsapp : undefined;
    const filters: { botUserId: string; estado?: string; bodegaId?: string; whatsapp?: string } = {
      botUserId: req.user.userId,
    };
    if (estado) filters.estado = estado;
    if (bodegaId) filters.bodegaId = bodegaId;
    if (whatsapp) filters.whatsapp = whatsapp;
    return res.json(await listIaJobs(filters));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getIaJobHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const tareaAsignacionId = String(req.params.tareaAsignacionId ?? "");
    return res.json(await getIaJobDetail(tareaAsignacionId, req.user.userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getIaJobContextHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const tareaAsignacionId = String(req.params.tareaAsignacionId ?? "");
    return res.json(await getIaJobContext(tareaAsignacionId, req.user.userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function contactIaJobHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const tareaAsignacionId = String(req.params.tareaAsignacionId ?? "");
    const message =
      typeof req.body?.message === "string" ? req.body.message : undefined;
    return res.json(await contactIaJob(tareaAsignacionId, req.user.userId, message));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function helpIaJobLoadHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const tareaAsignacionId = String(req.params.tareaAsignacionId ?? "");
    return res.json(await helpIaJobLoad(tareaAsignacionId, req.user.userId, req.body ?? {}));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function submitIaJobResultHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const tareaAsignacionId = String(req.params.tareaAsignacionId ?? "");
    const estado = String(req.body?.estado ?? "") as
      | "pendiente"
      | "en_progreso"
      | "completado"
      | "cancelado";
    const observaciones =
      typeof req.body?.observaciones === "string"
        ? req.body.observaciones
        : undefined;
    const outputPayload = req.body?.outputPayload;

    return res.json(
      await submitIaJobResult({
        tareaAsignacionId,
        botUserId: req.user.userId,
        estado,
        observaciones,
        outputPayload,
      }),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listIaBodegasHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    return res.json(await listIaBodegas(req.user.userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listIaFincasHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    const bodegaId = typeof req.query.bodegaId === "string" ? req.query.bodegaId : undefined;
    const params: { botUserId: string; bodegaId?: string } = { botUserId: req.user.userId };
    if (bodegaId) params.bodegaId = bodegaId;
    return res.json(await listIaFincas(params));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listIaCuartelesHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    const fincaId = typeof req.query.fincaId === "string" ? req.query.fincaId : undefined;
    const params: { botUserId: string; fincaId?: string } = { botUserId: req.user.userId };
    if (fincaId) params.fincaId = fincaId;
    return res.json(await listIaCuarteles(params));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listIaCampaniasHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    const bodegaId = typeof req.query.bodegaId === "string" ? req.query.bodegaId : undefined;
    const params: { botUserId: string; bodegaId?: string } = { botUserId: req.user.userId };
    if (bodegaId) params.bodegaId = bodegaId;
    return res.json(await listIaCampanias(params));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listIaTrabajadoresHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    const params: { botUserId: string; bodegaId?: string } = { botUserId: req.user.userId };
    if (typeof req.query.bodegaId === "string") params.bodegaId = req.query.bodegaId;
    return res.json(await listIaTrabajadores(params));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createIaTrabajadorHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    const { nombre, bodegaId, rol, whatsapp } = req.body ?? {};
    return res.status(201).json(
      await createIaTrabajador({
        botUserId: req.user.userId,
        nombre,
        bodegaId,
        rol,
        whatsapp,
      }),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listIaProtocolosHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    return res.json(await listIaProtocolos(req.user.userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listIaProcesosHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    return res.json(await listIaProcesos(req.user.userId, String(req.params.protocoloId ?? "")));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listIaInsumosHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    const tipo = typeof req.query.tipo === "string" ? req.query.tipo : undefined;
    return res.json(await listIaInsumos(req.user.userId, tipo));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listIaActividadSugerenciasHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    // Matriz de configuración para el flujo conversacional del bot
    // (sección 18 del manual): por actividad, qué preguntar y qué sugerir.
    return res.json(await listActividadesSugerencias());
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listIaTrazabilidadesHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    const params: {
      botUserId: string;
      bodegaId?: string;
      campaniaId?: string;
      fincaId?: string;
      cuartelId?: string;
      estado?: string;
    } = {
      botUserId: req.user.userId,
    };
    if (typeof req.query.bodegaId === "string") params.bodegaId = req.query.bodegaId;
    if (typeof req.query.campaniaId === "string") params.campaniaId = req.query.campaniaId;
    if (typeof req.query.fincaId === "string") params.fincaId = req.query.fincaId;
    if (typeof req.query.cuartelId === "string") params.cuartelId = req.query.cuartelId;
    if (typeof req.query.estado === "string") params.estado = req.query.estado;
    return res.json(await listIaTrazabilidades(params));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getIaTrazabilidadHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    return res.json(await getIaTrazabilidad(String(req.params.trazabilidadId ?? ""), req.user.userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getIaTrazabilidadContextHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    return res.json(
      await getIaTrazabilidadContext(String(req.params.trazabilidadId ?? ""), req.user.userId),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listIaHallazgosHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    const params: {
      botUserId: string;
      trazabilidadId?: string;
      estado?: string;
      severidad?: string;
    } = { botUserId: req.user.userId };
    if (typeof req.query.trazabilidadId === "string") params.trazabilidadId = req.query.trazabilidadId;
    if (typeof req.query.estado === "string") params.estado = req.query.estado;
    if (typeof req.query.severidad === "string") params.severidad = req.query.severidad;
    return res.json(await listIaHallazgos(params));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getIaHallazgoHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    return res.json(await getIaHallazgo(String(req.params.hallazgoId ?? ""), req.user.userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listIaEventosHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    const rawLimit =
      typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
    const params: {
      botUserId: string;
      tipo?: string;
      trazabilidadId?: string;
      bodegaId?: string;
      campaniaId?: string;
      fincaId?: string;
      cuartelId?: string;
      limit?: number;
    } = { botUserId: req.user.userId };
    if (typeof req.query.tipo === "string") params.tipo = req.query.tipo;
    if (typeof req.query.trazabilidadId === "string") params.trazabilidadId = req.query.trazabilidadId;
    if (typeof req.query.bodegaId === "string") params.bodegaId = req.query.bodegaId;
    if (typeof req.query.campaniaId === "string") params.campaniaId = req.query.campaniaId;
    if (typeof req.query.fincaId === "string") params.fincaId = req.query.fincaId;
    if (typeof req.query.cuartelId === "string") params.cuartelId = req.query.cuartelId;
    if (Number.isFinite(rawLimit)) params.limit = Number(rawLimit);
    return res.json(await listIaEventos(params));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function iaConsultarHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    const pregunta = typeof req.body?.pregunta === "string" ? req.body.pregunta : "";
    const bodegaId = typeof req.body?.bodegaId === "string" ? req.body.bodegaId : undefined;
    const trazabilidadId =
      typeof req.body?.trazabilidadId === "string" ? req.body.trazabilidadId : undefined;
    const limit = typeof req.body?.limit === "number" ? req.body.limit : undefined;
    return res.json(
      await iaConsultar({
        botUserId: req.user.userId,
        pregunta,
        bodegaId,
        trazabilidadId,
        limit,
      }),
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getIaUsuarioByWhatsappHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    const whatsapp = String(req.params.whatsapp ?? "");
    return res.json(await getIaUsuarioByWhatsapp(req.user.userId, whatsapp));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getIaUsuarioHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    const targetUserId = String(req.params.userId ?? "");
    return res.json(await getIaUsuario(req.user.userId, targetUserId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listIaEventoTiposHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    return res.json(listIaEventoTipos());
  } catch (error) {
    return handleError(res, error);
  }
}

export async function addIaEntradaHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    const tareaAsignacionId = String(req.params.tareaAsignacionId ?? "");
    const { descripcion, notas, adjuntos, documentos, plantilla } = req.body ?? {};
    const params: Parameters<typeof addIaEntrada>[0] = { botUserId: req.user.userId, tareaAsignacionId };
    if (typeof notas === "string") params.notas = notas;
    if (typeof descripcion === "string") params.descripcion = descripcion;
    if (Array.isArray(adjuntos)) params.adjuntos = adjuntos;
    if (Array.isArray(documentos)) params.documentos = documentos;
    if (plantilla && typeof plantilla === "object" && !Array.isArray(plantilla)) params.plantilla = plantilla;
    return res.status(201).json(await addIaEntrada(params));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createIaCuartelHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    const { fincaId, codigoCuartel, superficieHa, cultivo, variedad, sistemaRiego, sistemaProductivo, sistemaConduccion } =
      req.body ?? {};
    const params: Parameters<typeof createIaCuartel>[0] = { botUserId: req.user.userId, fincaId, codigoCuartel };
    if (typeof superficieHa === "number") params.superficieHa = superficieHa;
    if (typeof cultivo === "string") params.cultivo = cultivo;
    if (typeof variedad === "string") params.variedad = variedad;
    if (typeof sistemaRiego === "string") params.sistemaRiego = sistemaRiego;
    if (typeof sistemaProductivo === "string") params.sistemaProductivo = sistemaProductivo;
    if (typeof sistemaConduccion === "string") params.sistemaConduccion = sistemaConduccion;
    return res.status(201).json(await createIaCuartel(params));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getIaEventoSchemaHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    return res.json(getIaEventoSchema(String(req.params.tipo ?? "")));
  } catch (error) {
    return handleError(res, error);
  }
}
