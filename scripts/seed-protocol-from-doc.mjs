import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
}

const t = (campo, type, required, extra = {}) => ({ campo, type, required, ...extra });
const plantilla = (campos) => ({ version: 1, campos });

export const etapas = [
  {
    nombre: "CAPÍTULO 0 · ORIGEN",
    orden: 0,
    procesos: [
      {
        nombre: "ORIGEN / UNIDAD PRODUCTIVA",
        evento_tipo: "origen_unidad_productiva",
        obligatorio: true,
        orden: 1,
        plantilla: plantilla([
          t("productor_razon_social", "string", true),
          t("finca", "string", true),
          t("localidad", "string", true),
          t("provincia", "string", true),
          t("codigo_cuartel", "string", true),
          t("superficie_ha", "number", true, { unit: "ha" }),
          t("cultivo", "string", true),
          t("variedad", "string", true),
          t("sistema_productivo", "string", false),
          t("sistema_riego", "string", false),
          t("sistema_conduccion", "string", false),
          t("coordenadas", "string", false),
        ]),
      },
    ],
  },
  {
    nombre: "CAPÍTULO 1 · PROCESOS PRODUCTIVOS",
    orden: 1,
    procesos: [
      {
        nombre: "MANEJO DE CANOPIA",
        evento_tipo: "canopia",
        obligatorio: true,
        orden: 1,
        plantilla: plantilla([
          t("fecha", "date", true),
          t("cuartel_id", "string", true),
          t("tipo_practica", "string", true, { enum: ["poda", "desbrote", "despampanado", "raleo"] }),
          t("intensidad", "string", true),
          t("jornales_horas", "number", true),
          t("responsable_user_id", "string", true),
          t("metodo", "string", false, { enum: ["manual", "mecanico"] }),
          t("observaciones", "string", false),
        ]),
      },
      {
        nombre: "MONITOREO FENOLÓGICO",
        evento_tipo: "fenologia",
        obligatorio: true,
        orden: 2,
        plantilla: plantilla([
          t("fecha", "date", true),
          t("cuartel_id", "string", true),
          t("estado_fenologico", "string", true, { enum: ["brotacion", "floracion", "envero", "maduracion"] }),
          t("responsable_user_id", "string", true),
          t("porcentaje_avance", "number", false, { unit: "%" }),
          t("brix", "number", false),
          t("observaciones", "string", false),
        ]),
      },
      {
        nombre: "COSECHA",
        evento_tipo: "cosecha",
        obligatorio: true,
        orden: 3,
        plantilla: plantilla([
          t("fecha_cosecha", "date", true),
          t("cuartel_id", "string", true),
          t("cantidad", "number", true),
          t("unidad", "string", true, { enum: ["kg", "bins", "cajas"] }),
          t("destino", "string", true),
          t("responsable_user_id", "string", true),
        ]),
      },
    ],
  },
  {
    nombre: "CAPÍTULO 2 · AGUA",
    orden: 2,
    procesos: [
      {
        nombre: "RIEGO",
        evento_tipo: "riego",
        obligatorio: true,
        orden: 1,
        plantilla: plantilla([
          t("fecha", "date", true),
          t("cuartel_id", "string", true),
          t("volumen", "number", true),
          t("unidad", "string", true, { enum: ["m3", "mm"] }),
          t("tiempo_horas", "number", true),
          t("sistema_riego", "string", true),
          t("responsable_user_id", "string", true),
          t("hora_inicio", "string", false),
          t("fuente_agua", "string", false),
          t("observaciones", "string", false),
        ]),
      },
      {
        nombre: "PRECIPITACIONES",
        evento_tipo: "precipitacion",
        obligatorio: true,
        orden: 2,
        plantilla: plantilla([
          t("fecha", "date", true),
          t("milimetros", "number", true, { unit: "mm" }),
          t("origen_dato", "string", false),
          t("observaciones", "string", false),
        ]),
      },
    ],
  },
  {
    nombre: "CAPÍTULO 3 · SUELO Y LABORES CULTURALES",
    orden: 3,
    procesos: [
      {
        nombre: "LABORES DE SUELO",
        evento_tipo: "labor_suelo",
        obligatorio: true,
        orden: 1,
        plantilla: plantilla([
          t("fecha", "date", true),
          t("cuartel_id", "string", true),
          t("tipo_labor", "string", true),
          t("intensidad", "string", true),
          t("jornales", "number", true),
          t("responsable_user_id", "string", true),
        ]),
      },
      {
        nombre: "FERTILIZACIÓN",
        evento_tipo: "fertilizacion",
        obligatorio: true,
        orden: 2,
        plantilla: plantilla([
          t("fecha", "date", true),
          t("cuartel_id", "string", true),
          t("producto", "string", true),
          t("dosis", "number", true),
          t("unidad", "string", true),
          t("metodo", "string", true),
          t("responsable_user_id", "string", true),
        ]),
      },
      {
        nombre: "ANÁLISIS DE SUELO",
        evento_tipo: "analisis_suelo",
        obligatorio: true,
        orden: 3,
        plantilla: plantilla([
          t("fecha", "date", true),
          t("unidad_muestreada", "string", true),
          t("laboratorio", "string", true),
          t("parametros", "string", true),
        ]),
      },
      {
        nombre: "ENMIENDAS",
        evento_tipo: "enmienda",
        obligatorio: true,
        orden: 4,
        plantilla: plantilla([
          t("fecha", "date", true),
          t("tipo", "string", true),
          t("dosis", "number", true),
          t("unidad", "string", true),
          t("responsable_user_id", "string", true),
        ]),
      },
      {
        nombre: "COBERTURA / EROSIÓN",
        evento_tipo: "cobertura_erosion",
        obligatorio: true,
        orden: 5,
        plantilla: plantilla([
          t("fecha", "date", true),
          t("tipo_cobertura", "string", true),
          t("manejo", "string", true),
          t("responsable_user_id", "string", true),
        ]),
      },
      {
        nombre: "LABORES CULTURALES (MECANIZADAS)",
        evento_tipo: "labores_culturales",
        obligatorio: false,
        orden: 6,
        plantilla: plantilla([
          t("fecha", "date", true),
          t("cuartel_id", "string", true),
          t("tipo_labor", "string", true),
          t("intensidad", "string", true),
          t("jornales", "number", true),
          t("responsable_user_id", "string", true),
        ]),
      },
    ],
  },
  {
    nombre: "CAPÍTULO 4 · MIP",
    orden: 4,
    procesos: [
      {
        nombre: "MONITOREO DE ENFERMEDADES",
        evento_tipo: "monitoreo_enfermedad",
        obligatorio: true,
        orden: 1,
        plantilla: plantilla([
          t("fecha", "date", true),
          t("cuartel_id", "string", true),
          t("enfermedad", "string", true),
          t("incidencia", "string", true),
          t("responsable_user_id", "string", true),
        ]),
      },
      {
        nombre: "MONITOREO DE PLAGAS",
        evento_tipo: "monitoreo_plaga",
        obligatorio: true,
        orden: 2,
        plantilla: plantilla([
          t("fecha", "date", true),
          t("cuartel_id", "string", true),
          t("plaga", "string", true),
          t("nivel", "string", true),
          t("responsable_user_id", "string", true),
        ]),
      },
      {
        nombre: "APLICACIÓN DE FITOSANITARIOS",
        evento_tipo: "aplicacion_fitosanitaria",
        obligatorio: true,
        orden: 3,
        plantilla: plantilla([
          t("fecha", "date", true),
          t("cuartel_id", "string", true),
          t("producto", "string", true),
          t("dosis", "number", true),
          t("unidad", "string", true),
          t("carencia_dias", "number", true),
          t("motivo", "string", true),
          t("responsable_user_id", "string", true),
          t("principio_activo", "string", false),
          t("condiciones_climaticas", "string", false),
          t("equipo", "string", false),
        ]),
      },
      {
        nombre: "SOBRANTES / LAVADO",
        evento_tipo: "sobrante_lavado",
        obligatorio: true,
        orden: 4,
        plantilla: plantilla([
          t("fecha", "date", true),
          t("tipo", "string", true),
          t("volumen", "number", true),
          t("disposicion", "string", true),
          t("responsable_user_id", "string", true),
        ]),
      },
    ],
  },
  {
    nombre: "CAPÍTULO 5 · INOCUIDAD",
    orden: 5,
    procesos: [
      {
        nombre: "LIMPIEZA DE COSECHA",
        evento_tipo: "limpieza_cosecha",
        obligatorio: true,
        orden: 1,
        plantilla: plantilla([
          t("fecha", "date", true),
          t("tipo_elemento", "string", true),
          t("metodo", "string", true),
          t("responsable_user_id", "string", true),
        ]),
      },
      {
        nombre: "SANITIZACIÓN BAÑOS",
        evento_tipo: "sanitizacion_banos",
        obligatorio: true,
        orden: 2,
        plantilla: plantilla([
          t("fecha", "date", true),
          t("tipo_bano", "string", true),
          t("checklist", "string", true),
          t("responsable_user_id", "string", true),
        ]),
      },
      {
        nombre: "NO CONFORMIDADES",
        evento_tipo: "no_conforme",
        obligatorio: true,
        orden: 3,
        plantilla: plantilla([
          t("fecha", "date", true),
          t("descripcion", "string", true),
          t("accion_correctiva", "string", true),
          t("responsable_user_id", "string", true),
        ]),
      },
      {
        nombre: "RECLAMOS",
        evento_tipo: "reclamo",
        obligatorio: true,
        orden: 4,
        plantilla: plantilla([
          t("fecha", "date", true),
          t("origen", "string", true),
          t("descripcion", "string", true),
          t("responsable_user_id", "string", true),
        ]),
      },
      {
        nombre: "INVENTARIO DE INSUMOS",
        evento_tipo: "inventario_insumos",
        obligatorio: false,
        orden: 5,
        plantilla: plantilla([
          t("producto", "string", true),
          t("cantidad", "number", true),
          t("fecha_vencimiento", "date", true),
          t("estado", "string", true),
        ]),
      },
      {
        nombre: "RESIDUOS",
        evento_tipo: "residuo",
        obligatorio: true,
        orden: 6,
        plantilla: plantilla([
          t("fecha", "date", true),
          t("tipo", "string", true),
          t("cantidad", "number", true),
          t("destino", "string", true),
          t("responsable_user_id", "string", true),
        ]),
      },
    ],
  },
  {
    nombre: "CAPÍTULO 6 · ENERGÍA",
    orden: 6,
    procesos: [
      {
        nombre: "ENERGÍA PARA RIEGO",
        evento_tipo: "energia",
        obligatorio: true,
        orden: 1,
        plantilla: plantilla([
          t("periodo", "string", true),
          t("cuartel_id", "string", true),
          t("tipo_energia", "string", true),
          t("consumo", "number", true),
          t("responsable_user_id", "string", true),
        ]),
      },
      {
        nombre: "ENERGÍA HELADAS",
        evento_tipo: "energia",
        obligatorio: false,
        orden: 2,
        plantilla: plantilla([
          t("fecha", "date", true),
          t("cuartel_id", "string", true),
          t("tipo_energia", "string", true),
          t("consumo", "number", true),
          t("responsable_user_id", "string", true),
        ]),
      },
    ],
  },
  {
    nombre: "CAPÍTULO 7 · PERSONAL",
    orden: 7,
    procesos: [
      {
        nombre: "CAPACITACIONES",
        evento_tipo: "capacitacion",
        obligatorio: true,
        orden: 1,
        plantilla: plantilla([
          t("fecha", "date", true),
          t("tema", "string", true),
          t("participantes", "string", true),
          t("responsable_user_id", "string", true),
        ]),
      },
      {
        nombre: "ENTREGA DE EPP",
        evento_tipo: "entrega_epp",
        obligatorio: true,
        orden: 2,
        plantilla: plantilla([
          t("fecha", "date", true),
          t("persona", "string", true),
          t("elemento", "string", true),
          t("responsable_user_id", "string", true),
        ]),
      },
      {
        nombre: "ACCIDENTES",
        evento_tipo: "accidente",
        obligatorio: true,
        orden: 3,
        plantilla: plantilla([
          t("fecha", "date", true),
          t("persona", "string", true),
          t("tipo", "string", true),
          t("accion", "string", true),
          t("responsable_user_id", "string", true),
        ]),
      },
    ],
  },
  {
    nombre: "CAPÍTULO 8 · MANTENIMIENTO",
    orden: 8,
    procesos: [
      {
        nombre: "MANTENIMIENTO DE EQUIPOS",
        evento_tipo: "mantenimiento",
        obligatorio: true,
        orden: 1,
        plantilla: plantilla([
          t("fecha", "date", true),
          t("equipo", "string", true),
          t("tipo", "string", true),
          t("responsable_user_id", "string", true),
        ]),
      },
    ],
  },
];

export async function seedProtocol(prisma) {
  await prisma.protocolo.updateMany({
    where: {
      NOT: {
        nombre: "PROTOCOLO DE TRAZABILIDAD Y SUSTENTABILIDAD – NIVEL FINCA",
      },
    },
    data: { activo: false },
  });

  const protocolo = await prisma.protocolo.upsert({
    where: { nombre_version: { nombre: "PROTOCOLO DE TRAZABILIDAD Y SUSTENTABILIDAD – NIVEL FINCA", version: "1.0.0" } },
    update: {
      descripcion: "Plantillas operativas base cargadas desde docs/protocol.md",
      activo: true,
    },
    create: {
      nombre: "PROTOCOLO DE TRAZABILIDAD Y SUSTENTABILIDAD – NIVEL FINCA",
      version: "1.0.0",
      descripcion: "Plantillas operativas base cargadas desde docs/protocol.md",
      activo: true,
    },
    select: { protocolo_id: true, nombre: true, version: true },
  });

  for (const etapa of etapas) {
    const createdEtapa = await prisma.protocoloEtapa.upsert({
      where: {
        protocolo_id_nombre: {
          protocolo_id: protocolo.protocolo_id,
          nombre: etapa.nombre,
        },
      },
      update: {
        orden: etapa.orden,
      },
      create: {
        protocolo_id: protocolo.protocolo_id,
        nombre: etapa.nombre,
        orden: etapa.orden,
      },
      select: { etapa_id: true },
    });

    for (const proceso of etapa.procesos) {
      await prisma.protocoloProceso.upsert({
        where: {
          etapa_id_nombre: {
            etapa_id: createdEtapa.etapa_id,
            nombre: proceso.nombre,
          },
        },
        update: {
          evento_tipo: proceso.evento_tipo,
          obligatorio: proceso.obligatorio,
          orden: proceso.orden,
          plantilla: proceso.plantilla,
        },
        create: {
          etapa_id: createdEtapa.etapa_id,
          nombre: proceso.nombre,
          evento_tipo: proceso.evento_tipo,
          obligatorio: proceso.obligatorio,
          orden: proceso.orden,
          plantilla: proceso.plantilla,
        },
      });
    }
  }

  console.log(`Protocolo seed OK. Etapas sincronizadas: ${etapas.length} (${protocolo.nombre} v${protocolo.version}).`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const prisma = createPrismaClient();

  seedProtocol(prisma)
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
