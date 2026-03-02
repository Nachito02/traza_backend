import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRoles } from "../../middlewares/roles.middleware.js";
import {
  addEncargoAsignacionesHandler,
  canManageEncargosHandler,
  createEncargoHandler,
  listEncargosHandler,
  listMyEncargosHandler,
  updateMyAsignacionEstadoHandler,
} from "./encargo.controller.js";

export const encargoRoutes = Router();

encargoRoutes.get("/me/can-manage", authMiddleware, canManageEncargosHandler);
encargoRoutes.get("/me/asignaciones", authMiddleware, listMyEncargosHandler);
encargoRoutes.patch(
  "/me/asignaciones/:encargoAsignacionId/estado",
  authMiddleware,
  updateMyAsignacionEstadoHandler,
);

encargoRoutes.get(
  "/",
  authMiddleware,
  requireRoles(["super_admin", "bodega_admin", "encargado"]),
  listEncargosHandler,
);
encargoRoutes.post(
  "/",
  authMiddleware,
  requireRoles(["super_admin", "bodega_admin", "encargado"]),
  createEncargoHandler,
);
encargoRoutes.post(
  "/:encargoId/asignaciones",
  authMiddleware,
  requireRoles(["super_admin", "bodega_admin", "encargado"]),
  addEncargoAsignacionesHandler,
);
