import { prisma } from "../../config/prismaClient.js";

export async function listProtocolos() {
  return prisma.protocolo.findMany({ where: { activo: true } });
}

export async function listProtocolosExpanded() {
  return prisma.protocolo.findMany({
    where: { activo: true },
    include: {
      protocolo_etapa: {
        orderBy: { orden: "asc" },
        include: {
          protocolo_proceso: {
            orderBy: { orden: "asc" },
          },
        },
      },
    },
    orderBy: { nombre: "asc" },
  });
}
