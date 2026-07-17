// Inicializa TODA la base en un solo comando, en el orden correcto:
//   1) Schema (sólo si falta): prisma migrate deploy
//   2) Bootstrap: usuarios + roles, bodega demo, campaña, protocolo
//   3) Catálogos maestros globales: insumos y recursos
//   4) Seeds de la bodega demo: tarifas de maquinaria/combustible, labores +
//      herramientas, e insumos de finca
// Todo es idempotente: se puede correr varias veces sin duplicar.
//   npm run init:all
import "dotenv/config";
import { execSync } from "node:child_process";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

// Bodega demo creada por init:bd (mismo ID fijo). Se puede sobreescribir con BODEGA_ID.
const BODEGA_ID = process.env.BODEGA_ID || "837bc9e4-8abe-4999-aaa2-15963e42f078";

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

  run("Bootstrap: usuarios, roles, bodega demo, campaña y protocolo", "npm run init:bd");
  run("Catálogo maestro de insumos (global)", "npm run seed:insumos-maestro");
  run("Catálogo maestro de recursos (global)", "npm run seed:recursos-maestro");
  run("Tarifas de la bodega demo: maquinaria y combustible", "npm run seed:costos");
  run("Labores manuales + catálogo de herramientas", "npm run seed:labores");
  run("Insumos de finca de la bodega demo", `npm run seed:insumos -- ${BODEGA_ID}`);

  console.log("\n\x1b[32m✅ Base de datos inicializada por completo.\x1b[0m");
  console.log(`   Bodega demo: ${BODEGA_ID}`);
  console.log("   Usuarios: pass 123456 (ver detalle arriba, salida de init:bd).");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
