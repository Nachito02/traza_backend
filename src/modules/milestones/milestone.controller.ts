import type { Request, Response } from 'express';
import { getUserMilestones } from './milestone.service.js';

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
