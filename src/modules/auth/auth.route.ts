import { Router } from "express";
import {
  changePasswordHandler,
  createUserHandler,
  deleteUserHandler,
  getUserDetailHandler,
  listUsersHandler,
  loginHandler,
  meHandler,
  meBodegasHandler,
  meRolesHandler,
  refreshHandler,
  logoutHandler,
  updateUserGlobalRoleHandler,
  updateUserBodegaRoleHandler,
  updateUserBodegaRoleByIdHandler,
  updateUserFincaRoleHandler,
  updateUserHandler,
} from "./auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

export const authRoutes = Router();

authRoutes.post("/login", loginHandler);
authRoutes.post("/change-password", changePasswordHandler);
authRoutes.post("/register", createUserHandler);
authRoutes.get("/me", authMiddleware, meHandler);
authRoutes.get("/me/bodegas", authMiddleware, meBodegasHandler);
authRoutes.get("/me/roles", authMiddleware, meRolesHandler);
authRoutes.get("/users", authMiddleware, listUsersHandler);
authRoutes.post("/users", authMiddleware, createUserHandler);
authRoutes.get("/users/:userId", authMiddleware, getUserDetailHandler);
authRoutes.patch("/users/:userId", authMiddleware, updateUserHandler);
authRoutes.delete("/users/:userId", authMiddleware, deleteUserHandler);
authRoutes.patch("/users/:userId/bodegas/:name/role", authMiddleware, updateUserBodegaRoleHandler);
authRoutes.patch("/users/:userId/bodegas/id/:bodegaId/role", authMiddleware, updateUserBodegaRoleByIdHandler);
authRoutes.patch("/users/:userId/fincas/:fincaId/roles", authMiddleware, updateUserFincaRoleHandler);
authRoutes.patch("/users/:userId/global-role", authMiddleware, updateUserGlobalRoleHandler);
authRoutes.post("/refresh", refreshHandler);
authRoutes.post("/logout", logoutHandler);
