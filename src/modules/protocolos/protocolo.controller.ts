import type { Request, Response } from "express";
import { listProtocolos } from "./protocolo.service.js";

export async function listProtocolosHandler(_req: Request, res: Response) {
  try {
    const protocolos = await listProtocolos();
    return res.json(protocolos);
  } catch {
    return res.status(500).json({ error: "Error interno" });
  }
}
