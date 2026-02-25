import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  aceptarHallazgoHandler,
  historiaLoteHandler,
  indicadoresHandler,
  indicadoresLoteHandler,
  listHallazgosHandler,
  resolverHallazgoHandler,
} from "./cumplimiento.controller.js";

export const cumplimientoRoutes = Router();

cumplimientoRoutes.get("/hallazgos", authMiddleware, listHallazgosHandler);
cumplimientoRoutes.post("/hallazgos/:id/resolver", authMiddleware, resolverHallazgoHandler);
cumplimientoRoutes.post("/hallazgos/:id/aceptar", authMiddleware, aceptarHallazgoHandler);
cumplimientoRoutes.get("/indicadores", authMiddleware, indicadoresHandler);
cumplimientoRoutes.get("/indicadores/lote/:loteId", authMiddleware, indicadoresLoteHandler);
cumplimientoRoutes.get("/lotes/:loteId/historia", authMiddleware, historiaLoteHandler);
