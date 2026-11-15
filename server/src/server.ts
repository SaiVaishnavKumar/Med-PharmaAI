import { app } from './app.js';
import { prisma } from './db.js';
const port=Number(process.env.PORT)||4000;
const server=app.listen(port,()=>console.info(`MediFlow API listening on http://localhost:${port}`));
for (const signal of ['SIGINT','SIGTERM'] as const) process.on(signal,()=>{server.close(()=>void prisma.$disconnect().finally(()=>process.exit(0)));});
