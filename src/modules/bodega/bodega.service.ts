import { prisma } from "../../config/prismaClient.js";

type CreateBodegaInput = {
  nombre: string;
  razon_social?: string;
  cuit?: string;
  productorId?: string;
};

export class BodegaError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function createBodega({
  nombre,
  razon_social,
  cuit,
  productorId,
}: CreateBodegaInput) {
  if (!nombre) {
    throw new BodegaError("Nombre es requerido", 400);
  }

  const data: {
    nombre: string;
    razon_social?: string | null;
    cuit?: string | null;
    productor_id?: string | null;
  } = { nombre };

  if (razon_social !== undefined) data.razon_social = razon_social;
  if (cuit !== undefined) data.cuit = cuit;
  if (productorId !== undefined) data.productor_id = productorId;

  const bodega = await prisma.bodega.create({ data });

  return bodega;
}
