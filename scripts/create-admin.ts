import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/config/prismaClient.ts";

const email = "arguellojuan08@gmail.com";
const nombre = "Juan Arguello";
const bodegaId = "837bc9e4-8abe-4999-aaa2-15963e42f078";
const password = "123456";

async function main() {


  const existing = await prisma.appUser.findUnique({ where: { email } });
  if (existing) {
    console.log("El usuario ya existe:", existing.user_id);
    return;
  }

  const bodega = await prisma.bodega.findUnique({
    where: { bodega_id: bodegaId },
  });
  if (!bodega) {
    throw new Error("Bodega no encontrada");
  }

  const password_hash = await bcrypt.hash(password, 10);
  const user = await prisma.appUser.create({
    data: {
      email,
      nombre,
      password_hash,
    },
  });

  await prisma.userBodega.create({
    data: {
      user_id: user.user_id,
      bodega_id: bodegaId,
    },
  });

  console.log("Usuario creado:", user.user_id);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    // await prisma.$disconnect();
  });
