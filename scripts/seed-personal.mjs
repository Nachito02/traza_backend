// Carga DATABASE_URL desde .env y corre seed-personal.sql con psql para UNA bodega.
// Uso: npm run seed:personal -- <bodega_id>
// (mismo wrapper que seed-insumos/seed-labores: psql directo no lee .env)
//
// Siembra personal FICTICIO (legajos DEMO-*) para poblar un demo y probar el
// cálculo de costos. Exige el ID de bodega a propósito: así no se puede regar
// gente inventada en todas las bodegas por accidente.
import "dotenv/config";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { runSqlFile } from "./_psql.mjs";

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
  console.error("✗ Falta DATABASE_URL en el entorno (.env).");
  process.exit(1);
}

// El ID de bodega puede venir por argumento o por env BODEGA_ID.
const bodegaId = (process.argv[2] || process.env.BODEGA_ID || "").trim();
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
if (!UUID_RE.test(bodegaId)) {
  console.error("✗ Falta el ID de bodega (UUID). Uso: npm run seed:personal -- <bodega_id>");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, "..", "seed-personal.sql");

// Sin comillas: el SQL usa :'bodega_id', que psql cita de forma segura.
const status = runSqlFile(rawUrl, sqlPath, ["-v", `bodega_id=${bodegaId}`]);
if (status === 0) {
  console.log(`✓ Personal demo sembrado para la bodega ${bodegaId}`);
  console.log("  Para revertirlo:");
  console.log(`  DELETE FROM "personal_bodega" WHERE "bodega_id" = '${bodegaId}' AND "legajo" LIKE 'DEMO-%';`);
}
process.exit(status);
