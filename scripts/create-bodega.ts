import "dotenv/config";
import { prisma } from "../src/config/prismaClient.ts";

const nombre = "Bodega Demo";
const razonSocial = "Bodega Demo SA";
const cuit = "30-00000000-0";

const productoresSeed = [
  { razon_social: "Productor Demo", cuit: "20-00000000-0" },
  { razon_social: "Productor Secundario", cuit: "20-00000000-1" },
];

async function main() {
  const productorIds: string[] = [];

  for (const item of productoresSeed) {
    if (!item.razon_social.trim()) continue;
    const productorExistente = await prisma.productor.findFirst({
      where: {
        razon_social: item.razon_social,
        ...(item.cuit ? { cuit: item.cuit } : {}),
      },
      select: { productor_id: true },
    });

    if (productorExistente) {
      productorIds.push(productorExistente.productor_id);
      console.log("Productor existente:", productorExistente.productor_id);
    } else {
      const productor = await prisma.productor.create({
        data: {
          razon_social: item.razon_social,
          ...(item.cuit ? { cuit: item.cuit } : {}),
        },
      });
      productorIds.push(productor.productor_id);
      console.log("Productor creado:", productor.productor_id);
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

  const bodega = await prisma.$transaction(async (tx) => {
    const created = await tx.bodega.create({
      data: {
        nombre,
        ...(razonSocial ? { razon_social: razonSocial } : {}),
        ...(cuit ? { cuit } : {}),
        ...(productorIds.length > 0 ? { productor_id: productorIds[0] } : {}),
      },
    });
    if (productorIds.length > 0) {
      await tx.productorBodega.createMany({
        data: productorIds.map((id) => ({
          productor_id: id,
          bodega_id: created.bodega_id,
        })),
        skipDuplicates: true,
      });
    }
    return created;
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
