import { Router } from "express";
import {
  createUserHandler,
  loginHandler,
  meHandler,
  meBodegasHandler,
  meRolesHandler,
  refreshHandler,
  logoutHandler,
} from "./auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

export const authRoutes = Router();

authRoutes.post("/login", loginHandler);
authRoutes.post("/register", createUserHandler);
authRoutes.get("/me", authMiddleware, meHandler);
authRoutes.get("/me/bodegas", authMiddleware, meBodegasHandler);
authRoutes.get("/me/roles", authMiddleware, meRolesHandler);
authRoutes.post("/users", authMiddleware, createUserHandler);
authRoutes.post("/refresh", refreshHandler);
authRoutes.post("/logout", logoutHandler);
