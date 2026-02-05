import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { meMilestonesHandler } from "./milestone.controller.js";

export const milestoneRoutes = Router();

milestoneRoutes.get("/me", authMiddleware, meMilestonesHandler);
