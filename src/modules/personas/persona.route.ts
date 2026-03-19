import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { listOperariosHandler, createOperarioHandler, deactivateOperarioHandler } from "./persona.controller.js";

export const personaRoutes = Router();

// GET  /operarios/bodega/:bodegaId   → lista usuarios de la bodega
// POST /operarios/bodega/:bodegaId   → crear usuario sin credenciales (operario)
personaRoutes.get("/bodega/:bodegaId", authMiddleware, listOperariosHandler);
personaRoutes.post("/bodega/:bodegaId", authMiddleware, createOperarioHandler);

// DELETE /operarios/:userId          → desactivar usuario
personaRoutes.delete("/:userId", authMiddleware, deactivateOperarioHandler);
