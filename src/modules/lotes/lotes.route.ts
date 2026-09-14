import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  crearCorteConVasijasHandler,
  crearLoteHandler,
  deleteLoteHandler,
  getImpactoBorradoLoteHandler,
  getLoteCiusExportHandler,
  getLoteGenealogiaHandler,
  getLoteHandler,
  getLoteHistorialHandler,
  listLotesHandler,
  listRecepcionesParaLoteHandler,
  updateLoteHandler,
} from "./lotes.controller.js";

export const lotesRoutes = Router();

lotesRoutes.get("/lotes", authMiddleware, listLotesHandler);
lotesRoutes.post("/lotes", authMiddleware, crearLoteHandler);
lotesRoutes.post("/lotes/blend", authMiddleware, crearCorteConVasijasHandler);
lotesRoutes.get("/lotes/:id/genealogia", authMiddleware, getLoteGenealogiaHandler);
lotesRoutes.get("/lotes/:id/historial", authMiddleware, getLoteHistorialHandler);
lotesRoutes.get("/lotes/:id/cius-export", authMiddleware, getLoteCiusExportHandler);
lotesRoutes.get("/lotes/:id/impacto-borrado", authMiddleware, getImpactoBorradoLoteHandler);
lotesRoutes.get("/lotes/:id", authMiddleware, getLoteHandler);
lotesRoutes.patch("/lotes/:id", authMiddleware, updateLoteHandler);
lotesRoutes.delete("/lotes/:id", authMiddleware, deleteLoteHandler);
lotesRoutes.get(
  "/recepciones-bodega/para-lote",
  authMiddleware,
  listRecepcionesParaLoteHandler,
);
