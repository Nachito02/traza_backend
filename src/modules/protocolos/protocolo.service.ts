import { prisma } from "../../config/prismaClient.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { isSystemAdmin } from "../auth/scope-permissions.service.js";
import { getIaEventoSchema } from "../ia/ia.service.js";
import { schemaFromProcesoTemplate, schemaToCampos, type EventoInputSchema } from "./plantilla-schema.js";

export class ProtocoloError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function ensureAdmin(userId: string) {
  const ok = await isSystemAdmin(userId);
  if (!ok) throw new ProtocoloError("Solo administradores pueden modificar protocolos", 403);
}

export async function listProtocolos() {
  return prisma.protocolo.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } });
}

export async function listProtocolosExpanded() {
  return prisma.protocolo.findMany({
    where: { activo: true },
    include: {
      protocolo_etapa: {
        orderBy: { orden: "asc" },
        include: {
          protocolo_proceso: { orderBy: { orden: "asc" } },
        },
      },
    },
    orderBy: { nombre: "asc" },
  });
}

export async function getProtocolo(protocoloId: string) {
  const protocolo = await prisma.protocolo.findUnique({
    where: { protocolo_id: protocoloId },
    include: {
      protocolo_etapa: {
        orderBy: { orden: "asc" },
        include: { protocolo_proceso: { orderBy: { orden: "asc" } } },
      },
    },
  });
  if (!protocolo) throw new ProtocoloError("Protocolo no encontrado", 404);
  return {
    ...protocolo,
    plantilla: {
      iteraciones: buildIteracionesPlantilla(protocolo.protocolo_etapa),
    },
  };
}

type PlantillaCampo = {
  campo: string;
  type: "string" | "number" | "date" | "boolean";
  enum?: string[];
  unit?: string;
  description?: string;
};

function getEventoSchemaOrNull(eventoTipo: string, plantilla?: unknown): EventoInputSchema | null {
  const fromDb = schemaFromProcesoTemplate(plantilla ?? null);
  if (fromDb) return fromDb;
  try {
    const data = getIaEventoSchema(eventoTipo);
    return data.schema as EventoInputSchema;
  } catch {
    return null;
  }
}

type PlantillaEtapa = {
  etapa_id: string;
  nombre: string;
  orden: number;
  protocolo_proceso: Array<{
    proceso_id: string;
    nombre: string;
    orden: number;
    evento_tipo: string;
    obligatorio: boolean;
    plantilla?: unknown;
  }>;
};

function buildIteracionesPlantilla(etapas: PlantillaEtapa[]) {
  let iteracion = 0;
  return etapas.flatMap((etapa) =>
    etapa.protocolo_proceso.map((proceso) => {
      iteracion += 1;
      const schema = getEventoSchemaOrNull(proceso.evento_tipo, proceso.plantilla);
      const { camposObligatorios, camposOpcionales } = schemaToCampos(schema) as {
        camposObligatorios: PlantillaCampo[];
        camposOpcionales: PlantillaCampo[];
      };

      return {
        iteracion,
        etapa: {
          etapa_id: etapa.etapa_id,
          nombre: etapa.nombre,
          orden: etapa.orden,
        },
        proceso: {
          proceso_id: proceso.proceso_id,
          nombre: proceso.nombre,
          orden: proceso.orden,
          evento_tipo: proceso.evento_tipo,
          obligatorio: proceso.obligatorio,
        },
        plantilla: {
          schema_disponible: Boolean(schema),
          campos_obligatorios: camposObligatorios,
          campos_opcionales: camposOpcionales,
        },
      };
    }),
  );
}

export async function getProtocoloPlantilla(protocoloId: string) {
  const protocolo = await prisma.protocolo.findUnique({
    where: { protocolo_id: protocoloId },
    select: {
      protocolo_id: true,
      nombre: true,
      version: true,
      descripcion: true,
      activo: true,
      protocolo_etapa: {
        orderBy: { orden: "asc" },
        select: {
          etapa_id: true,
          nombre: true,
          orden: true,
          protocolo_proceso: {
            orderBy: { orden: "asc" },
            select: {
              proceso_id: true,
              nombre: true,
              orden: true,
              evento_tipo: true,
              obligatorio: true,
              plantilla: true,
            },
          },
        },
      },
    },
  });

  if (!protocolo) throw new ProtocoloError("Protocolo no encontrado", 404);
  const iteraciones = buildIteracionesPlantilla(protocolo.protocolo_etapa);

  return {
    protocolo: {
      protocolo_id: protocolo.protocolo_id,
      nombre: protocolo.nombre,
      version: protocolo.version,
      descripcion: protocolo.descripcion,
      activo: protocolo.activo,
    },
    iteraciones,
  };
}

export async function createProtocolo(
  { nombre, version = "1.0.0", descripcion }: { nombre: string; version?: string; descripcion?: string },
  userId: string,
) {
  await ensureAdmin(userId);
  if (!nombre?.trim()) throw new ProtocoloError("nombre requerido", 400);

  const existing = await prisma.protocolo.findFirst({ where: { nombre: nombre.trim(), version } });
  if (existing) throw new ProtocoloError(`Ya existe el protocolo "${nombre}" v${version}`, 409);

  return prisma.protocolo.create({ data: { nombre: nombre.trim(), version, descripcion: descripcion ?? null } });
}

export async function updateProtocolo(
  protocoloId: string,
  { nombre, version, descripcion }: { nombre?: string; version?: string; descripcion?: string | null },
  userId: string,
) {
  await ensureAdmin(userId);
  const protocolo = await prisma.protocolo.findUnique({ where: { protocolo_id: protocoloId } });
  if (!protocolo) throw new ProtocoloError("Protocolo no encontrado", 404);

  const data: { nombre?: string; version?: string; descripcion?: string | null } = {};
  if (nombre !== undefined) data.nombre = nombre.trim();
  if (version !== undefined) data.version = version;
  if (descripcion !== undefined) data.descripcion = descripcion;

  if (Object.keys(data).length === 0) throw new ProtocoloError("No hay campos para actualizar", 400);

  return prisma.protocolo.update({ where: { protocolo_id: protocoloId }, data });
}

export async function deleteProtocolo(protocoloId: string, userId: string) {
  await ensureAdmin(userId);
  const protocolo = await prisma.protocolo.findUnique({ where: { protocolo_id: protocoloId } });
  if (!protocolo) throw new ProtocoloError("Protocolo no encontrado", 404);

  await prisma.protocolo.update({ where: { protocolo_id: protocoloId }, data: { activo: false } });
  return { deleted: true };
}

// — Etapas —

export async function createEtapa(
  protocoloId: string,
  { nombre, orden }: { nombre: string; orden: number },
  userId: string,
) {
  await ensureAdmin(userId);
  const protocolo = await prisma.protocolo.findUnique({ where: { protocolo_id: protocoloId } });
  if (!protocolo) throw new ProtocoloError("Protocolo no encontrado", 404);
  if (!nombre?.trim()) throw new ProtocoloError("nombre requerido", 400);

  return prisma.protocoloEtapa.create({ data: { protocolo_id: protocoloId, nombre: nombre.trim(), orden } });
}

export async function updateEtapa(
  etapaId: string,
  { nombre, orden }: { nombre?: string; orden?: number },
  userId: string,
) {
  await ensureAdmin(userId);
  const etapa = await prisma.protocoloEtapa.findUnique({ where: { etapa_id: etapaId } });
  if (!etapa) throw new ProtocoloError("Etapa no encontrada", 404);

  const data: { nombre?: string; orden?: number } = {};
  if (nombre !== undefined) data.nombre = nombre.trim();
  if (orden !== undefined) data.orden = orden;

  if (Object.keys(data).length === 0) throw new ProtocoloError("No hay campos para actualizar", 400);

  return prisma.protocoloEtapa.update({ where: { etapa_id: etapaId }, data });
}

export async function deleteEtapa(etapaId: string, userId: string) {
  await ensureAdmin(userId);
  const etapa = await prisma.protocoloEtapa.findUnique({ where: { etapa_id: etapaId } });
  if (!etapa) throw new ProtocoloError("Etapa no encontrada", 404);

  await prisma.protocoloEtapa.delete({ where: { etapa_id: etapaId } });
  return { deleted: true };
}

// — Procesos —

export async function createProceso(
  etapaId: string,
  {
    nombre,
    evento_tipo,
    obligatorio = false,
    orden,
    plantilla,
  }: { nombre: string; evento_tipo: string; obligatorio?: boolean; orden: number; plantilla?: unknown },
  userId: string,
) {
  await ensureAdmin(userId);
  const etapa = await prisma.protocoloEtapa.findUnique({ where: { etapa_id: etapaId } });
  if (!etapa) throw new ProtocoloError("Etapa no encontrada", 404);
  if (!nombre?.trim()) throw new ProtocoloError("nombre requerido", 400);
  if (!evento_tipo?.trim()) throw new ProtocoloError("evento_tipo requerido", 400);

  const data: Prisma.ProtocoloProcesoUncheckedCreateInput = {
    etapa_id: etapaId,
    nombre: nombre.trim(),
    evento_tipo,
    obligatorio,
    orden,
  };
  if (plantilla !== undefined) data.plantilla = plantilla as Prisma.InputJsonValue;

  return prisma.protocoloProceso.create({
    data,
  });
}

export async function updateProceso(
  procesoId: string,
  {
    nombre,
    evento_tipo,
    obligatorio,
    orden,
    plantilla,
  }: { nombre?: string; evento_tipo?: string; obligatorio?: boolean; orden?: number; plantilla?: unknown },
  userId: string,
) {
  await ensureAdmin(userId);
  const proceso = await prisma.protocoloProceso.findUnique({ where: { proceso_id: procesoId } });
  if (!proceso) throw new ProtocoloError("Proceso no encontrado", 404);

  const data: Prisma.ProtocoloProcesoUncheckedUpdateInput = {};
  if (nombre !== undefined) data.nombre = nombre.trim();
  if (evento_tipo !== undefined) data.evento_tipo = evento_tipo;
  if (obligatorio !== undefined) data.obligatorio = obligatorio;
  if (orden !== undefined) data.orden = orden;
  if (plantilla !== undefined) data.plantilla = plantilla as Prisma.InputJsonValue;

  if (Object.keys(data).length === 0) throw new ProtocoloError("No hay campos para actualizar", 400);

  return prisma.protocoloProceso.update({ where: { proceso_id: procesoId }, data });
}

export async function deleteProceso(procesoId: string, userId: string) {
  await ensureAdmin(userId);
  const proceso = await prisma.protocoloProceso.findUnique({ where: { proceso_id: procesoId } });
  if (!proceso) throw new ProtocoloError("Proceso no encontrado", 404);

  await prisma.protocoloProceso.delete({ where: { proceso_id: procesoId } });
  return { deleted: true };
}
