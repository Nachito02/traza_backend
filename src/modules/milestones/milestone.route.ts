import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import multer from 'multer';
import {
  assignMilestoneHandler,
  createMilestoneHandler,
  completeMilestoneHandler,
  meMilestonesHandler,
  uploadEvidenceHandler,
} from "./milestone.controller.js";

const upload = multer({ dest: 'uploads/' });

export const milestoneRoutes = Router();

milestoneRoutes.get("/me", authMiddleware, meMilestonesHandler);
milestoneRoutes.post("/", authMiddleware, createMilestoneHandler);
milestoneRoutes.patch("/:id", authMiddleware, completeMilestoneHandler);
milestoneRoutes.patch("/:id/asignar", authMiddleware, assignMilestoneHandler);
milestoneRoutes.post("/:id/evidence", authMiddleware, upload.single('file'), uploadEvidenceHandler);
