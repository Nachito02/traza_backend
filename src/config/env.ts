import "dotenv/config";
import { z } from "zod";

// Trata "" como "no seteado" para variables numéricas con default.
const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);

const schema = z.object({
  // Requeridas: si faltan, el proceso no arranca (fail-fast).
  DATABASE_URL: z.string().min(1, "obligatorio (cadena de conexión Postgres)"),
  JWT_SECRET: z.string().min(1, "obligatorio (clave de firma de tokens)"),

  // Con default seguro.
  PORT: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().default(3000)),
  NODE_ENV: z.string().default("development"),
  CORS_ORIGIN: z.string().default(""),
  IPFS_GATEWAY_URL: z.string().default("https://ipfs.io"),
  REFRESH_TOKEN_TTL_DAYS: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().default(30)),

  // Opcionales.
  IPFS_API_URL: z.string().optional(),
  COOKIE_SAME_SITE: z.string().optional(),
  COOKIE_SECURE: z.string().optional(),
  DEV_API_KEY: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("\n❌ Configuración de entorno inválida:\n");
  for (const issue of parsed.error.issues) {
    console.error(`  • ${issue.path.join(".") || "(env)"}: ${issue.message}`);
  }
  console.error("\nRevisá tu archivo .env y volvé a iniciar.\n");
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
