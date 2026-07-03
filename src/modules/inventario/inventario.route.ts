import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  listInsumosHandler,
  createInsumoHandler,
  updateInsumoHandler,
  deleteInsumoHandler,
  existenciasHandler,
  ingresoHandler,
  ajusteHandler,
  movimientosHandler,
  alertasHandler,
} from "./inventario.controller.js";

export const inventarioRoutes = Router();

// ── ABM de insumos ──
inventarioRoutes.get("/insumos", authMiddleware, listInsumosHandler);
inventarioRoutes.post("/insumos", authMiddleware, createInsumoHandler);
inventarioRoutes.patch("/insumos/:id", authMiddleware, updateInsumoHandler);
inventarioRoutes.delete("/insumos/:id", authMiddleware, deleteInsumoHandler);

// ── Stock ──
inventarioRoutes.get("/existencias", authMiddleware, existenciasHandler);
inventarioRoutes.post("/movimientos/ingreso", authMiddleware, ingresoHandler);
inventarioRoutes.post("/movimientos/ajuste", authMiddleware, ajusteHandler);
inventarioRoutes.get("/movimientos/:insumoId", authMiddleware, movimientosHandler);
inventarioRoutes.get("/alertas", authMiddleware, alertasHandler);
