import { prisma } from "../../config/prismaClient.js";
import type { Prisma } from "../../generated/prisma/index.js";

export class LoteError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function ensureUserBodega(userId: string, bodegaId: string) {
  const rel = await prisma.userBodega.findFirst({
    where: { user_id: userId, bodega_id: bodegaId },
    select: { user_id: true },
  });
  if (!rel) {
    throw new LoteError("No autorizado para esta bodega", 403);
  }
}

/** Deja solo letras/números en mayúscula, sin acentos, para armar códigos de lote. */
function sanitizarSegmento(value: string, maxLen: number): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, maxLen);
}

async function generarCodigoLote(
  tx: Prisma.TransactionClient,
  params: {
    bodegaId: string;
    cuartelId: string | null;
    variedad: string | null;
    anio: number;
    origen: "ingreso" | "corte";
  },
): Promise<{ codigo: string; secuencia: number }> {
  const bodega = await tx.bodega.findUnique({
    where: { bodega_id: params.bodegaId },
    select: { codigo: true, nombre: true },
  });
  const bodegaCorto = (bodega?.codigo?.trim() || sanitizarSegmento(bodega?.nombre ?? "BOD", 4)) || "BOD";
  const anioCorto = String(params.anio).slice(-2);

  let prefijo: string;
  if (params.origen === "corte") {
    prefijo = `${bodegaCorto}-CORTE-${anioCorto}`;
  } else {
    const cuartel = params.cuartelId
      ? await tx.cuartel.findUnique({
          where: { cuartel_id: params.cuartelId },
          select: { codigo_cuartel: true },
        })
      : null;
    const cuartelCorto = sanitizarSegmento(cuartel?.codigo_cuartel ?? "SC", 8) || "SC";
    const variedadCorta = sanitizarSegmento(params.variedad ?? "MIX", 3) || "MIX";
    prefijo = `${bodegaCorto}-${cuartelCorto}-${variedadCorta}-${anioCorto}`;
  }

  const existentes = await tx.lote.count({
    where: { bodega_id: params.bodegaId, codigo: { startsWith: `${prefijo}-` } },
  });

  let secuencia = existentes + 1;
  let codigo = `${prefijo}-${String(secuencia).padStart(2, "0")}`;

  // Reintento defensivo por si dos creaciones concurrentes calculan la misma secuencia.
  for (let intento = 0; intento < 10; intento++) {
    const existe = await tx.lote.findFirst({
      where: { bodega_id: params.bodegaId, codigo },
      select: { lote_id: true },
    });
    if (!existe) break;
    secuencia += 1;
    codigo = `${prefijo}-${String(secuencia).padStart(2, "0")}`;
  }

  return { codigo, secuencia };
}

const LOTE_DETAIL_INCLUDE = {
  cuartel: { include: { finca: true } },
  campania: true,
  lote_origen_recepcion: {
    include: {
      recepcion_bodega: {
        include: { ciu: true, remito_uva: true },
      },
    },
  },
  composicion_hijo: {
    include: { lote_padre: { select: { lote_id: true, codigo: true, origen: true } } },
  },
  _count: { select: { vasija_contenido: true, composicion_padre: true } },
} satisfies Prisma.LoteInclude;

type CrearLoteInput = {
  userId: string;
  bodegaId: string;
  campaniaId: string;
  recepcionBodegaIds: string[];
  observaciones?: string;
};

export async function crearLote(input: CrearLoteInput) {
  const { userId, bodegaId, campaniaId, recepcionBodegaIds, observaciones } = input;

  if (!bodegaId || !campaniaId) {
    throw new LoteError("bodegaId y campaniaId son requeridos", 400);
  }
  if (!recepcionBodegaIds || recepcionBodegaIds.length === 0) {
    throw new LoteError("Seleccioná al menos una recepción", 400);
  }
  await ensureUserBodega(userId, bodegaId);

  const campania = await prisma.campania.findUnique({ where: { campania_id: campaniaId } });
  if (!campania || campania.bodega_id !== bodegaId) {
    throw new LoteError("Campaña inválida para la bodega", 400);
  }

  const recepciones = await prisma.recepcionBodega.findMany({
    where: { recepcion_bodega_id: { in: recepcionBodegaIds } },
    include: {
      remito_uva: true,
      ciu: true,
      lote_origen_recepcion: true,
    },
  });

  if (recepciones.length !== recepcionBodegaIds.length) {
    throw new LoteError("Alguna recepción no existe", 404);
  }

  let cuartelId: string | null = null;
  let hayMezcla = false;

  for (const r of recepciones) {
    if (r.remito_uva.bodega_id !== bodegaId) {
      throw new LoteError("Alguna recepción no pertenece a la bodega", 400);
    }
    if (!r.ciu) {
      throw new LoteError("Todas las recepciones deben tener un CIU cargado", 400);
    }
    if (r.lote_origen_recepcion) {
      throw new LoteError("Alguna recepción ya pertenece a un lote", 409);
    }
    if (cuartelId === null) {
      cuartelId = r.remito_uva.cuartel_id;
    } else if (cuartelId !== r.remito_uva.cuartel_id) {
      throw new LoteError("Todas las recepciones deben ser del mismo cuartel", 400);
    }
    if (r.remito_uva.variedad_pureza === "mezclada") {
      hayMezcla = true;
    }
  }

  // La variedad real del lote sale de lo que declaró cada CIU (Rubro V), no del dato
  // estático del cuartel: un mismo cuartel puede tener viajes de variedades distintas.
  const variedadesCiu = new Set(
    recepciones
      .map((r) => r.ciu?.variedad_nombre)
      .filter((v): v is string => Boolean(v && v.trim())),
  );
  if (variedadesCiu.size > 1) hayMezcla = true;

  const cuartel = cuartelId
    ? await prisma.cuartel.findUnique({ where: { cuartel_id: cuartelId }, select: { variedad: true } })
    : null;
  const variedad = hayMezcla
    ? "Mezcla"
    : variedadesCiu.size === 1
      ? Array.from(variedadesCiu)[0]!
      : cuartel?.variedad ?? null;
  const anio = campania.fecha_inicio.getFullYear();

  return prisma.$transaction(async (tx) => {
    const { codigo, secuencia } = await generarCodigoLote(tx, {
      bodegaId,
      cuartelId,
      variedad,
      anio,
      origen: "ingreso",
    });

    const lote = await tx.lote.create({
      data: {
        bodega_id: bodegaId,
        codigo,
        secuencia,
        origen: "ingreso",
        campania_id: campaniaId,
        cuartel_id: cuartelId,
        variedad,
        ...(observaciones !== undefined ? { observaciones } : {}),
      },
    });

    await tx.loteOrigenRecepcion.createMany({
      data: recepcionBodegaIds.map((recepcionBodegaId) => ({
        lote_id: lote.lote_id,
        recepcion_bodega_id: recepcionBodegaId,
      })),
    });

    return tx.lote.findUnique({
      where: { lote_id: lote.lote_id },
      include: LOTE_DETAIL_INCLUDE,
    });
  });
}

export async function listLotes(userId: string, bodegaId: string) {
  await ensureUserBodega(userId, bodegaId);
  return prisma.lote.findMany({
    where: { bodega_id: bodegaId },
    include: LOTE_DETAIL_INCLUDE,
    orderBy: { created_at: "desc" },
  });
}

export async function getLoteById(loteId: string, userId: string) {
  const lote = await prisma.lote.findUnique({
    where: { lote_id: loteId },
    include: LOTE_DETAIL_INCLUDE,
  });
  if (!lote) throw new LoteError("Lote no encontrado", 404);
  await ensureUserBodega(userId, lote.bodega_id);
  return lote;
}

type UpdateLoteInput = {
  codigo?: string;
  variedad?: string;
  observaciones?: string;
};

export async function updateLote(loteId: string, userId: string, input: UpdateLoteInput) {
  const lote = await prisma.lote.findUnique({ where: { lote_id: loteId }, select: { bodega_id: true } });
  if (!lote) throw new LoteError("Lote no encontrado", 404);
  await ensureUserBodega(userId, lote.bodega_id);

  try {
    return await prisma.lote.update({
      where: { lote_id: loteId },
      data: {
        ...(input.codigo !== undefined ? { codigo: input.codigo } : {}),
        ...(input.variedad !== undefined ? { variedad: input.variedad } : {}),
        ...(input.observaciones !== undefined ? { observaciones: input.observaciones } : {}),
      },
      include: LOTE_DETAIL_INCLUDE,
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      throw new LoteError("Ya existe un lote con ese código en esta bodega", 409);
    }
    throw error;
  }
}

export type ImpactoBorradoLote = {
  recepcionesOrigen: number;
  vasijaContenido: Array<{ vasija_id: string; vasija_codigo: string; volumen_l: number; activo: boolean }>;
  /** Lotes que ya usaron este como componente de un blend — si hay alguno, el borrado se bloquea. */
  usadoComoComponenteDe: Array<{ lote_id: string; codigo: string }>;
};

export async function getImpactoBorradoLote(loteId: string, userId: string): Promise<ImpactoBorradoLote> {
  const lote = await prisma.lote.findUnique({ where: { lote_id: loteId }, select: { bodega_id: true } });
  if (!lote) throw new LoteError("Lote no encontrado", 404);
  await ensureUserBodega(userId, lote.bodega_id);

  const [recepcionesOrigen, vasijaContenido, composicionesHijas] = await Promise.all([
    prisma.loteOrigenRecepcion.count({ where: { lote_id: loteId } }),
    prisma.vasijaContenido.findMany({
      where: { lote_id: loteId },
      include: { vasija: { select: { codigo: true } } },
    }),
    prisma.loteComposicion.findMany({
      where: { lote_padre_id: loteId },
      include: { lote: { select: { lote_id: true, codigo: true } } },
    }),
  ]);

  return {
    recepcionesOrigen,
    vasijaContenido: vasijaContenido.map((v) => ({
      vasija_id: v.vasija_id,
      vasija_codigo: v.vasija.codigo,
      volumen_l: Number(v.volumen_l ?? 0),
      activo: v.hasta === null,
    })),
    usadoComoComponenteDe: composicionesHijas.map((c) => ({ lote_id: c.lote.lote_id, codigo: c.lote.codigo })),
  };
}

/**
 * Borra un lote y todo lo que cuelga de él (volumen en vasija, su propia
 * composición si es resultado de un blend, y libera las recepciones de origen
 * que vuelven a quedar disponibles para armar otro lote). Bloquea si este lote
 * ya se usó como componente de OTRO lote (blend) — ahí no hay cascada segura,
 * hay que corregir ese corte primero.
 */
export async function eliminarLote(loteId: string, userId: string) {
  const lote = await prisma.lote.findUnique({ where: { lote_id: loteId }, select: { bodega_id: true } });
  if (!lote) throw new LoteError("Lote no encontrado", 404);
  await ensureUserBodega(userId, lote.bodega_id);

  const usadoComoComponente = await prisma.loteComposicion.count({ where: { lote_padre_id: loteId } });
  if (usadoComoComponente > 0) {
    throw new LoteError(
      "No se puede eliminar: este lote ya se usó como componente de otro lote (blend). Corregí ese corte primero.",
      409,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.vasijaContenido.deleteMany({ where: { lote_id: loteId } });
    await tx.loteComposicion.deleteMany({ where: { lote_id: loteId } });
    await tx.loteOrigenRecepcion.deleteMany({ where: { lote_id: loteId } });
    await tx.lote.delete({ where: { lote_id: loteId } });
  });
}

/** Margen para redondeos de punto flotante al comparar/repartir volúmenes. */
const EPSILON_VOLUMEN_L = 0.001;

function parseFecha(input: string, fieldLabel: string): Date {
  const date = new Date(String(input ?? "").trim());
  if (Number.isNaN(date.getTime())) {
    throw new LoteError(`${fieldLabel} inválida`, 400);
  }
  return date;
}

/**
 * Drena `volumenL` de una vasija (cierra/reparte igual que un trasiego) y devuelve
 * qué lotes (y cuánto de cada uno) se sacaron, para poder calcular la composición
 * del blend resultante. Bloquea si se pide más de lo que hay activo.
 */
async function drenarVasijaParaCorte(
  tx: Prisma.TransactionClient,
  params: { vasijaId: string; volumenL: number; fechaHora: Date },
): Promise<Array<{ loteId: string; volumen: number }>> {
  const activos = await tx.vasijaContenido.findMany({
    where: { vasija_id: params.vasijaId, hasta: null },
  });
  const disponible = activos.reduce((acc, row) => acc + Number(row.volumen_l ?? 0), 0);

  if (disponible + EPSILON_VOLUMEN_L < params.volumenL) {
    throw new LoteError(
      `Volumen insuficiente en vasija: disponible ${disponible.toFixed(2)} l, solicitado ${params.volumenL.toFixed(2)} l`,
      400,
    );
  }

  const fraccion = disponible > 0 ? params.volumenL / disponible : 0;
  const drenado: Array<{ loteId: string; volumen: number }> = [];

  for (const row of activos) {
    const rowVolumen = Number(row.volumen_l ?? 0);
    const movido = rowVolumen * fraccion;
    const restante = rowVolumen - movido;

    await tx.vasijaContenido.update({
      where: { vasija_contenido_id: row.vasija_contenido_id },
      data: { hasta: params.fechaHora },
    });

    if (restante > EPSILON_VOLUMEN_L) {
      await tx.vasijaContenido.create({
        data: {
          vasija_id: params.vasijaId,
          lote_id: row.lote_id,
          desde: params.fechaHora,
          volumen_l: restante,
        },
      });
    }

    if (movido > EPSILON_VOLUMEN_L) {
      drenado.push({ loteId: row.lote_id, volumen: movido });
    }
  }

  return drenado;
}

type CrearCorteConVasijasInput = {
  userId: string;
  bodegaId: string;
  campaniaId?: string;
  fecha: string;
  objetivo?: string;
  responsableUserId?: string;
  observaciones?: string;
  fuentes: Array<{ vasijaId: string; volumenL: number }>;
  destinos: Array<{ vasijaId: string; volumenL: number }>;
};

/**
 * Blend guiado: en vez de tipear vasija+lote+% a mano, el enólogo elige de qué
 * vasijas sacar y cuánto volumen. El sistema valida contra el ledger de cada
 * vasija, arma el Corte + CorteComponente (histórico), crea el Lote resultado del
 * blend con su código, y registra en LoteComposicion de qué lotes padre viene (con
 * el % efectivo). El resultado se reparte en una o más vasijas destino (obligatorio
 * elegir al menos una) — cada una recibe una fila de VasijaContenido del lote nuevo;
 * la composición (% por lote padre) es una propiedad del lote, no de dónde quedó
 * guardado, así que repartirlo en varias vasijas no cambia esa cuenta.
 */
export async function crearCorteConVasijas(input: CrearCorteConVasijasInput) {
  const {
    userId,
    bodegaId,
    campaniaId,
    fecha,
    objetivo,
    responsableUserId,
    observaciones,
    fuentes,
    destinos,
  } = input;

  if (!bodegaId || !fecha) {
    throw new LoteError("bodegaId y fecha son requeridos", 400);
  }
  if (!fuentes || fuentes.length === 0) {
    throw new LoteError("Elegí al menos una vasija de origen", 400);
  }
  for (const f of fuentes) {
    if (!f.vasijaId || !(f.volumenL > 0)) {
      throw new LoteError("Cada fuente necesita vasija y un volumen mayor a 0", 400);
    }
  }
  if (!destinos || destinos.length === 0) {
    throw new LoteError("Elegí al menos una vasija destino", 400);
  }
  for (const d of destinos) {
    if (!d.vasijaId || !(d.volumenL > 0)) {
      throw new LoteError("Cada destino necesita vasija y un volumen mayor a 0", 400);
    }
  }
  if (new Set(destinos.map((d) => d.vasijaId)).size !== destinos.length) {
    throw new LoteError("No repitas la misma vasija destino", 400);
  }
  await ensureUserBodega(userId, bodegaId);

  const vasijaIds = Array.from(
    new Set([...fuentes.map((f) => f.vasijaId), ...destinos.map((d) => d.vasijaId)]),
  );
  const vasijas = await prisma.vasija.findMany({ where: { vasija_id: { in: vasijaIds } } });
  if (vasijas.length !== vasijaIds.length || vasijas.some((v) => v.bodega_id !== bodegaId)) {
    throw new LoteError("Alguna vasija no pertenece a la bodega", 400);
  }

  if (campaniaId) {
    const campania = await prisma.campania.findUnique({ where: { campania_id: campaniaId } });
    if (!campania || campania.bodega_id !== bodegaId) {
      throw new LoteError("Campaña inválida para la bodega", 400);
    }
  }

  const fechaHoraDate = parseFecha(fecha, "Fecha");

  return prisma.$transaction(async (tx) => {
    const aportesPorLote = new Map<string, number>();
    let volumenTotal = 0;

    for (const fuente of fuentes) {
      const drenado = await drenarVasijaParaCorte(tx, {
        vasijaId: fuente.vasijaId,
        volumenL: fuente.volumenL,
        fechaHora: fechaHoraDate,
      });
      for (const d of drenado) {
        aportesPorLote.set(d.loteId, (aportesPorLote.get(d.loteId) ?? 0) + d.volumen);
        volumenTotal += d.volumen;
      }
    }

    if (aportesPorLote.size === 0) {
      throw new LoteError("Las vasijas elegidas no tienen composición registrada", 400);
    }

    const volumenDestinos = destinos.reduce((acc, d) => acc + d.volumenL, 0);
    if (Math.abs(volumenDestinos - volumenTotal) > EPSILON_VOLUMEN_L) {
      throw new LoteError(
        `La suma de las vasijas destino (${volumenDestinos.toFixed(2)} l) no coincide con el volumen total del corte (${volumenTotal.toFixed(2)} l)`,
        400,
      );
    }

    const corte = await tx.corte.create({
      data: {
        bodega_id: bodegaId,
        ...(campaniaId !== undefined ? { campania_id: campaniaId } : {}),
        fecha: fechaHoraDate,
        ...(objetivo !== undefined ? { objetivo } : {}),
        ...(responsableUserId !== undefined ? { responsable_user_id: responsableUserId } : {}),
        ...(observaciones !== undefined ? { observaciones } : {}),
      },
    });

    await tx.corteComponente.createMany({
      data: fuentes.map((f) => ({
        corte_id: corte.corte_id,
        vasija_id: f.vasijaId,
        volumen_l: f.volumenL,
      })),
    });

    const lotesPadre = await tx.lote.findMany({
      where: { lote_id: { in: Array.from(aportesPorLote.keys()) } },
    });
    const cuarteles = new Set(lotesPadre.map((l) => l.cuartel_id).filter((v): v is string => Boolean(v)));
    const variedades = new Set(lotesPadre.map((l) => l.variedad).filter((v): v is string => Boolean(v)));
    const cuartelUnico = cuarteles.size === 1 ? Array.from(cuarteles)[0]! : null;
    const variedadUnica = variedades.size === 1 ? Array.from(variedades)[0]! : null;

    const { codigo, secuencia } = await generarCodigoLote(tx, {
      bodegaId,
      cuartelId: cuartelUnico,
      variedad: variedadUnica,
      anio: fechaHoraDate.getFullYear(),
      origen: "corte",
    });

    const loteBlend = await tx.lote.create({
      data: {
        bodega_id: bodegaId,
        codigo,
        secuencia,
        origen: "corte",
        ...(campaniaId !== undefined ? { campania_id: campaniaId } : {}),
        ...(cuartelUnico ? { cuartel_id: cuartelUnico } : {}),
        variedad: variedadUnica ?? "Mezcla",
        corte_origen_id: corte.corte_id,
      },
    });

    await tx.loteComposicion.createMany({
      data: Array.from(aportesPorLote.entries()).map(([loteId, volumen]) => ({
        lote_id: loteBlend.lote_id,
        lote_padre_id: loteId,
        corte_id: corte.corte_id,
        volumen_l: volumen,
        porcentaje: volumenTotal > 0 ? (volumen / volumenTotal) * 100 : 0,
      })),
    });

    for (const destino of destinos) {
      if (destino.volumenL > EPSILON_VOLUMEN_L) {
        await tx.vasijaContenido.create({
          data: {
            vasija_id: destino.vasijaId,
            lote_id: loteBlend.lote_id,
            desde: fechaHoraDate,
            volumen_l: destino.volumenL,
          },
        });
      }
    }

    return tx.corte.findUnique({
      where: { corte_id: corte.corte_id },
      include: {
        corte_componente: true,
        lote_creado: { include: LOTE_DETAIL_INCLUDE },
      },
    });
  });
}

type ListRecepcionesParaLoteInput = {
  userId: string;
  bodegaId: string;
};

/**
 * Todos los ingresos (recepciones) de la bodega, más recientes primero, con su CIU
 * y si ya forman parte de un Lote (para que la UI pueda agrupar por cuartel, dejar
 * seleccionar los pendientes y mostrar los ya asignados como historial).
 *
 * No se filtra por campaña: `RemitoUva.lote_cosecha_id` (el evento de cosecha de la
 * finca) es opcional y el formulario de remito no lo pide, así que en la práctica
 * casi ningún remito lo tiene seteado — filtrar por ahí dejaba la lista vacía.
 */
export async function listRecepcionesParaLote(input: ListRecepcionesParaLoteInput) {
  const { userId, bodegaId } = input;
  await ensureUserBodega(userId, bodegaId);

  return prisma.recepcionBodega.findMany({
    where: {
      remito_uva: { bodega_id: bodegaId },
    },
    include: {
      ciu: true,
      remito_uva: { include: { cuartel: true, finca: true } },
      lote_origen_recepcion: { include: { lote: { select: { lote_id: true, codigo: true } } } },
    },
    orderBy: { fecha_hora: "desc" },
  });
}

// ── Genealogía (trazabilidad hacia atrás) ───────────────────────────────────

export type LoteGenealogiaNode = {
  lote_id: string;
  codigo: string;
  origen: "ingreso" | "corte";
  /** % que este lote aporta a su lote "hijo" en el árbol (el que lo consumió). Null en la raíz. */
  porcentaje_en_padre: number | null;
  cuartel: { cuartel_id: string; codigo_cuartel: string; finca: { finca_id: string; nombre_finca: string } } | null;
  cius: Array<{ ciu_id: string; codigo_ciu: string }>;
  /** Lotes que aportaron a este (dirección de datos: LoteComposicion.lote_padre_id). */
  hijos: LoteGenealogiaNode[];
};

/**
 * Resuelve recursivamente de qué lotes viene `loteId`, hasta llegar a los lotes de
 * origen "ingreso" (que resuelven a sus CIU). `visitados` evita ciclos (no deberían
 * existir dado que LoteComposicion es append-only y los hijos son siempre más nuevos
 * que los padres, pero es defensivo).
 */
export async function resolverGenealogiaLote(
  loteId: string,
  porcentajeEnPadre: number | null,
  visitados: Set<string> = new Set(),
): Promise<LoteGenealogiaNode> {
  if (visitados.has(loteId)) {
    throw new LoteError("Ciclo detectado en la genealogía del lote", 500);
  }
  const siguientesVisitados = new Set(visitados);
  siguientesVisitados.add(loteId);

  const lote = await prisma.lote.findUnique({
    where: { lote_id: loteId },
    include: {
      cuartel: { include: { finca: true } },
      lote_origen_recepcion: {
        include: { recepcion_bodega: { include: { ciu: true } } },
      },
      composicion_hijo: true,
    },
  });
  if (!lote) throw new LoteError("Lote no encontrado", 404);

  const cius = lote.lote_origen_recepcion
    .map((lor) => lor.recepcion_bodega.ciu)
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map((c) => ({ ciu_id: c.ciu_id, codigo_ciu: c.codigo_ciu }));

  const hijos: LoteGenealogiaNode[] = [];
  for (const comp of lote.composicion_hijo) {
    hijos.push(
      await resolverGenealogiaLote(comp.lote_padre_id, Number(comp.porcentaje ?? 0), siguientesVisitados),
    );
  }

  return {
    lote_id: lote.lote_id,
    codigo: lote.codigo,
    origen: lote.origen,
    porcentaje_en_padre: porcentajeEnPadre,
    cuartel: lote.cuartel
      ? {
          cuartel_id: lote.cuartel.cuartel_id,
          codigo_cuartel: lote.cuartel.codigo_cuartel,
          finca: { finca_id: lote.cuartel.finca.finca_id, nombre_finca: lote.cuartel.finca.nombre_finca },
        }
      : null,
    cius,
    hijos,
  };
}

export type CiuContribucion = {
  ciu_id: string;
  codigo_ciu: string;
  lote_id: string;
  lote_codigo: string;
  porcentaje_efectivo: number;
};

/** Recorre el árbol de genealogía y arma la lista plana (deduplicada) de CIU con su % efectivo sobre la raíz. */
export function recolectarCiusDeGenealogia(
  nodo: LoteGenealogiaNode,
  porcentajeAbsoluto: number,
  out: Map<string, CiuContribucion>,
): void {
  if (nodo.hijos.length === 0) {
    for (const ciu of nodo.cius) {
      const previo = out.get(ciu.ciu_id);
      if (previo) {
        previo.porcentaje_efectivo += porcentajeAbsoluto;
      } else {
        out.set(ciu.ciu_id, {
          ciu_id: ciu.ciu_id,
          codigo_ciu: ciu.codigo_ciu,
          lote_id: nodo.lote_id,
          lote_codigo: nodo.codigo,
          porcentaje_efectivo: porcentajeAbsoluto,
        });
      }
    }
    return;
  }
  for (const hijo of nodo.hijos) {
    const hijoAbsoluto = porcentajeAbsoluto * ((hijo.porcentaje_en_padre ?? 0) / 100);
    recolectarCiusDeGenealogia(hijo, hijoAbsoluto, out);
  }
}

export async function getLoteGenealogia(loteId: string, userId: string) {
  const lote = await prisma.lote.findUnique({ where: { lote_id: loteId }, select: { bodega_id: true } });
  if (!lote) throw new LoteError("Lote no encontrado", 404);
  await ensureUserBodega(userId, lote.bodega_id);

  const genealogia = await resolverGenealogiaLote(loteId, null);
  const ciusMap = new Map<string, CiuContribucion>();
  recolectarCiusDeGenealogia(genealogia, 100, ciusMap);
  const cius = Array.from(ciusMap.values()).sort((a, b) => b.porcentaje_efectivo - a.porcentaje_efectivo);

  return { genealogia, cius };
}

// ── Historial (línea de tiempo de todo lo que le pasó al lote) ─────────────

export type LoteHistorialEvento =
  | {
      kind: "origen_ingreso";
      fecha: string;
      recepciones: Array<{ codigo_ciu: string | null; fecha_hora: string; kg_pesados: number | null }>;
    }
  | {
      kind: "origen_corte";
      fecha: string;
      corte_id: string;
      objetivo: string | null;
      componentes: Array<{ lote_id: string; lote_codigo: string; porcentaje: number }>;
    }
  | {
      kind: "movimiento_vasija";
      fecha: string;
      vasija_codigo: string;
      volumen_l: number;
      cerrado: boolean;
      tipo_operacion: string | null;
      observaciones: string | null;
      responsable: string | null;
    }
  | {
      kind: "usado_en_corte";
      fecha: string;
      corte_id: string;
      lote_resultado_id: string;
      lote_resultado_codigo: string;
      porcentaje: number;
    };

export async function getLoteHistorial(loteId: string, userId: string): Promise<LoteHistorialEvento[]> {
  const lote = await prisma.lote.findUnique({
    where: { lote_id: loteId },
    include: {
      lote_origen_recepcion: {
        include: { recepcion_bodega: { include: { ciu: true } } },
      },
      corte_origen: {
        select: { corte_id: true, fecha: true, objetivo: true },
      },
      composicion_hijo: {
        include: { lote_padre: { select: { lote_id: true, codigo: true } } },
      },
    },
  });
  if (!lote) throw new LoteError("Lote no encontrado", 404);
  await ensureUserBodega(userId, lote.bodega_id);

  const eventos: LoteHistorialEvento[] = [];

  if (lote.origen === "ingreso" && lote.lote_origen_recepcion.length > 0) {
    const recepciones = lote.lote_origen_recepcion.map((lor) => ({
      codigo_ciu: lor.recepcion_bodega.ciu?.codigo_ciu ?? null,
      fecha_hora: lor.recepcion_bodega.fecha_hora.toISOString(),
      kg_pesados: lor.recepcion_bodega.kg_pesados ? Number(lor.recepcion_bodega.kg_pesados) : null,
    }));
    const fecha = recepciones.reduce(
      (min, r) => (r.fecha_hora < min ? r.fecha_hora : min),
      recepciones[0]!.fecha_hora,
    );
    eventos.push({ kind: "origen_ingreso", fecha, recepciones });
  }

  if (lote.origen === "corte" && lote.corte_origen) {
    eventos.push({
      kind: "origen_corte",
      fecha: lote.corte_origen.fecha.toISOString(),
      corte_id: lote.corte_origen.corte_id,
      objetivo: lote.corte_origen.objetivo,
      componentes: lote.composicion_hijo.map((c) => ({
        lote_id: c.lote_padre.lote_id,
        lote_codigo: c.lote_padre.codigo,
        porcentaje: Number(c.porcentaje ?? 0),
      })),
    });
  }

  const movimientos = await prisma.vasijaContenido.findMany({
    where: { lote_id: loteId },
    include: {
      vasija: { select: { codigo: true } },
      operacion_vasija: { include: { app_user: { select: { nombre: true } } } },
    },
    orderBy: { desde: "asc" },
  });
  for (const m of movimientos) {
    eventos.push({
      kind: "movimiento_vasija",
      fecha: m.desde.toISOString(),
      vasija_codigo: m.vasija.codigo,
      volumen_l: Number(m.volumen_l ?? 0),
      cerrado: m.hasta !== null,
      tipo_operacion: m.operacion_vasija?.tipo ?? null,
      observaciones: m.operacion_vasija?.observaciones ?? null,
      responsable: m.operacion_vasija?.app_user?.nombre ?? null,
    });
  }

  const usosComoComponente = await prisma.loteComposicion.findMany({
    where: { lote_padre_id: loteId },
    include: {
      lote: { select: { lote_id: true, codigo: true } },
      corte: { select: { corte_id: true, fecha: true } },
    },
  });
  for (const uso of usosComoComponente) {
    if (!uso.corte) continue;
    eventos.push({
      kind: "usado_en_corte",
      fecha: uso.corte.fecha.toISOString(),
      corte_id: uso.corte.corte_id,
      lote_resultado_id: uso.lote.lote_id,
      lote_resultado_codigo: uso.lote.codigo,
      porcentaje: Number(uso.porcentaje ?? 0),
    });
  }

  return eventos.sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));
}

function campoDecimal(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

/**
 * Arma una línea de 50 campos separados por "|", replicando el formato txt del INV
 * (mapeado a mano contra 6 CIU reales — ver docs/modulo-lotes.md). Las posiciones
 * marcadas como "sin confirmar" en ese mapeo se dejan fijas con el mismo valor que
 * aparece en los ejemplos reales, para que el formato quede idéntico.
 */
function construirLineaCiuInv(ciu: {
  codigo_ciu: string;
  emitido_at: Date;
  estado: string;
  variedad_codigo_inv: string | null;
  tenor_azucarino_gl: unknown;
  uva_organica: boolean | null;
  bodega: { nro_inscripto_inv: string | null; cuit: string | null; nombre: string; razon_social: string | null };
  finca: { nro_inscripto_inv: string | null; cuit: string | null; razon_social: string | null; renspa: string | null } | null;
  recepcion_bodega: {
    remito_uva: {
      kg_bruto: unknown;
      kg_tara: unknown;
      kg_neto: unknown;
      patente: string | null;
      modelo_vehiculo: string | null;
      cuit_conductor: string | null;
      tipo_cosecha: string | null;
    };
  };
}): string {
  const remito = ciu.recepcion_bodega.remito_uva;
  const fecha = ciu.emitido_at.toISOString().slice(0, 10);
  const anio = String(ciu.emitido_at.getFullYear());
  const cosechaCodigo = remito.tipo_cosecha === "manual" ? "M" : "T";
  const estadoCodigo = ciu.estado === "aprobado" || ciu.estado === "emitido" ? "A" : ciu.estado.slice(0, 1).toUpperCase();
  const organicaCodigo = ciu.uva_organica ? "S" : "-";

  const campos = [
    ciu.codigo_ciu, // 1
    "60", // 2 — constante, sin confirmar
    ciu.codigo_ciu, // 3
    fecha, // 4 — Fecha CIU
    "", // 5 — Antecedente Administrativo
    ciu.bodega.nro_inscripto_inv ?? "", // 6
    ciu.bodega.razon_social ?? ciu.bodega.nombre, // 7
    ciu.bodega.cuit ?? "", // 8
    "", "", "", // 9-11 — sin confirmar
    ciu.finca?.nro_inscripto_inv ?? "", // 12
    ciu.finca?.razon_social ?? "", // 13
    ciu.finca?.cuit ?? "", // 14
    "", "", "", "", "", "", "", "", "", // 15-23 — Rubro II(B) + reservado, sin confirmar
    campoDecimal(remito.kg_bruto), // 24
    campoDecimal(remito.kg_tara), // 25
    campoDecimal(remito.kg_neto), // 26
    remito.patente ?? "", // 27
    remito.modelo_vehiculo ?? "", // 28
    remito.cuit_conductor ?? "", // 29
    ciu.variedad_codigo_inv ?? "", // 30
    campoDecimal(ciu.tenor_azucarino_gl), // 31
    cosechaCodigo, // 32 — T=mecanizada, M=manual
    organicaCodigo, // 33 — inferido: "-"=No
    "", // 34 — sin confirmar
    "AL", // 35 — inferido: Tipo Alta
    "0", // 36 — inferido: Antecedente Administrativo numérico
    "", "", "", "", // 37-40 — sin confirmar
    anio, // 41 — inferido: año/campaña
    "", "", "", "", "", // 42-46 — Modalidad de comercialización, sin confirmar
    estadoCodigo, // 47 — A=Aprobado
    "1", // 48 — sin confirmar
    "0", // 49 — sin confirmar
    ciu.finca?.renspa ?? "", // 50 — RENSPA
  ];

  return campos.join("|");
}

/**
 * Documento .txt con una línea por CIU de origen del lote (formato del INV, 50
 * campos separados por "|" — ver docs/modulo-lotes.md para el mapeo campo a campo).
 */
export async function getLoteCiusExport(loteId: string, userId: string): Promise<string> {
  const { cius } = await getLoteGenealogia(loteId, userId);
  if (cius.length === 0) return "";

  const registros = await prisma.ciu.findMany({
    where: { ciu_id: { in: cius.map((c) => c.ciu_id) } },
    include: {
      bodega: { select: { nro_inscripto_inv: true, cuit: true, nombre: true, razon_social: true } },
      finca: { select: { nro_inscripto_inv: true, cuit: true, razon_social: true, renspa: true } },
      recepcion_bodega: {
        include: {
          remito_uva: {
            select: {
              kg_bruto: true,
              kg_tara: true,
              kg_neto: true,
              patente: true,
              modelo_vehiculo: true,
              cuit_conductor: true,
              tipo_cosecha: true,
            },
          },
        },
      },
    },
  });

  const registrosPorId = new Map(registros.map((r) => [r.ciu_id, r]));
  const lineas = cius
    .map((c) => registrosPorId.get(c.ciu_id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map((r) => construirLineaCiuInv(r));

  return lineas.join("\n");
}
