import { prisma } from "../../config/prismaClient.js";
import { canAccessBodega, canManageBodega } from "../auth/scope-permissions.service.js";
import type { TipoPersonal, ModalidadPago, RolManoObra } from "../../generated/prisma/index.js";

export class PersonalError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const TIPOS: TipoPersonal[] = ["interno", "externo"];
const MODALIDADES: ModalidadPago[] = ["mensual", "por_hora"];
const ROLES = ["operario", "tractorista", "aplicador", "tecnico", "encargado", "contratista"];
const HORAS_POR_JORNAL = 8;

function num(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function parsePositiveOrNull(value: unknown, label: string): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new PersonalError(`${label} debe ser ≥ 0`, 400);
  return n;
}

function parseIntPositive(value: unknown, label: string, fallback: number): number {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new PersonalError(`${label} debe ser un entero > 0`, 400);
  return n;
}

async function ensureBodegaAccess(userId: string, bodegaId: string) {
  if (!(await canAccessBodega(userId, bodegaId))) {
    throw new PersonalError("No autorizado para esta bodega", 403);
  }
}
async function ensureBodegaManage(userId: string, bodegaId: string) {
  if (!(await canManageBodega(userId, bodegaId))) {
    throw new PersonalError("No autorizado para administrar el personal de esta bodega", 403);
  }
}

// ── Costo/hora efectivo de una persona ───────────────────────────────────────

type PersonalCosto = {
  modalidad: ModalidadPago;
  sueldo_mensual: unknown;
  costo_hora: unknown;
  dias_mes: number;
};

/** Costo/hora efectivo: directo (por_hora) o derivado del sueldo (mensual). */
export function costoHoraPersona(p: PersonalCosto): number {
  if (p.modalidad === "mensual") {
    const sueldo = num(p.sueldo_mensual);
    const dias = p.dias_mes > 0 ? p.dias_mes : 25;
    if (sueldo <= 0) return 0;
    return sueldo / dias / HORAS_POR_JORNAL; // jornal = sueldo/días; hora = jornal/8
  }
  return num(p.costo_hora);
}

/** Mapa personal_bodega_id → costo/hora efectivo, para una bodega. */
export async function getCostosHoraPersonal(
  bodegaId: string,
  personalIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (personalIds.length === 0) return map;
  const rows = await prisma.personalBodega.findMany({
    where: { bodega_id: bodegaId, personal_bodega_id: { in: personalIds }, activo: true },
    select: { personal_bodega_id: true, modalidad: true, sueldo_mensual: true, costo_hora: true, dias_mes: true },
  });
  for (const r of rows) map.set(r.personal_bodega_id, costoHoraPersona(r));
  return map;
}

// ── ABM del legajo ───────────────────────────────────────────────────────────

export async function listPersonal(userId: string, bodegaId: string) {
  await ensureBodegaAccess(userId, bodegaId);
  const rows = await prisma.personalBodega.findMany({
    where: { bodega_id: bodegaId },
    orderBy: { created_at: "desc" },
  });
  return rows.map((r) => ({ ...r, costo_hora_efectivo: Math.round(costoHoraPersona(r) * 100) / 100 }));
}

async function validateInput(input: {
  tipo?: unknown;
  modalidad?: unknown;
  rol?: unknown;
}) {
  if (input.tipo !== undefined && !TIPOS.includes(input.tipo as TipoPersonal)) {
    throw new PersonalError(`Tipo inválido: ${input.tipo}`, 400);
  }
  if (input.modalidad !== undefined && !MODALIDADES.includes(input.modalidad as ModalidadPago)) {
    throw new PersonalError(`Modalidad inválida: ${input.modalidad}`, 400);
  }
  if (input.rol !== undefined && input.rol !== null && input.rol !== "" && !ROLES.includes(String(input.rol))) {
    throw new PersonalError(`Rol inválido: ${input.rol}`, 400);
  }
}

export async function createPersonal(input: {
  userId: string;
  bodegaId: string;
  nombre: unknown;
  targetUserId?: unknown; // opcional: vínculo a un usuario de la plataforma
  tipo?: unknown;
  modalidad?: unknown;
  rol?: unknown;
  sueldo_mensual?: unknown;
  costo_hora?: unknown;
  dias_mes?: unknown;
}) {
  await ensureBodegaManage(input.userId, input.bodegaId);
  await validateInput(input);
  if (typeof input.nombre !== "string" || !input.nombre.trim()) {
    throw new PersonalError("El nombre del personal es obligatorio", 400);
  }
  // Vínculo a usuario es OPCIONAL; si se indica, debe pertenecer a la bodega.
  let linkedUserId: string | null = null;
  if (typeof input.targetUserId === "string" && input.targetUserId) {
    const rel = await prisma.userBodega.findFirst({
      where: { user_id: input.targetUserId, bodega_id: input.bodegaId },
      select: { user_id: true },
    });
    if (!rel) throw new PersonalError("El usuario vinculado no pertenece a esta bodega", 400);
    linkedUserId = input.targetUserId;
  }

  return prisma.personalBodega.create({
    data: {
      bodega_id: input.bodegaId,
      nombre: input.nombre.trim(),
      ...(linkedUserId ? { user_id: linkedUserId } : {}),
      tipo: (input.tipo as TipoPersonal) ?? "interno",
      modalidad: (input.modalidad as ModalidadPago) ?? "por_hora",
      ...(input.rol ? { rol: input.rol as RolManoObra } : {}),
      sueldo_mensual: parsePositiveOrNull(input.sueldo_mensual, "Sueldo mensual"),
      costo_hora: parsePositiveOrNull(input.costo_hora, "Costo hora"),
      dias_mes: parseIntPositive(input.dias_mes, "Días por mes", 25),
    },
  });
}

async function getScoped(id: string, userId: string) {
  const row = await prisma.personalBodega.findUnique({
    where: { personal_bodega_id: id },
    select: { personal_bodega_id: true, bodega_id: true },
  });
  if (!row) throw new PersonalError("Legajo no encontrado", 404);
  await ensureBodegaManage(userId, row.bodega_id);
  return row;
}

export async function updatePersonal(
  id: string,
  userId: string,
  input: {
    nombre?: unknown;
    tipo?: unknown;
    modalidad?: unknown;
    rol?: unknown;
    sueldo_mensual?: unknown;
    costo_hora?: unknown;
    dias_mes?: unknown;
    activo?: unknown;
  },
) {
  await getScoped(id, userId);
  await validateInput(input);
  return prisma.personalBodega.update({
    where: { personal_bodega_id: id },
    data: {
      ...(typeof input.nombre === "string" && input.nombre.trim() ? { nombre: input.nombre.trim() } : {}),
      ...(input.tipo !== undefined ? { tipo: input.tipo as TipoPersonal } : {}),
      ...(input.modalidad !== undefined ? { modalidad: input.modalidad as ModalidadPago } : {}),
      ...(input.rol !== undefined ? { rol: input.rol ? (input.rol as RolManoObra) : null } : {}),
      ...(input.sueldo_mensual !== undefined
        ? { sueldo_mensual: parsePositiveOrNull(input.sueldo_mensual, "Sueldo mensual") }
        : {}),
      ...(input.costo_hora !== undefined
        ? { costo_hora: parsePositiveOrNull(input.costo_hora, "Costo hora") }
        : {}),
      ...(input.dias_mes !== undefined ? { dias_mes: parseIntPositive(input.dias_mes, "Días por mes", 25) } : {}),
      ...(typeof input.activo === "boolean" ? { activo: input.activo } : {}),
      updated_at: new Date(),
    },
  });
}

export async function deletePersonal(id: string, userId: string) {
  await getScoped(id, userId);
  await prisma.personalBodega.delete({ where: { personal_bodega_id: id } });
  return { deleted: true };
}
