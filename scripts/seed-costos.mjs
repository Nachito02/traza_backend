// Carga DATABASE_URL desde .env y corre seed-costos.sql con psql.
// (psql directo no lee .env; por eso este wrapper, igual que seed-protocol.)
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
const sqlPath = join(__dirname, "..", "seed-costos.sql");

process.exit(runSqlFile(rawUrl, sqlPath));
