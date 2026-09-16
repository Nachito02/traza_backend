// Exporta el catálogo de evento_tipo del protocolo al frontend.
//
// Por qué existe: las políticas y los formularios del frontend se eligen por `evento_tipo`,
// pero el catálogo vive en este seed. Cuando se renombró `energia_riego`/`energia_heladas` a
// un solo `energia`, el frontend siguió apuntando a los tipos viejos y esos dos procesos
// dejaron de mostrar su formulario, en silencio.
//
// Genera un archivo que el frontend versiona y un test verifica. Si el protocolo cambia,
// correr esto y el test dirá qué quedó sin clasificar.
//
//   npm run export:evento-tipos
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { etapas } from "./seed-protocol-from-doc.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const destino = join(__dirname, "..", "..", "traza-frontend", "src", "features", "actividades", "eventoTipos.generated.ts");

const procesos = etapas.flatMap((e) =>
  e.procesos.map((p) => ({ eventoTipo: p.evento_tipo, nombre: p.nombre, etapa: e.nombre })),
);
const tipos = [...new Set(procesos.map((p) => p.eventoTipo))].sort();

const contenido = `// GENERADO por traza-backend/scripts/export-evento-tipos.mjs — no editar a mano.
// Fuente de verdad: traza-backend/scripts/seed-protocol-from-doc.mjs
//
// Los formularios (eventoConfig) y las políticas (insumos, superficie) se eligen por
// evento_tipo. Este archivo permite que un test detecte cuando el protocolo cambia y algo
// quedó apuntando a un tipo que ya no existe, o sin clasificar uno nuevo.

/** Los ${tipos.length} evento_tipo del protocolo, tal como los siembra el backend. */
export const EVENTO_TIPOS_DEL_PROTOCOLO = [
${tipos.map((t) => `  ${JSON.stringify(t)},`).join("\n")}
] as const;

export type EventoTipoDelProtocolo = (typeof EVENTO_TIPOS_DEL_PROTOCOLO)[number];

/** Los ${procesos.length} procesos, para mensajes de error legibles. */
export const PROCESOS_DEL_PROTOCOLO: { eventoTipo: string; nombre: string; etapa: string }[] = [
${procesos.map((p) => `  ${JSON.stringify(p)},`).join("\n")}
];
`;

writeFileSync(destino, contenido);
console.log(`✓ ${tipos.length} evento_tipo y ${procesos.length} procesos exportados a`);
console.log(`  ${destino}`);

// Los dumps sueltos de la raíz. Ningún código los lee —son material de consulta— pero
// quedaron desactualizados y llegaron a inducir a error: declaraban energia_riego y
// energia_heladas, tipos que ya no existen. Se regeneran acá para que no vuelvan a mentir.
const raiz = join(__dirname, "..", "..");
const meta = {
  _generado_por: "traza-backend/scripts/export-evento-tipos.mjs",
  _fuente: "scripts/seed-protocol-from-doc.mjs",
  _nota: "Material de consulta: ningún código lo lee. Regenerar tras cambiar el protocolo.",
};
writeFileSync(
  join(raiz, "table_protocolo_etapa.json"),
  JSON.stringify({ ...meta, etapas: etapas.map((e) => ({ nombre: e.nombre, orden: e.orden })) }, null, 2),
);
writeFileSync(
  join(raiz, "table_protocolo_proceso.json"),
  JSON.stringify(
    {
      ...meta,
      procesos: etapas.flatMap((e) =>
        e.procesos.map((p) => ({
          etapa: e.nombre,
          nombre: p.nombre,
          evento_tipo: p.evento_tipo,
          obligatorio: !!p.obligatorio,
          orden: p.orden,
          campos: (p.plantilla?.campos ?? []).map((c) => ({ campo: c.campo, type: c.type, required: !!c.required })),
        })),
      ),
    },
    null,
    2,
  ),
);
console.log(`✓ dumps de consulta regenerados en la raíz`);
