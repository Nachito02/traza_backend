

import express from 'express';
import cors from "cors";
import cookieParser from 'cookie-parser';
import { prisma } from './config/prismaClient.js';
import { routes } from './routes/index.js';
import swaggerUi from "swagger-ui-express";
import openapiSpec from "./config/openapi.js";

const app = express();

app.use((req, res, next) => {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    console.log(`[HTTP] ${method} ${originalUrl} -> ${res.statusCode} (${durationMs}ms)`);
  });

  next();
});

app.use(express.json());
app.use(cookieParser());

app.use(cors({ origin: true, credentials: true }))
app.use('/uploads', express.static('uploads'));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

//Routes
app.use('/api', routes);

app.get("/bodegas", async (_req, res) => {
  const bodegas = await prisma.finca.findMany();
  res.json(bodegas);
});

export default app;
