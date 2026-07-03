import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  addTareaAsignacionesHandler,
  addTareaEntradaHandler,
  assignTareaCompatHandler,
  canManageTareasHandler,
  cancelTareaHandler,
  completarTareaHandler,
  createTareaHandler,
  registrarActividadHandler,
  validarTareaHandler,
  eliminarTareaHandler,
  finalizarTareaAsignacionHandler,
  listBodegaPendientesHandler,
  listTareaEntradasHandler,
  listTareasHandler,
  listMyTareasHandler,
  listMyPendientesHandler,
  updateMyAsignacionEstadoHandler,
  updateTareaEntradaHandler,
  uploadEntradaAdjuntoHandler,
} from "./tarea.controller.js";

// Allowed MIME types for adjuntos
const ALLOWED_MIME_PREFIXES = ["image/", "video/"];
const ALLOWED_MIME_EXACT = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
]);

// Keep files in memory (buffer) — IPFS upload happens in the controller
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
  fileFilter: (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile?: boolean) => void,
  ) => {
    const allowed =
      ALLOWED_MIME_PREFIXES.some((prefix) => file.mimetype.startsWith(prefix)) ||
      ALLOWED_MIME_EXACT.has(file.mimetype);
    if (allowed) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
    }
  },
});

export const tareaRoutes = Router();

tareaRoutes.get("/me/can-manage", authMiddleware, canManageTareasHandler);
tareaRoutes.get("/me/asignaciones", authMiddleware, listMyTareasHandler);
tareaRoutes.get("/mis-pendientes", authMiddleware, listMyPendientesHandler);
tareaRoutes.get(
  "/bodega/:bodegaId/pendientes",
  authMiddleware,
  listBodegaPendientesHandler,
);
tareaRoutes.patch(
  "/me/asignaciones/:tareaAsignacionId/estado",
  authMiddleware,
  updateMyAsignacionEstadoHandler,
);
tareaRoutes.get(
  "/me/asignaciones/:tareaAsignacionId/entradas",
  authMiddleware,
  listTareaEntradasHandler,
);
tareaRoutes.post(
  "/me/asignaciones/:tareaAsignacionId/entradas",
  authMiddleware,
  addTareaEntradaHandler,
);
tareaRoutes.post(
  "/me/asignaciones/:tareaAsignacionId/finalizar",
  authMiddleware,
  finalizarTareaAsignacionHandler,
);

tareaRoutes.get(
  "/",
  authMiddleware,
  listTareasHandler,
);
tareaRoutes.post(
  "/",
  authMiddleware,
  createTareaHandler,
);
tareaRoutes.post(
  "/registro",
  authMiddleware,
  registrarActividadHandler,
);
tareaRoutes.post(
  "/:tareaId/asignaciones",
  authMiddleware,
  addTareaAsignacionesHandler,
);
tareaRoutes.patch(
  "/:tareaId/asignar",
  authMiddleware,
  assignTareaCompatHandler,
);
tareaRoutes.post(
  "/:tareaId/asignar",
  authMiddleware,
  assignTareaCompatHandler,
);
tareaRoutes.patch(
  "/:tareaId/cancelar",
  authMiddleware,
  cancelTareaHandler,
);
tareaRoutes.patch(
  "/:tareaId/completar",
  authMiddleware,
  completarTareaHandler,
);
tareaRoutes.patch(
  "/:tareaId/validar",
  authMiddleware,
  validarTareaHandler,
);
tareaRoutes.delete(
  "/:tareaId",
  authMiddleware,
  eliminarTareaHandler,
);

// Edit a tarea_entrada (date correction)
tareaRoutes.patch(
  "/entradas/:entradaId",
  authMiddleware,
  updateTareaEntradaHandler,
);

// Upload an image adjunto to a tarea_entrada → IPFS → store CID
tareaRoutes.post(
  "/entradas/:entradaId/adjuntos",
  authMiddleware,
  upload.single("imagen"),
  uploadEntradaAdjuntoHandler,
);
