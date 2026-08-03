import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.route.js";
import { bodegaRoutes } from "../modules/bodega/bodega.route.js";
import { fincaRoutes } from "../modules/fincas/finca.route.js";
import { cuartelRoutes } from "../modules/cuarteles/cuartel.route.js";
import { campaniaRoutes } from "../modules/campanias/campania.route.js";
import { protocoloRoutes } from "../modules/protocolos/protocolo.route.js";
import { trazabilidadRoutes } from "../modules/trazabilidades/trazabilidad.route.js";
import { cumplimientoRoutes } from "../modules/cumplimiento/cumplimiento.route.js";
import { productorRoutes } from "../modules/productores/productor.route.js";
import { tareaRoutes } from "../modules/tareas/tarea.route.js";
import { botRoutes } from "../modules/bot/bot.route.js";
import { iaRoutes } from "../modules/ia/ia.route.js";
import { elaboracionRoutes } from "../modules/elaboracion/elaboracion.route.js";
import { lotesRoutes } from "../modules/lotes/lotes.route.js";
import { costosRoutes } from "../modules/costos/costos.route.js";
import { inventarioRoutes } from "../modules/inventario/inventario.route.js";
import { recursosRoutes } from "../modules/recursos/recursos.route.js";
import { personalRoutes } from "../modules/personal/personal.route.js";
import { personaRoutes } from "../modules/personas/persona.route.js";
import { publicRoutes } from "../modules/public/public.route.js";

export const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/bodegas", bodegaRoutes);
routes.use("/fincas", fincaRoutes);
routes.use("/cuarteles", cuartelRoutes);
routes.use("/campanias", campaniaRoutes);
routes.use("/protocolos", protocoloRoutes);
routes.use("/trazabilidades", trazabilidadRoutes);
routes.use("/cumplimiento", cumplimientoRoutes);
routes.use("/productores", productorRoutes);
routes.use("/tareas", tareaRoutes);
routes.use("/bot", botRoutes);
routes.use("/ia", iaRoutes);
// lotesRoutes va antes que elaboracionRoutes: comparten el prefijo /elaboracion y
// /recepciones-bodega/para-lote necesita matchear antes que /recepciones-bodega/:id.
routes.use("/elaboracion", lotesRoutes);
routes.use("/elaboracion", elaboracionRoutes);
routes.use("/costos", costosRoutes);
routes.use("/inventario", inventarioRoutes);
routes.use("/recursos", recursosRoutes);
routes.use("/personal", personalRoutes);
routes.use("/operarios", personaRoutes);
routes.use("/public", publicRoutes);
