import "dotenv/config";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { seedProtocol } from "./seed-protocol-from-doc.mjs";
import { runSqlFile } from "./_psql.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const PASSWORD = "123456";

const IDS = {
  bodega: "837bc9e4-8abe-4999-aaa2-15963e42f078",
  campania: "10000000-0000-4000-8000-000000000001",
};

const GLOBAL_ROLES = [
  "admin_sistema",
  "bot_agent",
  "super_agent",
];

const ALL_BODEGA_ROLES = [
  "admin_bodega",
  "encargado_bodega",
  "productor",
  "responsable_calidad_inocuidad",
  "responsable_ssyo",
  "enologo",
  "encargado_finca",
  "operador_campo",
];

const USERS = [
  {
    nombre: "Juan Arguello",
    email: "arguellojuan08@gmail.com",
    globalRoles: ["admin_sistema"],
    bodegaRoles: ALL_BODEGA_ROLES,
  },
  {
    nombre: "Admin Bodega Demo",
    email: "admin.bodega@traza.local",
    globalRoles: [],
    bodegaRoles: ["admin_bodega"],
  },
  {
    nombre: "Encargada Bodega Demo",
    email: "encargado.bodega@traza.local",
    globalRoles: [],
    bodegaRoles: ["encargado_bodega"],
  },
  {
    nombre: "Productor Demo",
    email: "productor@traza.local",
    globalRoles: [],
    bodegaRoles: ["productor"],
  },
  {
    nombre: "Enologo Demo",
    email: "enologo@traza.local",
    globalRoles: [],
    bodegaRoles: ["enologo"],
  },
  {
    nombre: "Calidad Demo",
    email: "calidad@traza.local",
    globalRoles: [],
    bodegaRoles: ["responsable_calidad_inocuidad"],
  },
  {
    nombre: "SSyO Demo",
    email: "ssyo@traza.local",
    globalRoles: [],
    bodegaRoles: ["responsable_ssyo"],
  },
  {
    nombre: "Encargado Finca Demo",
    email: "encargado.finca@traza.local",
    globalRoles: [],
    bodegaRoles: ["encargado_finca"],
  },
  {
    nombre: "Operario Campo Demo",
    email: "operario.campo@traza.local",
    globalRoles: [],
    bodegaRoles: ["operador_campo"],
  },
];

async function ensureAuxiliaryTables() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "user_finca_rol" (
      "user_id" UUID NOT NULL,
      "finca_id" UUID NOT NULL,
      "rol" TEXT NOT NULL,
      CONSTRAINT "user_finca_rol_pkey" PRIMARY KEY ("user_id", "finca_id", "rol"),
      CONSTRAINT "user_finca_rol_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "app_user"("user_id")
        ON DELETE CASCADE ON UPDATE NO ACTION,
      CONSTRAINT "user_finca_rol_finca_id_fkey"
        FOREIGN KEY ("finca_id") REFERENCES "finca"("finca_id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "idx_user_finca_rol_finca_rol"
    ON "user_finca_rol"("finca_id", "rol");
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "user_bodega_rol"
    DROP CONSTRAINT IF EXISTS "ck_user_bodega_rol_rol";
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "user_bodega_rol"
    ADD CONSTRAINT "ck_user_bodega_rol_rol"
    CHECK ("rol" IN (
      'admin_bodega',
      'encargado_bodega',
      'productor',
      'responsable_calidad_inocuidad',
      'responsable_ssyo',
      'enologo',
      'encargado_finca',
      'operador_campo'
    ));
  `);
}

async function ensureGlobalRoles() {
  for (const roleName of GLOBAL_ROLES) {
    await prisma.rol.upsert({
      where: { nombre: roleName },
      update: {},
      create: { nombre: roleName },
    });
  }
}

async function ensureBaseOperationData() {
  await prisma.bodega.upsert({
    where: { bodega_id: IDS.bodega },
    update: {
      nombre: "Bodega Carbonero",
      razon_social: "Bodega Carbonero Demo",
      cuit: "30-00000000-0",
      activo: true,
      updated_at: new Date(),
    },
    create: {
      bodega_id: IDS.bodega,
      nombre: "Bodega Carbonero",
      razon_social: "Bodega Carbonero Demo",
      cuit: "30-00000000-0",
      activo: true,
    },
  });

  await prisma.campania.upsert({
    where: { campania_id: IDS.campania },
    update: {
      nombre: "Campaña 2026",
      fecha_inicio: new Date("2026-01-01T00:00:00.000Z"),
      fecha_fin: new Date("2026-12-31T00:00:00.000Z"),
      estado: "abierta",
      updated_at: new Date(),
    },
    create: {
      campania_id: IDS.campania,
      bodega_id: IDS.bodega,
      nombre: "Campaña 2026",
      fecha_inicio: new Date("2026-01-01T00:00:00.000Z"),
      fecha_fin: new Date("2026-12-31T00:00:00.000Z"),
      estado: "abierta",
    },
  });

}

async function ensureUserBodegaRoles(userId, roles) {
  await prisma.userBodega.upsert({
    where: {
      user_id_bodega_id: {
        user_id: userId,
        bodega_id: IDS.bodega,
      },
    },
    update: {},
    create: {
      user_id: userId,
      bodega_id: IDS.bodega,
    },
  });

  await prisma.userBodegaRol.deleteMany({
    where: {
      user_id: userId,
      bodega_id: IDS.bodega,
    },
  });

  for (const rol of roles) {
    await prisma.userBodegaRol.create({
      data: {
        user_id: userId,
        bodega_id: IDS.bodega,
        rol,
      },
    });
  }
}

async function ensureUserGlobalRoles(userId, roles) {
  await prisma.userRol.deleteMany({ where: { user_id: userId } });

  for (const roleName of roles) {
    const role = await prisma.rol.findUnique({ where: { nombre: roleName } });
    if (!role) continue;
    await prisma.userRol.create({
      data: {
        user_id: userId,
        rol_id: role.rol_id,
      },
    });
  }
}

async function ensureUsers() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const createdUsers = [];

  for (const input of USERS) {
    const user = await prisma.appUser.upsert({
      where: { email: input.email },
      update: {
        nombre: input.nombre,
        password_hash: passwordHash,
        must_change_password: false,
        is_active: true,
      },
      create: {
        nombre: input.nombre,
        email: input.email,
        password_hash: passwordHash,
        must_change_password: false,
        is_active: true,
      },
      select: {
        user_id: true,
        nombre: true,
        email: true,
      },
    });

    await ensureUserBodegaRoles(user.user_id, input.bodegaRoles);
    await ensureUserGlobalRoles(user.user_id, input.globalRoles);
    createdUsers.push(user);
  }

  return createdUsers;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no esta definido");
  }

  await ensureAuxiliaryTables();
  await ensureGlobalRoles();
  await ensureBaseOperationData();
  const users = await ensureUsers();
  await seedProtocol(prisma);

  // Catálogos base (SQL, idempotentes): maestros globales + tarifas/insumos de la bodega demo.
  const rawUrl = process.env.DATABASE_URL;
  const sql = (file) => join(__dirname, "..", file);
  console.log("");
  console.log("Sembrando catálogos base…");
  runSqlFile(rawUrl, sql("seed-recursos-maestro.sql"));           // maestro de maquinaria (tractores/autopropulsadas/…)
  runSqlFile(rawUrl, sql("seed-insumos-maestro.sql"));            // maestro de insumos
  runSqlFile(rawUrl, sql("seed-labores.sql"));                    // matriz de sugerencias + herramientas por bodega
  runSqlFile(rawUrl, sql("seed-costos.sql"));                     // tarifas de maquinaria/combustible por bodega
  runSqlFile(rawUrl, sql("seed-insumos.sql"), ["-v", `bodega_id=${IDS.bodega}`]); // insumos base de la bodega demo

  console.log("");
  console.log("InitBD OK");
  console.log(`Bodega: Bodega Carbonero (${IDS.bodega})`);
  console.log(`Campania: Campaña 2026 (${IDS.campania})`);
  console.log(`Password para todos los usuarios: ${PASSWORD}`);
  console.table(users.map((user) => ({
    nombre: user.nombre,
    email: user.email,
    user_id: user.user_id,
  })));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
