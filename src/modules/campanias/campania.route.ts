import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  createCampaniaHandler,
  deleteCampaniaHandler,
  getCampaniaByIdHandler,
  listCampaniasHandler,
  updateCampaniaHandler,
} from "./campania.controller.js";

export const campaniaRoutes = Router();

campaniaRoutes.get("/", authMiddleware, listCampaniasHandler);
campaniaRoutes.post("/", authMiddleware, createCampaniaHandler);
campaniaRoutes.get("/:campaniaId", authMiddleware, getCampaniaByIdHandler);
campaniaRoutes.patch("/:campaniaId", authMiddleware, updateCampaniaHandler);
campaniaRoutes.delete("/:campaniaId", authMiddleware, deleteCampaniaHandler);
