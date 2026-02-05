

import express from 'express';
import { prisma } from './config/prismaClient.js';
import { routes } from './routes/index.js';

const app = express();


app.use(express.json());


//Routes
app.use('/api', routes);

app.get("/bodegas", async (_req, res) => {
  const bodegas = await prisma.finca.findMany();
  res.json(bodegas);
});

export default app;
