import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  addTrazabilidadOrigenHandler,
  createTrazabilidadHandler,
  getTrazabilidadInversaByCodigoEnvaseHandler,
  getTrazabilidadHandler,
  listTrazabilidadesHandler,
} from "./trazabilidad.controller.js";
import { listMilestonesByTrazabilidadHandler } from "../milestones/milestone.controller.js";

export const trazabilidadRoutes = Router();

trazabilidadRoutes.post("/", authMiddleware, createTrazabilidadHandler);
trazabilidadRoutes.get("/", authMiddleware, listTrazabilidadesHandler);
trazabilidadRoutes.get(
  "/codigo-envase/:codigoQr/inversa",
  authMiddleware,
  getTrazabilidadInversaByCodigoEnvaseHandler,
);
trazabilidadRoutes.get("/:id", authMiddleware, getTrazabilidadHandler);
trazabilidadRoutes.post("/:id/origenes", authMiddleware, addTrazabilidadOrigenHandler);
trazabilidadRoutes.get(
  "/:id/milestones",
  authMiddleware,
  listMilestonesByTrazabilidadHandler,
);
