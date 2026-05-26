import { prisma } from "../../config/prismaClient.js";
import { canAccessFinca, canOperateFinca } from "../auth/scope-permissions.service.js";
import {
  getTipoVariedadForVariedad,
  isValidCultivo,
  isValidManejoCultivo,
  isValidSistemaRiego,
  isValidSistemaConduccion,
  isValidVariedad,
  normalizeCultivo,
  normalizeManejoCultivo,
  normalizeSistemaRiego,
  normalizeSistemaConduccion,
  normalizeTipoVariedad,
  normalizeVariedad,
} from "./cuartel.catalog.js";

type GeoJSONPolygon = { type: "Polygon"; coordinates: [number, number][][] };
type Centroide = { lat: number; lng: number };

type CreateCuartelInput = {
  fincaId: string;
  codigo_cuartel: string;
  superficie_ha?: number;
  cultivo?: string;
  tipo_variedad?: string;
  variedad?: string;
  sistema_riego?: string;
  sistema_productivo?: string;
  sistema_conduccion?: string;
  cantidad_hileras?: number | null;
  largo_hileras_m?: number | null;
  densidad_hileras?: number | null;
  distancia_plantacion?: string | null;
  poligono?: GeoJSONPolygon | null;
  centroide?: Centroide | null;
  userId: string;
};

type UpdateCuartelInput = {
  codigo_cuartel?: string;
  superficie_ha?: number;
  cultivo?: string | null;
  tipo_variedad?: string | null;
  variedad?: string | null;
  sistema_riego?: string | null;
  sistema_productivo?: string | null;
  sistema_conduccion?: string | null;
  cantidad_hileras?: number | null;
  largo_hileras_m?: number | null;
  densidad_hileras?: number | null;
  distancia_plantacion?: string | null;
  poligono?: GeoJSONPolygon | null;
  centroide?: Centroide | null;
  userId: string;
};

export class CuartelError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function normalizeCuartelCatalogFields(input: {
  cultivo?: string | null | undefined;
  tipo_variedad?: string | null | undefined;
  variedad?: string | null | undefined;
}) {
  const cultivo = normalizeCultivo(input.cultivo);
  if (!isValidCultivo(cultivo)) {
    throw new CuartelError("Cultivo inválido. Actualmente solo se permite Vid.", 400);
  }

  const variedad = normalizeVariedad(input.variedad);
  if (!isValidVariedad(variedad)) {
    throw new CuartelError("Variedad inválida. Seleccioná una variedad del catálogo.", 400);
  }

  const tipoFromVariedad = getTipoVariedadForVariedad(variedad);
  const tipoVariedad = normalizeTipoVariedad(input.tipo_variedad) ?? tipoFromVariedad;
  if (tipoVariedad !== tipoFromVariedad) {
    throw new CuartelError("El tipo de variedad no coincide con la variedad seleccionada.", 400);
  }

  return { cultivo, variedad, tipo_variedad: tipoVariedad };
}

function normalizeOptionalManejoCultivo(value: unknown) {
  const manejoCultivo = normalizeManejoCultivo(value);
  if (!isValidManejoCultivo(manejoCultivo)) {
    throw new CuartelError("Manejo de cultivo inválido. Seleccioná una opción del catálogo.", 400);
  }
  return manejoCultivo;
}

function normalizeOptionalSistemaRiego(value: unknown) {
  const sistemaRiego = normalizeSistemaRiego(value);
  if (!isValidSistemaRiego(sistemaRiego)) {
    throw new CuartelError("Sistema de riego inválido. Seleccioná una opción del catálogo.", 400);
  }
  return sistemaRiego;
}

function normalizeOptionalSistemaConduccion(value: unknown) {
  const sistemaConduccion = normalizeSistemaConduccion(value);
  if (!isValidSistemaConduccion(sistemaConduccion)) {
    throw new CuartelError("Sistema de conducción inválido. Seleccioná una opción del catálogo.", 400);
  }
  return sistemaConduccion;
}

function normalizeOptionalNonNegativeNumber(value: unknown, label: string) {
  if (value === undefined || value === null || value === "") return null;
  const numberValue = Number(value);
  if (Number.isNaN(numberValue) || numberValue < 0) {
    throw new CuartelError(`${label} debe ser un número válido.`, 400);
  }
  return numberValue;
}

function normalizeOptionalNonNegativeInteger(value: unknown, label: string) {
  const numberValue = normalizeOptionalNonNegativeNumber(value, label);
  if (numberValue === null) return null;
  if (!Number.isInteger(numberValue)) {
    throw new CuartelError(`${label} debe ser un número entero.`, 400);
  }
  return numberValue;
}

async function ensureUserFinca(userId: string, fincaId: string) {
  const finca = await prisma.finca.findUnique({
    where: { finca_id: fincaId },
    select: { finca_id: true },
  });
  if (!finca) {
    throw new CuartelError("Finca no encontrada", 404);
  }
  const canAccess = await canAccessFinca(userId, fincaId);
  if (!canAccess) {
    throw new CuartelError("No autorizado para esta finca", 403);
  }
  return finca;
}

export async function listCuartelesByFinca(fincaId: string, userId: string) {
  await ensureUserFinca(userId, fincaId);
  return prisma.cuartel.findMany({ where: { finca_id: fincaId } });
}

export async function createCuartel({
  fincaId,
  codigo_cuartel,
  superficie_ha,
  cultivo,
  tipo_variedad,
  variedad,
  sistema_riego,
  sistema_productivo,
  sistema_conduccion,
  cantidad_hileras,
  largo_hileras_m,
  densidad_hileras,
  distancia_plantacion,
  poligono,
  centroide,
  userId,
}: CreateCuartelInput) {
  if (!fincaId || !codigo_cuartel) {
    throw new CuartelError("Datos incompletos", 400);
  }

  const finca = await ensureUserFinca(userId, fincaId);
  const canOperate = await canOperateFinca(userId, fincaId);
  if (!canOperate) {
    throw new CuartelError("No autorizado para operar esta finca", 403);
  }

  const data: {
    finca_id: string;
    codigo_cuartel: string;
    superficie_ha?: number;
    cultivo?: string | null;
    tipo_variedad?: string | null;
    variedad?: string | null;
    sistema_riego?: string | null;
    sistema_productivo?: string | null;
    sistema_conduccion?: string | null;
    cantidad_hileras?: number | null;
    largo_hileras_m?: number | null;
    densidad_hileras?: number | null;
    distancia_plantacion?: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    poligono?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    centroide?: any;
  } = { finca_id: finca.finca_id, codigo_cuartel };
  const catalogFields = normalizeCuartelCatalogFields({ cultivo, tipo_variedad, variedad });

  if (superficie_ha !== undefined) data.superficie_ha = superficie_ha;
  data.cultivo = catalogFields.cultivo;
  data.tipo_variedad = catalogFields.tipo_variedad;
  data.variedad = catalogFields.variedad;
  if (sistema_riego !== undefined) data.sistema_riego = normalizeOptionalSistemaRiego(sistema_riego);
  if (sistema_productivo !== undefined) {
    data.sistema_productivo = normalizeOptionalManejoCultivo(sistema_productivo);
  }
  if (sistema_conduccion !== undefined) {
    data.sistema_conduccion = normalizeOptionalSistemaConduccion(sistema_conduccion);
  }
  if (cantidad_hileras !== undefined) {
    data.cantidad_hileras = normalizeOptionalNonNegativeInteger(cantidad_hileras, "Cantidad de hileras");
  }
  if (largo_hileras_m !== undefined) {
    data.largo_hileras_m = normalizeOptionalNonNegativeNumber(largo_hileras_m, "Largo de hileras");
  }
  if (densidad_hileras !== undefined) {
    data.densidad_hileras = normalizeOptionalNonNegativeNumber(densidad_hileras, "Densidad de hileras");
  }
  if (distancia_plantacion !== undefined) {
    data.distancia_plantacion = distancia_plantacion?.trim() || null;
  }
  if (poligono !== undefined) data.poligono = poligono ?? null;
  if (centroide !== undefined) data.centroide = centroide ?? null;

  return prisma.cuartel.create({ data });
}

export async function getCuartelById(cuartelId: string, userId: string) {
  if (!cuartelId) {
    throw new CuartelError("cuartelId requerido", 400);
  }

  const cuartel = await prisma.cuartel.findUnique({
    where: { cuartel_id: cuartelId },
  });
  if (!cuartel) {
    throw new CuartelError("Cuartel no encontrado", 404);
  }

  await ensureUserFinca(userId, cuartel.finca_id);
  return cuartel;
}

export async function updateCuartel(
  cuartelId: string,
  {
    codigo_cuartel,
    superficie_ha,
    cultivo,
    tipo_variedad,
    variedad,
    sistema_riego,
    sistema_productivo,
    sistema_conduccion,
    cantidad_hileras,
    largo_hileras_m,
    densidad_hileras,
    distancia_plantacion,
    poligono,
    centroide,
    userId,
  }: UpdateCuartelInput,
) {
  const cuartel = await getCuartelById(cuartelId, userId);
  const canOperate = await canOperateFinca(userId, cuartel.finca_id);
  if (!canOperate) {
    throw new CuartelError("No autorizado para operar esta finca", 403);
  }

  const data: {
    codigo_cuartel?: string;
    superficie_ha?: number;
    cultivo?: string | null;
    tipo_variedad?: string | null;
    variedad?: string | null;
    sistema_riego?: string | null;
    sistema_productivo?: string | null;
    sistema_conduccion?: string | null;
    cantidad_hileras?: number | null;
    largo_hileras_m?: number | null;
    densidad_hileras?: number | null;
    distancia_plantacion?: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    poligono?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    centroide?: any;
  } = {};

  if (codigo_cuartel !== undefined) data.codigo_cuartel = codigo_cuartel;
  if (superficie_ha !== undefined) data.superficie_ha = superficie_ha;
  if (cultivo !== undefined || tipo_variedad !== undefined || variedad !== undefined) {
    const catalogFields = normalizeCuartelCatalogFields({
      cultivo: cultivo ?? cuartel.cultivo,
      tipo_variedad: tipo_variedad ?? cuartel.tipo_variedad,
      variedad: variedad ?? cuartel.variedad,
    });
    data.cultivo = catalogFields.cultivo;
    data.tipo_variedad = catalogFields.tipo_variedad;
    data.variedad = catalogFields.variedad;
  }
  if (sistema_riego !== undefined) data.sistema_riego = normalizeOptionalSistemaRiego(sistema_riego);
  if (sistema_productivo !== undefined) {
    data.sistema_productivo = normalizeOptionalManejoCultivo(sistema_productivo);
  }
  if (sistema_conduccion !== undefined) {
    data.sistema_conduccion = normalizeOptionalSistemaConduccion(sistema_conduccion);
  }
  if (cantidad_hileras !== undefined) {
    data.cantidad_hileras = normalizeOptionalNonNegativeInteger(cantidad_hileras, "Cantidad de hileras");
  }
  if (largo_hileras_m !== undefined) {
    data.largo_hileras_m = normalizeOptionalNonNegativeNumber(largo_hileras_m, "Largo de hileras");
  }
  if (densidad_hileras !== undefined) {
    data.densidad_hileras = normalizeOptionalNonNegativeNumber(densidad_hileras, "Densidad de hileras");
  }
  if (distancia_plantacion !== undefined) {
    data.distancia_plantacion = distancia_plantacion?.trim() || null;
  }
  if (poligono !== undefined) data.poligono = poligono ?? null;
  if (centroide !== undefined) data.centroide = centroide ?? null;

  if (Object.keys(data).length === 0) {
    throw new CuartelError("No hay campos para actualizar", 400);
  }

  return prisma.cuartel.update({
    where: { cuartel_id: cuartel.cuartel_id },
    data,
  });
}

export async function deleteCuartel(cuartelId: string, userId: string) {
  const cuartel = await getCuartelById(cuartelId, userId);
  const canOperate = await canOperateFinca(userId, cuartel.finca_id);
  if (!canOperate) {
    throw new CuartelError("No autorizado para operar esta finca", 403);
  }
  await prisma.cuartel.delete({ where: { cuartel_id: cuartel.cuartel_id } });
  return { deleted: true };
}
