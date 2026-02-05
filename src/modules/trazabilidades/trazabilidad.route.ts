import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  createTrazabilidadHandler,
  listTrazabilidadesHandler,
} from "./trazabilidad.controller.js";

export const trazabilidadRoutes = Router();

trazabilidadRoutes.post("/", authMiddleware, createTrazabilidadHandler);
trazabilidadRoutes.get("/", authMiddleware, listTrazabilidadesHandler);
