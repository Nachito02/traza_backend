import type { Request, Response } from "express";
import {
  PersonalError,
  listPersonal,
  createPersonal,
  updatePersonal,
  deletePersonal,
} from "./personal.service.js";

function handleError(res: Response, error: unknown) {
  if (error instanceof PersonalError) {
    return res.status(error.status).json({ error: error.message });
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  ) {
    return res.status(409).json({ error: "Esa persona ya tiene un legajo en esta bodega." });
  }
  console.error("[personal]", error);
  return res.status(500).json({ error: "Error interno" });
}

function requireUser(req: Request, res: Response): string | null {
  if (!req.user?.userId) {
    res.status(401).json({ error: "unauthorized" });
    return null;
  }
  return req.user.userId;
}

function requireBodegaId(req: Request, res: Response): string | null {
  const bodegaId =
    typeof req.query.bodegaId === "string"
      ? req.query.bodegaId
      : typeof req.body?.bodegaId === "string"
        ? req.body.bodegaId
        : "";
  if (!bodegaId) {
    res.status(400).json({ error: "bodegaId requerido" });
    return null;
  }
  return bodegaId;
}

export async function listPersonalHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const bodegaId = requireBodegaId(req, res);
    if (!bodegaId) return;
    return res.json(await listPersonal(userId, bodegaId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createPersonalHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const {
      bodegaId,
      nombre,
      legajo,
      fecha_ingreso,
      targetUserId,
      tipo,
      modalidad,
      rol,
      sueldo_mensual,
      costo_hora,
      costo_unitario,
      dias_mes,
    } = req.body ?? {};
    const row = await createPersonal({
      userId,
      bodegaId,
      nombre,
      legajo,
      fecha_ingreso,
      targetUserId,
      tipo,
      modalidad,
      rol,
      sueldo_mensual,
      costo_hora,
      costo_unitario,
      dias_mes,
    });
    return res.status(201).json(row);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updatePersonalHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    return res.json(await updatePersonal(String(req.params.id), userId, req.body ?? {}));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deletePersonalHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    return res.json(await deletePersonal(String(req.params.id), userId));
  } catch (error) {
    return handleError(res, error);
  }
}
