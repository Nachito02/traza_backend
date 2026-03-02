import type { Request, Response } from "express";
import { listProtocolos, listProtocolosExpanded } from "./protocolo.service.js";

export async function listProtocolosHandler(_req: Request, res: Response) {
  try {
    const protocolos = await listProtocolos();
    return res.json(protocolos);
  } catch {
    return res.status(500).json({ error: "Error interno" });
  }
}

export async function listProtocolosExpandedHandler(_req: Request, res: Response) {
  try {
    const protocolos = await listProtocolosExpanded();
    return res.json(protocolos);
  } catch {
    return res.status(500).json({ error: "Error interno" });
  }
}
