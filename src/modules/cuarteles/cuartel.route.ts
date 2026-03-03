import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  createCuartelHandler,
  deleteCuartelHandler,
  getCuartelByIdHandler,
  listCuartelesByFincaHandler,
  updateCuartelHandler,
} from "./cuartel.controller.js";

export const cuartelRoutes = Router();

cuartelRoutes.post("/", authMiddleware, createCuartelHandler);
cuartelRoutes.get("/finca/:fincaId", authMiddleware, listCuartelesByFincaHandler);
cuartelRoutes.get("/:cuartelId", authMiddleware, getCuartelByIdHandler);
cuartelRoutes.patch("/:cuartelId", authMiddleware, updateCuartelHandler);
cuartelRoutes.delete("/:cuartelId", authMiddleware, deleteCuartelHandler);
