import { prisma } from "../../config/prismaClient.js";
import {
  recolectarCiusDeGenealogia,
  resolverGenealogiaLote,
  type CiuContribucion,
  type LoteGenealogiaNode,
} from "../lotes/lotes.service.js";

type CreateTrazabilidadInput = {
  protocoloId: string;
  bodegaId: string;
  fincaId?: string;
  cuartelId?: string;
  campaniaId: string;
  nombre_producto?: string;
  imagen_producto?: string;
  userId: string;
};

type AddTrazabilidadOrigenInput = {
  trazabilidadId: string;
  fincaId: string;
  cuartelId: string;
  userId: string;
};

export class TrazabilidadError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function ensureUserBodega(userId: string, bodegaId: string) {
  const rel = await prisma.userBodega.findFirst({
    where: { user_id: userId, bodega_id: bodegaId },
  });
  if (!rel) {
    throw new TrazabilidadError("No autorizado para esta bodega", 403);
  }
}

export async function getTrazabilidadById(
  trazabilidadId: string,
  userId: string,
) {
  const trazabilidad = await prisma.trazabilidad.findUnique({
    where: { trazabilidad_id: trazabilidadId },
    include: {
      trazabilidad_origen: true,
    },
  });
  if (!trazabilidad) {
    throw new TrazabilidadError("Trazabilidad no encontrada", 404);
  }
  await ensureUserBodega(userId, trazabilidad.bodega_id);
  return trazabilidad;
}

export async function listTrazabilidades(userId: string, bodegaId?: string) {
  if (bodegaId) {
    await ensureUserBodega(userId, bodegaId);
    return prisma.trazabilidad.findMany({
      where: { bodega_id: bodegaId },
      include: { trazabilidad_origen: true },
    });
  }

  const bodegas = await prisma.userBodega.findMany({
    where: { user_id: userId },
    select: { bodega_id: true },
  });
  const ids = bodegas.map((b) => b.bodega_id);
  if (ids.length === 0) return [];

  return prisma.trazabilidad.findMany({
    where: { bodega_id: { in: ids } },
    include: { trazabilidad_origen: true },
  });
}

export async function createTrazabilidad({
  protocoloId,
  bodegaId,
  fincaId,
  cuartelId,
  campaniaId,
  nombre_producto,
  imagen_producto,
  userId,
}: CreateTrazabilidadInput) {
  if (!protocoloId || !bodegaId || !campaniaId) {
    throw new TrazabilidadError("Datos incompletos", 400);
  }

  await ensureUserBodega(userId, bodegaId);

  if ((fincaId && !cuartelId) || (!fincaId && cuartelId)) {
    throw new TrazabilidadError("fincaId y cuartelId deben enviarse juntos", 400);
  }

  if (fincaId && cuartelId) {
    const finca = await prisma.finca.findUnique({
      where: { finca_id: fincaId },
      select: { bodega_id: true },
    });
    if (!finca || finca.bodega_id !== bodegaId) {
      throw new TrazabilidadError("La finca no pertenece a la bodega", 400);
    }

    const cuartel = await prisma.cuartel.findUnique({
      where: { cuartel_id: cuartelId },
      select: { finca_id: true },
    });
    if (!cuartel || cuartel.finca_id !== fincaId) {
      throw new TrazabilidadError("El cuartel no pertenece a la finca", 400);
    }
  }

  const protocolo = await prisma.protocolo.findUnique({
    where: { protocolo_id: protocoloId },
    select: { protocolo_id: true },
  });
  if (!protocolo) {
    throw new TrazabilidadError("Protocolo no encontrado", 404);
  }

  const campania = await prisma.campania.findUnique({
    where: { campania_id: campaniaId },
    select: { campania_id: true, bodega_id: true },
  });
  if (!campania) {
    throw new TrazabilidadError("Campaña no encontrada", 404);
  }
  if (campania.bodega_id !== bodegaId) {
    throw new TrazabilidadError("La campaña no pertenece a la bodega", 400);
  }

  const data: {
    protocolo_id: string;
    bodega_id: string;
    finca_id?: string;
    cuartel_id?: string;
    campania_id: string;
    nombre_producto?: string | null;
    imagen_producto?: string | null;
  } = {
    protocolo_id: protocoloId,
    bodega_id: bodegaId,
    campania_id: campaniaId,
  };
  if (fincaId && cuartelId) {
    data.finca_id = fincaId;
    data.cuartel_id = cuartelId;
  }

  if (nombre_producto !== undefined) data.nombre_producto = nombre_producto;
  if (imagen_producto !== undefined) data.imagen_producto = imagen_producto;

  const trazabilidad = await prisma.trazabilidad.create({ data });

  if (fincaId && cuartelId) {
    await prisma.trazabilidadOrigen.create({
      data: {
        trazabilidad_id: trazabilidad.trazabilidad_id,
        finca_id: fincaId,
        cuartel_id: cuartelId,
      },
    });
  }

  return trazabilidad;
}

export async function addTrazabilidadOrigen({
  trazabilidadId,
  fincaId,
  cuartelId,
  userId,
}: AddTrazabilidadOrigenInput) {
  if (!trazabilidadId || !fincaId || !cuartelId) {
    throw new TrazabilidadError("Datos incompletos", 400);
  }

  const trazabilidad = await prisma.trazabilidad.findUnique({
    where: { trazabilidad_id: trazabilidadId },
    select: { trazabilidad_id: true, bodega_id: true },
  });
  if (!trazabilidad) {
    throw new TrazabilidadError("Trazabilidad no encontrada", 404);
  }
  await ensureUserBodega(userId, trazabilidad.bodega_id);

  const finca = await prisma.finca.findUnique({
    where: { finca_id: fincaId },
    select: { bodega_id: true },
  });
  if (!finca || finca.bodega_id !== trazabilidad.bodega_id) {
    throw new TrazabilidadError("La finca no pertenece a la bodega de la trazabilidad", 400);
  }

  const cuartel = await prisma.cuartel.findUnique({
    where: { cuartel_id: cuartelId },
    select: { finca_id: true },
  });
  if (!cuartel || cuartel.finca_id !== fincaId) {
    throw new TrazabilidadError("El cuartel no pertenece a la finca", 400);
  }

  await prisma.trazabilidadOrigen.upsert({
    where: {
      trazabilidad_id_finca_id_cuartel_id: {
        trazabilidad_id: trazabilidadId,
        finca_id: fincaId,
        cuartel_id: cuartelId,
      },
    },
    create: {
      trazabilidad_id: trazabilidadId,
      finca_id: fincaId,
      cuartel_id: cuartelId,
    },
    update: {},
  });

  return prisma.trazabilidadOrigen.findMany({
    where: { trazabilidad_id: trazabilidadId },
    orderBy: [{ finca_id: "asc" }, { cuartel_id: "asc" }],
  });
}

export async function getTrazabilidadInversaByCodigoEnvase(
  codigoQr: string,
  userId: string,
) {
  if (!codigoQr?.trim()) {
    throw new TrazabilidadError("codigoQr requerido", 400);
  }

  const codigo = await prisma.codigoEnvase.findUnique({
    where: { codigo_qr: codigoQr.trim() },
    include: {
      lote_fraccionamiento: {
        include: {
          producto: {
            select: {
              producto_id: true,
              bodega_id: true,
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
    throw new TrazabilidadError("Código de envase no encontrado", 404);
  }

  const bodegaId = codigo.lote_fraccionamiento.producto.bodega_id;
  await ensureUserBodega(userId, bodegaId);

  const corte = codigo.lote_fraccionamiento.corte;

  // Raíces desde las que arrancar la genealogía, con su peso relativo dentro del corte.
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

  for (const loteId of raices) {
    const nodo = await resolverGenealogiaLote(loteId, pesoPorRaiz);
    genealogia.push(nodo);
    recolectarCiusDeGenealogia(nodo, pesoPorRaiz, ciusMap);
  }

  const cius = Array.from(ciusMap.values()).sort((a, b) => b.porcentaje_efectivo - a.porcentaje_efectivo);

  return {
    codigo_envase_id: codigo.codigo_envase_id,
    codigo_qr: codigo.codigo_qr,
    codigo_lote_impreso: codigo.codigo_lote_impreso,
    lote_fraccionamiento: {
      lote_fraccionamiento_id:
        codigo.lote_fraccionamiento.lote_fraccionamiento_id,
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
  };
}
