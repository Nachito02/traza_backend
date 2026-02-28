import { Router } from "express";
import {
  createBodegaHandler,
  linkProductorToBodegaHandler,
  listBodegaProductoresHandler,
} from "./bodega.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { listFincasByBodegaHandler } from "../fincas/finca.controller.js";

export const bodegaRoutes = Router();



//TODO proteger ruta
bodegaRoutes.post("/", authMiddleware, createBodegaHandler);
bodegaRoutes.get("/:bodegaId/fincas", authMiddleware, listFincasByBodegaHandler);
bodegaRoutes.get("/:bodegaId/productores", authMiddleware, listBodegaProductoresHandler);
bodegaRoutes.post("/:bodegaId/productores", authMiddleware, linkProductorToBodegaHandler);
