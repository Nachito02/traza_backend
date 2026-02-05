import "dotenv/config";
import bcrypt from "bcryptjs";

const email = "arguellojuan08@gmail.com";
const nombre = "Juan Arguello";
const bodegaId = "e5cafa84-bca6-417d-96b6-9f01995d2177";
const password = "123456";

async function main() {

    const {prisma} = await import ("../src/config/prismaClient.js");

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
      bodega: { connect: { bodega_id: bodegaId } },
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
