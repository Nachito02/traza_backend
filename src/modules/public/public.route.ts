import { Router } from "express";
import {
  getPublicLoteHandler,
  getPublicProductoHandler,
  getPublicTrazabilidadCuartelHandler,
} from "./public.controller.js";

export const publicRoutes = Router();

// No authMiddleware — these endpoints are intentionally public
publicRoutes.get("/trazabilidad/cuartel/:cuartelId", getPublicTrazabilidadCuartelHandler);
publicRoutes.get("/producto/:codigoQr", getPublicProductoHandler);
publicRoutes.get("/lote/:loteId", getPublicLoteHandler);
