// Agrega (o actualiza, es idempotente) las ~42 operaciones de vasija de la
// especificación funcional como capítulos nuevos DENTRO del protocolo general
// ya existente ("PROTOCOLO DE TRAZABILIDAD Y SUSTENTABILIDAD – NIVEL FINCA"),
// en vez de crear un protocolo aparte — sigue siendo un solo protocolo, con
// todo adentro. Los capítulos 0-8 son de scripts/seed-protocol-from-doc.mjs
// (finca); acá seguimos la numeración desde el 9, sin tocar nada de esos.
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

// Campos comunes a toda operación de vasija con movimiento de volumen (llenado,
// vaciado, carga de mosto/vino, trasiego, corte de vinos, descube) — mismos
// nombres que espera `materializarMovimientoVasija` en tarea.service.ts.
const plantillaMovimiento = ({ requiereLote = false, requiereOtraVasija = true } = {}) =>
  plantilla([
    t("fecha_hora", "date", true),
    ...(requiereOtraVasija
      ? [t("vasijaId", "string", true, { label: "Otra vasija (origen o destino, según corresponda)" })]
      : []),
    t("volumen_movido_l", "number", true, { unit: "l" }),
    ...(requiereLote ? [t("loteId", "string", true)] : []),
    t("enologoUserId", "string", false),
    t("observaciones", "string", false),
  ]);

// Campos genéricos para operaciones sin ledger de volumen (limpieza,
// mantenimiento, fermentación como actividad, etc.) — quedan como Tarea con
// costos/insumos, sin tabla de dominio tipada.
const plantillaGenerica = (extra = []) =>
  plantilla([t("fecha_hora", "date", true), ...extra, t("observaciones", "string", false)]);

export const etapas = [
  {
    nombre: "CAPÍTULO 9 · MOVIMIENTO DE VINO",
    orden: 9,
    procesos: [
      { nombre: "LLENADO", evento_tipo: "llenado", obligatorio: false, orden: 1, plantilla: plantillaMovimiento({ requiereLote: true, requiereOtraVasija: false }) },
      { nombre: "VACIADO", evento_tipo: "vaciado", obligatorio: false, orden: 2, plantilla: plantillaMovimiento({ requiereOtraVasija: false }) },
      { nombre: "CARGA DE MOSTO", evento_tipo: "carga_mosto", obligatorio: false, orden: 3, plantilla: plantillaMovimiento({ requiereLote: true, requiereOtraVasija: false }) },
      { nombre: "CARGA DE VINO", evento_tipo: "carga_vino", obligatorio: false, orden: 4, plantilla: plantillaMovimiento({ requiereLote: true, requiereOtraVasija: false }) },
      { nombre: "TRASIEGO", evento_tipo: "trasiego", obligatorio: false, orden: 5, plantilla: plantillaMovimiento() },
      { nombre: "CORTE DE VINOS", evento_tipo: "corte_de_vinos", obligatorio: false, orden: 6, plantilla: plantillaMovimiento() },
      { nombre: "DESCUBE", evento_tipo: "descube", obligatorio: false, orden: 7, plantilla: plantillaMovimiento({ requiereOtraVasija: false }) },
    ],
  },
  {
    nombre: "CAPÍTULO 10 · PROCESO ENOLÓGICO",
    orden: 10,
    procesos: [
      { nombre: "HOMOGENEIZACIÓN", evento_tipo: "homogeneizacion", obligatorio: false, orden: 1, plantilla: plantillaGenerica() },
      { nombre: "FERMENTACIÓN ALCOHÓLICA", evento_tipo: "fermentacion_alcoholica", obligatorio: false, orden: 2, plantilla: plantillaGenerica([t("estado_fermentacion", "string", false)]) },
      { nombre: "FERMENTACIÓN MALOLÁCTICA", evento_tipo: "fermentacion_malolactica", obligatorio: false, orden: 3, plantilla: plantillaGenerica([t("estado_fermentacion", "string", false)]) },
      { nombre: "MACERACIÓN", evento_tipo: "maceracion", obligatorio: false, orden: 4, plantilla: plantillaGenerica() },
      { nombre: "CRIANZA", evento_tipo: "crianza", obligatorio: false, orden: 5, plantilla: plantillaGenerica() },
      { nombre: "CRIANZA SOBRE LÍAS", evento_tipo: "crianza_sobre_lias", obligatorio: false, orden: 6, plantilla: plantillaGenerica() },
      { nombre: "CLARIFICACIÓN", evento_tipo: "clarificacion", obligatorio: false, orden: 7, plantilla: plantillaGenerica() },
      { nombre: "ESTABILIZACIÓN", evento_tipo: "estabilizacion", obligatorio: false, orden: 8, plantilla: plantillaGenerica() },
      { nombre: "FILTRACIÓN", evento_tipo: "filtracion", obligatorio: false, orden: 9, plantilla: plantillaGenerica() },
      { nombre: "MICROOXIGENACIÓN", evento_tipo: "microoxigenacion", obligatorio: false, orden: 10, plantilla: plantillaGenerica() },
      { nombre: "AIREACIÓN", evento_tipo: "aireacion", obligatorio: false, orden: 11, plantilla: plantillaGenerica() },
      { nombre: "REMONTAJE", evento_tipo: "remontaje", obligatorio: false, orden: 12, plantilla: plantillaGenerica() },
      { nombre: "BAZUQUEO", evento_tipo: "bazuqueo", obligatorio: false, orden: 13, plantilla: plantillaGenerica() },
      { nombre: "DÉLESTAGE", evento_tipo: "delestage", obligatorio: false, orden: 14, plantilla: plantillaGenerica() },
      { nombre: "ADICIÓN DE INSUMOS ENOLÓGICOS", evento_tipo: "adicion_insumos_enologicos", obligatorio: false, orden: 15, plantilla: plantillaGenerica() },
      { nombre: "CORRECCIÓN ENOLÓGICA", evento_tipo: "correccion_enologica", obligatorio: false, orden: 16, plantilla: plantillaGenerica() },
    ],
  },
  {
    nombre: "CAPÍTULO 11 · CONTROL Y ANÁLISIS",
    orden: 11,
    procesos: [
      { nombre: "TOMA DE MUESTRA", evento_tipo: "toma_muestra", obligatorio: false, orden: 1, plantilla: plantillaGenerica() },
      { nombre: "MUESTREO PARA LABORATORIO", evento_tipo: "muestreo_laboratorio", obligatorio: false, orden: 2, plantilla: plantillaGenerica() },
      { nombre: "CONTROL ANALÍTICO", evento_tipo: "control_analitico", obligatorio: false, orden: 3, plantilla: plantillaGenerica() },
      { nombre: "INSPECCIÓN", evento_tipo: "inspeccion", obligatorio: false, orden: 4, plantilla: plantillaGenerica() },
    ],
  },
  {
    nombre: "CAPÍTULO 12 · PREPARACIÓN Y FRACCIONAMIENTO",
    orden: 12,
    procesos: [
      { nombre: "PREPARACIÓN PARA EMBOTELLADO", evento_tipo: "preparacion_embotellado", obligatorio: false, orden: 1, plantilla: plantillaGenerica() },
      { nombre: "ALIMENTACIÓN DE LÍNEA DE FRACCIONAMIENTO", evento_tipo: "alimentacion_linea_fraccionamiento", obligatorio: false, orden: 2, plantilla: plantillaGenerica() },
      { nombre: "PRENSADO", evento_tipo: "prensado", obligatorio: false, orden: 3, plantilla: plantillaGenerica() },
    ],
  },
  {
    nombre: "CAPÍTULO 13 · LIMPIEZA Y SANITIZACIÓN",
    orden: 13,
    procesos: [
      { nombre: "LAVADO", evento_tipo: "lavado", obligatorio: false, orden: 1, plantilla: plantillaGenerica() },
      { nombre: "LIMPIEZA CIP", evento_tipo: "limpieza_cip", obligatorio: false, orden: 2, plantilla: plantillaGenerica() },
      { nombre: "SANITIZACIÓN", evento_tipo: "sanitizacion", obligatorio: false, orden: 3, plantilla: plantillaGenerica() },
      { nombre: "DESINFECCIÓN", evento_tipo: "desinfeccion", obligatorio: false, orden: 4, plantilla: plantillaGenerica() },
      { nombre: "ESTERILIZACIÓN", evento_tipo: "esterilizacion", obligatorio: false, orden: 5, plantilla: plantillaGenerica() },
    ],
  },
  {
    // "CAPÍTULO 8 · MANTENIMIENTO" ya existe (equipos/infraestructura de
    // finca) — este es el de vasijas específicamente, nombre distinto para
    // no pisarlo ni confundir.
    nombre: "CAPÍTULO 14 · MANTENIMIENTO DE VASIJAS",
    orden: 14,
    procesos: [
      { nombre: "CALIBRACIÓN", evento_tipo: "calibracion", obligatorio: false, orden: 1, plantilla: plantillaGenerica() },
      { nombre: "MANTENIMIENTO PREVENTIVO", evento_tipo: "mantenimiento_preventivo", obligatorio: false, orden: 2, plantilla: plantillaGenerica() },
      { nombre: "MANTENIMIENTO CORRECTIVO", evento_tipo: "mantenimiento_correctivo", obligatorio: false, orden: 3, plantilla: plantillaGenerica() },
      { nombre: "REPARACIÓN", evento_tipo: "reparacion", obligatorio: false, orden: 4, plantilla: plantillaGenerica() },
      { nombre: "CAMBIO DE JUNTA O ACCESORIOS", evento_tipo: "cambio_junta_accesorios", obligatorio: false, orden: 5, plantilla: plantillaGenerica() },
      { nombre: "APERTURA DE VASIJA", evento_tipo: "apertura_vasija", obligatorio: false, orden: 6, plantilla: plantillaGenerica() },
      { nombre: "CIERRE DE VASIJA", evento_tipo: "cierre_vasija", obligatorio: false, orden: 7, plantilla: plantillaGenerica() },
    ],
  },
];

const PROTOCOLO_GENERAL_NOMBRE = "PROTOCOLO DE TRAZABILIDAD Y SUSTENTABILIDAD – NIVEL FINCA";
const PROTOCOLO_GENERAL_VERSION = "1.0.0";

export async function seedProtocoloVasijas(prisma) {
  // A diferencia de la versión anterior de este script, NO creamos un
  // protocolo propio — buscamos el general y le agregamos capítulos. Si no
  // existe (entorno sin el seed de finca corrido), fallamos con un mensaje
  // claro en vez de crear uno "a medias".
  const protocolo = await prisma.protocolo.findUnique({
    where: {
      nombre_version: { nombre: PROTOCOLO_GENERAL_NOMBRE, version: PROTOCOLO_GENERAL_VERSION },
    },
    select: { protocolo_id: true, nombre: true, version: true },
  });
  if (!protocolo) {
    throw new Error(
      `No existe el protocolo "${PROTOCOLO_GENERAL_NOMBRE}" v${PROTOCOLO_GENERAL_VERSION} — corré antes "npm run seed:protocol".`,
    );
  }

  let procesosCount = 0;
  for (const etapa of etapas) {
    const createdEtapa = await prisma.protocoloEtapa.upsert({
      where: {
        protocolo_id_nombre: {
          protocolo_id: protocolo.protocolo_id,
          nombre: etapa.nombre,
        },
      },
      update: { orden: etapa.orden },
      create: {
        protocolo_id: protocolo.protocolo_id,
        nombre: etapa.nombre,
        orden: etapa.orden,
      },
      select: { etapa_id: true },
    });

    await prisma.protocoloProceso.updateMany({
      where: { etapa_id: createdEtapa.etapa_id },
      data: { orden: { increment: 1000 } },
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
      procesosCount += 1;
    }
  }

  console.log(
    `Capítulos de vasija agregados a ${protocolo.nombre} v${protocolo.version} — ${etapas.length} capítulos, ${procesosCount} procesos.`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const prisma = createPrismaClient();

  seedProtocoloVasijas(prisma)
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
