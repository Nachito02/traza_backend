import { prisma } from "../../config/prismaClient.js";

type CreateProductorInput = {
  razon_social: string;
  cuit?: string;
  activo?: boolean;
};

type UpdateProductorInput = {
  productorId: string;
  razon_social?: string;
  cuit?: string;
  activo?: boolean;
};

type ListProductoresInput = {
  activo?: boolean;
  search?: string;
};

export class ProductorError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function createProductor({
  razon_social,
  cuit,
  activo,
}: CreateProductorInput) {
  if (!razon_social || !razon_social.trim()) {
    throw new ProductorError("razon_social es requerida", 400);
  }

  return prisma.productor.create({
    data: {
      razon_social: razon_social.trim(),
      ...(cuit !== undefined ? { cuit } : {}),
      ...(activo !== undefined ? { activo } : {}),
    },
  });
}

export async function listProductores({ activo, search }: ListProductoresInput) {
  const where: {
    activo?: boolean;
    OR?: Array<{
      razon_social?: { contains: string; mode: "insensitive" };
      cuit?: { contains: string; mode: "insensitive" };
    }>;
  } = {};

  if (activo !== undefined) {
    where.activo = activo;
  }

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { razon_social: { contains: q, mode: "insensitive" } },
      { cuit: { contains: q, mode: "insensitive" } },
    ];
  }

  return prisma.productor.findMany({
    where,
    orderBy: { created_at: "desc" },
  });
}

export async function getProductorById(productorId: string) {
  const productor = await prisma.productor.findUnique({
    where: { productor_id: productorId },
  });

  if (!productor) {
    throw new ProductorError("Productor no encontrado", 404);
  }

  return productor;
}

export async function updateProductor({
  productorId,
  razon_social,
  cuit,
  activo,
}: UpdateProductorInput) {
  await getProductorById(productorId);

  if (razon_social !== undefined && !razon_social.trim()) {
    throw new ProductorError("razon_social no puede ser vacío", 400);
  }

  return prisma.productor.update({
    where: { productor_id: productorId },
    data: {
      ...(razon_social !== undefined ? { razon_social: razon_social.trim() } : {}),
      ...(cuit !== undefined ? { cuit } : {}),
      ...(activo !== undefined ? { activo } : {}),
      updated_at: new Date(),
    },
  });
}

export async function deleteProductor(productorId: string) {
  await getProductorById(productorId);

  return prisma.productor.update({
    where: { productor_id: productorId },
    data: {
      activo: false,
      updated_at: new Date(),
    },
  });
}
