// Carga DATABASE_URL desde .env y corre seed-insumos.sql con psql para UNA bodega.
// Uso: npm run seed:insumos -- <bodega_id>
// (mismo wrapper que seed-labores/seed-protocol: psql directo no lee .env)
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
  console.error("✗ Falta el ID de bodega (UUID). Uso: npm run seed:insumos -- <bodega_id>");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, "..", "seed-insumos.sql");

// Sin comillas: el SQL usa :'bodega_id', que psql cita de forma segura.
const status = runSqlFile(rawUrl, sqlPath, ["-v", `bodega_id=${bodegaId}`]);
if (status === 0) {
  console.log(`✓ Insumos sembrados para la bodega ${bodegaId}`);
}
process.exit(status);
