// Inicializa TODA la base en un solo comando:
//   1) Schema (sólo si falta): prisma migrate deploy
//   2) Bootstrap completo: usuarios + roles, bodega demo, campaña, protocolo
//      y catálogos/seed base de la bodega demo
// Todo es idempotente: se puede correr varias veces sin duplicar.
//   npm run init:all
import "dotenv/config";
import { execSync } from "node:child_process";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

function run(label, cmd) {
  console.log(`\n\x1b[36m▶ ${label}\x1b[0m`);
  execSync(cmd, { stdio: "inherit" });
}

async function schemaExists() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT to_regclass('public.app_user') IS NOT NULL AS ok`,
    );
    return rows?.[0]?.ok === true;
  } catch {
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no está definido (.env).");
  }

  if (await schemaExists()) {
    console.log("• Schema ya existe — se omite la creación.");
  } else {
    run("Creando el schema (prisma migrate deploy)", "npx prisma migrate deploy");
  }

  run("Bootstrap completo: usuarios, roles, bodega demo, campaña, protocolo y seeds base", "npm run init:bd");

  console.log("\n\x1b[32m✅ Base de datos inicializada por completo.\x1b[0m");
  console.log("   Usuarios: pass 123456 (ver detalle arriba, salida de init:bd).");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
