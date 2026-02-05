import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  createCampaniaHandler,
  listCampaniasHandler,
} from "./campania.controller.js";

export const campaniaRoutes = Router();

campaniaRoutes.get("/", authMiddleware, listCampaniasHandler);
campaniaRoutes.post("/", authMiddleware, createCampaniaHandler);
