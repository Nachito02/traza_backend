import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  addTareaAsignacionesHandler,
  assignTareaCompatHandler,
  canManageTareasHandler,
  cancelTareaHandler,
  createTareaHandler,
  listBodegaPendientesHandler,
  listTareasHandler,
  listMyTareasHandler,
  listMyPendientesHandler,
  updateMyAsignacionEstadoHandler,
} from "./tarea.controller.js";

export const tareaRoutes = Router();

tareaRoutes.get("/me/can-manage", authMiddleware, canManageTareasHandler);
tareaRoutes.get("/me/asignaciones", authMiddleware, listMyTareasHandler);
tareaRoutes.get("/mis-pendientes", authMiddleware, listMyPendientesHandler);
tareaRoutes.get(
  "/bodega/:bodegaId/pendientes",
  authMiddleware,
  listBodegaPendientesHandler,
);
tareaRoutes.patch(
  "/me/asignaciones/:tareaAsignacionId/estado",
  authMiddleware,
  updateMyAsignacionEstadoHandler,
);

tareaRoutes.get(
  "/",
  authMiddleware,
  listTareasHandler,
);
tareaRoutes.post(
  "/",
  authMiddleware,
  createTareaHandler,
);
tareaRoutes.post(
  "/:tareaId/asignaciones",
  authMiddleware,
  addTareaAsignacionesHandler,
);
tareaRoutes.patch(
  "/:tareaId/asignar",
  authMiddleware,
  assignTareaCompatHandler,
);
tareaRoutes.post(
  "/:tareaId/asignar",
  authMiddleware,
  assignTareaCompatHandler,
);
tareaRoutes.patch(
  "/:tareaId/cancelar",
  authMiddleware,
  cancelTareaHandler,
);
