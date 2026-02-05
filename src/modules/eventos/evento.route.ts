import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { createEventoHandler } from "./evento.controller.js";

export const eventoRoutes = Router();

eventoRoutes.post("/:tipo", authMiddleware, createEventoHandler);
