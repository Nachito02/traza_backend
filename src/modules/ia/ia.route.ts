import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRoles } from "../../middlewares/roles.middleware.js";
import {
  botLoginHandler,
  botRegisterHandler,
  createDelegationHandler,
  createSuperAgentHandler,
  myDelegationsHandler,
  revokeDelegationHandler,
  botSolicitarDelegacionHandler,
  botConfirmarDelegacionHandler,
  botIniciarCreacionTareaHandler,
} from "../bot/bot.controller.js";
import {
  contactIaJobHandler,
  getIaUsuarioByWhatsappHandler,
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
  listIaActividadSugerenciasHandler,
  listIaJobsHandler,
  listIaTrabajadoresHandler,
  createIaTrabajadorHandler,
  createIaCuartelHandler,
  addIaEntradaHandler,
  listIaProcesosHandler,
  listIaProtocolosHandler,
  listIaTrazabilidadesHandler,
  submitIaJobResultHandler,
  listIaEventoTiposHandler,
  getIaEventoSchemaHandler,
} from "./ia.controller.js";

export const iaRoutes = Router();

iaRoutes.post("/auth/register", authMiddleware, requireRoles(["admin_sistema"]), botRegisterHandler);
iaRoutes.post("/auth/register-agent", authMiddleware, requireRoles(["admin_sistema"]), createSuperAgentHandler);
iaRoutes.post("/auth/login", botLoginHandler);

iaRoutes.use(authMiddleware, requireRoles(["bot_agent", "super_agent", "admin_sistema"]));

iaRoutes.get("/me", iaMeHandler);
iaRoutes.get("/catalogos/bodegas", listIaBodegasHandler);
iaRoutes.get("/catalogos/fincas", listIaFincasHandler);
iaRoutes.get("/catalogos/cuarteles", listIaCuartelesHandler);
iaRoutes.post("/catalogos/cuarteles", createIaCuartelHandler);
iaRoutes.get("/catalogos/campanias", listIaCampaniasHandler);
iaRoutes.get("/catalogos/trabajadores", listIaTrabajadoresHandler);
iaRoutes.post("/catalogos/trabajadores", createIaTrabajadorHandler);
iaRoutes.get("/catalogos/protocolos", listIaProtocolosHandler);
iaRoutes.get("/catalogos/protocolos/:protocoloId/procesos", listIaProcesosHandler);
iaRoutes.get("/catalogos/insumos", listIaInsumosHandler);
iaRoutes.get("/catalogos/actividades-sugerencias", listIaActividadSugerenciasHandler);
iaRoutes.get("/catalogos/eventos", listIaEventoTiposHandler);
iaRoutes.get("/catalogos/eventos/:tipo/schema", getIaEventoSchemaHandler);
iaRoutes.get("/tareas", listIaJobsHandler);
iaRoutes.post("/tareas/iniciar", botIniciarCreacionTareaHandler);
iaRoutes.get("/tareas/:tareaAsignacionId", getIaJobHandler);
iaRoutes.get("/tareas/:tareaAsignacionId/contexto", getIaJobContextHandler);
iaRoutes.post("/tareas/:tareaAsignacionId/contactar", contactIaJobHandler);
iaRoutes.post("/tareas/:tareaAsignacionId/guardar-progreso", helpIaJobLoadHandler);
iaRoutes.post("/tareas/:tareaAsignacionId/entradas", addIaEntradaHandler);
iaRoutes.post("/tareas/:tareaAsignacionId/finalizar", submitIaJobResultHandler);
iaRoutes.get("/trazabilidades", listIaTrazabilidadesHandler);
iaRoutes.get("/trazabilidades/:trazabilidadId", getIaTrazabilidadHandler);
iaRoutes.get("/trazabilidades/:trazabilidadId/contexto", getIaTrazabilidadContextHandler);
iaRoutes.get("/hallazgos", listIaHallazgosHandler);
iaRoutes.get("/hallazgos/:hallazgoId", getIaHallazgoHandler);
iaRoutes.get("/eventos", listIaEventosHandler);
iaRoutes.get("/usuarios/whatsapp/:whatsapp", getIaUsuarioByWhatsappHandler);
iaRoutes.get("/usuarios/:userId", getIaUsuarioHandler);
iaRoutes.post("/consultas", iaConsultarHandler);

iaRoutes.post("/delegaciones", createDelegationHandler);
iaRoutes.get("/delegaciones/me", myDelegationsHandler);
iaRoutes.delete("/delegaciones/:botDelegationId", revokeDelegationHandler);
iaRoutes.post("/delegaciones/solicitar", botSolicitarDelegacionHandler);
iaRoutes.post("/delegaciones/confirmar", botConfirmarDelegacionHandler);
