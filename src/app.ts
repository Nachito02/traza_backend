

import express from 'express';

const app = express();


app.use(express.json());


//Routes
// app.use('/api', itemRoutes);


export default app;