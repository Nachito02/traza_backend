// Helper compartido por los seeds que corren archivos .sql con psql.
// Resuelve el binario de psql aunque no esté en el PATH (caso típico en Windows,
// donde el instalador de PostgreSQL no agrega bin/ al PATH) y normaliza la
// DATABASE_URL de Prisma a una que libpq/psql entienda.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Prisma admite query params (?schema=, ?connection_limit=, ?pgbouncer=, etc.)
// que libpq/psql no entiende. Los sacamos y convertimos `schema` en search_path.
export function toPsqlUrl(input) {
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

// Instalaciones típicas de PostgreSQL en Windows: Program Files\PostgreSQL\<ver>\bin.
// Devuelve las rutas a psql.exe encontradas, de mayor a menor versión.
function windowsInstallCandidates() {
  const bases = [
    process.env.ProgramFiles && join(process.env.ProgramFiles, "PostgreSQL"),
    process.env["ProgramFiles(x86)"] && join(process.env["ProgramFiles(x86)"], "PostgreSQL"),
    "C:/Program Files/PostgreSQL",
  ].filter(Boolean);

  const found = [];
  for (const base of bases) {
    try {
      for (const entry of readdirSync(base)) {
        const candidate = join(base, entry, "bin", "psql.exe");
        if (existsSync(candidate)) {
          found.push({ version: Number.parseInt(entry, 10) || 0, path: candidate });
        }
      }
    } catch {
      // base inexistente, seguimos con la próxima.
    }
  }
  return found.sort((a, b) => b.version - a.version).map((x) => x.path);
}

// Resuelve el ejecutable de psql. Orden: variable PSQL → PATH → instalación local.
// Devuelve la ruta (o "psql") o null si no se encuentra.
export function resolvePsql() {
  if (process.env.PSQL && existsSync(process.env.PSQL)) return process.env.PSQL;

  const onPath = spawnSync("psql", ["--version"], { stdio: "ignore" });
  if (!onPath.error) return "psql";

  const [installed] = windowsInstallCandidates();
  return installed ?? null;
}

// Corre un .sql con psql, resolviendo el binario y normalizando la URL.
// `extraArgs` permite pasar variables (-v nombre=valor) u otras flags.
export function runSqlFile(rawUrl, sqlPath, extraArgs = []) {
  const psql = resolvePsql();
  if (!psql) {
    console.error(
      "✗ No se encontró psql. Instalá el cliente de PostgreSQL, agregá su carpeta bin al PATH,\n" +
        "  o definí la variable de entorno PSQL con la ruta completa a psql.exe.\n" +
        "  Ej (Windows): setx PSQL \"C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe\"",
    );
    process.exit(1);
  }

  const result = spawnSync(
    psql,
    [toPsqlUrl(rawUrl), "-v", "ON_ERROR_STOP=1", ...extraArgs, "-f", sqlPath],
    // Los .sql están en UTF-8. Forzamos el client encoding para que psql no use
    // el codepage de la consola (WIN1252 en PowerShell), que rompe los acentos.
    { stdio: "inherit", env: { ...process.env, PGCLIENTENCODING: "UTF8" } },
  );

  if (result.error) {
    console.error("✗ No se pudo ejecutar psql:", result.error.message);
    process.exit(1);
  }
  return result.status ?? 0;
}
