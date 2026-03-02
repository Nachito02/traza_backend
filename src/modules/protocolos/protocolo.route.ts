import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  listProtocolosExpandedHandler,
  listProtocolosHandler,
} from "./protocolo.controller.js";

export const protocoloRoutes = Router();

protocoloRoutes.get("/", authMiddleware, listProtocolosHandler);
protocoloRoutes.get("/expanded", authMiddleware, listProtocolosExpandedHandler);
