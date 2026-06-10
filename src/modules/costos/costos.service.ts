import { prisma } from "../../config/prismaClient.js";
import {
  canAccessBodega,
  canManageBodega,
} from "../auth/scope-permissions.service.js";
import type {
  ModalidadEjecucion,
  RolManoObra,
  ClaseMaquinaria,
  TipoCombustible,
  Prisma,
} from "../../generated/prisma/index.js";

export class CostoError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// ── Helpers numéricos ────────────────────────────────────────────────────────

/** Convierte Decimal/string/number de Prisma a número JS (null/undefined → 0). */
function num(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Redondea a 2 decimales (moneda). */
function money(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function parsePositiveOrNull(value: unknown, label: string): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    throw new CostoError(`${label} debe ser un número ≥ 0`, 400);
  }
  return n;
}

function parseRequiredPositive(value: unknown, label: string): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    throw new CostoError(`${label} es obligatorio y debe ser ≥ 0`, 400);
  }
  return n;
}

function parseRequiredString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new CostoError(`${label} es obligatorio`, 400);
  }
  return value.trim();
}

function parseDateOrToday(value: unknown): Date {
  if (value === undefined || value === null || value === "") return new Date();
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) {
    throw new CostoError("Fecha inválida", 400);
  }
  return d;
}

// ── Scope ────────────────────────────────────────────────────────────────────

async function ensureBodegaAccess(userId: string, bodegaId: string) {
  if (!(await canAccessBodega(userId, bodegaId))) {
    throw new CostoError("No autorizado para esta bodega", 403);
  }
}

async function ensureBodegaManage(userId: string, bodegaId: string) {
  if (!(await canManageBodega(userId, bodegaId))) {
    throw new CostoError("No autorizado para administrar tarifas de esta bodega", 403);
  }
}

async function getUserBodegaIds(userId: string): Promise<string[]> {
  const rels = await prisma.userBodega.findMany({
    where: { user_id: userId },
    select: { bodega_id: true },
  });
  return rels.map((r) => r.bodega_id);
}

/** Carga la tarea validando acceso por bodega; devuelve datos base para costos. */
async function loadTareaScoped(tareaId: string, userId: string) {
  const tarea = await prisma.tarea.findUnique({
    where: { tarea_id: tareaId },
    select: {
      tarea_id: true,
      bodega_id: true,
      cuartel_id: true,
      finca_id: true,
      cuartel: { select: { superficie_ha: true } },
    },
  });
  if (!tarea) throw new CostoError("Tarea no encontrada", 404);
  await ensureBodegaAccess(userId, tarea.bodega_id);
  return tarea;
}

// ── Tarifas: Mano de obra ────────────────────────────────────────────────────

const ROLES_MANO_OBRA = ["operario", "tractorista", "aplicador", "tecnico", "encargado", "contratista"];
const CLASES_MAQUINARIA = ["motriz", "implemento"];
const TIPOS_COMBUSTIBLE = ["gasoil", "nafta", "electricidad", "glp", "otro"];
const MODALIDADES = ["propia", "contratada", "mixta"];

export async function listTarifasManoObra(userId: string, bodegaId: string) {
  await ensureBodegaAccess(userId, bodegaId);
  return prisma.tarifaManoObra.findMany({
    where: { bodega_id: bodegaId },
    orderBy: [{ rol: "asc" }, { vigencia_desde: "desc" }],
  });
}

export async function createTarifaManoObra(input: {
  userId: string;
  bodegaId: string;
  rol: string;
  costo_jornal: unknown;
  costo_hora?: unknown;
  vigencia_desde?: unknown;
}) {
  await ensureBodegaManage(input.userId, input.bodegaId);
  if (!ROLES_MANO_OBRA.includes(input.rol)) {
    throw new CostoError(`Rol inválido: ${input.rol}`, 400);
  }
  return prisma.tarifaManoObra.create({
    data: {
      bodega_id: input.bodegaId,
      rol: input.rol as RolManoObra,
      costo_jornal: parseRequiredPositive(input.costo_jornal, "Costo jornal"),
      costo_hora: parsePositiveOrNull(input.costo_hora, "Costo hora"),
      vigencia_desde: parseDateOrToday(input.vigencia_desde),
    },
  });
}

export async function updateTarifaManoObra(
  id: string,
  userId: string,
  input: { costo_jornal?: unknown; costo_hora?: unknown; vigencia_desde?: unknown; activo?: unknown },
) {
  const current = await prisma.tarifaManoObra.findUnique({
    where: { tarifa_mano_obra_id: id },
    select: { bodega_id: true },
  });
  if (!current) throw new CostoError("Tarifa no encontrada", 404);
  await ensureBodegaManage(userId, current.bodega_id);
  return prisma.tarifaManoObra.update({
    where: { tarifa_mano_obra_id: id },
    data: {
      ...(input.costo_jornal !== undefined
        ? { costo_jornal: parseRequiredPositive(input.costo_jornal, "Costo jornal") }
        : {}),
      ...(input.costo_hora !== undefined
        ? { costo_hora: parsePositiveOrNull(input.costo_hora, "Costo hora") }
        : {}),
      ...(input.vigencia_desde !== undefined
        ? { vigencia_desde: parseDateOrToday(input.vigencia_desde) }
        : {}),
      ...(typeof input.activo === "boolean" ? { activo: input.activo } : {}),
    },
  });
}

export async function deleteTarifaManoObra(id: string, userId: string) {
  const current = await prisma.tarifaManoObra.findUnique({
    where: { tarifa_mano_obra_id: id },
    select: { bodega_id: true },
  });
  if (!current) throw new CostoError("Tarifa no encontrada", 404);
  await ensureBodegaManage(userId, current.bodega_id);
  await prisma.tarifaManoObra.delete({ where: { tarifa_mano_obra_id: id } });
  return { deleted: true };
}

// ── Tarifas: Maquinaria ──────────────────────────────────────────────────────

export async function listTarifasMaquinaria(userId: string, bodegaId: string) {
  await ensureBodegaAccess(userId, bodegaId);
  return prisma.tarifaMaquinaria.findMany({
    where: { bodega_id: bodegaId },
    orderBy: [{ clase: "asc" }, { nombre: "asc" }],
  });
}

export async function createTarifaMaquinaria(input: {
  userId: string;
  bodegaId: string;
  nombre: string;
  clase: string;
  costo_hora: unknown;
  consumo_lts_hora?: unknown;
  vigencia_desde?: unknown;
}) {
  await ensureBodegaManage(input.userId, input.bodegaId);
  if (!CLASES_MAQUINARIA.includes(input.clase)) {
    throw new CostoError(`Clase inválida: ${input.clase}`, 400);
  }
  return prisma.tarifaMaquinaria.create({
    data: {
      bodega_id: input.bodegaId,
      nombre: parseRequiredString(input.nombre, "Nombre"),
      clase: input.clase as ClaseMaquinaria,
      costo_hora: parseRequiredPositive(input.costo_hora, "Costo hora"),
      consumo_lts_hora: parsePositiveOrNull(input.consumo_lts_hora, "Consumo lts/hora"),
      vigencia_desde: parseDateOrToday(input.vigencia_desde),
    },
  });
}

export async function updateTarifaMaquinaria(
  id: string,
  userId: string,
  input: {
    nombre?: unknown;
    costo_hora?: unknown;
    consumo_lts_hora?: unknown;
    vigencia_desde?: unknown;
    activo?: unknown;
  },
) {
  const current = await prisma.tarifaMaquinaria.findUnique({
    where: { tarifa_maquinaria_id: id },
    select: { bodega_id: true },
  });
  if (!current) throw new CostoError("Tarifa no encontrada", 404);
  await ensureBodegaManage(userId, current.bodega_id);
  return prisma.tarifaMaquinaria.update({
    where: { tarifa_maquinaria_id: id },
    data: {
      ...(input.nombre !== undefined ? { nombre: parseRequiredString(input.nombre, "Nombre") } : {}),
      ...(input.costo_hora !== undefined
        ? { costo_hora: parseRequiredPositive(input.costo_hora, "Costo hora") }
        : {}),
      ...(input.consumo_lts_hora !== undefined
        ? { consumo_lts_hora: parsePositiveOrNull(input.consumo_lts_hora, "Consumo lts/hora") }
        : {}),
      ...(input.vigencia_desde !== undefined
        ? { vigencia_desde: parseDateOrToday(input.vigencia_desde) }
        : {}),
      ...(typeof input.activo === "boolean" ? { activo: input.activo } : {}),
    },
  });
}

export async function deleteTarifaMaquinaria(id: string, userId: string) {
  const current = await prisma.tarifaMaquinaria.findUnique({
    where: { tarifa_maquinaria_id: id },
    select: { bodega_id: true },
  });
  if (!current) throw new CostoError("Tarifa no encontrada", 404);
  await ensureBodegaManage(userId, current.bodega_id);
  await prisma.tarifaMaquinaria.delete({ where: { tarifa_maquinaria_id: id } });
  return { deleted: true };
}

// ── Tarifas: Combustible ─────────────────────────────────────────────────────

export async function listTarifasCombustible(userId: string, bodegaId: string) {
  await ensureBodegaAccess(userId, bodegaId);
  return prisma.tarifaCombustible.findMany({
    where: { bodega_id: bodegaId },
    orderBy: [{ tipo: "asc" }, { vigencia_desde: "desc" }],
  });
}

export async function createTarifaCombustible(input: {
  userId: string;
  bodegaId: string;
  tipo: string;
  costo_unitario: unknown;
  unidad?: unknown;
  vigencia_desde?: unknown;
}) {
  await ensureBodegaManage(input.userId, input.bodegaId);
  if (!TIPOS_COMBUSTIBLE.includes(input.tipo)) {
    throw new CostoError(`Tipo de combustible inválido: ${input.tipo}`, 400);
  }
  return prisma.tarifaCombustible.create({
    data: {
      bodega_id: input.bodegaId,
      tipo: input.tipo as TipoCombustible,
      costo_unitario: parseRequiredPositive(input.costo_unitario, "Costo unitario"),
      ...(typeof input.unidad === "string" && input.unidad.trim()
        ? { unidad: input.unidad.trim() }
        : {}),
      vigencia_desde: parseDateOrToday(input.vigencia_desde),
    },
  });
}

export async function updateTarifaCombustible(
  id: string,
  userId: string,
  input: { costo_unitario?: unknown; unidad?: unknown; vigencia_desde?: unknown; activo?: unknown },
) {
  const current = await prisma.tarifaCombustible.findUnique({
    where: { tarifa_combustible_id: id },
    select: { bodega_id: true },
  });
  if (!current) throw new CostoError("Tarifa no encontrada", 404);
  await ensureBodegaManage(userId, current.bodega_id);
  return prisma.tarifaCombustible.update({
    where: { tarifa_combustible_id: id },
    data: {
      ...(input.costo_unitario !== undefined
        ? { costo_unitario: parseRequiredPositive(input.costo_unitario, "Costo unitario") }
        : {}),
      ...(typeof input.unidad === "string" && input.unidad.trim()
        ? { unidad: input.unidad.trim() }
        : {}),
      ...(input.vigencia_desde !== undefined
        ? { vigencia_desde: parseDateOrToday(input.vigencia_desde) }
        : {}),
      ...(typeof input.activo === "boolean" ? { activo: input.activo } : {}),
    },
  });
}

export async function deleteTarifaCombustible(id: string, userId: string) {
  const current = await prisma.tarifaCombustible.findUnique({
    where: { tarifa_combustible_id: id },
    select: { bodega_id: true },
  });
  if (!current) throw new CostoError("Tarifa no encontrada", 404);
  await ensureBodegaManage(userId, current.bodega_id);
  await prisma.tarifaCombustible.delete({ where: { tarifa_combustible_id: id } });
  return { deleted: true };
}

// ── Lookups de tarifa vigente ────────────────────────────────────────────────

async function tarifaManoObraVigente(bodegaId: string, rol: RolManoObra) {
  return prisma.tarifaManoObra.findFirst({
    where: { bodega_id: bodegaId, rol, activo: true },
    orderBy: { vigencia_desde: "desc" },
  });
}

async function tarifaCombustibleVigente(bodegaId: string, tipo: TipoCombustible) {
  return prisma.tarifaCombustible.findFirst({
    where: { bodega_id: bodegaId, tipo, activo: true },
    orderBy: { vigencia_desde: "desc" },
  });
}

// ── Captura: Ejecución (bloques B + C) ───────────────────────────────────────

export async function upsertEjecucion(
  tareaId: string,
  userId: string,
  input: {
    modalidad: string;
    superficie_intervenida: unknown;
    unidad_superficie?: unknown;
    jornales_generales?: unknown;
    horas_generales?: unknown;
    jornales_tractorista?: unknown;
    horas_tractorista?: unknown;
    horas_tecnico?: unknown;
    contratista?: unknown;
    monto_contratista?: unknown;
    observaciones?: unknown;
  },
) {
  const tarea = await loadTareaScoped(tareaId, userId);
  if (!MODALIDADES.includes(input.modalidad)) {
    throw new CostoError(`Modalidad inválida: ${input.modalidad}`, 400);
  }
  // Regla de negocio: no hay actividad sin superficie intervenida.
  const superficie = parseRequiredPositive(input.superficie_intervenida, "Superficie intervenida");
  if (superficie <= 0) {
    throw new CostoError("La superficie intervenida debe ser mayor a 0", 400);
  }

  // % intervenido respecto del cuartel (si se conoce la superficie del cuartel).
  const superficieCuartel = num(tarea.cuartel?.superficie_ha);
  const pct = superficieCuartel > 0 ? money((superficie / superficieCuartel) * 100) : null;

  const data = {
    modalidad: input.modalidad as ModalidadEjecucion,
    superficie_intervenida: superficie,
    unidad_superficie:
      typeof input.unidad_superficie === "string" && input.unidad_superficie.trim()
        ? input.unidad_superficie.trim()
        : "ha",
    pct_intervenido: pct,
    jornales_generales: parsePositiveOrNull(input.jornales_generales, "Jornales generales"),
    horas_generales: parsePositiveOrNull(input.horas_generales, "Horas generales"),
    jornales_tractorista: parsePositiveOrNull(input.jornales_tractorista, "Jornales tractorista"),
    horas_tractorista: parsePositiveOrNull(input.horas_tractorista, "Horas tractorista"),
    horas_tecnico: parsePositiveOrNull(input.horas_tecnico, "Horas técnico"),
    contratista:
      typeof input.contratista === "string" && input.contratista.trim()
        ? input.contratista.trim()
        : null,
    monto_contratista: parsePositiveOrNull(input.monto_contratista, "Monto contratista"),
    observaciones:
      typeof input.observaciones === "string" && input.observaciones.trim()
        ? input.observaciones.trim()
        : null,
  };

  // Regla: si es contratada, exigir contratista + monto.
  if (
    (input.modalidad === "contratada" || input.modalidad === "mixta") &&
    (!data.contratista || data.monto_contratista === null)
  ) {
    throw new CostoError(
      "En modalidad contratada/mixta se requiere contratista y monto/tarifa",
      400,
    );
  }

  const ejecucion = await prisma.tareaEjecucion.upsert({
    where: { tarea_id: tareaId },
    create: { tarea_id: tareaId, ...data },
    update: { ...data, updated_at: new Date() },
  });
  await recalcularCostosTarea(tareaId);
  return ejecucion;
}

// ── Captura: Máquinas (bloques D + E) ────────────────────────────────────────

export async function addActividadMaquina(
  tareaId: string,
  userId: string,
  input: {
    tarifa_maquinaria_id?: unknown;
    nombre?: unknown;
    clase: string;
    propia?: unknown;
    horas: unknown;
    consumo_combustible_lts?: unknown;
  },
) {
  const tarea = await loadTareaScoped(tareaId, userId);
  if (!CLASES_MAQUINARIA.includes(input.clase)) {
    throw new CostoError(`Clase inválida: ${input.clase}`, 400);
  }

  let nombre = typeof input.nombre === "string" ? input.nombre.trim() : "";
  let tarifaId: string | null = null;
  if (typeof input.tarifa_maquinaria_id === "string" && input.tarifa_maquinaria_id) {
    const tarifa = await prisma.tarifaMaquinaria.findUnique({
      where: { tarifa_maquinaria_id: input.tarifa_maquinaria_id },
      select: { tarifa_maquinaria_id: true, bodega_id: true, nombre: true },
    });
    if (!tarifa || tarifa.bodega_id !== tarea.bodega_id) {
      throw new CostoError("Tarifa de maquinaria inválida para esta bodega", 400);
    }
    tarifaId = tarifa.tarifa_maquinaria_id;
    if (!nombre) nombre = tarifa.nombre;
  }
  if (!nombre) throw new CostoError("Nombre de máquina es obligatorio", 400);

  const propia = input.propia === undefined ? true : Boolean(input.propia);
  const horas = parseRequiredPositive(input.horas, "Horas de utilización");

  // Regla: si es máquina motriz propia, exigir consumo de combustible
  // (o que la tarifa tenga consumo_lts_hora para derivarlo).
  const consumo = parsePositiveOrNull(input.consumo_combustible_lts, "Consumo combustible");
  if (input.clase === "motriz" && propia && consumo === null) {
    const tarifa = tarifaId
      ? await prisma.tarifaMaquinaria.findUnique({
          where: { tarifa_maquinaria_id: tarifaId },
          select: { consumo_lts_hora: true },
        })
      : null;
    if (!tarifa?.consumo_lts_hora) {
      throw new CostoError(
        "Una máquina motriz propia requiere consumo de combustible (o una tarifa con consumo lts/hora)",
        400,
      );
    }
  }

  const created = await prisma.actividadMaquina.create({
    data: {
      tarea_id: tareaId,
      tarifa_maquinaria_id: tarifaId,
      nombre,
      clase: input.clase as ClaseMaquinaria,
      propia,
      horas,
      consumo_combustible_lts: consumo,
    },
  });
  await recalcularCostosTarea(tareaId);
  return created;
}

export async function deleteActividadMaquina(id: string, userId: string) {
  const row = await prisma.actividadMaquina.findUnique({
    where: { actividad_maquina_id: id },
    select: { tarea_id: true },
  });
  if (!row) throw new CostoError("Línea de máquina no encontrada", 404);
  await loadTareaScoped(row.tarea_id, userId);
  await prisma.actividadMaquina.delete({ where: { actividad_maquina_id: id } });
  await recalcularCostosTarea(row.tarea_id);
  return { deleted: true };
}

// ── Captura: Insumos (bloque F) ──────────────────────────────────────────────

export async function addActividadInsumo(
  tareaId: string,
  userId: string,
  input: {
    insumo_id?: unknown;
    descripcion?: unknown;
    dosis_ha: unknown;
    unidad_dosis: unknown;
    cantidad_total: unknown;
    unidad_total?: unknown;
  },
) {
  const tarea = await loadTareaScoped(tareaId, userId);

  // Regla obligatoria: producto + dosis/ha + cantidad total.
  const dosis_ha = parseRequiredPositive(input.dosis_ha, "Dosis por hectárea");
  const cantidad_total = parseRequiredPositive(input.cantidad_total, "Cantidad total utilizada");
  const unidad_dosis = parseRequiredString(input.unidad_dosis, "Unidad de dosis");

  let insumoId: string | null = null;
  let descripcion = typeof input.descripcion === "string" ? input.descripcion.trim() : "";
  let unidadTotal =
    typeof input.unidad_total === "string" && input.unidad_total.trim()
      ? input.unidad_total.trim()
      : "";

  if (typeof input.insumo_id === "string" && input.insumo_id) {
    const insumo = await prisma.insumoCatalogo.findUnique({
      where: { insumo_id: input.insumo_id },
      select: { insumo_id: true, bodega_id: true, nombre_comercial: true, unidad_base: true },
    });
    if (!insumo) throw new CostoError("Insumo no encontrado", 400);
    // El insumo debe ser global (bodega_id null) o de la bodega de la tarea.
    if (insumo.bodega_id && insumo.bodega_id !== tarea.bodega_id) {
      throw new CostoError("Insumo no pertenece a esta bodega", 400);
    }
    insumoId = insumo.insumo_id;
    if (!descripcion) descripcion = insumo.nombre_comercial;
    if (!unidadTotal) unidadTotal = insumo.unidad_base;
  }

  if (!insumoId && !descripcion) {
    throw new CostoError("Debe indicar un insumo del catálogo o una descripción", 400);
  }
  if (!unidadTotal) unidadTotal = unidad_dosis;

  const created = await prisma.actividadInsumo.create({
    data: {
      tarea_id: tareaId,
      insumo_id: insumoId,
      descripcion: descripcion || null,
      dosis_ha,
      unidad_dosis,
      cantidad_total,
      unidad_total: unidadTotal,
    },
  });
  await recalcularCostosTarea(tareaId);
  return created;
}

export async function deleteActividadInsumo(id: string, userId: string) {
  const row = await prisma.actividadInsumo.findUnique({
    where: { actividad_insumo_id: id },
    select: { tarea_id: true },
  });
  if (!row) throw new CostoError("Línea de insumo no encontrada", 404);
  await loadTareaScoped(row.tarea_id, userId);
  await prisma.actividadInsumo.delete({ where: { actividad_insumo_id: id } });
  await recalcularCostosTarea(row.tarea_id);
  return { deleted: true };
}

// ── Motor de cálculo de costos ───────────────────────────────────────────────

/**
 * Recalcula y persiste los costos de una actividad (tarea).
 * - Snapshotea precios vigentes en cada línea de máquina/insumo.
 * - Deriva el combustible de las máquinas motrices.
 * - Reescribe las filas de `actividad_costo` (una por categoría).
 *
 * Pensado para llamarse cuando cambian datos de la actividad y al
 * completar la tarea. No valida scope (lo hacen los callers).
 */
export async function recalcularCostosTarea(tareaId: string) {
  const tarea = await prisma.tarea.findUnique({
    where: { tarea_id: tareaId },
    select: { tarea_id: true, bodega_id: true },
  });
  if (!tarea) throw new CostoError("Tarea no encontrada", 404);
  const bodegaId = tarea.bodega_id;

  const [ejecucion, maquinas, insumos] = await Promise.all([
    prisma.tareaEjecucion.findUnique({ where: { tarea_id: tareaId } }),
    prisma.actividadMaquina.findMany({
      where: { tarea_id: tareaId },
      include: { tarifa_maquinaria: { select: { costo_hora: true, consumo_lts_hora: true } } },
    }),
    prisma.actividadInsumo.findMany({
      where: { tarea_id: tareaId },
      include: { insumo_catalogo: { select: { costo_unitario: true } } },
    }),
  ]);

  // 1) Mano de obra
  let montoManoObra = 0;
  const detalleManoObra: Record<string, number> = {};
  if (ejecucion) {
    const [tOperario, tTractorista, tTecnico] = await Promise.all([
      tarifaManoObraVigente(bodegaId, "operario"),
      tarifaManoObraVigente(bodegaId, "tractorista"),
      tarifaManoObraVigente(bodegaId, "tecnico"),
    ]);
    const cOperario = num(ejecucion.jornales_generales) * num(tOperario?.costo_jornal);
    const cTractorista = num(ejecucion.jornales_tractorista) * num(tTractorista?.costo_jornal);
    const cTecnico = num(ejecucion.horas_tecnico) * num(tTecnico?.costo_hora);
    detalleManoObra.operario = money(cOperario);
    detalleManoObra.tractorista = money(cTractorista);
    detalleManoObra.tecnico = money(cTecnico);
    montoManoObra = money(cOperario + cTractorista + cTecnico);
  }

  // 2) Maquinaria + 3) Combustible (derivado de motrices)
  let montoMaquinaria = 0;
  let litrosCombustible = 0;
  for (const m of maquinas) {
    const costoHora = num(m.tarifa_maquinaria?.costo_hora ?? m.costo_hora_snapshot);
    const horas = num(m.horas);
    const totalLinea = money(costoHora * horas);

    // Litros: explícito o derivado de horas × consumo de la tarifa (sólo motriz).
    let litros = m.consumo_combustible_lts !== null ? num(m.consumo_combustible_lts) : 0;
    if (m.clase === "motriz" && litros === 0 && m.tarifa_maquinaria?.consumo_lts_hora) {
      litros = num(m.tarifa_maquinaria.consumo_lts_hora) * horas;
    }
    litrosCombustible += litros;
    montoMaquinaria += totalLinea;

    // Snapshot del costo en la línea.
    await prisma.actividadMaquina.update({
      where: { actividad_maquina_id: m.actividad_maquina_id },
      data: {
        costo_hora_snapshot: costoHora || null,
        costo_total: totalLinea,
        ...(m.consumo_combustible_lts === null && litros > 0
          ? { consumo_combustible_lts: litros }
          : {}),
      },
    });
  }
  montoMaquinaria = money(montoMaquinaria);

  const tGasoil = await tarifaCombustibleVigente(bodegaId, "gasoil");
  const montoCombustible = money(litrosCombustible * num(tGasoil?.costo_unitario));

  // 4) Insumos
  let montoInsumos = 0;
  for (const ins of insumos) {
    const costoUnitario = num(ins.insumo_catalogo?.costo_unitario ?? ins.costo_unitario_snapshot);
    const totalLinea = money(costoUnitario * num(ins.cantidad_total));
    montoInsumos += totalLinea;
    await prisma.actividadInsumo.update({
      where: { actividad_insumo_id: ins.actividad_insumo_id },
      data: {
        costo_unitario_snapshot: costoUnitario || null,
        costo_total: totalLinea,
      },
    });
  }
  montoInsumos = money(montoInsumos);

  // 5) Contratista
  const montoContratista = money(num(ejecucion?.monto_contratista));

  // Persistir actividad_costo (reescribe categorías)
  const filas: { categoria: string; monto: number; detalle: Prisma.InputJsonValue }[] = [
    { categoria: "mano_obra", monto: montoManoObra, detalle: detalleManoObra },
    { categoria: "maquinaria", monto: montoMaquinaria, detalle: { lineas: maquinas.length } },
    {
      categoria: "combustible",
      monto: montoCombustible,
      detalle: { litros: money(litrosCombustible), precio_lt: num(tGasoil?.costo_unitario) },
    },
    { categoria: "insumos", monto: montoInsumos, detalle: { lineas: insumos.length } },
    { categoria: "contratista", monto: montoContratista, detalle: {} },
  ];

  await prisma.$transaction([
    prisma.actividadCosto.deleteMany({ where: { tarea_id: tareaId } }),
    prisma.actividadCosto.createMany({
      data: filas
        .filter((f) => f.monto > 0)
        .map((f) => ({
          tarea_id: tareaId,
          categoria: f.categoria as Prisma.ActividadCostoCreateManyInput["categoria"],
          monto: f.monto,
          detalle: f.detalle,
        })),
    }),
  ]);

  const total = money(filas.reduce((acc, f) => acc + f.monto, 0));
  return {
    tareaId,
    total,
    porCategoria: Object.fromEntries(filas.map((f) => [f.categoria, f.monto])),
  };
}

// ── Lecturas / indicadores ───────────────────────────────────────────────────

export async function getCostosTarea(tareaId: string, userId: string) {
  const tarea = await loadTareaScoped(tareaId, userId);
  const [ejecucion, maquinas, insumos, costos] = await Promise.all([
    prisma.tareaEjecucion.findUnique({ where: { tarea_id: tareaId } }),
    prisma.actividadMaquina.findMany({ where: { tarea_id: tareaId }, orderBy: { created_at: "asc" } }),
    prisma.actividadInsumo.findMany({ where: { tarea_id: tareaId }, orderBy: { created_at: "asc" } }),
    prisma.actividadCosto.findMany({ where: { tarea_id: tareaId } }),
  ]);

  const total = money(costos.reduce((acc, c) => acc + num(c.monto), 0));
  const superficie = num(ejecucion?.superficie_intervenida);
  const costoPorHa = superficie > 0 ? money(total / superficie) : null;

  return {
    tareaId,
    cuartelId: tarea.cuartel_id,
    ejecucion,
    maquinas,
    insumos,
    costos,
    total,
    costoPorHa,
  };
}

/** Agrega costos de todas las actividades de un cuartel. */
export async function getResumenPorCuartel(cuartelId: string, userId: string) {
  const cuartel = await prisma.cuartel.findUnique({
    where: { cuartel_id: cuartelId },
    select: { cuartel_id: true, superficie_ha: true, finca: { select: { bodega_id: true } } },
  });
  if (!cuartel) throw new CostoError("Cuartel no encontrado", 404);
  await ensureBodegaAccess(userId, cuartel.finca.bodega_id);

  const costos = await prisma.actividadCosto.findMany({
    where: { tarea: { cuartel_id: cuartelId } },
    select: { categoria: true, monto: true },
  });
  return aggregate(costos, num(cuartel.superficie_ha) || null);
}

/** Lista las actividades (tareas) de un cuartel con su costo total y $/ha. */
export async function listActividadesConCostoPorCuartel(cuartelId: string, userId: string) {
  const cuartel = await prisma.cuartel.findUnique({
    where: { cuartel_id: cuartelId },
    select: { cuartel_id: true, finca: { select: { bodega_id: true } } },
  });
  if (!cuartel) throw new CostoError("Cuartel no encontrado", 404);
  await ensureBodegaAccess(userId, cuartel.finca.bodega_id);

  const tareas = await prisma.tarea.findMany({
    where: { cuartel_id: cuartelId },
    select: {
      tarea_id: true,
      titulo: true,
      estado: true,
      created_at: true,
      protocolo_proceso: { select: { nombre: true, evento_tipo: true } },
      tarea_ejecucion: { select: { superficie_intervenida: true } },
      actividad_costo: { select: { categoria: true, monto: true } },
    },
    orderBy: { created_at: "desc" },
  });

  return tareas.map((t) => {
    const total = money(t.actividad_costo.reduce((acc, c) => acc + num(c.monto), 0));
    const superficie = num(t.tarea_ejecucion?.superficie_intervenida);
    const porCategoria: Record<string, number> = {};
    for (const c of t.actividad_costo) {
      porCategoria[c.categoria] = money((porCategoria[c.categoria] ?? 0) + num(c.monto));
    }
    return {
      tareaId: t.tarea_id,
      titulo: t.titulo,
      estado: t.estado,
      actividad: t.protocolo_proceso?.nombre ?? null,
      eventoTipo: t.protocolo_proceso?.evento_tipo ?? null,
      fecha: t.created_at,
      superficie: superficie || null,
      total,
      costoPorHa: superficie > 0 ? money(total / superficie) : null,
      porCategoria,
    };
  });
}

/** Agrega costos de todas las actividades de una campaña. */
export async function getResumenPorCampania(campaniaId: string, userId: string) {
  const campania = await prisma.campania.findUnique({
    where: { campania_id: campaniaId },
    select: { campania_id: true, bodega_id: true },
  });
  if (!campania) throw new CostoError("Campaña no encontrada", 404);
  await ensureBodegaAccess(userId, campania.bodega_id);

  // Las tareas no referencian campaña directamente; se filtran por las que
  // tienen ejecución cuyas actividades caen en cuarteles de la bodega.
  // Para MVP: agregamos por todas las actividades de la bodega de la campaña.
  const costos = await prisma.actividadCosto.findMany({
    where: { tarea: { bodega_id: campania.bodega_id } },
    select: { categoria: true, monto: true },
  });
  return aggregate(costos, null);
}

function aggregate(
  costos: { categoria: string; monto: unknown }[],
  superficieHa: number | null,
) {
  const porCategoria: Record<string, number> = {};
  let total = 0;
  for (const c of costos) {
    const m = num(c.monto);
    porCategoria[c.categoria] = money((porCategoria[c.categoria] ?? 0) + m);
    total += m;
  }
  total = money(total);
  return {
    total,
    porCategoria,
    costoPorHa: superficieHa && superficieHa > 0 ? money(total / superficieHa) : null,
    actividades: costos.length,
  };
}

export async function listInsumosCatalogo(userId: string, bodegaId?: string) {
  // Insumos globales (bodega_id null) + los de las bodegas del usuario.
  const bodegaIds = bodegaId ? [bodegaId] : await getUserBodegaIds(userId);
  if (bodegaId) await ensureBodegaAccess(userId, bodegaId);
  return prisma.insumoCatalogo.findMany({
    where: { OR: [{ bodega_id: null }, { bodega_id: { in: bodegaIds } }] },
    orderBy: [{ tipo: "asc" }, { nombre_comercial: "asc" }],
  });
}
