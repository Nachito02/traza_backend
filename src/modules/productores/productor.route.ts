import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  createProductorHandler,
  deleteProductorHandler,
  getProductorHandler,
  listProductoresHandler,
  updateProductorHandler,
} from "./productor.controller.js";

export const productorRoutes = Router();

productorRoutes.get("/", authMiddleware, listProductoresHandler);
productorRoutes.post("/", authMiddleware, createProductorHandler);
productorRoutes.get("/:productorId", authMiddleware, getProductorHandler);
productorRoutes.patch("/:productorId", authMiddleware, updateProductorHandler);
productorRoutes.delete("/:productorId", authMiddleware, deleteProductorHandler);
