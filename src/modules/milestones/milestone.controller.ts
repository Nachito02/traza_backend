import type { Request, Response, NextFunction } from 'express';
import {
  completeMilestone,
  createMilestone,
  getUserMilestones,
  listMilestonesByTrazabilidad,
  addEvidence, // Added for uploadEvidenceHandler
} from './milestone.service.js';

export async function meMilestonesHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const milestones = await getUserMilestones(req.user.userId);
    return res.json(milestones);
  } catch (error) {
    return res.status(500).json({ error: 'Error interno' });
  }
}

export async function createMilestoneHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const { trazabilidadId, procesoId } = req.body ?? {};
    const milestone = await createMilestone({
      trazabilidadId,
      procesoId,
      userId: req.user.userId,
    });
    return res.status(201).json(milestone);
  } catch (error) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }
}

export async function listMilestonesByTrazabilidadHandler(
  req: Request,
  res: Response,
) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const { id } = req.params;
    const milestones = await listMilestonesByTrazabilidad(
      id as string,
      req.user.userId,
    );
    return res.json(milestones);
  } catch (error) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }
}

export async function completeMilestoneHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const id = String(req.params.id ?? "");
    if (!id) {
      return res.status(400).json({ error: "id requerido" });
    }
    const milestone = await completeMilestone(id as string, req.user.userId);
    return res.json(milestone);
  } catch (error) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }
}

export async function uploadEvidenceHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = String(req.params.id ?? "");
    if (!id) {
      res.status(400).json({ error: 'id requerido' });
      return;
    }
    const { tipo } = req.body;
    const file = (req as any).file;

    // TODO: get user from request properly typed
    const userId = (req as any).user?.userId;

    if (!file || !userId) {
       res.status(400).json({ error: 'Faltan datos' });
       return;
    }

    // IMPORTANT: The file is saved at uploads/filename.ext
    // We construct a URL that the frontend can access assuming static serving is configured
    const url = `/uploads/${file.filename}`;

    const evidencia = await addEvidence({
        milestoneId: id,
        url,
        tipo: tipo || 'imagen',
        userId
    });
    
    res.json(evidencia);
  } catch (error) {
    next(error);
  }
}
