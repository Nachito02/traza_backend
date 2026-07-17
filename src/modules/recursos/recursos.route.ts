import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  listRecursosHandler,
  createRecursoHandler,
  updateRecursoHandler,
  deleteRecursoHandler,
  clasesMaestroHandler,
  categoriasMaestroHandler,
  maestroHandler,
} from "./recursos.controller.js";

export const recursosRoutes = Router();

// ── Catálogo maestro global (referencia para autocompletar) ──
recursosRoutes.get("/maestro/clases", authMiddleware, clasesMaestroHandler);
recursosRoutes.get("/maestro/categorias", authMiddleware, categoriasMaestroHandler);
recursosRoutes.get("/maestro", authMiddleware, maestroHandler);

// ── ABM del catálogo de recursos de la bodega ──
recursosRoutes.get("/", authMiddleware, listRecursosHandler);
recursosRoutes.post("/", authMiddleware, createRecursoHandler);
recursosRoutes.patch("/:id", authMiddleware, updateRecursoHandler);
recursosRoutes.delete("/:id", authMiddleware, deleteRecursoHandler);
