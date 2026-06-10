import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  listTarifasManoObraHandler,
  createTarifaManoObraHandler,
  updateTarifaManoObraHandler,
  deleteTarifaManoObraHandler,
  listTarifasMaquinariaHandler,
  createTarifaMaquinariaHandler,
  updateTarifaMaquinariaHandler,
  deleteTarifaMaquinariaHandler,
  listTarifasCombustibleHandler,
  createTarifaCombustibleHandler,
  updateTarifaCombustibleHandler,
  deleteTarifaCombustibleHandler,
  listInsumosCatalogoHandler,
  getCostosTareaHandler,
  upsertEjecucionHandler,
  addActividadMaquinaHandler,
  deleteActividadMaquinaHandler,
  addActividadInsumoHandler,
  deleteActividadInsumoHandler,
  recalcularCostosTareaHandler,
  resumenPorCuartelHandler,
  actividadesPorCuartelHandler,
  resumenPorCampaniaHandler,
} from "./costos.controller.js";

export const costosRoutes = Router();

// ── Tarifas: mano de obra ──
costosRoutes.get("/tarifas/mano-obra", authMiddleware, listTarifasManoObraHandler);
costosRoutes.post("/tarifas/mano-obra", authMiddleware, createTarifaManoObraHandler);
costosRoutes.patch("/tarifas/mano-obra/:id", authMiddleware, updateTarifaManoObraHandler);
costosRoutes.delete("/tarifas/mano-obra/:id", authMiddleware, deleteTarifaManoObraHandler);

// ── Tarifas: maquinaria ──
costosRoutes.get("/tarifas/maquinaria", authMiddleware, listTarifasMaquinariaHandler);
costosRoutes.post("/tarifas/maquinaria", authMiddleware, createTarifaMaquinariaHandler);
costosRoutes.patch("/tarifas/maquinaria/:id", authMiddleware, updateTarifaMaquinariaHandler);
costosRoutes.delete("/tarifas/maquinaria/:id", authMiddleware, deleteTarifaMaquinariaHandler);

// ── Tarifas: combustible ──
costosRoutes.get("/tarifas/combustible", authMiddleware, listTarifasCombustibleHandler);
costosRoutes.post("/tarifas/combustible", authMiddleware, createTarifaCombustibleHandler);
costosRoutes.patch("/tarifas/combustible/:id", authMiddleware, updateTarifaCombustibleHandler);
costosRoutes.delete("/tarifas/combustible/:id", authMiddleware, deleteTarifaCombustibleHandler);

// ── Catálogo de insumos ──
costosRoutes.get("/insumos", authMiddleware, listInsumosCatalogoHandler);

// ── Captura por actividad (tarea) ──
costosRoutes.get("/tareas/:tareaId", authMiddleware, getCostosTareaHandler);
costosRoutes.put("/tareas/:tareaId/ejecucion", authMiddleware, upsertEjecucionHandler);
costosRoutes.post("/tareas/:tareaId/maquinas", authMiddleware, addActividadMaquinaHandler);
costosRoutes.delete("/maquinas/:id", authMiddleware, deleteActividadMaquinaHandler);
costosRoutes.post("/tareas/:tareaId/insumos", authMiddleware, addActividadInsumoHandler);
costosRoutes.delete("/insumos/:id", authMiddleware, deleteActividadInsumoHandler);
costosRoutes.post("/tareas/:tareaId/recalcular", authMiddleware, recalcularCostosTareaHandler);

// ── Indicadores ──
costosRoutes.get("/resumen/cuartel/:cuartelId", authMiddleware, resumenPorCuartelHandler);
costosRoutes.get("/resumen/cuartel/:cuartelId/actividades", authMiddleware, actividadesPorCuartelHandler);
costosRoutes.get("/resumen/campania/:campaniaId", authMiddleware, resumenPorCampaniaHandler);
