import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  listPersonalHandler,
  createPersonalHandler,
  updatePersonalHandler,
  deletePersonalHandler,
} from "./personal.controller.js";

export const personalRoutes = Router();

personalRoutes.get("/", authMiddleware, listPersonalHandler);
personalRoutes.post("/", authMiddleware, createPersonalHandler);
personalRoutes.patch("/:id", authMiddleware, updatePersonalHandler);
personalRoutes.delete("/:id", authMiddleware, deletePersonalHandler);
