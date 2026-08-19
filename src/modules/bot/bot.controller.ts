import type { Request, Response } from "express";
import { AuthError } from "../auth/auth.service.js";
import {
  VALID_SCOPES,
  botActualizarAsignacionEstado,
  botAyudarCarga,
  botConfirmarDelegacion,
  botContactarAsignacion,
  botCrearCuartel,
  botCrearTarea,
  botCrearVasija,
  botGetOperariosByBodega,
  botGetProtocolos,
  botGetTareasByWhatsapp,
  botGetUserByWhatsapp,
  botIniciarCreacionTarea,
  botLogin,
  botSolicitarDelegacion,
  BotError,
  createBotDelegation,
  createBotUser,
  createSuperAgentUser,
  superAgentLogin,
  listMyBotDelegations,
  revokeBotDelegation,
} from "./bot.service.js";

function handleError(res: Response, error: unknown) {
  if (error instanceof BotError) {
    return res.status(error.status).json({ error: error.message });
  }
  if (error instanceof AuthError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error("[bot]", error);
  return res.status(500).json({ error: "Error interno" });
}

export function listScopesHandler(_req: Request, res: Response) {
  // Lista de scopes que se pueden delegar a un agente bot (para que el asistente los use).
  return res.json({ scopes: VALID_SCOPES });
}

export async function createSuperAgentHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const { nombre, password } = req.body ?? {};
    const user = await createSuperAgentUser(req.user.userId, { nombre, password });
    return res.status(201).json(user);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function superAgentLoginHandler(req: Request, res: Response) {
  try {
    const { nombre, password } = req.body ?? {};
    const result = await superAgentLogin(nombre, password);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function botRegisterHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const { email, password, nombre } = req.body ?? {};
    const user = await createBotUser(req.user.userId, { email, password, nombre });
    return res.status(201).json(user);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function botLoginHandler(req: Request, res: Response) {
  try {
    const { username, password } = req.body ?? {};
    const result = await botLogin(username, password);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createDelegationHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const { botUserId, bodegaId, scopes, expiresAt } = req.body ?? {};
    const row = await createBotDelegation(
      {
        botUserId,
        bodegaId,
        scopes: Array.isArray(scopes) ? scopes : [],
        expiresAt,
      },
      req.user.userId,
    );
    return res.status(201).json(row);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function myDelegationsHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const rows = await listMyBotDelegations(req.user.userId);
    return res.json(rows);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function revokeDelegationHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const botDelegationId = String(req.params.botDelegationId ?? "");
    const row = await revokeBotDelegation(botDelegationId, req.user.userId);
    return res.json(row);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function botContactarAsignacionHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const tareaAsignacionId = String(req.params.tareaAsignacionId ?? "");
    const message = typeof req.body?.message === "string" ? req.body.message : undefined;
    const row = await botContactarAsignacion(tareaAsignacionId, req.user.userId, message);
    return res.json(row);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function botGetUserByWhatsappHandler(req: Request, res: Response) {
  try {
    const whatsapp = String(req.params.whatsapp ?? "");
    const user = await botGetUserByWhatsapp(whatsapp);
    return res.json(user);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function botAyudarCargaHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const tareaAsignacionId = String(req.params.tareaAsignacionId ?? "");
    const row = await botAyudarCarga(tareaAsignacionId, req.user.userId, req.body ?? {});
    return res.json(row);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function botCrearTareaHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const {
      onBehalfUserId,
      bodegaId,
      procesoId,
      fincaId,
      cuartelId,
      descripcion,
      fechaFin,
      prioridad,
      imagenCid,
      imagenUrl,
      assigneeUserIds,
    } = req.body ?? {};
    const tarea = await botCrearTarea(
      {
        onBehalfUserId,
        bodegaId,
        procesoId,
        fincaId,
        cuartelId,
        descripcion,
        fechaFin,
        prioridad,
        imagenCid,
        imagenUrl,
        ...(Array.isArray(assigneeUserIds) ? { assigneeUserIds } : {}),
      },
      req.user.userId,
    );
    return res.status(201).json(tarea);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function botActualizarAsignacionEstadoHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const tareaAsignacionId = String(req.params.tareaAsignacionId ?? "");
    const { estado, observaciones } = req.body ?? {};
    const row = await botActualizarAsignacionEstado(
      tareaAsignacionId,
      req.user.userId,
      estado,
      typeof observaciones === "string" ? observaciones : undefined,
    );
    return res.json(row);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function botGetProtocolosHandler(req: Request, res: Response) {
  try {
    const protocolos = await botGetProtocolos();
    return res.json(protocolos);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function botGetTareasByWhatsappHandler(req: Request, res: Response) {
  try {
    const whatsapp = String(req.params.whatsapp ?? "");
    const estadosRaw = req.query.estados;
    const VALID = ["pendiente", "en_progreso", "completado", "cancelado"] as const;
    type Estado = (typeof VALID)[number];
    const estados: Estado[] | undefined = typeof estadosRaw === "string"
      ? (estadosRaw.split(",").filter((s): s is Estado => VALID.includes(s as Estado)))
      : undefined;
    const result = await botGetTareasByWhatsapp(whatsapp, estados);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function botSolicitarDelegacionHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const { whatsapp, scopes, bodegaId, expiresAt } = req.body ?? {};
    const result = await botSolicitarDelegacion(
      { whatsapp, scopes: Array.isArray(scopes) ? scopes : [], bodegaId, expiresAt },
      req.user.userId,
    );
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function botConfirmarDelegacionHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const { whatsapp, codigo } = req.body ?? {};
    const delegation = await botConfirmarDelegacion(whatsapp, codigo);
    return res.status(201).json(delegation);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function botCrearCuartelHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const fincaId = String(req.params.fincaId ?? "");
    const { onBehalfUserId, codigo_cuartel, superficie_ha, cultivo, variedad, sistema_riego, sistema_productivo, sistema_conduccion } = req.body ?? {};
    const cuartel = await botCrearCuartel(
      { onBehalfUserId, fincaId, codigo_cuartel, superficie_ha, cultivo, variedad, sistema_riego, sistema_productivo, sistema_conduccion },
      req.user.userId,
    );
    return res.status(201).json(cuartel);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function botCrearVasijaHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const bodegaId = String(req.params.bodegaId ?? "");
    const { onBehalfUserId, codigo, tipo, capacidad_litros, estado, ubicacion } = req.body ?? {};
    const vasija = await botCrearVasija(
      { onBehalfUserId, bodegaId, codigo, tipo, capacidad_litros, estado, ubicacion },
      req.user.userId,
    );
    return res.status(201).json(vasija);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function botIniciarCreacionTareaHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const {
      whatsapp,
      bodegaId,
      procesoId,
      fincaId,
      cuartelId,
      descripcion,
      fechaFin,
      prioridad,
      imagenCid,
      imagenUrl,
      assigneeUserIds,
      delegacionExpiresAt,
    } = req.body ?? {};
    const result = await botIniciarCreacionTarea(
      {
        whatsapp,
        bodegaId,
        procesoId,
        fincaId,
        cuartelId,
        descripcion,
        fechaFin,
        prioridad,
        imagenCid,
        imagenUrl,
        ...(Array.isArray(assigneeUserIds) ? { assigneeUserIds } : {}),
        delegacionExpiresAt,
      },
      req.user.userId,
    );
    const statusCode = result.status === "created" ? 201 : 202;
    return res.status(statusCode).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function botGetOperariosByBodegaHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const bodegaId = String(req.params.bodegaId ?? "");
    const operarios = await botGetOperariosByBodega(bodegaId, req.user.userId);
    return res.json(operarios);
  } catch (error) {
    return handleError(res, error);
  }
}
