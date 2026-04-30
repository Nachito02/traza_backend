import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  createAnalisisRecepcionHandler,
  createCiuHandler,
  createCiuRecepcionHandler,
  createControlFermentacionHandler,
  createCodigoEnvaseHandler,
  createCorteHandler,
  createDespachoHandler,
  createExistenciaVasijaHandler,
  createLoteFraccionamientoHandler,
  createOperacionVasijaHandler,
  createProductoHandler,
  createQcIngresoUvaHandler,
  createRecepcionBodegaHandler,
  createRemitoUvaHandler,
  createVasijaHandler,
  deleteAnalisisRecepcionHandler,
  deleteCiuHandler,
  deleteCiuRecepcionHandler,
  deleteControlFermentacionHandler,
  deleteCodigoEnvaseHandler,
  deleteCorteHandler,
  deleteDespachoHandler,
  deleteExistenciaVasijaHandler,
  deleteLoteFraccionamientoHandler,
  deleteOperacionVasijaHandler,
  deleteProductoHandler,
  deleteQcIngresoUvaHandler,
  deleteRecepcionBodegaHandler,
  deleteRemitoUvaHandler,
  deleteVasijaHandler,
  getAnalisisRecepcionHandler,
  getCiuHandler,
  getCiuRecepcionHandler,
  getControlFermentacionHandler,
  getCodigoEnvaseHandler,
  getCorteHandler,
  getDespachoHandler,
  getExistenciaVasijaHandler,
  getLoteFraccionamientoHandler,
  getOperacionVasijaHandler,
  getProductoHandler,
  getQcIngresoUvaHandler,
  getRecepcionBodegaHandler,
  getRemitoUvaHandler,
  getVasijaHandler,
  listAnalisisRecepcionHandler,
  listCiusHandler,
  listCiuRecepcionesHandler,
  listControlesFermentacionHandler,
  listCodigosEnvaseHandler,
  listCortesHandler,
  listDespachosHandler,
  listExistenciasVasijaHandler,
  listLotesCosechaHandler,
  listLotesFraccionamientoHandler,
  listOperacionesVasijaHandler,
  listProductosHandler,
  listQcIngresoUvaHandler,
  listRecepcionesBodegaHandler,
  listRemitosUvaHandler,
  listVasijasHandler,
  updateAnalisisRecepcionHandler,
  updateCiuHandler,
  updateCiuRecepcionHandler,
  updateControlFermentacionHandler,
  updateCodigoEnvaseHandler,
  updateCorteHandler,
  updateDespachoHandler,
  updateExistenciaVasijaHandler,
  updateLoteFraccionamientoHandler,
  updateOperacionVasijaHandler,
  updateProductoHandler,
  updateQcIngresoUvaHandler,
  updateRecepcionBodegaHandler,
  updateRemitoUvaHandler,
  updateVasijaHandler,
} from "./elaboracion.controller.js";

export const elaboracionRoutes = Router();

elaboracionRoutes.get("/vasijas", authMiddleware, listVasijasHandler);
elaboracionRoutes.post("/vasijas", authMiddleware, createVasijaHandler);
elaboracionRoutes.get("/vasijas/:id", authMiddleware, getVasijaHandler);
elaboracionRoutes.patch("/vasijas/:id", authMiddleware, updateVasijaHandler);
elaboracionRoutes.delete("/vasijas/:id", authMiddleware, deleteVasijaHandler);

elaboracionRoutes.get("/cortes", authMiddleware, listCortesHandler);
elaboracionRoutes.post("/cortes", authMiddleware, createCorteHandler);
elaboracionRoutes.get("/cortes/:id", authMiddleware, getCorteHandler);
elaboracionRoutes.patch("/cortes/:id", authMiddleware, updateCorteHandler);
elaboracionRoutes.delete("/cortes/:id", authMiddleware, deleteCorteHandler);

elaboracionRoutes.get("/productos", authMiddleware, listProductosHandler);
elaboracionRoutes.post("/productos", authMiddleware, createProductoHandler);
elaboracionRoutes.get("/productos/:id", authMiddleware, getProductoHandler);
elaboracionRoutes.patch("/productos/:id", authMiddleware, updateProductoHandler);
elaboracionRoutes.delete("/productos/:id", authMiddleware, deleteProductoHandler);

elaboracionRoutes.get(
  "/lotes-fraccionamiento",
  authMiddleware,
  listLotesFraccionamientoHandler,
);
elaboracionRoutes.post(
  "/lotes-fraccionamiento",
  authMiddleware,
  createLoteFraccionamientoHandler,
);
elaboracionRoutes.get(
  "/lotes-fraccionamiento/:id",
  authMiddleware,
  getLoteFraccionamientoHandler,
);
elaboracionRoutes.patch(
  "/lotes-fraccionamiento/:id",
  authMiddleware,
  updateLoteFraccionamientoHandler,
);
elaboracionRoutes.delete(
  "/lotes-fraccionamiento/:id",
  authMiddleware,
  deleteLoteFraccionamientoHandler,
);

elaboracionRoutes.get("/codigos-envase", authMiddleware, listCodigosEnvaseHandler);
elaboracionRoutes.post("/codigos-envase", authMiddleware, createCodigoEnvaseHandler);
elaboracionRoutes.get("/codigos-envase/:id", authMiddleware, getCodigoEnvaseHandler);
elaboracionRoutes.patch(
  "/codigos-envase/:id",
  authMiddleware,
  updateCodigoEnvaseHandler,
);
elaboracionRoutes.delete(
  "/codigos-envase/:id",
  authMiddleware,
  deleteCodigoEnvaseHandler,
);

elaboracionRoutes.get("/lotes-cosecha", authMiddleware, listLotesCosechaHandler);

elaboracionRoutes.get("/remitos-uva", authMiddleware, listRemitosUvaHandler);
elaboracionRoutes.post("/remitos-uva", authMiddleware, createRemitoUvaHandler);
elaboracionRoutes.get("/remitos-uva/:id", authMiddleware, getRemitoUvaHandler);
elaboracionRoutes.patch("/remitos-uva/:id", authMiddleware, updateRemitoUvaHandler);
elaboracionRoutes.delete("/remitos-uva/:id", authMiddleware, deleteRemitoUvaHandler);

elaboracionRoutes.get("/recepciones-bodega", authMiddleware, listRecepcionesBodegaHandler);
elaboracionRoutes.post("/recepciones-bodega", authMiddleware, createRecepcionBodegaHandler);
elaboracionRoutes.get("/recepciones-bodega/:id", authMiddleware, getRecepcionBodegaHandler);
elaboracionRoutes.patch(
  "/recepciones-bodega/:id",
  authMiddleware,
  updateRecepcionBodegaHandler,
);
elaboracionRoutes.delete(
  "/recepciones-bodega/:id",
  authMiddleware,
  deleteRecepcionBodegaHandler,
);

elaboracionRoutes.get("/analisis-recepcion", authMiddleware, listAnalisisRecepcionHandler);
elaboracionRoutes.post("/analisis-recepcion", authMiddleware, createAnalisisRecepcionHandler);
elaboracionRoutes.get("/analisis-recepcion/:id", authMiddleware, getAnalisisRecepcionHandler);
elaboracionRoutes.patch(
  "/analisis-recepcion/:id",
  authMiddleware,
  updateAnalisisRecepcionHandler,
);
elaboracionRoutes.delete(
  "/analisis-recepcion/:id",
  authMiddleware,
  deleteAnalisisRecepcionHandler,
);

elaboracionRoutes.get("/operaciones-vasija", authMiddleware, listOperacionesVasijaHandler);
elaboracionRoutes.post("/operaciones-vasija", authMiddleware, createOperacionVasijaHandler);
elaboracionRoutes.get("/operaciones-vasija/:id", authMiddleware, getOperacionVasijaHandler);
elaboracionRoutes.patch(
  "/operaciones-vasija/:id",
  authMiddleware,
  updateOperacionVasijaHandler,
);
elaboracionRoutes.delete(
  "/operaciones-vasija/:id",
  authMiddleware,
  deleteOperacionVasijaHandler,
);

elaboracionRoutes.get("/despachos", authMiddleware, listDespachosHandler);
elaboracionRoutes.post("/despachos", authMiddleware, createDespachoHandler);
elaboracionRoutes.get("/despachos/:id", authMiddleware, getDespachoHandler);
elaboracionRoutes.patch("/despachos/:id", authMiddleware, updateDespachoHandler);
elaboracionRoutes.delete("/despachos/:id", authMiddleware, deleteDespachoHandler);

elaboracionRoutes.get("/cius", authMiddleware, listCiusHandler);
elaboracionRoutes.post("/cius", authMiddleware, createCiuHandler);
elaboracionRoutes.get("/cius/:id", authMiddleware, getCiuHandler);
elaboracionRoutes.patch("/cius/:id", authMiddleware, updateCiuHandler);
elaboracionRoutes.delete("/cius/:id", authMiddleware, deleteCiuHandler);

elaboracionRoutes.get("/ciu-recepciones", authMiddleware, listCiuRecepcionesHandler);
elaboracionRoutes.post("/ciu-recepciones", authMiddleware, createCiuRecepcionHandler);
elaboracionRoutes.get(
  "/ciu-recepciones/:ciuId/:recepcionBodegaId",
  authMiddleware,
  getCiuRecepcionHandler,
);
elaboracionRoutes.patch(
  "/ciu-recepciones/:ciuId/:recepcionBodegaId",
  authMiddleware,
  updateCiuRecepcionHandler,
);
elaboracionRoutes.delete(
  "/ciu-recepciones/:ciuId/:recepcionBodegaId",
  authMiddleware,
  deleteCiuRecepcionHandler,
);

elaboracionRoutes.get("/qc-ingreso-uva", authMiddleware, listQcIngresoUvaHandler);
elaboracionRoutes.post("/qc-ingreso-uva", authMiddleware, createQcIngresoUvaHandler);
elaboracionRoutes.get("/qc-ingreso-uva/:id", authMiddleware, getQcIngresoUvaHandler);
elaboracionRoutes.patch(
  "/qc-ingreso-uva/:id",
  authMiddleware,
  updateQcIngresoUvaHandler,
);
elaboracionRoutes.delete(
  "/qc-ingreso-uva/:id",
  authMiddleware,
  deleteQcIngresoUvaHandler,
);

elaboracionRoutes.get(
  "/existencias-vasija",
  authMiddleware,
  listExistenciasVasijaHandler,
);
elaboracionRoutes.post(
  "/existencias-vasija",
  authMiddleware,
  createExistenciaVasijaHandler,
);
elaboracionRoutes.get(
  "/existencias-vasija/:id",
  authMiddleware,
  getExistenciaVasijaHandler,
);
elaboracionRoutes.patch(
  "/existencias-vasija/:id",
  authMiddleware,
  updateExistenciaVasijaHandler,
);
elaboracionRoutes.delete(
  "/existencias-vasija/:id",
  authMiddleware,
  deleteExistenciaVasijaHandler,
);

elaboracionRoutes.get(
  "/controles-fermentacion",
  authMiddleware,
  listControlesFermentacionHandler,
);
elaboracionRoutes.post(
  "/controles-fermentacion",
  authMiddleware,
  createControlFermentacionHandler,
);
elaboracionRoutes.get(
  "/controles-fermentacion/:id",
  authMiddleware,
  getControlFermentacionHandler,
);
elaboracionRoutes.patch(
  "/controles-fermentacion/:id",
  authMiddleware,
  updateControlFermentacionHandler,
);
elaboracionRoutes.delete(
  "/controles-fermentacion/:id",
  authMiddleware,
  deleteControlFermentacionHandler,
);
