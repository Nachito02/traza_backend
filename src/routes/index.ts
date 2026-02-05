import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.route.js";
import { bodegaRoutes } from "../modules/bodega/bodega.route.js";
import { milestoneRoutes } from "../modules/milestones/milestone.route.js";
import { fincaRoutes } from "../modules/fincas/finca.route.js";
import { cuartelRoutes } from "../modules/cuarteles/cuartel.route.js";
import { campaniaRoutes } from "../modules/campanias/campania.route.js";
import { protocoloRoutes } from "../modules/protocolos/protocolo.route.js";
import { trazabilidadRoutes } from "../modules/trazabilidades/trazabilidad.route.js";

export const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/bodegas", bodegaRoutes);
routes.use("/milestones", milestoneRoutes);
routes.use("/fincas", fincaRoutes);
routes.use("/cuarteles", cuartelRoutes);
routes.use("/campanias", campaniaRoutes);
routes.use("/protocolos", protocoloRoutes);
routes.use("/trazabilidades", trazabilidadRoutes);
