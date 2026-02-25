import { prisma } from "../../config/prismaClient.js";

export class CumplimientoError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function getUserBodegaIds(userId: string) {
  const rels = await prisma.userBodega.findMany({
    where: { user_id: userId },
    select: { bodega_id: true },
  });
  return rels.map((r) => r.bodega_id);
}

async function ensureUserHasAccessToTrazabilidad(userId: string, trazabilidadId: string) {
  const trazabilidad = await prisma.trazabilidad.findUnique({
    where: { trazabilidad_id: trazabilidadId },
    select: { bodega_id: true },
  });

  if (!trazabilidad) {
    throw new CumplimientoError("Trazabilidad no encontrada", 404);
  }

  const rel = await prisma.userBodega.findFirst({
    where: {
      user_id: userId,
      bodega_id: trazabilidad.bodega_id,
    },
  });

  if (!rel) {
    throw new CumplimientoError("No autorizado", 403);
  }
}

async function ensureUserHasAccessToHallazgo(userId: string, hallazgoId: string) {
  const hallazgo = await prisma.hallazgoCumplimiento.findUnique({
    where: { hallazgo_id: hallazgoId },
    select: {
      hallazgo_id: true,
      trazabilidad_id: true,
      estado: true,
      trazabilidad: { select: { bodega_id: true } },
    },
  });

  if (!hallazgo) {
    throw new CumplimientoError("Hallazgo no encontrado", 404);
  }

  if (!hallazgo.trazabilidad_id || !hallazgo.trazabilidad) {
    throw new CumplimientoError("Hallazgo sin trazabilidad asociada", 400);
  }

  const rel = await prisma.userBodega.findFirst({
    where: {
      user_id: userId,
      bodega_id: hallazgo.trazabilidad.bodega_id,
    },
  });

  if (!rel) {
    throw new CumplimientoError("No autorizado", 403);
  }

  return hallazgo;
}

export async function listHallazgos(params: {
  userId: string;
  trazabilidadId?: string;
  severidad?: "bloqueo" | "alerta" | "info";
  estado?: "abierto" | "en_proceso" | "resuelto" | "aceptado" | "anulado";
}) {
  const { userId, trazabilidadId, severidad, estado } = params;

  if (trazabilidadId) {
    await ensureUserHasAccessToTrazabilidad(userId, trazabilidadId);
  }

  const userBodegaIds = await getUserBodegaIds(userId);
  if (userBodegaIds.length === 0) return [];

  return prisma.hallazgoCumplimiento.findMany({
    where: {
      ...(trazabilidadId ? { trazabilidad_id: trazabilidadId } : {}),
      ...(severidad ? { severidad } : {}),
      ...(estado ? { estado } : {}),
      trazabilidad: {
        bodega_id: { in: userBodegaIds },
      },
    },
    orderBy: [{ created_at: "desc" }],
  });
}

export async function resolverHallazgo(params: {
  userId: string;
  hallazgoId: string;
}) {
  const { userId, hallazgoId } = params;

  await ensureUserHasAccessToHallazgo(userId, hallazgoId);

  return prisma.hallazgoCumplimiento.update({
    where: { hallazgo_id: hallazgoId },
    data: {
      estado: "resuelto",
      resolved_at: new Date(),
      updated_at: new Date(),
    },
  });
}

export async function aceptarHallazgo(params: {
  userId: string;
  hallazgoId: string;
  justificacionCategoria: string;
  justificacionTexto: string;
}) {
  const { userId, hallazgoId, justificacionCategoria, justificacionTexto } = params;

  const hallazgo = await ensureUserHasAccessToHallazgo(userId, hallazgoId);

  if (hallazgo.estado !== "abierto" && hallazgo.estado !== "en_proceso") {
    throw new CumplimientoError("Solo se pueden aceptar hallazgos abiertos", 400);
  }

  return prisma.hallazgoCumplimiento.update({
    where: { hallazgo_id: hallazgoId },
    data: {
      estado: "aceptado",
      justificacion_categoria: justificacionCategoria,
      justificacion_texto: justificacionTexto,
      justificacion_responsable: userId,
      justificacion_fecha: new Date(),
      updated_at: new Date(),
    },
  });
}

function calcM3PorHa(totalVolumenM3: number, superficieHa: number | null): number | null {
  if (!superficieHa || superficieHa <= 0) return null;
  return totalVolumenM3 / superficieHa;
}

export async function getIndicadoresByContext(params: {
  userId: string;
  trazabilidadId?: string;
  campaniaId?: string;
  cuartelId?: string;
}) {
  const { userId, trazabilidadId, campaniaId, cuartelId } = params;

  let targetCampaniaId = campaniaId;
  let targetCuartelId = cuartelId;
  let targetTrazabilidadId = trazabilidadId;

  if (trazabilidadId) {
    await ensureUserHasAccessToTrazabilidad(userId, trazabilidadId);
    const traz = await prisma.trazabilidad.findUnique({
      where: { trazabilidad_id: trazabilidadId },
      select: {
        campania_id: true,
        cuartel_id: true,
      },
    });
    if (!traz) throw new CumplimientoError("Trazabilidad no encontrada", 404);
    targetCampaniaId = traz.campania_id;
    targetCuartelId = traz.cuartel_id;
    targetTrazabilidadId = trazabilidadId;
  }

  if (!targetCampaniaId || !targetCuartelId) {
    throw new CumplimientoError("campaniaId y cuartelId son obligatorios", 400);
  }

  const cuartel = await prisma.cuartel.findUnique({
    where: { cuartel_id: targetCuartelId },
    select: { superficie_ha: true },
  });

  const [riegos, fitos, cosechas, monitoreosPlaga, monitoreosEnf, hallazgos] =
    await Promise.all([
      prisma.eventoRiego.findMany({
        where: {
          campania_id: targetCampaniaId,
          cuartel_id: targetCuartelId,
        },
        select: { volumen: true, unidad: true },
      }),
      prisma.eventoAplicacionFitosanitaria.findMany({
        where: {
          campania_id: targetCampaniaId,
          cuartel_id: targetCuartelId,
        },
        select: {
          evento_fito_id: true,
          fecha: true,
          carencia_dias: true,
        },
      }),
      prisma.eventoCosecha.findMany({
        where: {
          campania_id: targetCampaniaId,
          cuartel_id: targetCuartelId,
        },
        select: {
          lote_cosecha_id: true,
          fecha_cosecha: true,
        },
      }),
      prisma.eventoMonitoreoPlaga.findMany({
        where: {
          campania_id: targetCampaniaId,
          cuartel_id: targetCuartelId,
        },
        select: { fecha: true },
      }),
      prisma.eventoMonitoreoEnfermedad.findMany({
        where: {
          campania_id: targetCampaniaId,
          cuartel_id: targetCuartelId,
        },
        select: { fecha: true },
      }),
      prisma.hallazgoCumplimiento.findMany({
        where: {
          ...(targetTrazabilidadId ? { trazabilidad_id: targetTrazabilidadId } : {}),
          estado: { in: ["abierto", "en_proceso"] },
        },
        select: { regla_codigo: true, severidad: true },
      }),
    ]);

  const totalVolumenM3 = riegos.reduce((acc, r) => {
    const volumen = Number(r.volumen);
    const unidad = r.unidad.trim().toLowerCase();
    if (unidad === "m3" || unidad === "m³") return acc + volumen;
    return acc;
  }, 0);

  const superficieHa = cuartel?.superficie_ha ? Number(cuartel.superficie_ha) : null;
  const m3PorHa = calcM3PorHa(totalVolumenM3, superficieHa);

  const monitoreosPrevios = fitos.reduce((acc, fito) => {
    const from = new Date(fito.fecha);
    from.setDate(from.getDate() - 14);
    const hasPlaga = monitoreosPlaga.some(
      (m) => m.fecha >= from && m.fecha <= fito.fecha,
    );
    const hasEnf = monitoreosEnf.some(
      (m) => m.fecha >= from && m.fecha <= fito.fecha,
    );
    return acc + (hasPlaga || hasEnf ? 1 : 0);
  }, 0);

  const carenciasOK = fitos.reduce((acc, fito) => {
    const blocked = cosechas.some((c) => {
      const finCarencia = new Date(fito.fecha);
      finCarencia.setDate(finCarencia.getDate() + fito.carencia_dias);
      return c.fecha_cosecha < finCarencia;
    });
    return acc + (blocked ? 0 : 1);
  }, 0);

  return {
    contexto: {
      trazabilidadId: targetTrazabilidadId ?? null,
      campaniaId: targetCampaniaId,
      cuartelId: targetCuartelId,
    },
    agua: {
      total_m3_campania: totalVolumenM3,
      m3_por_ha: m3PorHa,
      eventos_riego: riegos.length,
    },
    fitosanitarios: {
      aplicaciones_total: fitos.length,
      porcentaje_con_monitoreo_previo:
        fitos.length > 0 ? Number(((monitoreosPrevios / fitos.length) * 100).toFixed(2)) : null,
      porcentaje_carencias_ok:
        fitos.length > 0 ? Number(((carenciasOK / fitos.length) * 100).toFixed(2)) : null,
    },
    cumplimiento: {
      hallazgos_abiertos_total: hallazgos.length,
      hallazgos_por_severidad: {
        bloqueo: hallazgos.filter((h) => h.severidad === "bloqueo").length,
        alerta: hallazgos.filter((h) => h.severidad === "alerta").length,
        info: hallazgos.filter((h) => h.severidad === "info").length,
      },
    },
  };
}

export async function getIndicadoresByLote(params: { userId: string; loteId: string }) {
  const { userId, loteId } = params;

  const lote = await prisma.eventoCosecha.findUnique({
    where: { lote_cosecha_id: loteId },
    select: {
      campania_id: true,
      cuartel_id: true,
      fecha_cosecha: true,
    },
  });

  if (!lote) {
    throw new CumplimientoError("Lote no encontrado", 404);
  }

  const trazabilidad = await prisma.trazabilidad.findFirst({
    where: {
      campania_id: lote.campania_id,
      cuartel_id: lote.cuartel_id,
    },
    select: { trazabilidad_id: true },
  });

  if (!trazabilidad) {
    throw new CumplimientoError("No existe trazabilidad para el lote", 404);
  }

  await ensureUserHasAccessToTrazabilidad(userId, trazabilidad.trazabilidad_id);

  const indicadores = await getIndicadoresByContext({
    userId,
    trazabilidadId: trazabilidad.trazabilidad_id,
  });

  return {
    loteId,
    fechaCosecha: lote.fecha_cosecha,
    ...indicadores,
  };
}

export async function getHistoriaLote(params: { userId: string; loteId: string }) {
  const { userId, loteId } = params;

  const lote = await prisma.eventoCosecha.findUnique({
    where: { lote_cosecha_id: loteId },
    include: {
      cuartel: {
        include: {
          finca: true,
        },
      },
      campania: true,
    },
  });

  if (!lote) {
    throw new CumplimientoError("Lote no encontrado", 404);
  }

  const trazabilidad = await prisma.trazabilidad.findFirst({
    where: {
      cuartel_id: lote.cuartel_id,
      campania_id: lote.campania_id,
    },
    select: {
      trazabilidad_id: true,
      bodega_id: true,
      finca_id: true,
      cuartel_id: true,
      campania_id: true,
      protocolo_id: true,
      estado: true,
      nombre_producto: true,
    },
  });

  if (!trazabilidad) {
    throw new CumplimientoError("No existe trazabilidad para el lote", 404);
  }

  await ensureUserHasAccessToTrazabilidad(userId, trazabilidad.trazabilidad_id);

  const [
    canopia,
    fenologia,
    riego,
    precipitacion,
    fertilizacion,
    laborSuelo,
    monEnf,
    monPlaga,
    fito,
    energia,
    hallazgos,
  ] = await Promise.all([
    prisma.eventoCanopia.findMany({
      where: { cuartel_id: lote.cuartel_id, campania_id: lote.campania_id },
      orderBy: { fecha: "asc" },
    }),
    prisma.eventoFenologia.findMany({
      where: { cuartel_id: lote.cuartel_id, campania_id: lote.campania_id },
      orderBy: { fecha: "asc" },
    }),
    prisma.eventoRiego.findMany({
      where: { cuartel_id: lote.cuartel_id, campania_id: lote.campania_id },
      orderBy: { fecha: "asc" },
    }),
    prisma.eventoPrecipitacion.findMany({
      where: { finca_id: lote.cuartel.finca_id, campania_id: lote.campania_id },
      orderBy: { fecha: "asc" },
    }),
    prisma.eventoFertilizacion.findMany({
      where: { cuartel_id: lote.cuartel_id, campania_id: lote.campania_id },
      orderBy: { fecha: "asc" },
    }),
    prisma.eventoLaborSuelo.findMany({
      where: { cuartel_id: lote.cuartel_id, campania_id: lote.campania_id },
      orderBy: { fecha: "asc" },
    }),
    prisma.eventoMonitoreoEnfermedad.findMany({
      where: { cuartel_id: lote.cuartel_id, campania_id: lote.campania_id },
      orderBy: { fecha: "asc" },
    }),
    prisma.eventoMonitoreoPlaga.findMany({
      where: { cuartel_id: lote.cuartel_id, campania_id: lote.campania_id },
      orderBy: { fecha: "asc" },
    }),
    prisma.eventoAplicacionFitosanitaria.findMany({
      where: { cuartel_id: lote.cuartel_id, campania_id: lote.campania_id },
      orderBy: { fecha: "asc" },
    }),
    prisma.eventoEnergia.findMany({
      where: { cuartel_id: lote.cuartel_id, campania_id: lote.campania_id },
      orderBy: { periodo: "asc" },
    }),
    prisma.hallazgoCumplimiento.findMany({
      where: {
        trazabilidad_id: trazabilidad.trazabilidad_id,
      },
      orderBy: { created_at: "desc" },
    }),
  ]);

  return {
    lote: {
      lote_id: lote.lote_cosecha_id,
      fecha_cosecha: lote.fecha_cosecha,
      cantidad: lote.cantidad,
      unidad: lote.unidad,
      destino: lote.destino,
    },
    origen: {
      trazabilidad_id: trazabilidad.trazabilidad_id,
      protocolo_id: trazabilidad.protocolo_id,
      estado: trazabilidad.estado,
      nombre_producto: trazabilidad.nombre_producto,
      finca: lote.cuartel.finca,
      cuartel: lote.cuartel,
      campania: lote.campania,
    },
    eventos_heredados: {
      canopia,
      fenologia,
      riego,
      precipitacion,
      fertilizacion,
      labor_suelo: laborSuelo,
      monitoreo_enfermedad: monEnf,
      monitoreo_plaga: monPlaga,
      aplicacion_fitosanitaria: fito,
      energia,
    },
    cumplimiento: {
      hallazgos,
    },
  };
}
