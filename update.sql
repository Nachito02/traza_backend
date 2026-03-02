-- UpdateSQL
-- Script incremental para bases existentes.
-- 1) Agregar aquí cambios de esquema (ALTER TABLE, CREATE INDEX, etc.) cuando corresponda.
-- 2) Mantener el seed idempotente para asegurar catálogo base actualizado.

-- Schema updates
-- (Sin cambios de esquema pendientes en esta versión)

-- Seed sync
WITH target_protocolo AS (
  INSERT INTO "protocolo" ("nombre", "version", "descripcion", "activo")
  VALUES (
    'Cadena vitivinícola',
    '1.0.0',
    'Protocolo base de trazabilidad para producción en finca, elaboración, distribución y comercialización.',
    true
  )
  ON CONFLICT ("nombre", "version")
  DO UPDATE SET
    "descripcion" = EXCLUDED."descripcion",
    "activo" = EXCLUDED."activo"
  RETURNING "protocolo_id"
)
INSERT INTO "protocolo_etapa" ("protocolo_id", "nombre", "orden")
SELECT p.protocolo_id, e.nombre, e.orden
FROM target_protocolo p
JOIN (
  VALUES
    ('Producción en finca', 10),
    ('Elaboración', 20),
    ('Distribución', 30),
    ('Comercialización', 40)
) AS e(nombre, orden) ON true
ON CONFLICT ("protocolo_id", "nombre")
DO UPDATE SET
  "orden" = EXCLUDED."orden";

INSERT INTO "protocolo_proceso" ("etapa_id", "nombre", "evento_tipo", "obligatorio", "orden")
SELECT pe."etapa_id", pr.nombre, pr.evento_tipo, pr.obligatorio, pr.orden
FROM "protocolo_etapa" pe
JOIN "protocolo" p ON p."protocolo_id" = pe."protocolo_id"
JOIN (
  VALUES
    ('Producción en finca', 'Características del terreno', 'analisis_suelo', true, 10),
    ('Producción en finca', 'Plantación de la vid', 'labor_suelo', true, 20),
    ('Producción en finca', 'Sistema de riego', 'riego', true, 30),
    ('Producción en finca', 'Tratamientos agrícolas', 'aplicacion_fitosanitaria', true, 40),
    ('Producción en finca', 'Registro fenológico', 'fenologia', true, 50),
    ('Producción en finca', 'Cosecha', 'cosecha', true, 60),
    ('Elaboración', 'Recepción de la uva', 'recepcion_uva', true, 10),
    ('Elaboración', 'Obtención del mosto', 'obtencion_mosto', true, 20),
    ('Elaboración', 'Fermentación', 'fermentacion', true, 30),
    ('Elaboración', 'Crianza', 'crianza', true, 40),
    ('Distribución', 'Envasado', 'envasado', true, 10),
    ('Distribución', 'Almacenamiento', 'almacenamiento', true, 20),
    ('Distribución', 'Transporte', 'transporte', true, 30),
    ('Comercialización', 'Venta', 'venta', true, 10),
    ('Comercialización', 'Distribución al consumidor', 'distribucion_consumidor', true, 20)
) AS pr(etapa_nombre, nombre, evento_tipo, obligatorio, orden)
  ON pr.etapa_nombre = pe."nombre"
WHERE p."nombre" = 'Cadena vitivinícola'
  AND p."version" = '1.0.0'
ON CONFLICT ("etapa_id", "nombre")
DO UPDATE SET
  "evento_tipo" = EXCLUDED."evento_tipo",
  "obligatorio" = EXCLUDED."obligatorio",
  "orden" = EXCLUDED."orden";
