import { Router } from "express";
import { getPublicTrazabilidadCuartelHandler } from "./public.controller.js";

export const publicRoutes = Router();

// No authMiddleware — these endpoints are intentionally public
publicRoutes.get("/trazabilidad/cuartel/:cuartelId", getPublicTrazabilidadCuartelHandler);
