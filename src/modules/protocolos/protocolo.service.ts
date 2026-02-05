import { prisma } from "../../config/prismaClient.js";

export async function listProtocolos() {
  return prisma.protocolo.findMany({ where: { activo: true } });
}
