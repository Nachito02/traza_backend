import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRoles } from "../../middlewares/roles.middleware.js";
import {
  botActualizarAsignacionEstadoHandler,
  botAyudarCargaHandler,
  botConfirmarDelegacionHandler,
  botContactarAsignacionHandler,
  botCrearCuartelHandler,
  botCrearTareaHandler,
  botCrearVasijaHandler,
  botGetOperariosByBodegaHandler,
  botGetProtocolosHandler,
  botGetTareasByWhatsappHandler,
  botGetUserByWhatsappHandler,
  botIniciarCreacionTareaHandler,
  botLoginHandler,
  botRegisterHandler,
  botSolicitarDelegacionHandler,
  createDelegationHandler,
  createSuperAgentHandler,
  myDelegationsHandler,
  revokeDelegationHandler,
} from "./bot.controller.js";

export const botRoutes = Router();

botRoutes.post("/auth/register", authMiddleware, requireRoles(["admin_sistema"]), botRegisterHandler);
botRoutes.post("/auth/register-agent", authMiddleware, requireRoles(["admin_sistema"]), createSuperAgentHandler);
botRoutes.post("/auth/login", botLoginHandler);

botRoutes.get(
  "/usuarios/whatsapp/:whatsapp",
  authMiddleware,
  requireRoles(["bot_agent", "super_agent", "admin_sistema"]),
  botGetUserByWhatsappHandler,
);

botRoutes.get(
  "/tareas/whatsapp/:whatsapp",
  authMiddleware,
  requireRoles(["bot_agent", "super_agent", "admin_sistema"]),
  botGetTareasByWhatsappHandler,
);

botRoutes.post("/delegaciones", authMiddleware, createDelegationHandler);
botRoutes.get("/delegaciones/me", authMiddleware, myDelegationsHandler);
botRoutes.delete("/delegaciones/:botDelegationId", authMiddleware, revokeDelegationHandler);

botRoutes.post(
  "/delegaciones/solicitar",
  authMiddleware,
  requireRoles(["bot_agent", "super_agent", "admin_sistema"]),
  botSolicitarDelegacionHandler,
);
botRoutes.post(
  "/delegaciones/confirmar",
  authMiddleware,
  requireRoles(["bot_agent", "super_agent", "admin_sistema"]),
  botConfirmarDelegacionHandler,
);

botRoutes.post(
  "/asignaciones/:tareaAsignacionId/contactar",
  authMiddleware,
  requireRoles(["bot_agent", "super_agent", "admin_sistema"]),
  botContactarAsignacionHandler,
);

botRoutes.post(
  "/asignaciones/:tareaAsignacionId/ayudar-carga",
  authMiddleware,
  requireRoles(["bot_agent", "super_agent", "admin_sistema"]),
  botAyudarCargaHandler,
);

botRoutes.post(
  "/tareas",
  authMiddleware,
  requireRoles(["bot_agent", "super_agent", "admin_sistema"]),
  botCrearTareaHandler,
);

botRoutes.post(
  "/tareas/iniciar",
  authMiddleware,
  requireRoles(["bot_agent", "super_agent", "admin_sistema"]),
  botIniciarCreacionTareaHandler,
);

botRoutes.patch(
  "/asignaciones/:tareaAsignacionId/estado",
  authMiddleware,
  requireRoles(["bot_agent", "super_agent", "admin_sistema"]),
  botActualizarAsignacionEstadoHandler,
);

botRoutes.get(
  "/protocolos",
  authMiddleware,
  requireRoles(["bot_agent", "super_agent", "admin_sistema"]),
  botGetProtocolosHandler,
);

botRoutes.get(
  "/bodegas/:bodegaId/operarios",
  authMiddleware,
  requireRoles(["bot_agent", "super_agent", "admin_sistema"]),
  botGetOperariosByBodegaHandler,
);

botRoutes.post(
  "/fincas/:fincaId/cuarteles",
  authMiddleware,
  requireRoles(["bot_agent", "super_agent", "admin_sistema"]),
  botCrearCuartelHandler,
);

botRoutes.post(
  "/bodegas/:bodegaId/vasijas",
  authMiddleware,
  requireRoles(["bot_agent", "super_agent", "admin_sistema"]),
  botCrearVasijaHandler,
);
