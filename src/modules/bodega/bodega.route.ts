import { Router } from "express";
import { createBodegaHandler } from "./bodega.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

export const bodegaRoutes = Router();



//TODO proteger ruta
bodegaRoutes.post("/",  createBodegaHandler);
