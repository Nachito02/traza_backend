import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  createMilestoneHandler,
  completeMilestoneHandler,
  meMilestonesHandler,
} from "./milestone.controller.js";

export const milestoneRoutes = Router();

milestoneRoutes.get("/me", authMiddleware, meMilestonesHandler);
milestoneRoutes.post("/", authMiddleware, createMilestoneHandler);
milestoneRoutes.patch("/:id", authMiddleware, completeMilestoneHandler);
