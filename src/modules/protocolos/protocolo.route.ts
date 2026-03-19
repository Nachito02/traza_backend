import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  listProtocolosHandler,
  listProtocolosExpandedHandler,
  getProtocoloHandler,
  getProtocoloPlantillaHandler,
  createProtocoloHandler,
  updateProtocoloHandler,
  deleteProtocoloHandler,
  createEtapaHandler,
  updateEtapaHandler,
  deleteEtapaHandler,
  createProcesoHandler,
  updateProcesoHandler,
  deleteProcesoHandler,
} from "./protocolo.controller.js";

export const protocoloRoutes = Router();

// Protocolos
protocoloRoutes.get("/", authMiddleware, listProtocolosHandler);
protocoloRoutes.get("/expanded", authMiddleware, listProtocolosExpandedHandler);
protocoloRoutes.get("/:protocoloId/plantilla", authMiddleware, getProtocoloPlantillaHandler);
protocoloRoutes.get("/:protocoloId", authMiddleware, getProtocoloHandler);
protocoloRoutes.post("/", authMiddleware, createProtocoloHandler);
protocoloRoutes.put("/:protocoloId", authMiddleware, updateProtocoloHandler);
protocoloRoutes.delete("/:protocoloId", authMiddleware, deleteProtocoloHandler);

// Etapas
protocoloRoutes.post("/:protocoloId/etapas", authMiddleware, createEtapaHandler);
protocoloRoutes.put("/etapas/:etapaId", authMiddleware, updateEtapaHandler);
protocoloRoutes.delete("/etapas/:etapaId", authMiddleware, deleteEtapaHandler);

// Procesos
protocoloRoutes.post("/etapas/:etapaId/procesos", authMiddleware, createProcesoHandler);
protocoloRoutes.put("/procesos/:procesoId", authMiddleware, updateProcesoHandler);
protocoloRoutes.delete("/procesos/:procesoId", authMiddleware, deleteProcesoHandler);
