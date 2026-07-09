// Carga DATABASE_URL desde .env y corre seed-insumos.sql con psql para UNA bodega.
// Uso: npm run seed:insumos -- <bodega_id>
// (mismo wrapper que seed-labores/seed-protocol: psql directo no lee .env)
import "dotenv/config";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

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

// Prisma admite query params (?schema=, ?connection_limit=, ?pgbouncer=, etc.)
// que libpq/psql no entiende. Los sacamos y convertimos `schema` en search_path.
function toPsqlUrl(input) {
  try {
    const url = new URL(input);
    const schema = url.searchParams.get("schema");
    const sslmode = url.searchParams.get("sslmode");
    url.search = "";
    if (sslmode) url.searchParams.set("sslmode", sslmode);
    if (schema && schema !== "public") {
      const extra = `options=-c%20search_path%3D${encodeURIComponent(schema)}`;
      url.search = url.search ? `${url.search}&${extra}` : `?${extra}`;
    }
    return url.toString();
  } catch {
    return input;
  }
}

const databaseUrl = toPsqlUrl(rawUrl);

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, "..", "seed-insumos.sql");

const result = spawnSync(
  "psql",
  // Sin comillas: el SQL usa :'bodega_id', que psql cita de forma segura.
  [databaseUrl, "-v", "ON_ERROR_STOP=1", "-v", `bodega_id=${bodegaId}`, "-f", sqlPath],
  { stdio: "inherit" },
);

if (result.error) {
  console.error("✗ No se pudo ejecutar psql:", result.error.message);
  process.exit(1);
}
if (result.status === 0) {
  console.log(`✓ Insumos sembrados para la bodega ${bodegaId}`);
}
process.exit(result.status ?? 0);
