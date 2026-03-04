import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  createFincaHandler,
  deleteFincaHandler,
  getFincaByIdHandler,
  listFincasConDetallesHandler,
  listFincasByBodegaHandler,
  updateFincaHandler,
} from "./finca.controller.js";

export const fincaRoutes = Router();

fincaRoutes.post("/", authMiddleware, createFincaHandler);
fincaRoutes.get("/", authMiddleware, listFincasConDetallesHandler);
fincaRoutes.get("/bodega/:bodegaId", authMiddleware, listFincasByBodegaHandler);
fincaRoutes.get("/:fincaId", authMiddleware, getFincaByIdHandler);
fincaRoutes.patch("/:fincaId", authMiddleware, updateFincaHandler);
fincaRoutes.delete("/:fincaId", authMiddleware, deleteFincaHandler);
