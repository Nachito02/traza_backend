import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRoles } from "../../middlewares/roles.middleware.js";
import {
  botAyudarCargaHandler,
  botContactarAsignacionHandler,
  createDelegationHandler,
  myDelegationsHandler,
  revokeDelegationHandler,
} from "./bot.controller.js";

export const botRoutes = Router();

botRoutes.post("/delegaciones", authMiddleware, createDelegationHandler);
botRoutes.get("/delegaciones/me", authMiddleware, myDelegationsHandler);
botRoutes.delete("/delegaciones/:botDelegationId", authMiddleware, revokeDelegationHandler);

botRoutes.post(
  "/asignaciones/:encargoAsignacionId/contactar",
  authMiddleware,
  requireRoles(["bot_agent", "super_admin"]),
  botContactarAsignacionHandler,
);

botRoutes.post(
  "/asignaciones/:encargoAsignacionId/ayudar-carga",
  authMiddleware,
  requireRoles(["bot_agent", "super_admin"]),
  botAyudarCargaHandler,
);
