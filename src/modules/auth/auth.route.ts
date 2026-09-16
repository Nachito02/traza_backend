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
// TODO(seguridad): cerrar el alta de usuarios por API.
// Esta ruta es PÚBLICA —no pasa por authMiddleware— y usa el mismo createUserHandler que
// POST /users, que sí está protegido. O sea: hoy cualquiera con la URL puede crearse un
// usuario. El frontend ya no la consume (la pantalla de registro se eliminó: el alta la
// hacemos nosotros en la configuración inicial), así que borrarla no rompe la app.
// Al cerrarla, revisar también scripts/create-admin.ts, que es el camino que debería quedar.
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
