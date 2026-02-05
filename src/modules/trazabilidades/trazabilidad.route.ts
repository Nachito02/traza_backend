import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  createTrazabilidadHandler,
  getTrazabilidadHandler,
  listTrazabilidadesHandler,
} from "./trazabilidad.controller.js";
import { listMilestonesByTrazabilidadHandler } from "../milestones/milestone.controller.js";

export const trazabilidadRoutes = Router();

trazabilidadRoutes.post("/", authMiddleware, createTrazabilidadHandler);
trazabilidadRoutes.get("/", authMiddleware, listTrazabilidadesHandler);
trazabilidadRoutes.get("/:id", authMiddleware, getTrazabilidadHandler);
trazabilidadRoutes.get(
  "/:id/milestones",
  authMiddleware,
  listMilestonesByTrazabilidadHandler,
);
