import { prisma } from "../../config/prismaClient.js";
import { canAccessBodega, canManageBodega } from "../auth/scope-permissions.service.js";

export class InventarioError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseRequiredString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new InventarioError(`${label} es obligatorio`, 400);
  }
  return value.trim();
}

function parsePositiveOrNull(value: unknown, label: string): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    throw new InventarioError(`${label} debe ser un número ≥ 0`, 400);
  }
  return n;
}

function parseRequiredPositive(value: unknown, label: string): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new InventarioError(`${label} debe ser mayor a 0`, 400);
  }
  return n;
}

function parseNumber(value: unknown, label: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new InventarioError(`${label} inválido`, 400);
  return n;
}

function num(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function round3(n: number): number {
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}

async function ensureBodegaAccess(userId: string, bodegaId: string) {
  if (!(await canAccessBodega(userId, bodegaId))) {
    throw new InventarioError("No autorizado para esta bodega", 403);
  }
}

async function ensureBodegaManage(userId: string, bodegaId: string) {
  if (!(await canManageBodega(userId, bodegaId))) {
    throw new InventarioError("No autorizado para administrar el inventario de esta bodega", 403);
  }
}

async function getUserBodegaIds(userId: string): Promise<string[]> {
  const rels = await prisma.userBodega.findMany({
    where: { user_id: userId },
    select: { bodega_id: true },
  });
  return rels.map((r) => r.bodega_id);
}

// ── ABM de insumos ───────────────────────────────────────────────────────────

export async function listInsumos(userId: string, bodegaId?: string, incluirInactivos = false) {
  // Inventario propio de cada bodega: sólo insumos de la(s) bodega(s), sin globales.
  const bodegaIds = bodegaId ? [bodegaId] : await getUserBodegaIds(userId);
  if (bodegaId) await ensureBodegaAccess(userId, bodegaId);
  return prisma.insumoCatalogo.findMany({
    where: {
      bodega_id: { in: bodegaIds },
      ...(incluirInactivos ? {} : { activo: true }),
    },
    orderBy: [{ tipo: "asc" }, { nombre_comercial: "asc" }],
  });
}

export async function createInsumo(input: {
  userId: string;
  bodegaId: string;
  tipo: string;
  nombre_comercial: string;
  principio_activo?: unknown;
  unidad_base: string;
  costo_unitario?: unknown;
  stock_minimo?: unknown;
}) {
  await ensureBodegaManage(input.userId, input.bodegaId);
  return prisma.insumoCatalogo.create({
    data: {
      bodega_id: input.bodegaId,
      tipo: parseRequiredString(input.tipo, "Tipo"),
      nombre_comercial: parseRequiredString(input.nombre_comercial, "Nombre comercial"),
      principio_activo:
        typeof input.principio_activo === "string" && input.principio_activo.trim()
          ? input.principio_activo.trim()
          : null,
      unidad_base: parseRequiredString(input.unidad_base, "Unidad base"),
      costo_unitario: parsePositiveOrNull(input.costo_unitario, "Costo unitario"),
      stock_minimo: parsePositiveOrNull(input.stock_minimo, "Stock mínimo"),
    },
  });
}

async function getInsumoScoped(insumoId: string, userId: string) {
  const insumo = await prisma.insumoCatalogo.findUnique({
    where: { insumo_id: insumoId },
    select: { insumo_id: true, bodega_id: true },
  });
  if (!insumo) throw new InventarioError("Insumo no encontrado", 404);
  // Los insumos globales (bodega_id null) no se editan desde una bodega.
  if (!insumo.bodega_id) {
    throw new InventarioError("Los insumos globales no se editan por bodega", 400);
  }
  await ensureBodegaManage(userId, insumo.bodega_id);
  return insumo;
}

export async function updateInsumo(
  insumoId: string,
  userId: string,
  input: {
    tipo?: unknown;
    nombre_comercial?: unknown;
    principio_activo?: unknown;
    unidad_base?: unknown;
    costo_unitario?: unknown;
    stock_minimo?: unknown;
    activo?: unknown;
  },
) {
  await getInsumoScoped(insumoId, userId);
  return prisma.insumoCatalogo.update({
    where: { insumo_id: insumoId },
    data: {
      ...(input.tipo !== undefined ? { tipo: parseRequiredString(input.tipo, "Tipo") } : {}),
      ...(input.nombre_comercial !== undefined
        ? { nombre_comercial: parseRequiredString(input.nombre_comercial, "Nombre comercial") }
        : {}),
      ...(input.principio_activo !== undefined
        ? {
            principio_activo:
              typeof input.principio_activo === "string" && input.principio_activo.trim()
                ? input.principio_activo.trim()
                : null,
          }
        : {}),
      ...(input.unidad_base !== undefined
        ? { unidad_base: parseRequiredString(input.unidad_base, "Unidad base") }
        : {}),
      ...(input.costo_unitario !== undefined
        ? { costo_unitario: parsePositiveOrNull(input.costo_unitario, "Costo unitario") }
        : {}),
      ...(input.stock_minimo !== undefined
        ? { stock_minimo: parsePositiveOrNull(input.stock_minimo, "Stock mínimo") }
        : {}),
      ...(typeof input.activo === "boolean" ? { activo: input.activo } : {}),
    },
  });
}

/**
 * Baja de insumo: si tiene consumos registrados, se desactiva (baja lógica) para
 * no romper el histórico; si no, se elimina.
 */
export async function deleteInsumo(insumoId: string, userId: string) {
  await getInsumoScoped(insumoId, userId);
  const enUso = await prisma.actividadInsumo.count({ where: { insumo_id: insumoId } });
  if (enUso > 0) {
    await prisma.insumoCatalogo.update({ where: { insumo_id: insumoId }, data: { activo: false } });
    return { deleted: false, desactivado: true };
  }
  await prisma.insumoCatalogo.delete({ where: { insumo_id: insumoId } });
  return { deleted: true, desactivado: false };
}

// ── Stock: movimientos, existencias, valorización ────────────────────────────

/**
 * Crea un movimiento de egreso por consumo de una actividad. Pensado para
 * llamarse desde el hook de costos. No valida scope (lo hace el caller) y no
 * bloquea si el stock queda negativo.
 */
export async function registrarEgresoConsumo(input: {
  insumoId: string;
  bodegaId: string;
  cantidad: number;
  unidad: string;
  actividadInsumoId: string;
  userId?: string;
}) {
  if (!(input.cantidad > 0)) return null;
  return prisma.movimientoStock.create({
    data: {
      insumo_id: input.insumoId,
      bodega_id: input.bodegaId,
      tipo: "egreso",
      cantidad: -Math.abs(input.cantidad), // egreso resta
      unidad: input.unidad,
      motivo: "Consumo en actividad",
      actividad_insumo_id: input.actividadInsumoId,
      ...(input.userId ? { created_by: input.userId } : {}),
    },
  });
}

/** Revierte (borra) el egreso ligado a una línea de consumo. */
export async function revertirEgresoConsumo(actividadInsumoId: string) {
  await prisma.movimientoStock.deleteMany({ where: { actividad_insumo_id: actividadInsumoId } });
}

async function getInsumoBodega(insumoId: string, userId: string, bodegaId: string) {
  await ensureBodegaManage(userId, bodegaId);
  const insumo = await prisma.insumoCatalogo.findUnique({
    where: { insumo_id: insumoId },
    select: { insumo_id: true, bodega_id: true, unidad_base: true },
  });
  if (!insumo) throw new InventarioError("Insumo no encontrado", 404);
  if (insumo.bodega_id && insumo.bodega_id !== bodegaId) {
    throw new InventarioError("El insumo no pertenece a esta bodega", 400);
  }
  return insumo;
}

/** Registra un ingreso (compra). Si viene costo, actualiza el precio del insumo. */
export async function registrarIngreso(input: {
  userId: string;
  bodegaId: string;
  insumoId: string;
  cantidad: unknown;
  costo_unitario?: unknown;
  motivo?: unknown;
}) {
  const insumo = await getInsumoBodega(input.insumoId, input.userId, input.bodegaId);
  const cantidad = parseRequiredPositive(input.cantidad, "Cantidad");
  const costo = parsePositiveOrNull(input.costo_unitario, "Costo unitario");

  const mov = await prisma.movimientoStock.create({
    data: {
      insumo_id: input.insumoId,
      bodega_id: input.bodegaId,
      tipo: "ingreso",
      cantidad: round3(cantidad),
      unidad: insumo.unidad_base,
      ...(costo !== null ? { costo_unitario: costo } : {}),
      motivo: typeof input.motivo === "string" && input.motivo.trim() ? input.motivo.trim() : "Compra",
      created_by: input.userId,
    },
  });
  // Actualizar el precio de referencia del insumo con el último costo de compra.
  if (costo !== null) {
    await prisma.insumoCatalogo.update({
      where: { insumo_id: input.insumoId },
      data: { costo_unitario: costo },
    });
  }
  return mov;
}

/** Registra un ajuste manual (delta con signo). */
export async function registrarAjuste(input: {
  userId: string;
  bodegaId: string;
  insumoId: string;
  cantidad: unknown; // delta con signo
  motivo?: unknown;
}) {
  const insumo = await getInsumoBodega(input.insumoId, input.userId, input.bodegaId);
  const delta = parseNumber(input.cantidad, "Cantidad del ajuste");
  if (delta === 0) throw new InventarioError("El ajuste no puede ser 0", 400);
  return prisma.movimientoStock.create({
    data: {
      insumo_id: input.insumoId,
      bodega_id: input.bodegaId,
      tipo: "ajuste",
      cantidad: round3(delta),
      unidad: insumo.unidad_base,
      motivo: typeof input.motivo === "string" && input.motivo.trim() ? input.motivo.trim() : "Ajuste",
      created_by: input.userId,
    },
  });
}

/** Existencias por insumo (stock actual + valorización) para una bodega. */
export async function getExistencias(userId: string, bodegaId: string) {
  await ensureBodegaAccess(userId, bodegaId);
  const [insumos, sumas] = await Promise.all([
    prisma.insumoCatalogo.findMany({
      where: { bodega_id: bodegaId, activo: true },
      orderBy: [{ tipo: "asc" }, { nombre_comercial: "asc" }],
    }),
    prisma.movimientoStock.groupBy({
      by: ["insumo_id"],
      where: { bodega_id: bodegaId },
      _sum: { cantidad: true },
    }),
  ]);
  const stockById = new Map<string, number>();
  for (const s of sumas) stockById.set(s.insumo_id, num(s._sum.cantidad));

  return insumos.map((i) => {
    const stock = round3(stockById.get(i.insumo_id) ?? 0);
    const costo = num(i.costo_unitario);
    const minimo = i.stock_minimo !== null ? num(i.stock_minimo) : null;
    return {
      insumo_id: i.insumo_id,
      nombre_comercial: i.nombre_comercial,
      tipo: i.tipo,
      unidad_base: i.unidad_base,
      costo_unitario: i.costo_unitario,
      stock,
      stock_minimo: i.stock_minimo,
      valorizacion: Math.round(stock * costo * 100) / 100,
      bajo_minimo: minimo !== null && stock < minimo,
    };
  });
}

/** Historial de movimientos de un insumo en una bodega. */
export async function listMovimientos(userId: string, bodegaId: string, insumoId: string) {
  await ensureBodegaAccess(userId, bodegaId);
  return prisma.movimientoStock.findMany({
    where: { bodega_id: bodegaId, insumo_id: insumoId },
    orderBy: { fecha: "desc" },
  });
}

/** Alertas: insumos bajo mínimo + lotes próximos a vencer (30 días). */
export async function getAlertas(userId: string, bodegaId: string) {
  await ensureBodegaAccess(userId, bodegaId);
  const existencias = await getExistencias(userId, bodegaId);
  const bajoMinimo = existencias.filter((e) => e.bajo_minimo);

  const en30dias = new Date();
  en30dias.setDate(en30dias.getDate() + 30);
  const lotesPorVencer = await prisma.insumoLote.findMany({
    where: {
      estado: "habilitado",
      fecha_vencimiento: { lte: en30dias },
      insumo_catalogo: { bodega_id: bodegaId },
    },
    select: {
      insumo_lote_id: true,
      nro_lote: true,
      fecha_vencimiento: true,
      insumo_catalogo: { select: { nombre_comercial: true } },
    },
    orderBy: { fecha_vencimiento: "asc" },
  });
  return { bajoMinimo, lotesPorVencer };
}
