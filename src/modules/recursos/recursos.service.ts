import { prisma } from "../../config/prismaClient.js";
import { canAccessBodega, canManageBodega } from "../auth/scope-permissions.service.js";
import type { AmbitoRecurso, ClaseMaquinaria } from "../../generated/prisma/index.js";

// Catálogo de máquinas, implementos, equipos y herramientas (setup). Reusa la
// tabla tarifa_maquinaria (que además alimenta costos). El módulo de costos sigue
// gestionando el costo_hora por su cuenta; acá el precio es opcional.
export class RecursoError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const AMBITOS: AmbitoRecurso[] = ["finca", "bodega"];
const CLASES: ClaseMaquinaria[] = ["motriz", "implemento", "equipo", "herramienta"];

function parseRequiredString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new RecursoError(`${label} es obligatorio`, 400);
  }
  return value.trim();
}

function parseOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parsePositiveOrNull(value: unknown, label: string): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new RecursoError(`${label} debe ser un número ≥ 0`, 400);
  return n;
}

function parseFechaOrNull(value: unknown, label: string): Date | null {
  if (value === undefined || value === null || value === "") return null;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) throw new RecursoError(`${label} inválida`, 400);
  return d;
}

function parseAmbito(value: unknown, fallback?: AmbitoRecurso): AmbitoRecurso | undefined {
  if (value === undefined || value === null || value === "") return fallback;
  if (!AMBITOS.includes(value as AmbitoRecurso)) throw new RecursoError(`Ámbito inválido: ${value}`, 400);
  return value as AmbitoRecurso;
}

function parseClase(value: unknown, fallback?: ClaseMaquinaria): ClaseMaquinaria | undefined {
  if (value === undefined || value === null || value === "") return fallback;
  if (!CLASES.includes(value as ClaseMaquinaria)) throw new RecursoError(`Clase inválida: ${value}`, 400);
  return value as ClaseMaquinaria;
}

async function ensureBodegaAccess(userId: string, bodegaId: string) {
  if (!(await canAccessBodega(userId, bodegaId))) {
    throw new RecursoError("No autorizado para esta bodega", 403);
  }
}
async function ensureBodegaManage(userId: string, bodegaId: string) {
  if (!(await canManageBodega(userId, bodegaId))) {
    throw new RecursoError("No autorizado para administrar los recursos de esta bodega", 403);
  }
}

// ── ABM del catálogo de recursos de una bodega ───────────────────────────────

export async function listRecursos(
  userId: string,
  bodegaId: string,
  ambito?: AmbitoRecurso,
  clase?: ClaseMaquinaria,
) {
  await ensureBodegaAccess(userId, bodegaId);
  return prisma.tarifaMaquinaria.findMany({
    where: { bodega_id: bodegaId, ...(ambito ? { ambito } : {}), ...(clase ? { clase } : {}) },
    orderBy: [{ clase: "asc" }, { categoria: "asc" }, { nombre: "asc" }],
  });
}

type RecursoInput = {
  ambito?: unknown;
  clase?: unknown;
  categoria?: unknown;
  familia?: unknown;
  nombre?: unknown;
  potencia_hp?: unknown;
  uso_principal?: unknown;
  unidad_uso?: unknown;
  consumo_descripcion?: unknown;
  observaciones?: unknown;
  costo_hora?: unknown;
  consumo_lts_hora?: unknown;
  vigencia_desde?: unknown;
  moneda?: unknown;
};

export async function createRecurso(userId: string, bodegaId: string, input: RecursoInput) {
  await ensureBodegaManage(userId, bodegaId);
  const clase = parseClase(input.clase);
  if (!clase) throw new RecursoError("La clase es obligatoria", 400);
  return prisma.tarifaMaquinaria.create({
    data: {
      bodega_id: bodegaId,
      ambito: parseAmbito(input.ambito, "finca")!,
      clase,
      nombre: parseRequiredString(input.nombre, "Nombre"),
      categoria: parseOptionalString(input.categoria),
      familia: parseOptionalString(input.familia),
      potencia_hp: parseOptionalString(input.potencia_hp),
      uso_principal: parseOptionalString(input.uso_principal),
      unidad_uso: parseOptionalString(input.unidad_uso),
      consumo_descripcion: parseOptionalString(input.consumo_descripcion),
      observaciones: parseOptionalString(input.observaciones),
      costo_hora: parsePositiveOrNull(input.costo_hora, "Costo hora"),
      consumo_lts_hora: parsePositiveOrNull(input.consumo_lts_hora, "Consumo l/h"),
      vigencia_desde: parseFechaOrNull(input.vigencia_desde, "Vigencia desde"),
      ...(parseOptionalString(input.moneda) ? { moneda: parseOptionalString(input.moneda)! } : {}),
    },
  });
}

async function getRecursoScoped(id: string, userId: string) {
  const row = await prisma.tarifaMaquinaria.findUnique({
    where: { tarifa_maquinaria_id: id },
    select: { tarifa_maquinaria_id: true, bodega_id: true },
  });
  if (!row) throw new RecursoError("Recurso no encontrado", 404);
  await ensureBodegaManage(userId, row.bodega_id);
  return row;
}

export async function updateRecurso(
  id: string,
  userId: string,
  input: RecursoInput & { activo?: unknown },
) {
  await getRecursoScoped(id, userId);
  return prisma.tarifaMaquinaria.update({
    where: { tarifa_maquinaria_id: id },
    data: {
      ...(input.ambito !== undefined ? { ambito: parseAmbito(input.ambito, "finca")! } : {}),
      ...(input.clase !== undefined ? { clase: parseClase(input.clase)! } : {}),
      ...(input.nombre !== undefined ? { nombre: parseRequiredString(input.nombre, "Nombre") } : {}),
      ...(input.categoria !== undefined ? { categoria: parseOptionalString(input.categoria) } : {}),
      ...(input.familia !== undefined ? { familia: parseOptionalString(input.familia) } : {}),
      ...(input.potencia_hp !== undefined ? { potencia_hp: parseOptionalString(input.potencia_hp) } : {}),
      ...(input.uso_principal !== undefined ? { uso_principal: parseOptionalString(input.uso_principal) } : {}),
      ...(input.unidad_uso !== undefined ? { unidad_uso: parseOptionalString(input.unidad_uso) } : {}),
      ...(input.consumo_descripcion !== undefined
        ? { consumo_descripcion: parseOptionalString(input.consumo_descripcion) }
        : {}),
      ...(input.observaciones !== undefined ? { observaciones: parseOptionalString(input.observaciones) } : {}),
      ...(input.costo_hora !== undefined
        ? { costo_hora: parsePositiveOrNull(input.costo_hora, "Costo hora") }
        : {}),
      ...(input.consumo_lts_hora !== undefined
        ? { consumo_lts_hora: parsePositiveOrNull(input.consumo_lts_hora, "Consumo l/h") }
        : {}),
      ...(input.vigencia_desde !== undefined
        ? { vigencia_desde: parseFechaOrNull(input.vigencia_desde, "Vigencia desde") }
        : {}),
      ...(typeof input.activo === "boolean" ? { activo: input.activo } : {}),
    },
  });
}

export async function deleteRecurso(id: string, userId: string) {
  await getRecursoScoped(id, userId);
  // Si el recurso ya se usó en actividades, se desactiva para no romper el histórico.
  const enUso = await prisma.actividadMaquina.count({ where: { tarifa_maquinaria_id: id } });
  if (enUso > 0) {
    await prisma.tarifaMaquinaria.update({ where: { tarifa_maquinaria_id: id }, data: { activo: false } });
    return { deleted: false, desactivado: true };
  }
  await prisma.tarifaMaquinaria.delete({ where: { tarifa_maquinaria_id: id } });
  return { deleted: true, desactivado: false };
}

// ── Catálogo maestro global (referencia para autocompletar) ──────────────────

export async function listClasesMaestro(ambitoRaw: unknown): Promise<ClaseMaquinaria[]> {
  const ambito = parseAmbito(ambitoRaw);
  const rows = await prisma.recursoMaestro.findMany({
    where: { activo: true, ...(ambito ? { ambito } : {}) },
    distinct: ["clase"],
    select: { clase: true },
  });
  const orden = CLASES;
  return rows.map((r) => r.clase).sort((a, b) => orden.indexOf(a) - orden.indexOf(b));
}

export async function listCategoriasMaestro(ambitoRaw: unknown, claseRaw: unknown): Promise<string[]> {
  const ambito = parseAmbito(ambitoRaw);
  const clase = parseClase(claseRaw);
  const rows = await prisma.recursoMaestro.findMany({
    where: { activo: true, categoria: { not: null }, ...(ambito ? { ambito } : {}), ...(clase ? { clase } : {}) },
    distinct: ["categoria"],
    select: { categoria: true },
    orderBy: { categoria: "asc" },
  });
  return rows.map((r) => r.categoria).filter((c): c is string => !!c);
}

export async function listMaestro(ambitoRaw: unknown, claseRaw: unknown, categoria?: string) {
  const ambito = parseAmbito(ambitoRaw);
  const clase = parseClase(claseRaw);
  return prisma.recursoMaestro.findMany({
    where: {
      activo: true,
      ...(ambito ? { ambito } : {}),
      ...(clase ? { clase } : {}),
      ...(categoria && categoria.trim() ? { categoria: categoria.trim() } : {}),
    },
    orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
  });
}
