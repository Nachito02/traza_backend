import { prisma } from "../../config/prismaClient.js";

type CreateCampaniaInput = {
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado?: string;
};

export class CampaniaError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function listCampanias() {
  return prisma.campania.findMany();
}

export async function createCampania({
  nombre,
  fecha_inicio,
  fecha_fin,
  estado,
}: CreateCampaniaInput) {
  if (!nombre || !fecha_inicio || !fecha_fin) {
    throw new CampaniaError("Datos incompletos", 400);
  }

  const data: {
    nombre: string;
    fecha_inicio: Date;
    fecha_fin: Date;
    estado?: string | null;
  } = {
    nombre,
    fecha_inicio: new Date(fecha_inicio),
    fecha_fin: new Date(fecha_fin),
  };

  if (estado !== undefined) data.estado = estado;

  return prisma.campania.create({ data });
}
