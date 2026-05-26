import { prisma } from "../../config/prismaClient.js";

export class PublicError extends Error {
  status: number;
  constructor(message: string, status = 404) {
    super(message);
    this.status = status;
  }
}

/**
 * Returns the full traceability timeline for a cuartel.
 * No authentication required — data is intentionally public for end consumers.
 */
export async function getPublicTrazabilidadCuartel(cuartelId: string) {
  if (!cuartelId) {
    throw new PublicError("cuartelId requerido", 400);
  }

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
    throw new PublicError("Cuartel no encontrado", 404);
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
