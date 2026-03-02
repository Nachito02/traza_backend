import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  addEncargoAsignacionesHandler,
  assignEncargoCompatHandler,
  canManageEncargosHandler,
  cancelEncargoHandler,
  createEncargoHandler,
  listBodegaPendientesHandler,
  listEncargosHandler,
  listMyEncargosHandler,
  listMyPendientesHandler,
  updateMyAsignacionEstadoHandler,
} from "./encargo.controller.js";

export const encargoRoutes = Router();

encargoRoutes.get("/me/can-manage", authMiddleware, canManageEncargosHandler);
encargoRoutes.get("/me/asignaciones", authMiddleware, listMyEncargosHandler);
encargoRoutes.get("/mis-pendientes", authMiddleware, listMyPendientesHandler);
encargoRoutes.get(
  "/bodega/:bodegaId/pendientes",
  authMiddleware,
  listBodegaPendientesHandler,
);
encargoRoutes.patch(
  "/me/asignaciones/:encargoAsignacionId/estado",
  authMiddleware,
  updateMyAsignacionEstadoHandler,
);

encargoRoutes.get(
  "/",
  authMiddleware,
  listEncargosHandler,
);
encargoRoutes.post(
  "/",
  authMiddleware,
  createEncargoHandler,
);
encargoRoutes.post(
  "/:encargoId/asignaciones",
  authMiddleware,
  addEncargoAsignacionesHandler,
);
encargoRoutes.patch(
  "/:encargoId/asignar",
  authMiddleware,
  assignEncargoCompatHandler,
);
encargoRoutes.post(
  "/:encargoId/asignar",
  authMiddleware,
  assignEncargoCompatHandler,
);
encargoRoutes.patch(
  "/:encargoId/cancelar",
  authMiddleware,
  cancelEncargoHandler,
);
