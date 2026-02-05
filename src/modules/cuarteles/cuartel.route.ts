import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  createCuartelHandler,
  listCuartelesByFincaHandler,
} from "./cuartel.controller.js";

export const cuartelRoutes = Router();

cuartelRoutes.post("/", authMiddleware, createCuartelHandler);
cuartelRoutes.get("/finca/:fincaId", authMiddleware, listCuartelesByFincaHandler);
