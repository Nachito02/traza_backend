import { prisma } from "../../config/prismaClient.js";

type CreateCampaniaInput = {
  bodegaId: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado?: string;
  userId: string;
};

export class CampaniaError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function ensureUserBodega(userId: string, bodegaId: string) {
  const rel = await prisma.userBodega.findFirst({
    where: { user_id: userId, bodega_id: bodegaId },
  });
  if (!rel) {
    throw new CampaniaError("No autorizado para esta bodega", 403);
  }
}

export async function listCampanias(userId: string, bodegaId?: string) {
  if (bodegaId) {
    await ensureUserBodega(userId, bodegaId);
    return prisma.campania.findMany({
      where: { bodega_id: bodegaId },
      orderBy: [{ fecha_inicio: "desc" }, { nombre: "asc" }],
    });
  }

  const bodegas = await prisma.userBodega.findMany({
    where: { user_id: userId },
    select: { bodega_id: true },
  });
  const ids = bodegas.map((b) => b.bodega_id);
  if (ids.length === 0) return [];

  return prisma.campania.findMany({
    where: { bodega_id: { in: ids } },
    orderBy: [{ fecha_inicio: "desc" }, { nombre: "asc" }],
  });
}

function parseCampaniaDate(input: string, fieldLabel: string): Date {
  const raw = input.trim();
  let parsed: Date;

  // Accept frontend-friendly DD/MM/YYYY and normalize to UTC date.
  const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = raw.match(ddmmyyyy);
  if (match) {
    const [, dd, mm, yyyy] = match;
    parsed = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
  } else {
    parsed = new Date(raw);
  }

  if (Number.isNaN(parsed.getTime())) {
    throw new CampaniaError(
      `${fieldLabel} inválida. Usá formato YYYY-MM-DD o DD/MM/YYYY`,
      400,
    );
  }

  return parsed;
}

export async function createCampania({
  bodegaId,
  nombre,
  fecha_inicio,
  fecha_fin,
  estado,
  userId,
}: CreateCampaniaInput) {
  if (!bodegaId || !nombre || !fecha_inicio || !fecha_fin) {
    throw new CampaniaError("Datos incompletos", 400);
  }
  await ensureUserBodega(userId, bodegaId);

  const existing = await prisma.campania.findFirst({
    where: { bodega_id: bodegaId, nombre },
    select: { campania_id: true },
  });
  if (existing) {
    throw new CampaniaError("Ya existe una campaña con ese nombre en la bodega", 409);
  }

  const data: {
    bodega_id: string;
    nombre: string;
    fecha_inicio: Date;
    fecha_fin: Date;
    estado?: string;
  } = {
    bodega_id: bodegaId,
    nombre,
    fecha_inicio: parseCampaniaDate(fecha_inicio, "Fecha inicio"),
    fecha_fin: parseCampaniaDate(fecha_fin, "Fecha fin"),
  };

  if (estado !== undefined) data.estado = estado;

  return prisma.campania.create({ data });
}
