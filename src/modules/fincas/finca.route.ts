import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  createFincaHandler,
  listFincasByBodegaHandler,
  updateFincaHandler,
} from "./finca.controller.js";

export const fincaRoutes = Router();

fincaRoutes.post("/", authMiddleware, createFincaHandler);
fincaRoutes.get("/bodega/:bodegaId", authMiddleware, listFincasByBodegaHandler);
fincaRoutes.patch("/:fincaId", authMiddleware, updateFincaHandler);
