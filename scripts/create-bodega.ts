import "dotenv/config";
import { prisma } from "../src/config/prismaClient.ts";

const nombre = "Bodega Demo";
const razonSocial = "Bodega Demo SA";
const cuit = "30-00000000-0";

// Opcional: si lo dejás vacío, crea la bodega sin productor.
const productorRazonSocial = "Productor Demo";
const productorCuit = "20-00000000-0";

async function main() {
  let productorId: string | null = null;

  if (productorRazonSocial.trim() !== "") {
    const productorExistente = await prisma.productor.findFirst({
      where: {
        razon_social: productorRazonSocial,
        ...(productorCuit ? { cuit: productorCuit } : {}),
      },
      select: { productor_id: true },
    });

    if (productorExistente) {
      productorId = productorExistente.productor_id;
      console.log("Productor existente:", productorId);
    } else {
      const productor = await prisma.productor.create({
        data: {
          razon_social: productorRazonSocial,
          ...(productorCuit ? { cuit: productorCuit } : {}),
        },
      });
      productorId = productor.productor_id;
      console.log("Productor creado:", productorId);
    }
  }

  const bodegaExistente = await prisma.bodega.findFirst({
    where: {
      nombre,
      ...(cuit ? { cuit } : {}),
    },
    select: { bodega_id: true },
  });

  if (bodegaExistente) {
    console.log("La bodega ya existe:", bodegaExistente.bodega_id);
    return;
  }

  const bodega = await prisma.bodega.create({
    data: {
      nombre,
      ...(razonSocial ? { razon_social: razonSocial } : {}),
      ...(cuit ? { cuit } : {}),
      ...(productorId ? { productor_id: productorId } : {}),
    },
  });

  console.log("Bodega creada:", bodega.bodega_id);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    // await prisma.$disconnect();
  });

