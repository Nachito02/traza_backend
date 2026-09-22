-- Elimina exclusivamente el capítulo legado "CAPÍTULO 3 · SUELO".
--
-- Protecciones:
--   1. Limita la búsqueda al protocolo oficial v1.0.0.
--   2. Exige que exista el capítulo reemplazante.
--   3. Exige una única coincidencia de cada capítulo.
--   4. Aborta si algún proceso legado está referenciado por tareas o milestones.
--   5. Ejecuta todo dentro de una transacción.
--
-- Uso:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
--     -f scripts/remove-legacy-capitulo-suelo.sql

BEGIN;

DO $$
DECLARE
  protocolo_objetivo_id uuid;
  etapa_legada_id uuid;
  etapa_correcta_id uuid;
  cantidad_legadas integer;
  cantidad_correctas integer;
  tareas_vinculadas bigint;
  milestones_vinculados bigint;
BEGIN
  SELECT p.protocolo_id
  INTO protocolo_objetivo_id
  FROM protocolo p
  WHERE p.nombre = 'PROTOCOLO DE TRAZABILIDAD Y SUSTENTABILIDAD – NIVEL FINCA'
    AND p.version = '1.0.0';

  IF protocolo_objetivo_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró el protocolo oficial v1.0.0. No se modificó nada.';
  END IF;

  SELECT count(*), min(e.etapa_id::text)::uuid
  INTO cantidad_legadas, etapa_legada_id
  FROM protocolo_etapa e
  WHERE e.protocolo_id = protocolo_objetivo_id
    AND e.nombre = 'CAPÍTULO 3 · SUELO';

  SELECT count(*), min(e.etapa_id::text)::uuid
  INTO cantidad_correctas, etapa_correcta_id
  FROM protocolo_etapa e
  WHERE e.protocolo_id = protocolo_objetivo_id
    AND e.nombre = 'CAPÍTULO 3 · SUELO Y LABORES CULTURALES';

  IF cantidad_legadas = 0 THEN
    RAISE NOTICE 'El capítulo legado no existe. No hay nada que eliminar.';
    RETURN;
  END IF;

  IF cantidad_legadas <> 1 THEN
    RAISE EXCEPTION 'Se encontraron % capítulos legados; se esperaba exactamente 1. No se modificó nada.', cantidad_legadas;
  END IF;

  IF cantidad_correctas <> 1 OR etapa_correcta_id IS NULL THEN
    RAISE EXCEPTION 'El capítulo correcto no existe o está duplicado (% coincidencias). No se modificó nada.', cantidad_correctas;
  END IF;

  SELECT count(*)
  INTO tareas_vinculadas
  FROM tarea t
  JOIN protocolo_proceso pp ON pp.proceso_id = t.proceso_id
  WHERE pp.etapa_id = etapa_legada_id;

  SELECT count(*)
  INTO milestones_vinculados
  FROM milestone m
  JOIN protocolo_proceso pp ON pp.proceso_id = m.proceso_id
  WHERE pp.etapa_id = etapa_legada_id;

  IF tareas_vinculadas > 0 OR milestones_vinculados > 0 THEN
    RAISE EXCEPTION
      'El capítulo legado todavía está en uso: % tareas y % milestones. No se modificó nada; primero hay que migrar esas referencias.',
      tareas_vinculadas,
      milestones_vinculados;
  END IF;

  DELETE FROM protocolo_etapa
  WHERE etapa_id = etapa_legada_id
    AND nombre = 'CAPÍTULO 3 · SUELO';

  RAISE NOTICE
    'Capítulo legado eliminado. El capítulo correcto % permanece intacto.',
    etapa_correcta_id;
END
$$;

COMMIT;

-- Resultado final esperado: una sola fila, la del capítulo correcto.
SELECT e.etapa_id, e.nombre, e.orden, count(pp.proceso_id) AS procesos
FROM protocolo_etapa e
LEFT JOIN protocolo_proceso pp ON pp.etapa_id = e.etapa_id
JOIN protocolo p ON p.protocolo_id = e.protocolo_id
WHERE p.nombre = 'PROTOCOLO DE TRAZABILIDAD Y SUSTENTABILIDAD – NIVEL FINCA'
  AND p.version = '1.0.0'
  AND e.nombre IN (
    'CAPÍTULO 3 · SUELO',
    'CAPÍTULO 3 · SUELO Y LABORES CULTURALES'
  )
GROUP BY e.etapa_id, e.nombre, e.orden
ORDER BY e.nombre;
