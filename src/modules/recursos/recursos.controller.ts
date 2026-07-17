import type { Request, Response } from "express";
import {
  RecursoError,
  listRecursos,
  createRecurso,
  updateRecurso,
  deleteRecurso,
  listClasesMaestro,
  listCategoriasMaestro,
  listMaestro,
} from "./recursos.service.js";
import type { AmbitoRecurso, ClaseMaquinaria } from "../../generated/prisma/index.js";

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

function handleError(res: Response, error: unknown) {
  if (error instanceof RecursoError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error("[recursos]", error);
  return res.status(500).json({ error: "Error interno" });
}

const asAmbito = (v: unknown) => (typeof v === "string" ? (v as AmbitoRecurso) : undefined);
const asClase = (v: unknown) => (typeof v === "string" ? (v as ClaseMaquinaria) : undefined);

export async function listRecursosHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const bodegaId = requireBodegaId(req, res);
    if (!bodegaId) return;
    return res.json(await listRecursos(userId, bodegaId, asAmbito(req.query.ambito), asClase(req.query.clase)));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createRecursoHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const bodegaId = requireBodegaId(req, res);
    if (!bodegaId) return;
    return res.status(201).json(await createRecurso(userId, bodegaId, req.body ?? {}));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateRecursoHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    return res.json(await updateRecurso(String(req.params.id), userId, req.body ?? {}));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteRecursoHandler(req: Request, res: Response) {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    return res.json(await deleteRecurso(String(req.params.id), userId));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function clasesMaestroHandler(req: Request, res: Response) {
  try {
    if (!requireUser(req, res)) return;
    return res.json(await listClasesMaestro(req.query.ambito));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function categoriasMaestroHandler(req: Request, res: Response) {
  try {
    if (!requireUser(req, res)) return;
    return res.json(await listCategoriasMaestro(req.query.ambito, req.query.clase));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function maestroHandler(req: Request, res: Response) {
  try {
    if (!requireUser(req, res)) return;
    const categoria = typeof req.query.categoria === "string" ? req.query.categoria : undefined;
    return res.json(await listMaestro(req.query.ambito, req.query.clase, categoria));
  } catch (error) {
    return handleError(res, error);
  }
}
