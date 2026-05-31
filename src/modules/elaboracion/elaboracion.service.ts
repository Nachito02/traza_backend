import { prisma } from "../../config/prismaClient.js";
import type { Prisma } from "../../generated/prisma/index.js";

type CreateVasijaInput = {
  userId: string;
  bodegaId: string;
  codigo: string;
  tipo?: string;
  capacidad_litros?: number;
  etapa?: string;
  ubicacion?: string;
};

type UpdateVasijaInput = {
  codigo?: string;
  tipo?: string;
  capacidad_litros?: number;
  etapa?: string;
  ubicacion?: string;
};

// Enums espejados del schema para casteo seguro
const VASIJA_TIPO_VALUES = ["Hormigon","AceroInoxidable","Roble","FibraDeVidrio","Polietileno","Ceramica"] as const;

type CorteComponenteInput = {
  vasijaId?: string;
  loteCosechaId?: string;
  volumen_l?: number;
  porcentaje?: number;
};

type CreateCorteInput = {
  userId: string;
  bodegaId: string;
  campaniaId?: string;
  fecha: string;
  objetivo?: string;
  responsableUserId?: string;
  observaciones?: string;
  componentes?: CorteComponenteInput[];
};

type UpdateCorteInput = {
  campaniaId?: string;
  fecha?: string;
  objetivo?: string;
  responsableUserId?: string;
  observaciones?: string;
  componentes?: CorteComponenteInput[];
};

type CreateProductoInput = {
  userId: string;
  bodegaId: string;
  nombre_comercial: string;
  varietal?: string;
  anio?: number;
  tipo?: string;
  activo?: boolean;
};

type UpdateProductoInput = {
  nombre_comercial?: string;
  varietal?: string;
  anio?: number;
  tipo?: string;
  activo?: boolean;
};

type CreateLoteFraccionamientoInput = {
  userId: string;
  corteId: string;
  productoId: string;
  fecha: string;
  botellas?: number;
  formato?: string;
  codigo_lote_impreso?: string;
};

type UpdateLoteFraccionamientoInput = {
  fecha?: string;
  botellas?: number;
  formato?: string;
  codigo_lote_impreso?: string;
};

type CreateCodigoEnvaseInput = {
  userId: string;
  loteFraccionamientoId: string;
  codigo_qr: string;
  codigo_lote_impreso?: string;
};

type UpdateCodigoEnvaseInput = {
  codigo_qr?: string;
  codigo_lote_impreso?: string;
};

type CreateRemitoUvaInput = {
  userId: string;
  bodegaId: string;
  fincaId: string;
  cuartelId: string;
  loteCosechaId?: string;
  salida_finca: string;
  llegada_bodega?: string;
  transportista?: string;
  patente?: string;
  kg_declarados?: number;
};

type UpdateRemitoUvaInput = {
  fincaId?: string;
  cuartelId?: string;
  loteCosechaId?: string;
  salida_finca?: string;
  llegada_bodega?: string;
  transportista?: string;
  patente?: string;
  kg_declarados?: number;
};

type ListLotesCosechaInput = {
  userId: string;
  bodegaId?: string;
  fincaId?: string;
  cuartelId?: string;
};

type CreateRecepcionBodegaInput = {
  userId: string;
  remitoUvaId: string;
  fecha_hora: string;
  kg_pesados?: number;
  clasificacion?: string;
  observaciones?: string;
};

type UpdateRecepcionBodegaInput = {
  fecha_hora?: string;
  kg_pesados?: number;
  clasificacion?: string;
  observaciones?: string;
};

type CreateAnalisisRecepcionInput = {
  userId: string;
  recepcionBodegaId: string;
  brix?: number;
  ph?: number;
  acidez?: number;
  sanidad?: string;
  temperatura_uva?: number;
  observaciones?: string;
};

type UpdateAnalisisRecepcionInput = {
  brix?: number;
  ph?: number;
  acidez?: number;
  sanidad?: string;
  temperatura_uva?: number;
  observaciones?: string;
};

type CreateOperacionVasijaInput = {
  userId: string;
  bodegaId: string;
  vasijaOrigenId?: string;
  vasijaDestinoId?: string;
  ordenEnologoId?: string;
  enologoUserId?: string;
  recepcionBodegaId?: string;
  tipo: "ingreso" | "fermentacion" | "trasiego" | "descube" | "correccion" | "corte_parcial";
  fecha_hora: string;
  actorUserId?: string;
  volumen_movido_l?: number;
  observaciones?: string;
};

type UpdateOperacionVasijaInput = {
  vasijaOrigenId?: string;
  vasijaDestinoId?: string;
  ordenEnologoId?: string;
  enologoUserId?: string;
  recepcionBodegaId?: string;
  tipo?: "ingreso" | "fermentacion" | "trasiego" | "descube" | "correccion" | "corte_parcial";
  fecha_hora?: string;
  actorUserId?: string;
  volumen_movido_l?: number;
  observaciones?: string;
};

type CreateDespachoInput = {
  userId: string;
  loteFraccionamientoId: string;
  fecha: string;
  destino?: string;
  cantidad?: number;
  documento?: string;
};

type UpdateDespachoInput = {
  fecha?: string;
  destino?: string;
  cantidad?: number;
  documento?: string;
};

type CreateCiuInput = {
  userId: string;
  bodegaId: string;
  recepcionBodegaId: string;
  codigo_ciu: string;
  estado?: string;
  emitido_at: string;
  observaciones?: string;
};

type UpdateCiuInput = {
  recepcionBodegaId?: string;
  codigo_ciu?: string;
  estado?: string;
  emitido_at?: string;
  observaciones?: string;
};

type CreateQcIngresoUvaInput = {
  userId: string;
  bodegaId: string;
  recepcionBodegaId: string;
  fecha_hora: string;
  brix?: number;
  ph?: number;
  acidez?: number;
  temperatura_uva?: number;
  estado_pcc?: string;
  aprobado?: boolean;
  observaciones?: string;
};

type UpdateQcIngresoUvaInput = {
  fecha_hora?: string;
  brix?: number;
  ph?: number;
  acidez?: number;
  temperatura_uva?: number;
  estado_pcc?: string;
  aprobado?: boolean;
  observaciones?: string;
};

type CreateExistenciaVasijaInput = {
  userId: string;
  vasijaId: string;
  fecha_hora: string;
  volumen_l?: number;
  grado_alcohol?: number;
  azucar_residual_g_l?: number;
  observaciones?: string;
};

type UpdateExistenciaVasijaInput = {
  fecha_hora?: string;
  volumen_l?: number;
  grado_alcohol?: number;
  azucar_residual_g_l?: number;
  observaciones?: string;
};

type CreateControlFermentacionInput = {
  userId: string;
  vasijaId: string;
  fecha_hora: string;
  densidad?: number;
  temperatura?: number;
  brix?: number;
  ph?: number;
  acidez?: number;
  estado_fermentacion?: string;
  observaciones?: string;
};

type UpdateControlFermentacionInput = {
  fecha_hora?: string;
  densidad?: number;
  temperatura?: number;
  brix?: number;
  ph?: number;
  acidez?: number;
  estado_fermentacion?: string;
  observaciones?: string;
};

export class ElaboracionError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function parseDate(input: string, fieldLabel: string) {
  const date = new Date(String(input ?? "").trim());
  if (Number.isNaN(date.getTime())) {
    throw new ElaboracionError(`${fieldLabel} inválida`, 400);
  }
  return date;
}

async function ensureUserBodega(userId: string, bodegaId: string) {
  const rel = await prisma.userBodega.findFirst({
    where: { user_id: userId, bodega_id: bodegaId },
    select: { user_id: true },
  });
  if (!rel) {
    throw new ElaboracionError("No autorizado para esta bodega", 403);
  }
}

async function resolveOrdenEnologoId(params: {
  bodegaId: string;
  fechaHora: string;
  ordenEnologoId: string | undefined;
  enologoUserId: string | undefined;
}) {
  const { bodegaId, fechaHora, ordenEnologoId, enologoUserId } = params;

  if (ordenEnologoId) {
    const orden = await prisma.ordenEnologo.findUnique({
      where: { orden_enologo_id: ordenEnologoId },
      select: { bodega_id: true },
    });
    if (!orden || orden.bodega_id !== bodegaId) {
      throw new ElaboracionError("ordenEnologoId invalida para la bodega", 400);
    }
    return ordenEnologoId;
  }

  if (!enologoUserId) return undefined;

  const membership = await prisma.userBodega.findFirst({
    where: {
      user_id: enologoUserId,
      bodega_id: bodegaId,
      user_bodega_rol: {
        some: { rol: "enologo" },
      },
    },
    select: { user_id: true },
  });

  if (!membership) {
    throw new ElaboracionError("enologoUserId invalido para la bodega", 400);
  }

  const parsedFechaHora = parseDate(fechaHora, "Fecha hora");
  const orden = await prisma.ordenEnologo.create({
    data: {
      bodega_id: bodegaId,
      enologo_user_id: enologoUserId,
      fecha: parsedFechaHora,
      estado: "activa",
    },
    select: { orden_enologo_id: true },
  });

  return orden.orden_enologo_id;
}

async function getUserBodegaIds(userId: string) {
  const rels = await prisma.userBodega.findMany({
    where: { user_id: userId },
    select: { bodega_id: true },
  });
  return rels.map((r) => r.bodega_id);
}

async function getCorteScoped(corteId: string, userId: string) {
  const corte = await prisma.corte.findUnique({
    where: { corte_id: corteId },
    select: { corte_id: true, bodega_id: true },
  });
  if (!corte) throw new ElaboracionError("Corte no encontrado", 404);
  await ensureUserBodega(userId, corte.bodega_id);
  return corte;
}

async function getProductoScoped(productoId: string, userId: string) {
  const producto = await prisma.producto.findUnique({
    where: { producto_id: productoId },
    select: { producto_id: true, bodega_id: true },
  });
  if (!producto) throw new ElaboracionError("Producto no encontrado", 404);
  await ensureUserBodega(userId, producto.bodega_id);
  return producto;
}

async function getLoteFraccionamientoScoped(
  loteFraccionamientoId: string,
  userId: string,
) {
  const lote = await prisma.loteFraccionamiento.findUnique({
    where: { lote_fraccionamiento_id: loteFraccionamientoId },
    select: {
      lote_fraccionamiento_id: true,
      producto: { select: { bodega_id: true } },
    },
  });
  if (!lote) throw new ElaboracionError("Lote de fraccionamiento no encontrado", 404);
  await ensureUserBodega(userId, lote.producto.bodega_id);
  return lote;
}

async function getRemitoScoped(remitoUvaId: string, userId: string) {
  const remito = await prisma.remitoUva.findUnique({
    where: { remito_uva_id: remitoUvaId },
    select: { remito_uva_id: true, bodega_id: true },
  });
  if (!remito) throw new ElaboracionError("Remito de uva no encontrado", 404);
  await ensureUserBodega(userId, remito.bodega_id);
  return remito;
}

async function validateRemitoOrigen(input: {
  bodegaId: string;
  fincaId: string;
  cuartelId: string;
  loteCosechaId?: string | null;
}) {
  const cuartel = await prisma.cuartel.findFirst({
    where: {
      cuartel_id: input.cuartelId,
      finca_id: input.fincaId,
      finca: { bodega_id: input.bodegaId },
    },
    select: { cuartel_id: true },
  });
  if (!cuartel) {
    throw new ElaboracionError("El cuartel seleccionado no pertenece a la finca/bodega indicada", 400);
  }

  // El lote de cosecha es opcional: el remito puede crearse solo con el cuartel.
  if (!input.loteCosechaId) return;

  const lote = await prisma.eventoCosecha.findUnique({
    where: { lote_cosecha_id: input.loteCosechaId },
    select: { lote_cosecha_id: true, cuartel_id: true },
  });
  if (!lote) throw new ElaboracionError("Lote de cosecha no encontrado", 404);
  if (lote.cuartel_id !== input.cuartelId) {
    throw new ElaboracionError("El lote de cosecha no corresponde al cuartel seleccionado", 400);
  }
}

async function getRecepcionScoped(recepcionBodegaId: string, userId: string) {
  const recepcion = await prisma.recepcionBodega.findUnique({
    where: { recepcion_bodega_id: recepcionBodegaId },
    select: {
      recepcion_bodega_id: true,
      remito_uva: { select: { bodega_id: true, finca_id: true } },
    },
  });
  if (!recepcion) throw new ElaboracionError("Recepcion de bodega no encontrada", 404);
  await ensureUserBodega(userId, recepcion.remito_uva.bodega_id);
  return recepcion;
}

async function getAnalisisScoped(analisisRecepcionId: string, userId: string) {
  const analisis = await prisma.analisisRecepcion.findUnique({
    where: { analisis_recepcion_id: analisisRecepcionId },
    select: {
      analisis_recepcion_id: true,
      recepcion_bodega: {
        select: { remito_uva: { select: { bodega_id: true } } },
      },
    },
  });
  if (!analisis) throw new ElaboracionError("Analisis de recepcion no encontrado", 404);
  await ensureUserBodega(userId, analisis.recepcion_bodega.remito_uva.bodega_id);
  return analisis;
}

async function getOperacionScoped(operacionVasijaId: string, userId: string) {
  const operacion = await prisma.operacionVasija.findUnique({
    where: { operacion_vasija_id: operacionVasijaId },
    select: { operacion_vasija_id: true, bodega_id: true, fecha_hora: true },
  });
  if (!operacion) throw new ElaboracionError("Operacion de vasija no encontrada", 404);
  await ensureUserBodega(userId, operacion.bodega_id);
  return operacion;
}

async function getDespachoScoped(despachoId: string, userId: string) {
  const despacho = await prisma.despacho.findUnique({
    where: { despacho_id: despachoId },
    select: {
      despacho_id: true,
      lote_fraccionamiento: { select: { producto: { select: { bodega_id: true } } } },
    },
  });
  if (!despacho) throw new ElaboracionError("Despacho no encontrado", 404);
  await ensureUserBodega(userId, despacho.lote_fraccionamiento.producto.bodega_id);
  return despacho;
}

async function getCiuScoped(ciuId: string, userId: string) {
  const ciu = await prisma.ciu.findUnique({
    where: { ciu_id: ciuId },
    select: { ciu_id: true, bodega_id: true, finca_id: true },
  });
  if (!ciu) throw new ElaboracionError("CIU no encontrado", 404);
  await ensureUserBodega(userId, ciu.bodega_id);
  return ciu;
}

async function getQcIngresoUvaScoped(qcIngresoUvaId: string, userId: string) {
  const qc = await prisma.qcIngresoUva.findUnique({
    where: { qc_ingreso_uva_id: qcIngresoUvaId },
    select: { qc_ingreso_uva_id: true, bodega_id: true },
  });
  if (!qc) throw new ElaboracionError("QC ingreso uva no encontrado", 404);
  await ensureUserBodega(userId, qc.bodega_id);
  return qc;
}

async function getExistenciaVasijaScoped(existenciaVasijaId: string, userId: string) {
  const existencia = await prisma.existenciaVasija.findUnique({
    where: { existencia_vasija_id: existenciaVasijaId },
    select: {
      existencia_vasija_id: true,
      vasija: { select: { bodega_id: true } },
    },
  });
  if (!existencia) throw new ElaboracionError("Existencia de vasija no encontrada", 404);
  await ensureUserBodega(userId, existencia.vasija.bodega_id);
  return existencia;
}

async function getControlFermentacionScoped(
  controlFermentacionId: string,
  userId: string,
) {
  const control = await prisma.controlFermentacion.findUnique({
    where: { control_fermentacion_id: controlFermentacionId },
    select: {
      control_fermentacion_id: true,
      vasija: { select: { bodega_id: true } },
    },
  });
  if (!control) throw new ElaboracionError("Control de fermentacion no encontrado", 404);
  await ensureUserBodega(userId, control.vasija.bodega_id);
  return control;
}

function normalizeComponentes(componentes?: CorteComponenteInput[]) {
  if (!componentes || componentes.length === 0) return [];
  for (const c of componentes) {
    if (!c.vasijaId && !c.loteCosechaId) {
      throw new ElaboracionError(
        "Cada componente debe tener vasijaId o loteCosechaId",
        400,
      );
    }
  }
  return componentes;
}

export async function listVasijas(userId: string, bodegaId?: string) {
  if (bodegaId) {
    await ensureUserBodega(userId, bodegaId);
    return prisma.vasija.findMany({
      where: { bodega_id: bodegaId },
      orderBy: [{ codigo: "asc" }],
    });
  }

  const bodegaIds = await getUserBodegaIds(userId);
  if (bodegaIds.length === 0) return [];
  return prisma.vasija.findMany({
    where: { bodega_id: { in: bodegaIds } },
    orderBy: [{ codigo: "asc" }],
  });
}

export async function getVasijaById(vasijaId: string, userId: string) {
  const vasija = await prisma.vasija.findUnique({
    where: { vasija_id: vasijaId },
  });
  if (!vasija) throw new ElaboracionError("Vasija no encontrada", 404);
  await ensureUserBodega(userId, vasija.bodega_id);
  return vasija;
}

export async function createVasija(input: CreateVasijaInput) {
  const { userId, bodegaId, codigo, tipo, capacidad_litros, etapa, ubicacion } = input;
  if (!bodegaId || !codigo) {
    throw new ElaboracionError("bodegaId y codigo son requeridos", 400);
  }
  await ensureUserBodega(userId, bodegaId);

  return prisma.vasija.create({
    data: {
      bodega_id: bodegaId,
      codigo,
      ...(tipo !== undefined ? { tipo: tipo as import("../../generated/prisma/index.js").VasijaTipo } : {}),
      ...(capacidad_litros !== undefined ? { capacidad_litros } : {}),
      ...(etapa !== undefined ? { etapa: etapa as import("../../generated/prisma/index.js").VasijaEtapa } : {}),
      ...(ubicacion !== undefined ? { ubicacion } : {}),
    },
  });
}

export async function updateVasija(
  vasijaId: string,
  userId: string,
  input: UpdateVasijaInput,
) {
  const existing = await getVasijaById(vasijaId, userId);
  return prisma.vasija.update({
    where: { vasija_id: existing.vasija_id },
    data: {
      ...(input.codigo !== undefined ? { codigo: input.codigo } : {}),
      ...(input.tipo !== undefined ? { tipo: input.tipo as import("../../generated/prisma/index.js").VasijaTipo } : {}),
      ...(input.capacidad_litros !== undefined
        ? { capacidad_litros: input.capacidad_litros }
        : {}),
      ...(input.etapa !== undefined ? { etapa: input.etapa as import("../../generated/prisma/index.js").VasijaEtapa } : {}),
      ...(input.ubicacion !== undefined ? { ubicacion: input.ubicacion } : {}),
    },
  });
}

export async function deleteVasija(vasijaId: string, userId: string) {
  const existing = await getVasijaById(vasijaId, userId);
  await prisma.vasija.delete({ where: { vasija_id: existing.vasija_id } });
  return { deleted: true };
}

export async function listCortes(userId: string, bodegaId?: string) {
  if (bodegaId) {
    await ensureUserBodega(userId, bodegaId);
    return prisma.corte.findMany({
      where: { bodega_id: bodegaId },
      include: { corte_componente: true },
      orderBy: [{ fecha: "desc" }],
    });
  }
  const bodegaIds = await getUserBodegaIds(userId);
  if (bodegaIds.length === 0) return [];
  return prisma.corte.findMany({
    where: { bodega_id: { in: bodegaIds } },
    include: { corte_componente: true },
    orderBy: [{ fecha: "desc" }],
  });
}

export async function getCorteById(corteId: string, userId: string) {
  await getCorteScoped(corteId, userId);
  return prisma.corte.findUnique({
    where: { corte_id: corteId },
    include: { corte_componente: true },
  });
}

export async function createCorte(input: CreateCorteInput) {
  const {
    userId,
    bodegaId,
    campaniaId,
    fecha,
    objetivo,
    responsableUserId,
    observaciones,
    componentes,
  } = input;
  if (!bodegaId || !fecha) {
    throw new ElaboracionError("bodegaId y fecha son requeridos", 400);
  }
  await ensureUserBodega(userId, bodegaId);

  if (campaniaId) {
    const campania = await prisma.campania.findUnique({
      where: { campania_id: campaniaId },
      select: { bodega_id: true },
    });
    if (!campania) throw new ElaboracionError("Campania no encontrada", 404);
    if (campania.bodega_id !== bodegaId) {
      throw new ElaboracionError("La campania no pertenece a la bodega", 400);
    }
  }

  const safeComponentes = normalizeComponentes(componentes);
  for (const c of safeComponentes) {
    if (c.vasijaId) {
      const vasija = await prisma.vasija.findUnique({
        where: { vasija_id: c.vasijaId },
        select: { bodega_id: true },
      });
      if (!vasija) throw new ElaboracionError("Vasija no encontrada", 404);
      if (vasija.bodega_id !== bodegaId) {
        throw new ElaboracionError("La vasija no pertenece a la bodega", 400);
      }
    }
    if (c.loteCosechaId) {
      const lote = await prisma.eventoCosecha.findUnique({
        where: { lote_cosecha_id: c.loteCosechaId },
        select: { lote_cosecha_id: true },
      });
      if (!lote) throw new ElaboracionError("Lote de cosecha no encontrado", 404);
    }
  }

  return prisma.$transaction(async (tx) => {
    const corte = await tx.corte.create({
      data: {
        bodega_id: bodegaId,
        ...(campaniaId !== undefined ? { campania_id: campaniaId } : {}),
        fecha: parseDate(fecha, "Fecha"),
        ...(objetivo !== undefined ? { objetivo } : {}),
        ...(responsableUserId !== undefined
          ? { responsable_user_id: responsableUserId }
          : {}),
        ...(observaciones !== undefined ? { observaciones } : {}),
      },
    });

    if (safeComponentes.length > 0) {
      await tx.corteComponente.createMany({
        data: safeComponentes.map((c) => ({
          corte_id: corte.corte_id,
          ...(c.vasijaId !== undefined ? { vasija_id: c.vasijaId } : {}),
          ...(c.loteCosechaId !== undefined
            ? { lote_cosecha_id: c.loteCosechaId }
            : {}),
          ...(c.volumen_l !== undefined ? { volumen_l: c.volumen_l } : {}),
          ...(c.porcentaje !== undefined ? { porcentaje: c.porcentaje } : {}),
        })),
      });
    }

    return tx.corte.findUnique({
      where: { corte_id: corte.corte_id },
      include: { corte_componente: true },
    });
  });
}

export async function updateCorte(
  corteId: string,
  userId: string,
  input: UpdateCorteInput,
) {
  const existing = await getCorteScoped(corteId, userId);
  const safeComponentes = normalizeComponentes(input.componentes);

  if (input.campaniaId !== undefined) {
    const campania = await prisma.campania.findUnique({
      where: { campania_id: input.campaniaId },
      select: { bodega_id: true },
    });
    if (!campania) throw new ElaboracionError("Campania no encontrada", 404);
    if (campania.bodega_id !== existing.bodega_id) {
      throw new ElaboracionError("La campania no pertenece a la bodega", 400);
    }
  }

  return prisma.$transaction(async (tx) => {
    await tx.corte.update({
      where: { corte_id: existing.corte_id },
      data: {
        ...(input.campaniaId !== undefined ? { campania_id: input.campaniaId } : {}),
        ...(input.fecha !== undefined ? { fecha: parseDate(input.fecha, "Fecha") } : {}),
        ...(input.objetivo !== undefined ? { objetivo: input.objetivo } : {}),
        ...(input.responsableUserId !== undefined
          ? { responsable_user_id: input.responsableUserId }
          : {}),
        ...(input.observaciones !== undefined
          ? { observaciones: input.observaciones }
          : {}),
      },
    });

    if (input.componentes !== undefined) {
      await tx.corteComponente.deleteMany({
        where: { corte_id: existing.corte_id },
      });
      if (safeComponentes.length > 0) {
        await tx.corteComponente.createMany({
          data: safeComponentes.map((c) => ({
            corte_id: existing.corte_id,
            ...(c.vasijaId !== undefined ? { vasija_id: c.vasijaId } : {}),
            ...(c.loteCosechaId !== undefined
              ? { lote_cosecha_id: c.loteCosechaId }
              : {}),
            ...(c.volumen_l !== undefined ? { volumen_l: c.volumen_l } : {}),
            ...(c.porcentaje !== undefined ? { porcentaje: c.porcentaje } : {}),
          })),
        });
      }
    }

    return tx.corte.findUnique({
      where: { corte_id: existing.corte_id },
      include: { corte_componente: true },
    });
  });
}

export async function deleteCorte(corteId: string, userId: string) {
  const existing = await getCorteScoped(corteId, userId);
  await prisma.corte.delete({ where: { corte_id: existing.corte_id } });
  return { deleted: true };
}

export async function listProductos(userId: string, bodegaId?: string) {
  if (bodegaId) {
    await ensureUserBodega(userId, bodegaId);
    return prisma.producto.findMany({
      where: { bodega_id: bodegaId },
      orderBy: [{ nombre_comercial: "asc" }],
    });
  }
  const bodegaIds = await getUserBodegaIds(userId);
  if (bodegaIds.length === 0) return [];
  return prisma.producto.findMany({
    where: { bodega_id: { in: bodegaIds } },
    orderBy: [{ nombre_comercial: "asc" }],
  });
}

export async function getProductoById(productoId: string, userId: string) {
  await getProductoScoped(productoId, userId);
  return prisma.producto.findUnique({ where: { producto_id: productoId } });
}

export async function createProducto(input: CreateProductoInput) {
  const { userId, bodegaId, nombre_comercial, varietal, anio, tipo, activo } = input;
  if (!bodegaId || !nombre_comercial) {
    throw new ElaboracionError("bodegaId y nombre_comercial son requeridos", 400);
  }
  await ensureUserBodega(userId, bodegaId);
  return prisma.producto.create({
    data: {
      bodega_id: bodegaId,
      nombre_comercial,
      ...(varietal !== undefined ? { varietal } : {}),
      ...(anio !== undefined ? { anio } : {}),
      ...(tipo !== undefined ? { tipo } : {}),
      ...(activo !== undefined ? { activo } : {}),
    },
  });
}

export async function updateProducto(
  productoId: string,
  userId: string,
  input: UpdateProductoInput,
) {
  await getProductoScoped(productoId, userId);
  return prisma.producto.update({
    where: { producto_id: productoId },
    data: {
      ...(input.nombre_comercial !== undefined
        ? { nombre_comercial: input.nombre_comercial }
        : {}),
      ...(input.varietal !== undefined ? { varietal: input.varietal } : {}),
      ...(input.anio !== undefined ? { anio: input.anio } : {}),
      ...(input.tipo !== undefined ? { tipo: input.tipo } : {}),
      ...(input.activo !== undefined ? { activo: input.activo } : {}),
    },
  });
}

export async function deleteProducto(productoId: string, userId: string) {
  await getProductoScoped(productoId, userId);
  await prisma.producto.delete({ where: { producto_id: productoId } });
  return { deleted: true };
}

export async function listLotesFraccionamiento(userId: string, bodegaId?: string) {
  const where = bodegaId
    ? { producto: { bodega_id: bodegaId } }
    : { producto: { bodega_id: { in: await getUserBodegaIds(userId) } } };

  if (bodegaId) {
    await ensureUserBodega(userId, bodegaId);
  }

  return prisma.loteFraccionamiento.findMany({
    where,
    include: {
      producto: true,
      corte: true,
    },
    orderBy: [{ fecha: "desc" }],
  });
}

export async function getLoteFraccionamientoById(
  loteFraccionamientoId: string,
  userId: string,
) {
  await getLoteFraccionamientoScoped(loteFraccionamientoId, userId);
  return prisma.loteFraccionamiento.findUnique({
    where: { lote_fraccionamiento_id: loteFraccionamientoId },
    include: { producto: true, corte: true, codigo_envase: true, despacho: true },
  });
}

export async function createLoteFraccionamiento(input: CreateLoteFraccionamientoInput) {
  const {
    userId,
    corteId,
    productoId,
    fecha,
    botellas,
    formato,
    codigo_lote_impreso,
  } = input;
  if (!corteId || !productoId || !fecha) {
    throw new ElaboracionError("corteId, productoId y fecha son requeridos", 400);
  }
  const corte = await getCorteScoped(corteId, userId);
  const producto = await getProductoScoped(productoId, userId);

  if (corte.bodega_id !== producto.bodega_id) {
    throw new ElaboracionError("Corte y producto deben pertenecer a la misma bodega", 400);
  }

  return prisma.loteFraccionamiento.create({
    data: {
      corte_id: corteId,
      producto_id: productoId,
      fecha: parseDate(fecha, "Fecha"),
      ...(botellas !== undefined ? { botellas } : {}),
      ...(formato !== undefined ? { formato } : {}),
      ...(codigo_lote_impreso !== undefined ? { codigo_lote_impreso } : {}),
    },
  });
}

export async function updateLoteFraccionamiento(
  loteFraccionamientoId: string,
  userId: string,
  input: UpdateLoteFraccionamientoInput,
) {
  await getLoteFraccionamientoScoped(loteFraccionamientoId, userId);
  return prisma.loteFraccionamiento.update({
    where: { lote_fraccionamiento_id: loteFraccionamientoId },
    data: {
      ...(input.fecha !== undefined ? { fecha: parseDate(input.fecha, "Fecha") } : {}),
      ...(input.botellas !== undefined ? { botellas: input.botellas } : {}),
      ...(input.formato !== undefined ? { formato: input.formato } : {}),
      ...(input.codigo_lote_impreso !== undefined
        ? { codigo_lote_impreso: input.codigo_lote_impreso }
        : {}),
    },
  });
}

export async function deleteLoteFraccionamiento(
  loteFraccionamientoId: string,
  userId: string,
) {
  await getLoteFraccionamientoScoped(loteFraccionamientoId, userId);
  await prisma.loteFraccionamiento.delete({
    where: { lote_fraccionamiento_id: loteFraccionamientoId },
  });
  return { deleted: true };
}

export async function listCodigosEnvase(
  userId: string,
  opts?: { bodegaId?: string; loteFraccionamientoId?: string },
) {
  if (opts?.bodegaId) await ensureUserBodega(userId, opts.bodegaId);

  const bodegaIds = opts?.bodegaId
    ? [opts.bodegaId]
    : await getUserBodegaIds(userId);

  return prisma.codigoEnvase.findMany({
    where: {
      lote_fraccionamiento: {
        producto: {
          bodega_id: { in: bodegaIds },
        },
      },
      ...(opts?.loteFraccionamientoId
        ? { lote_fraccionamiento_id: opts.loteFraccionamientoId }
        : {}),
    },
    include: {
      lote_fraccionamiento: true,
    },
    orderBy: [{ created_at: "desc" }],
  });
}

export async function getCodigoEnvaseById(codigoEnvaseId: string, userId: string) {
  const codigo = await prisma.codigoEnvase.findUnique({
    where: { codigo_envase_id: codigoEnvaseId },
    include: {
      lote_fraccionamiento: {
        include: { producto: { select: { bodega_id: true } } },
      },
    },
  });
  if (!codigo) throw new ElaboracionError("Codigo de envase no encontrado", 404);
  await ensureUserBodega(userId, codigo.lote_fraccionamiento.producto.bodega_id);
  return codigo;
}

export async function createCodigoEnvase(input: CreateCodigoEnvaseInput) {
  const { userId, loteFraccionamientoId, codigo_qr, codigo_lote_impreso } = input;
  if (!loteFraccionamientoId || !codigo_qr) {
    throw new ElaboracionError("loteFraccionamientoId y codigo_qr son requeridos", 400);
  }
  await getLoteFraccionamientoScoped(loteFraccionamientoId, userId);

  return prisma.codigoEnvase.create({
    data: {
      lote_fraccionamiento_id: loteFraccionamientoId,
      codigo_qr,
      ...(codigo_lote_impreso !== undefined ? { codigo_lote_impreso } : {}),
    },
  });
}

export async function updateCodigoEnvase(
  codigoEnvaseId: string,
  userId: string,
  input: UpdateCodigoEnvaseInput,
) {
  await getCodigoEnvaseById(codigoEnvaseId, userId);
  return prisma.codigoEnvase.update({
    where: { codigo_envase_id: codigoEnvaseId },
    data: {
      ...(input.codigo_qr !== undefined ? { codigo_qr: input.codigo_qr } : {}),
      ...(input.codigo_lote_impreso !== undefined
        ? { codigo_lote_impreso: input.codigo_lote_impreso }
        : {}),
    },
  });
}

export async function deleteCodigoEnvase(codigoEnvaseId: string, userId: string) {
  await getCodigoEnvaseById(codigoEnvaseId, userId);
  await prisma.codigoEnvase.delete({ where: { codigo_envase_id: codigoEnvaseId } });
  return { deleted: true };
}

export async function listLotesCosecha(input: ListLotesCosechaInput) {
  const { userId, bodegaId, fincaId, cuartelId } = input;
  const bodegaIds = bodegaId ? [bodegaId] : await getUserBodegaIds(userId);
  if (bodegaIds.length === 0) return [];
  if (bodegaId) await ensureUserBodega(userId, bodegaId);

  const where: Prisma.EventoCosechaWhereInput = {
    cuartel: {
      ...(cuartelId ? { cuartel_id: cuartelId } : {}),
      ...(fincaId ? { finca_id: fincaId } : {}),
      finca: { bodega_id: { in: bodegaIds } },
    },
  };

  return prisma.eventoCosecha.findMany({
    where,
    select: {
      lote_cosecha_id: true,
      fecha_cosecha: true,
      cantidad: true,
      unidad: true,
      destino: true,
      cuartel_id: true,
      campania_id: true,
      cuartel: {
        select: {
          cuartel_id: true,
          codigo_cuartel: true,
          finca_id: true,
          finca: {
            select: {
              finca_id: true,
              nombre_finca: true,
              bodega_id: true,
            },
          },
        },
      },
    },
    orderBy: [{ fecha_cosecha: "desc" }],
  });
}

export async function listRemitosUva(userId: string, bodegaId?: string) {
  if (bodegaId) {
    await ensureUserBodega(userId, bodegaId);
    return prisma.remitoUva.findMany({
      where: { bodega_id: bodegaId },
      include: { finca: true, cuartel: true, evento_cosecha: true, recepcion_bodega: true },
      orderBy: [{ salida_finca: "desc" }],
    });
  }
  const bodegaIds = await getUserBodegaIds(userId);
  if (bodegaIds.length === 0) return [];
  return prisma.remitoUva.findMany({
    where: { bodega_id: { in: bodegaIds } },
    include: { finca: true, cuartel: true, evento_cosecha: true, recepcion_bodega: true },
    orderBy: [{ salida_finca: "desc" }],
  });
}

export async function getRemitoUvaById(remitoUvaId: string, userId: string) {
  await getRemitoScoped(remitoUvaId, userId);
  return prisma.remitoUva.findUnique({
    where: { remito_uva_id: remitoUvaId },
    include: { finca: true, cuartel: true, evento_cosecha: true, recepcion_bodega: true },
  });
}

export async function createRemitoUva(input: CreateRemitoUvaInput) {
  const {
    userId,
    bodegaId,
    fincaId,
    cuartelId,
    loteCosechaId,
    salida_finca,
    llegada_bodega,
    transportista,
    patente,
    kg_declarados,
  } = input;
  if (!bodegaId || !fincaId || !cuartelId || !salida_finca) {
    throw new ElaboracionError(
      "bodegaId, fincaId, cuartelId y salida_finca son requeridos",
      400,
    );
  }
  await ensureUserBodega(userId, bodegaId);
  await validateRemitoOrigen({ bodegaId, fincaId, cuartelId, loteCosechaId: loteCosechaId ?? null });

  return prisma.remitoUva.create({
    data: {
      bodega_id: bodegaId,
      finca_id: fincaId,
      cuartel_id: cuartelId,
      ...(loteCosechaId ? { lote_cosecha_id: loteCosechaId } : {}),
      salida_finca: parseDate(salida_finca, "Salida finca"),
      ...(llegada_bodega !== undefined
        ? { llegada_bodega: parseDate(llegada_bodega, "Llegada bodega") }
        : {}),
      ...(transportista !== undefined ? { transportista } : {}),
      ...(patente !== undefined ? { patente } : {}),
      ...(kg_declarados !== undefined ? { kg_declarados } : {}),
    },
  });
}

export async function updateRemitoUva(
  remitoUvaId: string,
  userId: string,
  input: UpdateRemitoUvaInput,
) {
  const current = await getRemitoScoped(remitoUvaId, userId);
  const nextBodegaId = current.bodega_id;
  const nextFincaId = input.fincaId;
  const nextCuartelId = input.cuartelId;
  const nextLoteCosechaId = input.loteCosechaId;

  if (nextFincaId || nextCuartelId || nextLoteCosechaId) {
    const existing = await prisma.remitoUva.findUnique({
      where: { remito_uva_id: remitoUvaId },
      select: { finca_id: true, cuartel_id: true, lote_cosecha_id: true },
    });
    if (!existing) throw new ElaboracionError("Remito de uva no encontrado", 404);
    await validateRemitoOrigen({
      bodegaId: nextBodegaId,
      fincaId: nextFincaId ?? existing.finca_id,
      cuartelId: nextCuartelId ?? existing.cuartel_id,
      loteCosechaId: nextLoteCosechaId ?? existing.lote_cosecha_id,
    });
  }

  return prisma.remitoUva.update({
    where: { remito_uva_id: remitoUvaId },
    data: {
      ...(input.fincaId !== undefined ? { finca_id: input.fincaId } : {}),
      ...(input.cuartelId !== undefined ? { cuartel_id: input.cuartelId } : {}),
      ...(input.loteCosechaId !== undefined ? { lote_cosecha_id: input.loteCosechaId } : {}),
      ...(input.salida_finca !== undefined
        ? { salida_finca: parseDate(input.salida_finca, "Salida finca") }
        : {}),
      ...(input.llegada_bodega !== undefined
        ? { llegada_bodega: parseDate(input.llegada_bodega, "Llegada bodega") }
        : {}),
      ...(input.transportista !== undefined ? { transportista: input.transportista } : {}),
      ...(input.patente !== undefined ? { patente: input.patente } : {}),
      ...(input.kg_declarados !== undefined ? { kg_declarados: input.kg_declarados } : {}),
    },
  });
}

export async function deleteRemitoUva(remitoUvaId: string, userId: string) {
  await getRemitoScoped(remitoUvaId, userId);
  await prisma.remitoUva.delete({ where: { remito_uva_id: remitoUvaId } });
  return { deleted: true };
}

export async function listRecepcionesBodega(userId: string, bodegaId?: string) {
  if (bodegaId) await ensureUserBodega(userId, bodegaId);
  const bodegaIds = bodegaId ? [bodegaId] : await getUserBodegaIds(userId);
  if (bodegaIds.length === 0) return [];
  return prisma.recepcionBodega.findMany({
    where: { remito_uva: { bodega_id: { in: bodegaIds } } },
    include: {
      remito_uva: { include: { finca: true, cuartel: true, evento_cosecha: true } },
      analisis_recepcion: true,
    },
    orderBy: [{ fecha_hora: "desc" }],
  });
}

export async function getRecepcionBodegaById(recepcionBodegaId: string, userId: string) {
  await getRecepcionScoped(recepcionBodegaId, userId);
  return prisma.recepcionBodega.findUnique({
    where: { recepcion_bodega_id: recepcionBodegaId },
    include: {
      remito_uva: { include: { finca: true, cuartel: true, evento_cosecha: true } },
      analisis_recepcion: true,
    },
  });
}

export async function createRecepcionBodega(input: CreateRecepcionBodegaInput) {
  const { userId, remitoUvaId, fecha_hora, kg_pesados, clasificacion, observaciones } = input;
  if (!remitoUvaId || !fecha_hora) {
    throw new ElaboracionError("remitoUvaId y fecha_hora son requeridos", 400);
  }
  const remito = await getRemitoScoped(remitoUvaId, userId);
  return prisma.recepcionBodega.create({
    data: {
      remito_uva_id: remito.remito_uva_id,
      fecha_hora: parseDate(fecha_hora, "Fecha hora"),
      ...(kg_pesados !== undefined ? { kg_pesados } : {}),
      ...(clasificacion !== undefined ? { clasificacion } : {}),
      ...(observaciones !== undefined ? { observaciones } : {}),
    },
  });
}

export async function updateRecepcionBodega(
  recepcionBodegaId: string,
  userId: string,
  input: UpdateRecepcionBodegaInput,
) {
  await getRecepcionScoped(recepcionBodegaId, userId);
  return prisma.recepcionBodega.update({
    where: { recepcion_bodega_id: recepcionBodegaId },
    data: {
      ...(input.fecha_hora !== undefined
        ? { fecha_hora: parseDate(input.fecha_hora, "Fecha hora") }
        : {}),
      ...(input.kg_pesados !== undefined ? { kg_pesados: input.kg_pesados } : {}),
      ...(input.clasificacion !== undefined ? { clasificacion: input.clasificacion } : {}),
      ...(input.observaciones !== undefined ? { observaciones: input.observaciones } : {}),
    },
  });
}

export async function deleteRecepcionBodega(recepcionBodegaId: string, userId: string) {
  await getRecepcionScoped(recepcionBodegaId, userId);
  await prisma.recepcionBodega.delete({ where: { recepcion_bodega_id: recepcionBodegaId } });
  return { deleted: true };
}

export async function listAnalisisRecepcion(userId: string, bodegaId?: string) {
  if (bodegaId) await ensureUserBodega(userId, bodegaId);
  const bodegaIds = bodegaId ? [bodegaId] : await getUserBodegaIds(userId);
  if (bodegaIds.length === 0) return [];
  return prisma.analisisRecepcion.findMany({
    where: { recepcion_bodega: { remito_uva: { bodega_id: { in: bodegaIds } } } },
    include: { recepcion_bodega: true },
    orderBy: [{ created_at: "desc" }],
  });
}

export async function getAnalisisRecepcionById(analisisRecepcionId: string, userId: string) {
  await getAnalisisScoped(analisisRecepcionId, userId);
  return prisma.analisisRecepcion.findUnique({
    where: { analisis_recepcion_id: analisisRecepcionId },
    include: { recepcion_bodega: true },
  });
}

export async function createAnalisisRecepcion(input: CreateAnalisisRecepcionInput) {
  const {
    userId,
    recepcionBodegaId,
    brix,
    ph,
    acidez,
    sanidad,
    temperatura_uva,
    observaciones,
  } = input;
  if (!recepcionBodegaId) {
    throw new ElaboracionError("recepcionBodegaId es requerido", 400);
  }
  await getRecepcionScoped(recepcionBodegaId, userId);
  return prisma.analisisRecepcion.create({
    data: {
      recepcion_bodega_id: recepcionBodegaId,
      ...(brix !== undefined ? { brix } : {}),
      ...(ph !== undefined ? { ph } : {}),
      ...(acidez !== undefined ? { acidez } : {}),
      ...(sanidad !== undefined ? { sanidad } : {}),
      ...(temperatura_uva !== undefined ? { temperatura_uva } : {}),
      ...(observaciones !== undefined ? { observaciones } : {}),
    },
  });
}

export async function updateAnalisisRecepcion(
  analisisRecepcionId: string,
  userId: string,
  input: UpdateAnalisisRecepcionInput,
) {
  await getAnalisisScoped(analisisRecepcionId, userId);
  return prisma.analisisRecepcion.update({
    where: { analisis_recepcion_id: analisisRecepcionId },
    data: {
      ...(input.brix !== undefined ? { brix: input.brix } : {}),
      ...(input.ph !== undefined ? { ph: input.ph } : {}),
      ...(input.acidez !== undefined ? { acidez: input.acidez } : {}),
      ...(input.sanidad !== undefined ? { sanidad: input.sanidad } : {}),
      ...(input.temperatura_uva !== undefined
        ? { temperatura_uva: input.temperatura_uva }
        : {}),
      ...(input.observaciones !== undefined
        ? { observaciones: input.observaciones }
        : {}),
    },
  });
}

export async function deleteAnalisisRecepcion(
  analisisRecepcionId: string,
  userId: string,
) {
  await getAnalisisScoped(analisisRecepcionId, userId);
  await prisma.analisisRecepcion.delete({
    where: { analisis_recepcion_id: analisisRecepcionId },
  });
  return { deleted: true };
}

function decorateOperacionVasija<
  T extends {
    orden_enologo?: null | { enologo_user_id?: string | null };
  },
>(operacion: T) {
  return {
    ...operacion,
    enologo_user_id: operacion.orden_enologo?.enologo_user_id ?? null,
  };
}

export async function listOperacionesVasija(userId: string, bodegaId?: string) {
  if (bodegaId) {
    await ensureUserBodega(userId, bodegaId);
    const operaciones = await prisma.operacionVasija.findMany({
      where: { bodega_id: bodegaId },
      include: {
        vasija_origen: true,
        vasija_destino: true,
        orden_enologo: true,
        recepcion_bodega: true,
      },
      orderBy: [{ fecha_hora: "desc" }],
    });
    return operaciones.map(decorateOperacionVasija);
  }
  const bodegaIds = await getUserBodegaIds(userId);
  if (bodegaIds.length === 0) return [];
  const operaciones = await prisma.operacionVasija.findMany({
    where: { bodega_id: { in: bodegaIds } },
    include: {
      vasija_origen: true,
      vasija_destino: true,
      orden_enologo: true,
      recepcion_bodega: true,
    },
    orderBy: [{ fecha_hora: "desc" }],
  });
  return operaciones.map(decorateOperacionVasija);
}

export async function getOperacionVasijaById(operacionVasijaId: string, userId: string) {
  await getOperacionScoped(operacionVasijaId, userId);
  const operacion = await prisma.operacionVasija.findUnique({
    where: { operacion_vasija_id: operacionVasijaId },
    include: {
      vasija_origen: true,
      vasija_destino: true,
      orden_enologo: true,
      recepcion_bodega: true,
    },
  });
  return operacion ? decorateOperacionVasija(operacion) : operacion;
}

export async function createOperacionVasija(input: CreateOperacionVasijaInput) {
  const {
    userId,
    bodegaId,
    vasijaOrigenId,
    vasijaDestinoId,
    ordenEnologoId,
    enologoUserId,
    recepcionBodegaId,
    tipo,
    fecha_hora,
    actorUserId,
    volumen_movido_l,
    observaciones,
  } = input;
  if (!bodegaId || !tipo || !fecha_hora) {
    throw new ElaboracionError("bodegaId, tipo y fecha_hora son requeridos", 400);
  }
  if (!vasijaOrigenId && !vasijaDestinoId) {
    throw new ElaboracionError("Se requiere al menos una vasija (origen o destino)", 400);
  }
  await ensureUserBodega(userId, bodegaId);

  if (vasijaOrigenId) {
    const vasija = await prisma.vasija.findUnique({
      where: { vasija_id: vasijaOrigenId },
      select: { bodega_id: true },
    });
    if (!vasija || vasija.bodega_id !== bodegaId) {
      throw new ElaboracionError("vasijaOrigenId invalida para la bodega", 400);
    }
  }
  if (vasijaDestinoId) {
    const vasija = await prisma.vasija.findUnique({
      where: { vasija_id: vasijaDestinoId },
      select: { bodega_id: true },
    });
    if (!vasija || vasija.bodega_id !== bodegaId) {
      throw new ElaboracionError("vasijaDestinoId invalida para la bodega", 400);
    }
  }
  const resolvedOrdenEnologoId = await resolveOrdenEnologoId({
    bodegaId,
    fechaHora: fecha_hora,
    ordenEnologoId,
    enologoUserId,
  });
  if (recepcionBodegaId) {
    const recepcion = await prisma.recepcionBodega.findUnique({
      where: { recepcion_bodega_id: recepcionBodegaId },
      select: { remito_uva: { select: { bodega_id: true } } },
    });
    if (!recepcion || recepcion.remito_uva.bodega_id !== bodegaId) {
      throw new ElaboracionError("recepcionBodegaId invalida para la bodega", 400);
    }
  }

  return prisma.operacionVasija.create({
    data: {
      bodega_id: bodegaId,
      ...(vasijaOrigenId !== undefined ? { vasija_origen_id: vasijaOrigenId } : {}),
      ...(vasijaDestinoId !== undefined ? { vasija_destino_id: vasijaDestinoId } : {}),
      ...(resolvedOrdenEnologoId !== undefined ? { orden_enologo_id: resolvedOrdenEnologoId } : {}),
      ...(recepcionBodegaId !== undefined
        ? { recepcion_bodega_id: recepcionBodegaId }
        : {}),
      tipo,
      fecha_hora: parseDate(fecha_hora, "Fecha hora"),
      ...(actorUserId !== undefined ? { user_id: actorUserId } : {}),
      ...(volumen_movido_l !== undefined ? { volumen_movido_l } : {}),
      ...(observaciones !== undefined ? { observaciones } : {}),
    },
  });
}

export async function updateOperacionVasija(
  operacionVasijaId: string,
  userId: string,
  input: UpdateOperacionVasijaInput,
) {
  const operacion = await getOperacionScoped(operacionVasijaId, userId);
  const nextFechaHora = input.fecha_hora ?? operacion.fecha_hora.toISOString();
  const resolvedOrdenEnologoId = input.ordenEnologoId !== undefined || input.enologoUserId !== undefined
    ? await resolveOrdenEnologoId({
        bodegaId: operacion.bodega_id,
        fechaHora: nextFechaHora,
        ordenEnologoId: input.ordenEnologoId,
        enologoUserId: input.enologoUserId,
      })
    : undefined;

  return prisma.operacionVasija.update({
    where: { operacion_vasija_id: operacionVasijaId },
    data: {
      ...(input.vasijaOrigenId !== undefined
        ? { vasija_origen_id: input.vasijaOrigenId }
        : {}),
      ...(input.vasijaDestinoId !== undefined
        ? { vasija_destino_id: input.vasijaDestinoId }
        : {}),
      ...(input.ordenEnologoId !== undefined || input.enologoUserId !== undefined
        ? { orden_enologo_id: resolvedOrdenEnologoId ?? null }
        : {}),
      ...(input.recepcionBodegaId !== undefined
        ? { recepcion_bodega_id: input.recepcionBodegaId }
        : {}),
      ...(input.tipo !== undefined ? { tipo: input.tipo } : {}),
      ...(input.fecha_hora !== undefined
        ? { fecha_hora: parseDate(input.fecha_hora, "Fecha hora") }
        : {}),
      ...(input.actorUserId !== undefined ? { user_id: input.actorUserId } : {}),
      ...(input.volumen_movido_l !== undefined
        ? { volumen_movido_l: input.volumen_movido_l }
        : {}),
      ...(input.observaciones !== undefined
        ? { observaciones: input.observaciones }
        : {}),
      bodega_id: operacion.bodega_id,
    },
  });
}

export async function deleteOperacionVasija(operacionVasijaId: string, userId: string) {
  await getOperacionScoped(operacionVasijaId, userId);
  await prisma.operacionVasija.delete({ where: { operacion_vasija_id: operacionVasijaId } });
  return { deleted: true };
}

export async function listDespachos(userId: string, bodegaId?: string) {
  if (bodegaId) await ensureUserBodega(userId, bodegaId);
  const bodegaIds = bodegaId ? [bodegaId] : await getUserBodegaIds(userId);
  if (bodegaIds.length === 0) return [];
  return prisma.despacho.findMany({
    where: { lote_fraccionamiento: { producto: { bodega_id: { in: bodegaIds } } } },
    include: { lote_fraccionamiento: true },
    orderBy: [{ fecha: "desc" }],
  });
}

export async function getDespachoById(despachoId: string, userId: string) {
  await getDespachoScoped(despachoId, userId);
  return prisma.despacho.findUnique({
    where: { despacho_id: despachoId },
    include: { lote_fraccionamiento: true },
  });
}

export async function createDespacho(input: CreateDespachoInput) {
  const { userId, loteFraccionamientoId, fecha, destino, cantidad, documento } = input;
  if (!loteFraccionamientoId || !fecha) {
    throw new ElaboracionError("loteFraccionamientoId y fecha son requeridos", 400);
  }
  await getLoteFraccionamientoScoped(loteFraccionamientoId, userId);
  return prisma.despacho.create({
    data: {
      lote_fraccionamiento_id: loteFraccionamientoId,
      fecha: parseDate(fecha, "Fecha"),
      ...(destino !== undefined ? { destino } : {}),
      ...(cantidad !== undefined ? { cantidad } : {}),
      ...(documento !== undefined ? { documento } : {}),
    },
  });
}

export async function updateDespacho(
  despachoId: string,
  userId: string,
  input: UpdateDespachoInput,
) {
  await getDespachoScoped(despachoId, userId);
  return prisma.despacho.update({
    where: { despacho_id: despachoId },
    data: {
      ...(input.fecha !== undefined ? { fecha: parseDate(input.fecha, "Fecha") } : {}),
      ...(input.destino !== undefined ? { destino: input.destino } : {}),
      ...(input.cantidad !== undefined ? { cantidad: input.cantidad } : {}),
      ...(input.documento !== undefined ? { documento: input.documento } : {}),
    },
  });
}

export async function deleteDespacho(despachoId: string, userId: string) {
  await getDespachoScoped(despachoId, userId);
  await prisma.despacho.delete({ where: { despacho_id: despachoId } });
  return { deleted: true };
}

export async function listCius(userId: string, bodegaId?: string) {
  if (bodegaId) {
    await ensureUserBodega(userId, bodegaId);
    return prisma.ciu.findMany({
      where: { bodega_id: bodegaId },
      include: {
        finca: true,
        recepcion_bodega: { include: { remito_uva: { include: { finca: true, cuartel: true } } } },
      },
      orderBy: [{ emitido_at: "desc" }],
    });
  }
  const bodegaIds = await getUserBodegaIds(userId);
  if (bodegaIds.length === 0) return [];
  return prisma.ciu.findMany({
    where: { bodega_id: { in: bodegaIds } },
    include: {
      finca: true,
      recepcion_bodega: { include: { remito_uva: { include: { finca: true, cuartel: true } } } },
    },
    orderBy: [{ emitido_at: "desc" }],
  });
}

export async function getCiuById(ciuId: string, userId: string) {
  await getCiuScoped(ciuId, userId);
  return prisma.ciu.findUnique({
    where: { ciu_id: ciuId },
    include: {
      finca: true,
      recepcion_bodega: { include: { remito_uva: { include: { finca: true, cuartel: true } } } },
    },
  });
}

/**
 * Valida que la recepción exista, pertenezca a la bodega del usuario y a la
 * bodega indicada, y devuelve la finca del ingreso (la finca del CIU "sigue"
 * al ingreso, no se ingresa por separado).
 */
async function resolveRecepcionForCiu(
  recepcionBodegaId: string,
  userId: string,
  bodegaId: string,
) {
  const recepcion = await getRecepcionScoped(recepcionBodegaId, userId);
  if (recepcion.remito_uva.bodega_id !== bodegaId) {
    throw new ElaboracionError("El ingreso (recepción) no pertenece a la bodega indicada", 400);
  }
  return { fincaId: recepcion.remito_uva.finca_id };
}

export async function createCiu(input: CreateCiuInput) {
  const { userId, bodegaId, recepcionBodegaId, codigo_ciu, estado, emitido_at, observaciones } =
    input;
  if (!bodegaId || !recepcionBodegaId || !codigo_ciu || !emitido_at) {
    throw new ElaboracionError(
      "bodegaId, recepcionBodegaId, codigo_ciu y emitido_at son requeridos",
      400,
    );
  }
  await ensureUserBodega(userId, bodegaId);
  const { fincaId } = await resolveRecepcionForCiu(recepcionBodegaId, userId, bodegaId);
  const existing = await prisma.ciu.findUnique({
    where: { recepcion_bodega_id: recepcionBodegaId },
    select: { ciu_id: true },
  });
  if (existing) {
    throw new ElaboracionError("Ese ingreso ya tiene un CIU emitido", 409);
  }
  return prisma.ciu.create({
    data: {
      bodega_id: bodegaId,
      finca_id: fincaId,
      recepcion_bodega_id: recepcionBodegaId,
      codigo_ciu,
      emitido_at: parseDate(emitido_at, "Emitido at"),
      ...(estado !== undefined ? { estado } : {}),
      ...(observaciones !== undefined ? { observaciones } : {}),
    },
  });
}

export async function updateCiu(ciuId: string, userId: string, input: UpdateCiuInput) {
  const current = await getCiuScoped(ciuId, userId);
  // Si se reasigna el ingreso, la finca del CIU se deriva del nuevo ingreso.
  let nextFincaId: string | null | undefined;
  if (input.recepcionBodegaId !== undefined) {
    const existing = await prisma.ciu.findUnique({
      where: { recepcion_bodega_id: input.recepcionBodegaId },
      select: { ciu_id: true },
    });
    if (existing && existing.ciu_id !== ciuId) {
      throw new ElaboracionError("Ese ingreso ya tiene un CIU emitido", 409);
    }
    ({ fincaId: nextFincaId } = await resolveRecepcionForCiu(
      input.recepcionBodegaId,
      userId,
      current.bodega_id,
    ));
  }
  return prisma.ciu.update({
    where: { ciu_id: ciuId },
    data: {
      ...(input.recepcionBodegaId !== undefined
        ? { recepcion_bodega_id: input.recepcionBodegaId, finca_id: nextFincaId ?? null }
        : {}),
      ...(input.codigo_ciu !== undefined ? { codigo_ciu: input.codigo_ciu } : {}),
      ...(input.estado !== undefined ? { estado: input.estado } : {}),
      ...(input.emitido_at !== undefined
        ? { emitido_at: parseDate(input.emitido_at, "Emitido at") }
        : {}),
      ...(input.observaciones !== undefined ? { observaciones: input.observaciones } : {}),
    },
  });
}

export async function deleteCiu(ciuId: string, userId: string) {
  await getCiuScoped(ciuId, userId);
  await prisma.ciu.delete({ where: { ciu_id: ciuId } });
  return { deleted: true };
}

export async function listQcIngresoUva(userId: string, bodegaId?: string) {
  if (bodegaId) await ensureUserBodega(userId, bodegaId);
  const bodegaIds = bodegaId ? [bodegaId] : await getUserBodegaIds(userId);
  if (bodegaIds.length === 0) return [];
  return prisma.qcIngresoUva.findMany({
    where: { bodega_id: { in: bodegaIds } },
    include: { recepcion_bodega: true },
    orderBy: [{ fecha_hora: "desc" }],
  });
}

export async function getQcIngresoUvaById(qcIngresoUvaId: string, userId: string) {
  await getQcIngresoUvaScoped(qcIngresoUvaId, userId);
  return prisma.qcIngresoUva.findUnique({
    where: { qc_ingreso_uva_id: qcIngresoUvaId },
    include: { recepcion_bodega: true },
  });
}

export async function createQcIngresoUva(input: CreateQcIngresoUvaInput) {
  const {
    userId,
    bodegaId,
    recepcionBodegaId,
    fecha_hora,
    brix,
    ph,
    acidez,
    temperatura_uva,
    estado_pcc,
    aprobado,
    observaciones,
  } = input;
  if (!bodegaId || !recepcionBodegaId || !fecha_hora) {
    throw new ElaboracionError(
      "bodegaId, recepcionBodegaId y fecha_hora son requeridos",
      400,
    );
  }
  await ensureUserBodega(userId, bodegaId);
  const recepcion = await getRecepcionScoped(recepcionBodegaId, userId);
  if (recepcion.remito_uva.bodega_id !== bodegaId) {
    throw new ElaboracionError("La recepcion no pertenece a la bodega", 400);
  }
  return prisma.qcIngresoUva.create({
    data: {
      bodega_id: bodegaId,
      recepcion_bodega_id: recepcionBodegaId,
      fecha_hora: parseDate(fecha_hora, "Fecha hora"),
      ...(brix !== undefined ? { brix } : {}),
      ...(ph !== undefined ? { ph } : {}),
      ...(acidez !== undefined ? { acidez } : {}),
      ...(temperatura_uva !== undefined ? { temperatura_uva } : {}),
      ...(estado_pcc !== undefined ? { estado_pcc } : {}),
      ...(aprobado !== undefined ? { aprobado } : {}),
      ...(observaciones !== undefined ? { observaciones } : {}),
    },
  });
}

export async function updateQcIngresoUva(
  qcIngresoUvaId: string,
  userId: string,
  input: UpdateQcIngresoUvaInput,
) {
  await getQcIngresoUvaScoped(qcIngresoUvaId, userId);
  return prisma.qcIngresoUva.update({
    where: { qc_ingreso_uva_id: qcIngresoUvaId },
    data: {
      ...(input.fecha_hora !== undefined
        ? { fecha_hora: parseDate(input.fecha_hora, "Fecha hora") }
        : {}),
      ...(input.brix !== undefined ? { brix: input.brix } : {}),
      ...(input.ph !== undefined ? { ph: input.ph } : {}),
      ...(input.acidez !== undefined ? { acidez: input.acidez } : {}),
      ...(input.temperatura_uva !== undefined
        ? { temperatura_uva: input.temperatura_uva }
        : {}),
      ...(input.estado_pcc !== undefined ? { estado_pcc: input.estado_pcc } : {}),
      ...(input.aprobado !== undefined ? { aprobado: input.aprobado } : {}),
      ...(input.observaciones !== undefined
        ? { observaciones: input.observaciones }
        : {}),
    },
  });
}

export async function deleteQcIngresoUva(qcIngresoUvaId: string, userId: string) {
  await getQcIngresoUvaScoped(qcIngresoUvaId, userId);
  await prisma.qcIngresoUva.delete({ where: { qc_ingreso_uva_id: qcIngresoUvaId } });
  return { deleted: true };
}

export async function listExistenciasVasija(userId: string, bodegaId?: string) {
  if (bodegaId) await ensureUserBodega(userId, bodegaId);
  const bodegaIds = bodegaId ? [bodegaId] : await getUserBodegaIds(userId);
  if (bodegaIds.length === 0) return [];
  return prisma.existenciaVasija.findMany({
    where: { vasija: { bodega_id: { in: bodegaIds } } },
    include: { vasija: true },
    orderBy: [{ fecha_hora: "desc" }],
  });
}

export async function getExistenciaVasijaById(
  existenciaVasijaId: string,
  userId: string,
) {
  await getExistenciaVasijaScoped(existenciaVasijaId, userId);
  return prisma.existenciaVasija.findUnique({
    where: { existencia_vasija_id: existenciaVasijaId },
    include: { vasija: true },
  });
}

export async function createExistenciaVasija(input: CreateExistenciaVasijaInput) {
  const {
    userId,
    vasijaId,
    fecha_hora,
    volumen_l,
    grado_alcohol,
    azucar_residual_g_l,
    observaciones,
  } = input;
  if (!vasijaId || !fecha_hora) {
    throw new ElaboracionError("vasijaId y fecha_hora son requeridos", 400);
  }
  const vasija = await prisma.vasija.findUnique({
    where: { vasija_id: vasijaId },
    select: { bodega_id: true },
  });
  if (!vasija) throw new ElaboracionError("Vasija no encontrada", 404);
  await ensureUserBodega(userId, vasija.bodega_id);
  return prisma.existenciaVasija.create({
    data: {
      vasija_id: vasijaId,
      fecha_hora: parseDate(fecha_hora, "Fecha hora"),
      ...(volumen_l !== undefined ? { volumen_l } : {}),
      ...(grado_alcohol !== undefined ? { grado_alcohol } : {}),
      ...(azucar_residual_g_l !== undefined ? { azucar_residual_g_l } : {}),
      ...(observaciones !== undefined ? { observaciones } : {}),
    },
  });
}

export async function updateExistenciaVasija(
  existenciaVasijaId: string,
  userId: string,
  input: UpdateExistenciaVasijaInput,
) {
  await getExistenciaVasijaScoped(existenciaVasijaId, userId);
  return prisma.existenciaVasija.update({
    where: { existencia_vasija_id: existenciaVasijaId },
    data: {
      ...(input.fecha_hora !== undefined
        ? { fecha_hora: parseDate(input.fecha_hora, "Fecha hora") }
        : {}),
      ...(input.volumen_l !== undefined ? { volumen_l: input.volumen_l } : {}),
      ...(input.grado_alcohol !== undefined ? { grado_alcohol: input.grado_alcohol } : {}),
      ...(input.azucar_residual_g_l !== undefined
        ? { azucar_residual_g_l: input.azucar_residual_g_l }
        : {}),
      ...(input.observaciones !== undefined
        ? { observaciones: input.observaciones }
        : {}),
    },
  });
}

export async function deleteExistenciaVasija(
  existenciaVasijaId: string,
  userId: string,
) {
  await getExistenciaVasijaScoped(existenciaVasijaId, userId);
  await prisma.existenciaVasija.delete({
    where: { existencia_vasija_id: existenciaVasijaId },
  });
  return { deleted: true };
}

export async function listControlesFermentacion(userId: string, bodegaId?: string) {
  if (bodegaId) await ensureUserBodega(userId, bodegaId);
  const bodegaIds = bodegaId ? [bodegaId] : await getUserBodegaIds(userId);
  if (bodegaIds.length === 0) return [];
  return prisma.controlFermentacion.findMany({
    where: { vasija: { bodega_id: { in: bodegaIds } } },
    include: { vasija: true },
    orderBy: [{ fecha_hora: "desc" }],
  });
}

export async function getControlFermentacionById(
  controlFermentacionId: string,
  userId: string,
) {
  await getControlFermentacionScoped(controlFermentacionId, userId);
  return prisma.controlFermentacion.findUnique({
    where: { control_fermentacion_id: controlFermentacionId },
    include: { vasija: true },
  });
}

export async function createControlFermentacion(input: CreateControlFermentacionInput) {
  const {
    userId,
    vasijaId,
    fecha_hora,
    densidad,
    temperatura,
    brix,
    ph,
    acidez,
    estado_fermentacion,
    observaciones,
  } = input;
  if (!vasijaId || !fecha_hora) {
    throw new ElaboracionError("vasijaId y fecha_hora son requeridos", 400);
  }
  const vasija = await prisma.vasija.findUnique({
    where: { vasija_id: vasijaId },
    select: { bodega_id: true },
  });
  if (!vasija) throw new ElaboracionError("Vasija no encontrada", 404);
  await ensureUserBodega(userId, vasija.bodega_id);
  return prisma.controlFermentacion.create({
    data: {
      vasija_id: vasijaId,
      fecha_hora: parseDate(fecha_hora, "Fecha hora"),
      ...(densidad !== undefined ? { densidad } : {}),
      ...(temperatura !== undefined ? { temperatura } : {}),
      ...(brix !== undefined ? { brix } : {}),
      ...(ph !== undefined ? { ph } : {}),
      ...(acidez !== undefined ? { acidez } : {}),
      ...(estado_fermentacion !== undefined ? { estado_fermentacion } : {}),
      ...(observaciones !== undefined ? { observaciones } : {}),
    },
  });
}

export async function updateControlFermentacion(
  controlFermentacionId: string,
  userId: string,
  input: UpdateControlFermentacionInput,
) {
  await getControlFermentacionScoped(controlFermentacionId, userId);
  return prisma.controlFermentacion.update({
    where: { control_fermentacion_id: controlFermentacionId },
    data: {
      ...(input.fecha_hora !== undefined
        ? { fecha_hora: parseDate(input.fecha_hora, "Fecha hora") }
        : {}),
      ...(input.densidad !== undefined ? { densidad: input.densidad } : {}),
      ...(input.temperatura !== undefined ? { temperatura: input.temperatura } : {}),
      ...(input.brix !== undefined ? { brix: input.brix } : {}),
      ...(input.ph !== undefined ? { ph: input.ph } : {}),
      ...(input.acidez !== undefined ? { acidez: input.acidez } : {}),
      ...(input.estado_fermentacion !== undefined
        ? { estado_fermentacion: input.estado_fermentacion }
        : {}),
      ...(input.observaciones !== undefined
        ? { observaciones: input.observaciones }
        : {}),
    },
  });
}

export async function deleteControlFermentacion(
  controlFermentacionId: string,
  userId: string,
) {
  await getControlFermentacionScoped(controlFermentacionId, userId);
  await prisma.controlFermentacion.delete({
    where: { control_fermentacion_id: controlFermentacionId },
  });
  return { deleted: true };
}
