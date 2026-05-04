

import express from 'express';
import cors from "cors";
import cookieParser from 'cookie-parser';
import { prisma } from './config/prismaClient.js';
import { routes } from './routes/index.js';
import swaggerUi from "swagger-ui-express";
import openapiSpec from "./config/openapi.js";
import openapiIaSpec from "./config/openapi-ia.js";

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// app.use((req, res, next) => {
//   const start = Date.now();
//   const { method, originalUrl } = req;

//   res.on("finish", () => {
//     const durationMs = Date.now() - start;
//     console.log(`[HTTP] ${method} ${originalUrl} -> ${res.statusCode} (${durationMs}ms)`);
//   });

//   next();
// });

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  })
);
app.use('/uploads', express.static('uploads'));
app.get("/docs/spec.json", (_req, res) => res.json(openapiSpec));
app.get("/docs/ia/spec.json", (_req, res) => res.json(openapiIaSpec));

// /docs/ia debe ir ANTES que /docs para evitar captura por prefijo.
const iaDocsOpts = {
  explorer: true,
  swaggerOptions: { tryItOutEnabled: true },
  customCss: `.opblock-tag { align-items: flex-start !important; } .opblock-tag small { margin-top: 4px; line-height: 1.5; white-space: normal; max-width: 70%; } .try-out { display: none !important; }`,
};
app.use("/docs/ia", swaggerUi.serveFiles(openapiIaSpec, iaDocsOpts), swaggerUi.setup(openapiIaSpec, iaDocsOpts));

const docsOpts = {
  explorer: true,
  swaggerOptions: { tryItOutEnabled: true },
  customCss: `.try-out { display: none !important; }`,
};
app.use("/docs", swaggerUi.serveFiles(openapiSpec, docsOpts), swaggerUi.setup(openapiSpec, docsOpts));

//Routes
app.use('/api', routes);

app.get("/bodegas", async (_req, res) => {
  const bodegas = await prisma.finca.findMany();
  res.json(bodegas);
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[global error handler]", err);
  res.status(500).json({ error: "Error interno" });
});

export default app;
