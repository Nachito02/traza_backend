// Carga DATABASE_URL desde .env y corre seed-labores.sql con psql.
// (psql directo no lee .env; por eso este wrapper, igual que seed-protocol.)
import "dotenv/config";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
  console.error("✗ Falta DATABASE_URL en el entorno (.env).");
  process.exit(1);
}

// Prisma admite query params (?schema=, ?connection_limit=, ?pgbouncer=, etc.)
// que libpq/psql no entiende. Los sacamos y convertimos `schema` en search_path.
function toPsqlUrl(input) {
  try {
    const url = new URL(input);
    const schema = url.searchParams.get("schema");
    const sslmode = url.searchParams.get("sslmode");
    // libpq no entiende los params de Prisma (schema, connection_limit, pgbouncer…).
    // Reconstruimos la query sólo con lo que psql sí soporta.
    url.search = "";
    if (sslmode) url.searchParams.set("sslmode", sslmode);
    // public es el search_path por defecto; sólo lo forzamos si es otro schema.
    // Se codifica manualmente (%20/%3D) porque searchParams usa "+" para el espacio
    // y libpq no lo interpreta como tal.
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
const sqlPath = join(__dirname, "..", "seed-labores.sql");

const result = spawnSync(
  "psql",
  [databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", sqlPath],
  { stdio: "inherit" },
);

if (result.error) {
  console.error("✗ No se pudo ejecutar psql:", result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 0);
