import type { Request, Response } from 'express';
import {
  completeMilestone,
  createMilestone,
  getUserMilestones,
  listMilestonesByTrazabilidad,
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
    const { id } = req.params;
    const milestone = await completeMilestone(id as string, req.user.userId);
    return res.json(milestone);
  } catch (error) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }
}
