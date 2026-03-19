import type { Request, Response } from "express";
import {
  listProtocolos,
  listProtocolosExpanded,
  getProtocolo,
  getProtocoloPlantilla,
  createProtocolo,
  updateProtocolo,
  deleteProtocolo,
  createEtapa,
  updateEtapa,
  deleteEtapa,
  createProceso,
  updateProceso,
  deleteProceso,
  ProtocoloError,
} from "./protocolo.service.js";

function handleError(res: Response, error: unknown) {
  if (error instanceof ProtocoloError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error("[protocolo]", error);
  return res.status(500).json({ error: "Error interno" });
}

export async function listProtocolosHandler(_req: Request, res: Response) {
  try {
    return res.json(await listProtocolos());
  } catch (e) {
    return handleError(res, e);
  }
}

export async function listProtocolosExpandedHandler(_req: Request, res: Response) {
  try {
    return res.json(await listProtocolosExpanded());
  } catch (e) {
    return handleError(res, e);
  }
}

export async function getProtocoloHandler(req: Request, res: Response) {
  try {
    return res.json(await getProtocolo(String(req.params["protocoloId"] ?? "")));
  } catch (e) {
    return handleError(res, e);
  }
}

export async function getProtocoloPlantillaHandler(req: Request, res: Response) {
  try {
    return res.json(await getProtocoloPlantilla(String(req.params["protocoloId"] ?? "")));
  } catch (e) {
    return handleError(res, e);
  }
}

export async function createProtocoloHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    const protocolo = await createProtocolo(req.body, req.user.userId);
    return res.status(201).json(protocolo);
  } catch (e) {
    return handleError(res, e);
  }
}

export async function updateProtocoloHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    return res.json(await updateProtocolo(String(req.params["protocoloId"] ?? ""), req.body, req.user.userId));
  } catch (e) {
    return handleError(res, e);
  }
}

export async function deleteProtocoloHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    return res.json(await deleteProtocolo(String(req.params["protocoloId"] ?? ""), req.user.userId));
  } catch (e) {
    return handleError(res, e);
  }
}

// — Etapas —

export async function createEtapaHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    const etapa = await createEtapa(String(req.params["protocoloId"] ?? ""), req.body, req.user.userId);
    return res.status(201).json(etapa);
  } catch (e) {
    return handleError(res, e);
  }
}

export async function updateEtapaHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    return res.json(await updateEtapa(String(req.params["etapaId"] ?? ""), req.body, req.user.userId));
  } catch (e) {
    return handleError(res, e);
  }
}

export async function deleteEtapaHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    return res.json(await deleteEtapa(String(req.params["etapaId"] ?? ""), req.user.userId));
  } catch (e) {
    return handleError(res, e);
  }
}

// — Procesos —

export async function createProcesoHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    const proceso = await createProceso(String(req.params["etapaId"] ?? ""), req.body, req.user.userId);
    return res.status(201).json(proceso);
  } catch (e) {
    return handleError(res, e);
  }
}

export async function updateProcesoHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    return res.json(await updateProceso(String(req.params["procesoId"] ?? ""), req.body, req.user.userId));
  } catch (e) {
    return handleError(res, e);
  }
}

export async function deleteProcesoHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: "unauthorized" });
    return res.json(await deleteProceso(String(req.params["procesoId"] ?? ""), req.user.userId));
  } catch (e) {
    return handleError(res, e);
  }
}
