import { prisma } from "../../config/prismaClient.js";

type BaseInput = {
  milestoneId: string;
  userId: string;
};

type RiegoInput = BaseInput & {
  tipo: "riego";
  fecha: string;
  cuartelId: string;
  campaniaId: string;
  volumen: number;
  unidad: string;
  sistema_riego?: string;
  responsable_persona_id?: string;
};

type CosechaInput = BaseInput & {
  tipo: "cosecha";
  fecha_cosecha: string;
  cuartelId: string;
  campaniaId: string;
  cantidad: number;
  unidad: string;
  destino?: string;
  responsable_persona_id?: string;
};

type CreateEventoInput = RiegoInput | CosechaInput;

export class EventoError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function ensureUserMilestone(userId: string, milestoneId: string) {
  const milestone = await prisma.milestone.findUnique({
    where: { milestone_id: milestoneId },
    select: { trazabilidad_id: true },
  });
  if (!milestone) {
    throw new EventoError("Milestone no encontrado", 404);
  }
  const trazabilidad = await prisma.trazabilidad.findUnique({
    where: { trazabilidad_id: milestone.trazabilidad_id },
    select: { bodega_id: true },
  });
  if (!trazabilidad) {
    throw new EventoError("Trazabilidad no encontrada", 404);
  }
  const rel = await prisma.userBodega.findFirst({
    where: { user_id: userId, bodega_id: trazabilidad.bodega_id },
  });
  if (!rel) {
    throw new EventoError("No autorizado", 403);
  }
}

export async function createEvento(input: CreateEventoInput) {
  await ensureUserMilestone(input.userId, input.milestoneId);

  if (input.tipo === "riego") {
    const evento = await prisma.eventoRiego.create({
      data: {
        fecha: new Date(input.fecha),
        cuartel_id: input.cuartelId,
        campania_id: input.campaniaId,
        volumen: input.volumen,
        unidad: input.unidad,
        sistema_riego: input.sistema_riego ?? null,
        responsable_persona_id: input.responsable_persona_id ?? null,
      },
    });

    await prisma.milestoneEvento.create({
      data: {
        milestone_id: input.milestoneId,
        evento_tabla: "evento_riego",
        evento_id: evento.evento_riego_id,
      },
    });

    return { tipo: "riego", evento };
  }

  if (input.tipo === "cosecha") {
    const evento = await prisma.eventoCosecha.create({
      data: {
        fecha_cosecha: new Date(input.fecha_cosecha),
        cuartel_id: input.cuartelId,
        campania_id: input.campaniaId,
        cantidad: input.cantidad,
        unidad: input.unidad,
        destino: input.destino ?? null,
        responsable_persona_id: input.responsable_persona_id ?? null,
      },
    });

    await prisma.milestoneEvento.create({
      data: {
        milestone_id: input.milestoneId,
        evento_tabla: "evento_cosecha",
        evento_id: evento.lote_cosecha_id,
      },
    });

    return { tipo: "cosecha", evento };
  }

  throw new EventoError("Tipo de evento no soportado", 400);
}
