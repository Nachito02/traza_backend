import { Router } from "express";
import {
  createUserHandler,
  loginHandler,
  meHandler,
} from "./auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

export const authRoutes = Router();

authRoutes.post("/login", loginHandler);
authRoutes.get("/me", authMiddleware, meHandler);
authRoutes.post("/users", authMiddleware, createUserHandler);

authRoutes.post("/register" , createUserHandler);
