import { prisma } from "../../config/prismaClient.js";

export async function listCampanias() {
  return prisma.campania.findMany();
}
