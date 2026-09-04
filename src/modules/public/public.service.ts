import { prisma } from "../../config/prismaClient.js";
import {
  recolectarCiusDeGenealogia,
  resolverGenealogiaLote,
  type CiuContribucion,
  type LoteGenealogiaNode,
} from "../lotes/lotes.service.js";

export class PublicError extends Error {
  status: number;
  constructor(message: string, status = 404) {
    super(message);
    this.status = status;
  }
}

/**
 * Arma la línea de tiempo de campo de un cuartel (tareas, remitos, CIU) — la
 * usa tanto el endpoint público por cuartel como el de producto (que la trae
 * para cada cuartel involucrado en el blend).
 */
async function resolverTrazabilidadCuartel(cuartelId: string) {
  // 1. Cuartel + finca info
  const cuartel = await prisma.cuartel.findUnique({
    where: { cuartel_id: cuartelId },
    include: {
      finca: {
        select: {
          finca_id: true,
          nombre_finca: true,
          ubicacion_texto: true,
          renspa: true,
        },
      },
    },
  });

  if (!cuartel) {
    return null;
  }

  // 2. Tareas de campo (completadas o en progreso) vinculadas al cuartel
  const tareas = await prisma.tarea.findMany({
    where: { cuartel_id: cuartelId },
    include: {
      protocolo_proceso: {
        select: { nombre: true, evento_tipo: true },
      },
      tarea_asignacion: {
        include: {
          app_user: { select: { nombre: true } },
        },
      },
      entradas: {
        include: {
          app_user: { select: { nombre: true } },
        },
        orderBy: { fecha: "asc" },
      },
    },
    orderBy: { updated_at: "desc" },
  });

  // 3. Remitos de uva del cuartel
  const remitosUva = await prisma.remitoUva.findMany({
    where: { cuartel_id: cuartelId },
    select: {
      remito_uva_id: true,
      salida_finca: true,
      llegada_bodega: true,
      kg_declarados: true,
      transportista: true,
      patente: true,
      created_at: true,
      recepcion_bodega: {
        select: {
          recepcion_bodega_id: true,
          fecha_hora: true,
          kg_pesados: true,
          clasificacion: true,
          observaciones: true,
        },
      },
    },
    orderBy: { salida_finca: "desc" },
  });

  // 4. CIUs de la finca (CIU no tiene cuartel_id, solo finca_id)
  const cius = await prisma.ciu.findMany({
    where: { finca_id: cuartel.finca_id },
    select: {
      ciu_id: true,
      codigo_ciu: true,
      estado: true,
      emitido_at: true,
      observaciones: true,
    },
    orderBy: { emitido_at: "desc" },
  });

  return {
    cuartel: {
      cuartel_id: cuartel.cuartel_id,
      codigo_cuartel: cuartel.codigo_cuartel,
      cultivo: cuartel.cultivo,
      variedad: cuartel.variedad,
      tipo_variedad: cuartel.tipo_variedad,
      superficie_ha: cuartel.superficie_ha ? Number(cuartel.superficie_ha) : null,
      sistema_riego: cuartel.sistema_riego,
      sistema_productivo: cuartel.sistema_productivo,
      sistema_conduccion: cuartel.sistema_conduccion,
      poligono: cuartel.poligono ?? null,
      centroide: cuartel.centroide ?? null,
      finca: cuartel.finca,
    },
    tareas: tareas.map((t) => ({
      tarea_id: t.tarea_id,
      titulo: t.titulo,
      descripcion: t.descripcion,
      estado: t.estado,
      prioridad: t.prioridad,
      fecha_fin: t.fecha_fin,
      updated_at: t.updated_at,
      created_at: t.created_at,
      proceso: t.protocolo_proceso
        ? { nombre: t.protocolo_proceso.nombre, tipo_evento: t.protocolo_proceso.evento_tipo }
        : null,
      asignaciones: t.tarea_asignacion.map((a) => ({
        estado: a.estado,
        operario: a.app_user?.nombre ?? null,
      })),
      entradas: t.entradas.map((e) => ({
        entrada_id: e.entrada_id,
        fecha: e.fecha,
        descripcion: e.descripcion,
        registrado_por: e.app_user?.nombre ?? null,
        adjuntos: Array.isArray(e.adjuntos) ? e.adjuntos : [],
      })),
    })),
    remitos_uva: remitosUva.map((r) => ({
      remito_uva_id: r.remito_uva_id,
      salida_finca: r.salida_finca,
      llegada_bodega: r.llegada_bodega,
      kg_declarados: r.kg_declarados ? Number(r.kg_declarados) : null,
      transportista: r.transportista,
      recepciones: r.recepcion_bodega.map((rb) => ({
        recepcion_bodega_id: rb.recepcion_bodega_id,
        fecha_hora: rb.fecha_hora,
        kg_pesados: rb.kg_pesados ? Number(rb.kg_pesados) : null,
        clasificacion: rb.clasificacion,
      })),
    })),
    cius: cius.map((c) => ({
      ciu_id: c.ciu_id,
      codigo_ciu: c.codigo_ciu,
      estado: c.estado,
      emitido_at: c.emitido_at,
    })),
  };
}

/**
 * Returns the full traceability timeline for a cuartel.
 * No authentication required — data is intentionally public for end consumers.
 */
export async function getPublicTrazabilidadCuartel(cuartelId: string) {
  if (!cuartelId) {
    throw new PublicError("cuartelId requerido", 400);
  }
  const data = await resolverTrazabilidadCuartel(cuartelId);
  if (!data) {
    throw new PublicError("Cuartel no encontrado", 404);
  }
  return data;
}

/** Recorre el árbol de genealogía y junta, sin repetir, los cuartel_id de las hojas. */
function recolectarCuartelIds(nodo: LoteGenealogiaNode, out: Set<string>): void {
  if (nodo.cuartel) out.add(nodo.cuartel.cuartel_id);
  for (const hijo of nodo.hijos) recolectarCuartelIds(hijo, out);
}

/**
 * Trazabilidad pública de un lote puntual (todavía no fraccionado en producto,
 * o cualquier lote intermedio del blend) — misma idea que `getPublicProducto`
 * pero arrancando directo desde un `lote_id` en vez de un código de envase, para
 * los links "vista linda" del diagrama de genealogía interno.
 */
export async function getPublicLote(loteId: string) {
  if (!loteId) {
    throw new PublicError("loteId requerido", 400);
  }

  let genealogia: LoteGenealogiaNode;
  try {
    genealogia = await resolverGenealogiaLote(loteId, null);
  } catch {
    throw new PublicError("Lote no encontrado", 404);
  }

  const ciusMap = new Map<string, CiuContribucion>();
  recolectarCiusDeGenealogia(genealogia, 100, ciusMap);
  const cius = Array.from(ciusMap.values()).sort((a, b) => b.porcentaje_efectivo - a.porcentaje_efectivo);

  const cuartelIds = new Set<string>();
  recolectarCuartelIds(genealogia, cuartelIds);
  const cuarteles = await Promise.all(
    Array.from(cuartelIds).map((cuartelId) => resolverTrazabilidadCuartel(cuartelId)),
  );

  return {
    lote_id: genealogia.lote_id,
    codigo: genealogia.codigo,
    origen: genealogia.origen,
    genealogia,
    cius,
    cuarteles: cuarteles.filter((c): c is NonNullable<typeof c> => c !== null),
  };
}

/**
 * Trazabilidad pública de un producto embotellado, a partir del código QR de
 * su envase: quién es el producto, de qué lote(s)/corte viene, y — a
 * diferencia de la versión autenticada (`getTrazabilidadInversaByCodigoEnvase`)
 * pensada para el enólogo — junta además la línea de campo completa (tareas,
 * remitos, CIU) de CADA cuartel de origen involucrado, no solo el nombre.
 * Sin auth: es lo que resuelve el QR de la etiqueta para cualquiera.
 */
export async function getPublicProducto(codigoQr: string) {
  if (!codigoQr?.trim()) {
    throw new PublicError("codigoQr requerido", 400);
  }

  const codigo = await prisma.codigoEnvase.findUnique({
    where: { codigo_qr: codigoQr.trim() },
    include: {
      lote_fraccionamiento: {
        include: {
          producto: {
            select: {
              producto_id: true,
              nombre_comercial: true,
              varietal: true,
              anio: true,
              tipo: true,
            },
          },
          corte: {
            include: {
              // Flujo nuevo (guiado, vía vasijas): el corte ya generó su propio Lote.
              lote_creado: { select: { lote_id: true } },
              // Flujo viejo (carga manual): hay que resolver el/los lote(s) a mano.
              corte_componente: {
                include: {
                  lote: { select: { lote_id: true } },
                  vasija: {
                    include: {
                      vasija_contenido: { select: { lote_id: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!codigo) {
    throw new PublicError("Código de envase no encontrado", 404);
  }

  const corte = codigo.lote_fraccionamiento.corte;

  const raices: string[] = [];
  if (corte.lote_creado.length > 0) {
    for (const l of corte.lote_creado) raices.push(l.lote_id);
  } else {
    const loteIds = new Set<string>();
    for (const componente of corte.corte_componente) {
      if (componente.lote) loteIds.add(componente.lote.lote_id);
      if (componente.vasija) {
        for (const vc of componente.vasija.vasija_contenido) loteIds.add(vc.lote_id);
      }
    }
    raices.push(...loteIds);
  }

  const pesoPorRaiz = raices.length > 0 ? 100 / raices.length : 0;
  const genealogia: LoteGenealogiaNode[] = [];
  const ciusMap = new Map<string, CiuContribucion>();
  const cuartelIds = new Set<string>();

  for (const loteId of raices) {
    const nodo = await resolverGenealogiaLote(loteId, pesoPorRaiz);
    genealogia.push(nodo);
    recolectarCiusDeGenealogia(nodo, pesoPorRaiz, ciusMap);
    recolectarCuartelIds(nodo, cuartelIds);
  }

  const cius = Array.from(ciusMap.values()).sort((a, b) => b.porcentaje_efectivo - a.porcentaje_efectivo);
  const cuarteles = await Promise.all(
    Array.from(cuartelIds).map((cuartelId) => resolverTrazabilidadCuartel(cuartelId)),
  );

  return {
    codigo_envase_id: codigo.codigo_envase_id,
    codigo_qr: codigo.codigo_qr,
    codigo_lote_impreso: codigo.codigo_lote_impreso,
    lote_fraccionamiento: {
      lote_fraccionamiento_id: codigo.lote_fraccionamiento.lote_fraccionamiento_id,
      fecha: codigo.lote_fraccionamiento.fecha,
      botellas: codigo.lote_fraccionamiento.botellas,
      formato: codigo.lote_fraccionamiento.formato,
    },
    producto: codigo.lote_fraccionamiento.producto,
    corte: {
      corte_id: corte.corte_id,
      fecha: corte.fecha,
      objetivo: corte.objetivo,
    },
    genealogia,
    cius,
    cuarteles: cuarteles.filter((c): c is NonNullable<typeof c> => c !== null),
  };
}
