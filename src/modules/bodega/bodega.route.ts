import { Router } from "express";
import {
  createBodegaHandler,
  getBodegaHandler,
  listBodegaFincaVinculosHandler,
  linkProductorToBodegaHandler,
  listBodegaProductoresHandler,
  updateBodegaHandler,
  upsertBodegaFincaVinculoHandler,
} from "./bodega.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { listFincasByBodegaHandler } from "../fincas/finca.controller.js";

export const bodegaRoutes = Router();



//TODO proteger ruta
bodegaRoutes.post("/", authMiddleware, createBodegaHandler);
bodegaRoutes.get("/:bodegaId", authMiddleware, getBodegaHandler);
bodegaRoutes.patch("/:bodegaId", authMiddleware, updateBodegaHandler);
bodegaRoutes.get("/:bodegaId/fincas", authMiddleware, listFincasByBodegaHandler);
bodegaRoutes.get("/:bodegaId/fincas/vinculos", authMiddleware, listBodegaFincaVinculosHandler);
bodegaRoutes.put("/:bodegaId/fincas/:fincaId/vinculo", authMiddleware, upsertBodegaFincaVinculoHandler);
bodegaRoutes.get("/:bodegaId/productores", authMiddleware, listBodegaProductoresHandler);
bodegaRoutes.post("/:bodegaId/productores", authMiddleware, linkProductorToBodegaHandler);
