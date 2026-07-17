// Siembra el catálogo maestro GLOBAL de recursos (recurso_maestro) desde el
// documento de carga inicial. No requiere bodega. Idempotente.
//   npm run seed:recursos-maestro
import "dotenv/config";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { runSqlFile } from "./_psql.mjs";

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
  console.error("✗ Falta DATABASE_URL en el entorno (.env).");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, "..", "seed-recursos-maestro.sql");

const status = runSqlFile(rawUrl, sqlPath);
if (status === 0) {
  console.log("✓ Catálogo maestro de recursos sembrado.");
}
process.exit(status);
