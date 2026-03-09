import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRoles } from "../../middlewares/roles.middleware.js";
import { botLoginHandler, botRegisterHandler } from "../bot/bot.controller.js";
import {
  contactIaJobHandler,
  getIaUsuarioHandler,
  getIaHallazgoHandler,
  getIaTrazabilidadContextHandler,
  getIaTrazabilidadHandler,
  getIaJobContextHandler,
  getIaJobHandler,
  helpIaJobLoadHandler,
  iaConsultarHandler,
  iaMeHandler,
  listIaBodegasHandler,
  listIaCampaniasHandler,
  listIaCuartelesHandler,
  listIaEventosHandler,
  listIaFincasHandler,
  listIaHallazgosHandler,
  listIaInsumosHandler,
  listIaJobsHandler,
  listIaPersonasHandler,
  listIaProcesosHandler,
  listIaProtocolosHandler,
  listIaTrazabilidadesHandler,
  submitIaJobResultHandler,
  listIaEventoTiposHandler,
  getIaEventoSchemaHandler,
} from "./ia.controller.js";

export const iaRoutes = Router();

iaRoutes.post("/auth/register", authMiddleware, requireRoles(["admin_sistema"]), botRegisterHandler);
iaRoutes.post("/auth/login", botLoginHandler);

iaRoutes.use(authMiddleware, requireRoles(["bot_agent", "admin_sistema"]));

iaRoutes.get("/me", iaMeHandler);
iaRoutes.get("/catalogos/bodegas", listIaBodegasHandler);
iaRoutes.get("/catalogos/fincas", listIaFincasHandler);
iaRoutes.get("/catalogos/cuarteles", listIaCuartelesHandler);
iaRoutes.get("/catalogos/campanias", listIaCampaniasHandler);
iaRoutes.get("/catalogos/personas", listIaPersonasHandler);
iaRoutes.get("/catalogos/protocolos", listIaProtocolosHandler);
iaRoutes.get("/catalogos/protocolos/:protocoloId/procesos", listIaProcesosHandler);
iaRoutes.get("/catalogos/insumos", listIaInsumosHandler);
iaRoutes.get("/catalogos/eventos", listIaEventoTiposHandler);
iaRoutes.get("/catalogos/eventos/:tipo/schema", getIaEventoSchemaHandler);
iaRoutes.get("/trabajos", listIaJobsHandler);
iaRoutes.get("/trabajos/:encargoAsignacionId", getIaJobHandler);
iaRoutes.get("/trabajos/:encargoAsignacionId/contexto", getIaJobContextHandler);
iaRoutes.post("/trabajos/:encargoAsignacionId/contactar", contactIaJobHandler);
iaRoutes.post("/trabajos/:encargoAsignacionId/save-progress", helpIaJobLoadHandler);
iaRoutes.post("/trabajos/:encargoAsignacionId/resultado", submitIaJobResultHandler);
iaRoutes.get("/trazabilidades", listIaTrazabilidadesHandler);
iaRoutes.get("/trazabilidades/:trazabilidadId", getIaTrazabilidadHandler);
iaRoutes.get("/trazabilidades/:trazabilidadId/contexto", getIaTrazabilidadContextHandler);
iaRoutes.get("/hallazgos", listIaHallazgosHandler);
iaRoutes.get("/hallazgos/:hallazgoId", getIaHallazgoHandler);
iaRoutes.get("/eventos", listIaEventosHandler);
iaRoutes.get("/usuarios/:userId", getIaUsuarioHandler);
iaRoutes.post("/consultas", iaConsultarHandler);
