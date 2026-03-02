import { Router } from "express";
import {
  createUserHandler,
  listUsersHandler,
  loginHandler,
  meHandler,
  meBodegasHandler,
  meRolesHandler,
  refreshHandler,
  logoutHandler,
  updateUserGlobalRoleHandler,
  updateUserBodegaRoleHandler,
} from "./auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRoles } from "../../middlewares/roles.middleware.js";

export const authRoutes = Router();

authRoutes.post("/login", loginHandler);
authRoutes.post("/register", createUserHandler);
authRoutes.get("/me", authMiddleware, meHandler);
authRoutes.get("/me/bodegas", authMiddleware, meBodegasHandler);
authRoutes.get("/me/roles", authMiddleware, meRolesHandler);
authRoutes.get("/users", authMiddleware, listUsersHandler);
authRoutes.post("/users", authMiddleware, requireRoles(["super_admin"]), createUserHandler);
authRoutes.patch("/users/:userId/bodegas/:name/role", authMiddleware, updateUserBodegaRoleHandler);
authRoutes.patch("/users/:userId/global-role", authMiddleware, updateUserGlobalRoleHandler);
authRoutes.post("/refresh", refreshHandler);
authRoutes.post("/logout", logoutHandler);
