BEGIN;

-- Protocolo legado y protocolo nuevo detectados en los JSON.
UPDATE "protocolo"
SET "activo" = CASE
  WHEN "protocolo_id" = 'b6e7538b-58bf-47bf-afdb-5aec31e1fdfd' THEN true
  WHEN "protocolo_id" = '278795e0-a9a1-40a7-a73d-7eed5613561f' THEN false
  ELSE "activo"
END
WHERE "protocolo_id" IN (
  'b6e7538b-58bf-47bf-afdb-5aec31e1fdfd',
  '278795e0-a9a1-40a7-a73d-7eed5613561f'
);

-- Etapas objetivo del protocolo nuevo.
WITH etapas_objetivo(etapa_id, protocolo_id, nombre, orden) AS (
  VALUES
    ('cd9b6cc3-3958-49b1-a65e-5833af98c325'::uuid, 'b6e7538b-58bf-47bf-afdb-5aec31e1fdfd'::uuid, 'CAPÍTULO 0 · ORIGEN', 0),
    ('002dff5d-ff3d-4322-bb90-9a0009f311a5'::uuid, 'b6e7538b-58bf-47bf-afdb-5aec31e1fdfd'::uuid, 'CAPÍTULO 1 · PROCESOS PRODUCTIVOS', 1),
    ('ff85dc48-4cc9-4c8e-885a-7a3568e34002'::uuid, 'b6e7538b-58bf-47bf-afdb-5aec31e1fdfd'::uuid, 'CAPÍTULO 2 · AGUA', 2),
    ('98fb82ca-d163-428a-8ef0-79b3352750f3'::uuid, 'b6e7538b-58bf-47bf-afdb-5aec31e1fdfd'::uuid, 'CAPÍTULO 3 · SUELO', 3),
    ('a892e414-1687-4a75-91ee-ec4369f18d3d'::uuid, 'b6e7538b-58bf-47bf-afdb-5aec31e1fdfd'::uuid, 'CAPÍTULO 4 · MIP', 4),
    ('1ae61606-9117-4ce3-8e91-bbb9f474606e'::uuid, 'b6e7538b-58bf-47bf-afdb-5aec31e1fdfd'::uuid, 'CAPÍTULO 5 · INOCUIDAD', 5),
    ('25a3a396-5ca7-447d-82ad-d4fe939550b7'::uuid, 'b6e7538b-58bf-47bf-afdb-5aec31e1fdfd'::uuid, 'CAPÍTULO 6 · ENERGÍA', 6),
    ('9f7affdc-ad04-41d5-8124-ec69c5fca59b'::uuid, 'b6e7538b-58bf-47bf-afdb-5aec31e1fdfd'::uuid, 'CAPÍTULO 7 · PERSONAL', 7),
    ('afc1461a-9c56-421b-a846-696a34ff1749'::uuid, 'b6e7538b-58bf-47bf-afdb-5aec31e1fdfd'::uuid, 'CAPÍTULO 8 · MANTENIMIENTO', 8)
),
upsert_etapas AS (
  INSERT INTO "protocolo_etapa" ("etapa_id", "protocolo_id", "nombre", "orden")
  SELECT etapa_id, protocolo_id, nombre, orden
  FROM etapas_objetivo
  ON CONFLICT ("protocolo_id", "nombre")
  DO UPDATE SET
    "orden" = EXCLUDED."orden"
  RETURNING "etapa_id", "protocolo_id", "nombre", "orden"
)
UPDATE "protocolo_etapa" pe
SET
  "etapa_id" = eo.etapa_id,
  "orden" = eo.orden
FROM etapas_objetivo eo
WHERE pe."protocolo_id" = eo.protocolo_id
  AND pe."nombre" = eo.nombre
  AND pe."etapa_id" <> eo.etapa_id;

-- Procesos objetivo del protocolo nuevo.
WITH procesos_objetivo(proceso_id, etapa_id, nombre, evento_tipo, obligatorio, orden, plantilla) AS (
  VALUES
    ('11e764b2-b3c2-4b37-8e89-d76100de8619'::uuid, 'cd9b6cc3-3958-49b1-a65e-5833af98c325'::uuid, 'ORIGEN / UNIDAD PRODUCTIVA', 'origen_unidad_productiva', true, 1, '{"campos":[{"type":"string","campo":"productor_razon_social","required":true},{"type":"string","campo":"finca","required":true},{"type":"string","campo":"localidad","required":true},{"type":"string","campo":"provincia","required":true},{"type":"string","campo":"codigo_cuartel","required":true},{"type":"number","unit":"ha","campo":"superficie_ha","required":true},{"type":"string","campo":"cultivo","required":true},{"type":"string","campo":"variedad","required":true},{"type":"string","campo":"sistema_productivo","required":false},{"type":"string","campo":"sistema_riego","required":false},{"type":"string","campo":"sistema_conduccion","required":false},{"type":"string","campo":"coordenadas","required":false}],"version":1}'::jsonb),
    ('69cbb224-6674-42c7-a8e3-5268cf463f6e'::uuid, '002dff5d-ff3d-4322-bb90-9a0009f311a5'::uuid, 'MANEJO DE CANOPIA', 'canopia', true, 1, '{"campos":[{"type":"date","campo":"fecha","required":true},{"type":"string","campo":"cuartel_id","required":true},{"enum":["poda","desbrote","despampanado","raleo"],"type":"string","campo":"tipo_practica","required":true},{"type":"string","campo":"intensidad","required":true},{"type":"number","campo":"jornales_horas","required":true},{"type":"string","campo":"responsable_user_id","required":true},{"enum":["manual","mecanico"],"type":"string","campo":"metodo","required":false},{"type":"string","campo":"observaciones","required":false}],"version":1}'::jsonb),
    ('c6b81301-aeb2-485f-9333-c6d0e2d86b88'::uuid, '002dff5d-ff3d-4322-bb90-9a0009f311a5'::uuid, 'MONITOREO FENOLÓGICO', 'fenologia', true, 2, '{"version":1}'::jsonb),
    ('af0d376b-e5d3-4828-9953-6d1d7d576c6d'::uuid, '002dff5d-ff3d-4322-bb90-9a0009f311a5'::uuid, 'COSECHA', 'cosecha', true, 3, '{"version":1}'::jsonb),
    ('572ba46f-fddc-4ee1-9357-f8f9d881c74f'::uuid, 'ff85dc48-4cc9-4c8e-885a-7a3568e34002'::uuid, 'RIEGO', 'riego', true, 1, '{"version":1}'::jsonb),
    ('aa944934-5f53-4458-b1f0-51d3552e8766'::uuid, 'ff85dc48-4cc9-4c8e-885a-7a3568e34002'::uuid, 'PRECIPITACIONES', 'precipitacion', true, 2, '{"version":1}'::jsonb),
    ('5f22f266-64ea-444b-b8d1-674762ff3ca5'::uuid, '98fb82ca-d163-428a-8ef0-79b3352750f3'::uuid, 'LABORES DE SUELO', 'labor_suelo', true, 1, '{"version":1}'::jsonb),
    ('f5b8ac6f-3e37-47fb-af53-7f86d7da7aaa'::uuid, '98fb82ca-d163-428a-8ef0-79b3352750f3'::uuid, 'FERTILIZACIÓN', 'fertilizacion', true, 2, '{"version":1}'::jsonb),
    ('43f4ef8f-2e80-4b7b-b924-4f1c147d5be0'::uuid, '98fb82ca-d163-428a-8ef0-79b3352750f3'::uuid, 'ANÁLISIS DE SUELO', 'analisis_suelo', true, 3, '{"version":1}'::jsonb),
    ('5d85f801-a71f-47da-9af8-92af1502e57f'::uuid, '98fb82ca-d163-428a-8ef0-79b3352750f3'::uuid, 'ENMIENDAS', 'enmienda', true, 4, '{"version":1}'::jsonb),
    ('676cbbc9-5a56-4290-99d0-f276f00bd2ff'::uuid, '98fb82ca-d163-428a-8ef0-79b3352750f3'::uuid, 'COBERTURA / EROSIÓN', 'cobertura_erosion', true, 5, '{"version":1}'::jsonb),
    ('dd26a5fa-96f2-4b2b-adf8-0871a4b3fd45'::uuid, 'a892e414-1687-4a75-91ee-ec4369f18d3d'::uuid, 'MONITOREO DE ENFERMEDADES', 'monitoreo_enfermedad', true, 1, '{"version":1}'::jsonb),
    ('dbd6d6c0-d1bf-42b6-94c0-fdd6b1fdc3d9'::uuid, 'a892e414-1687-4a75-91ee-ec4369f18d3d'::uuid, 'MONITOREO DE PLAGAS', 'monitoreo_plaga', true, 2, '{"version":1}'::jsonb),
    ('6f7f7086-6ad1-4a95-a955-7b14961b51db'::uuid, 'a892e414-1687-4a75-91ee-ec4369f18d3d'::uuid, 'APLICACIÓN DE FITOSANITARIOS', 'aplicacion_fitosanitaria', true, 3, '{"version":1}'::jsonb),
    ('57b3f438-c18d-4e76-bf6c-9dd044cc8ac8'::uuid, 'a892e414-1687-4a75-91ee-ec4369f18d3d'::uuid, 'SOBRANTES / LAVADO', 'sobrante_lavado', true, 4, '{"version":1}'::jsonb),
    ('8b8f6fb9-fc6a-4bff-b9e2-f055ec4f70a6'::uuid, '1ae61606-9117-4ce3-8e91-bbb9f474606e'::uuid, 'LIMPIEZA DE COSECHA', 'limpieza_cosecha', true, 1, '{"version":1}'::jsonb),
    ('bc99b8a9-9f9f-41a4-b84a-95c273d445a7'::uuid, '1ae61606-9117-4ce3-8e91-bbb9f474606e'::uuid, 'SANITIZACIÓN BAÑOS', 'sanitizacion_banos', true, 2, '{"version":1}'::jsonb),
    ('2c4cc155-db8a-4426-a021-c0d48f8ef619'::uuid, '1ae61606-9117-4ce3-8e91-bbb9f474606e'::uuid, 'PRODUCTOS NO CONFORMES', 'no_conforme', true, 3, '{"version":1}'::jsonb),
    ('c3c4bf4d-dde3-4a2d-b8fa-48d4c8bf508e'::uuid, '1ae61606-9117-4ce3-8e91-bbb9f474606e'::uuid, 'RECLAMOS', 'reclamo', true, 4, '{"version":1}'::jsonb),
    ('9eb7f43a-5d70-4f50-bfd9-d0f8d6fef974'::uuid, '1ae61606-9117-4ce3-8e91-bbb9f474606e'::uuid, 'INVENTARIO DE INSUMOS', 'inventario_insumos', true, 5, '{"version":1}'::jsonb),
    ('539c7311-6667-420a-a278-807ebfc1dbef'::uuid, '1ae61606-9117-4ce3-8e91-bbb9f474606e'::uuid, 'RESIDUOS', 'residuo', true, 6, '{"version":1}'::jsonb),
    ('fdbf1c54-8088-4960-8929-a4ef1cc145fa'::uuid, '25a3a396-5ca7-447d-82ad-d4fe939550b7'::uuid, 'GASTO ENERGÉTICO PARA RIEGO', 'energia_riego', true, 1, '{"version":1}'::jsonb),
    ('89f97931-5e15-4fef-970a-6235860ea0b8'::uuid, '25a3a396-5ca7-447d-82ad-d4fe939550b7'::uuid, 'GASTO ENERGÉTICO PARA DEFENSA CONTRA HELADAS', 'energia_heladas', true, 2, '{"version":1}'::jsonb),
    ('98d5b6fe-d35f-46be-997f-2b79b95740da'::uuid, '9f7affdc-ad04-41d5-8124-ec69c5fca59b'::uuid, 'CAPACITACIONES', 'capacitacion', true, 1, '{"version":1}'::jsonb),
    ('c39aa820-b20b-4c11-8469-b43f51d5518b'::uuid, '9f7affdc-ad04-41d5-8124-ec69c5fca59b'::uuid, 'ENTREGA DE EPP', 'entrega_epp', true, 2, '{"version":1}'::jsonb),
    ('8a8ef449-c58d-4f27-9f98-258cf9f28d84'::uuid, '9f7affdc-ad04-41d5-8124-ec69c5fca59b'::uuid, 'ACCIDENTES', 'accidente', true, 3, '{"version":1}'::jsonb),
    ('9314bb4a-e05d-413d-b4c7-af961552370f'::uuid, 'afc1461a-9c56-421b-a846-696a34ff1749'::uuid, 'MANTENIMIENTO DE EQUIPOS', 'mantenimiento', true, 1, '{"version":1}'::jsonb)
),
upsert_procesos AS (
  INSERT INTO "protocolo_proceso" ("proceso_id", "etapa_id", "nombre", "evento_tipo", "obligatorio", "orden", "plantilla")
  SELECT proceso_id, etapa_id, nombre, evento_tipo, obligatorio, orden, plantilla
  FROM procesos_objetivo
  ON CONFLICT ("etapa_id", "nombre")
  DO UPDATE SET
    "evento_tipo" = EXCLUDED."evento_tipo",
    "obligatorio" = EXCLUDED."obligatorio",
    "orden" = EXCLUDED."orden",
    "plantilla" = EXCLUDED."plantilla"
  RETURNING "proceso_id", "etapa_id", "nombre"
)
UPDATE "protocolo_proceso" pp
SET
  "proceso_id" = po.proceso_id,
  "evento_tipo" = po.evento_tipo,
  "obligatorio" = po.obligatorio,
  "orden" = po.orden,
  "plantilla" = po.plantilla
FROM procesos_objetivo po
WHERE pp."etapa_id" = po.etapa_id
  AND pp."nombre" = po.nombre
  AND pp."proceso_id" <> po.proceso_id
  AND NOT EXISTS (
    SELECT 1
    FROM "milestone" m
    WHERE m."proceso_id" = pp."proceso_id"
  )
  AND NOT EXISTS (
    SELECT 1
    FROM "tarea" t
    WHERE t."proceso_id" = pp."proceso_id"
  );

COMMIT;
