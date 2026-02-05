import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.route.js";
import { bodegaRoutes } from "../modules/bodega/bodega.route.js";

export const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/bodegas", bodegaRoutes);
