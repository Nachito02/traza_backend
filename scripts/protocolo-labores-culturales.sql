-- Capítulo 3: renombrar + agregar el proceso "Labores culturales (mecanizadas)".
-- Idempotente. Apunta al capítulo por su NOMBRE exacto (ajustá abajo si difiere).
--   psql "$DATABASE_URL" -f scripts/protocolo-labores-culturales.sql

-- Nombre actual del capítulo del suelo y el nombre nuevo:
\set CAP_ACTUAL 'CAPÍTULO 3 · SUELO'
\set CAP_NUEVO  'CAPÍTULO 3 · SUELO Y LABORES CULTURALES'

-- 1) Renombrar el capítulo.
UPDATE "protocolo_etapa"
SET "nombre" = :'CAP_NUEVO'
WHERE "nombre" = :'CAP_ACTUAL';

-- 2) Agregar el proceso de labores culturales mecanizadas al final de ese capítulo.
--    (proceso_id se genera solo por el DEFAULT gen_random_uuid()).
INSERT INTO "protocolo_proceso" ("etapa_id", "nombre", "evento_tipo", "obligatorio", "orden")
SELECT e."etapa_id",
       'LABORES CULTURALES (MECANIZADAS)',
       'labores_culturales',
       false,
       COALESCE((SELECT MAX(pp."orden") FROM "protocolo_proceso" pp WHERE pp."etapa_id" = e."etapa_id"), 0) + 1
FROM "protocolo_etapa" e
WHERE e."nombre" = :'CAP_NUEVO'
ON CONFLICT DO NOTHING;

-- Verificación:
-- SELECT et.nombre AS capitulo, pp.nombre AS proceso, pp.evento_tipo, pp.orden
-- FROM protocolo_proceso pp JOIN protocolo_etapa et ON et.etapa_id = pp.etapa_id
-- WHERE et.nombre = 'CAPÍTULO 3 · SUELO Y LABORES CULTURALES' ORDER BY pp.orden;
