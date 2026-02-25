

import express from 'express';
import cors from "cors";
import cookieParser from 'cookie-parser';
import { prisma } from './config/prismaClient.js';
import { routes } from './routes/index.js';

const app = express();


app.use(express.json());
app.use(cookieParser());

app.use(cors({ origin: true, credentials: true }))
app.use('/uploads', express.static('uploads'));

//Routes
app.use('/api', routes);

app.get("/bodegas", async (_req, res) => {
  const bodegas = await prisma.finca.findMany();
  res.json(bodegas);
});

export default app;
