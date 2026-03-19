import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  createEventoHandler,
  listEventosHandler,
  getEventoHandler,
  deleteEventoHandler,
} from "./evento.controller.js";

export const eventoRoutes = Router();

// List eventos linked to a milestone (optionally filter by ?tipo=)
eventoRoutes.get("/milestone/:milestoneId", authMiddleware, listEventosHandler);

// Get a specific evento by milestone + tipo + id
eventoRoutes.get("/milestone/:milestoneId/:tipo/:eventoId", authMiddleware, getEventoHandler);

// Delete a specific evento
eventoRoutes.delete("/milestone/:milestoneId/:tipo/:eventoId", authMiddleware, deleteEventoHandler);

// Create evento
eventoRoutes.post("/:tipo", authMiddleware, createEventoHandler);
