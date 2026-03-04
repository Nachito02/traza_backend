import type { Request, Response } from "express";
import {
  CampaniaError,
  createCampania,
  deleteCampania,
  getCampaniaById,
  listCampanias,
  updateCampania,
} from "./campania.service.js";

export async function listCampaniasHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const bodegaId =
      typeof req.query.bodegaId === "string" ? req.query.bodegaId : undefined;
    const campanias = await listCampanias(req.user.userId, bodegaId);
    return res.json(campanias);
  } catch (error) {
    if (error instanceof CampaniaError) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: "Error interno" });
  }
}

export async function createCampaniaHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const { bodegaId, nombre, fecha_inicio, fecha_fin, estado } = req.body ?? {};
    const campania = await createCampania({
      bodegaId,
      nombre,
      fecha_inicio,
      fecha_fin,
      estado,
      userId: req.user.userId,
    });
    return res.status(201).json(campania);
  } catch (error) {
    if (error instanceof CampaniaError) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: "Error interno" });
  }
}

export async function getCampaniaByIdHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const campaniaId = String(req.params.campaniaId ?? "");
    if (!campaniaId) {
      return res.status(400).json({ error: "campaniaId requerido" });
    }
    const campania = await getCampaniaById(campaniaId, req.user.userId);
    return res.json(campania);
  } catch (error) {
    if (error instanceof CampaniaError) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: "Error interno" });
  }
}

export async function updateCampaniaHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const campaniaId = String(req.params.campaniaId ?? "");
    const { nombre, fecha_inicio, fecha_fin, estado } = req.body ?? {};
    const campania = await updateCampania(campaniaId, {
      nombre,
      fecha_inicio,
      fecha_fin,
      estado,
      userId: req.user.userId,
    });
    return res.json(campania);
  } catch (error) {
    if (error instanceof CampaniaError) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: "Error interno" });
  }
}

export async function deleteCampaniaHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const campaniaId = String(req.params.campaniaId ?? "");
    const result = await deleteCampania(campaniaId, req.user.userId);
    return res.json(result);
  } catch (error) {
    if (error instanceof CampaniaError) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: "Error interno" });
  }
}
