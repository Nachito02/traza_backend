-- UpdateSQL
-- Script incremental para bases existentes.
-- 1) Agregar aquí cambios de esquema (ALTER TABLE, CREATE INDEX, etc.) cuando corresponda.
-- 2) Mantener el seed idempotente para asegurar catálogo base actualizado.

-- Schema updates
ALTER TABLE "user_bodega" DROP CONSTRAINT IF EXISTS "ck_user_bodega_rol_en_bodega";

CREATE TABLE IF NOT EXISTS "user_bodega_rol" (
  "user_id" UUID NOT NULL,
  "bodega_id" UUID NOT NULL,
  "rol" TEXT NOT NULL,
  CONSTRAINT "user_bodega_rol_pkey" PRIMARY KEY ("user_id", "bodega_id", "rol")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_bodega_rol_user_bodega_fkey'
  ) THEN
    ALTER TABLE "user_bodega_rol"
    ADD CONSTRAINT "user_bodega_rol_user_bodega_fkey"
    FOREIGN KEY ("user_id", "bodega_id")
    REFERENCES "user_bodega"("user_id", "bodega_id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_user_bodega_rol_bodega_rol"
ON "user_bodega_rol"("bodega_id", "rol");

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_bodega'
      AND column_name = 'rol_en_bodega'
  ) THEN
    INSERT INTO "user_bodega_rol" ("user_id", "bodega_id", "rol")
    SELECT
      ub."user_id",
      ub."bodega_id",
      CASE
        WHEN ub."rol_en_bodega" IN ('bodega_admin', 'admin') THEN 'admin_bodega'
        WHEN ub."rol_en_bodega" = 'encargado' THEN 'encargado_finca'
        WHEN ub."rol_en_bodega" = 'operario' THEN 'operador_campo'
        WHEN ub."rol_en_bodega" IS NULL OR BTRIM(ub."rol_en_bodega") = '' THEN 'operador_campo'
        ELSE ub."rol_en_bodega"
      END AS "rol"
    FROM "user_bodega" ub
    ON CONFLICT ("user_id", "bodega_id", "rol") DO NOTHING;

    ALTER TABLE "user_bodega" DROP COLUMN "rol_en_bodega";
  END IF;
END $$;

UPDATE "user_bodega_rol"
SET "rol" = 'admin_bodega'
WHERE "rol" IN ('bodega_admin', 'admin');

UPDATE "user_bodega_rol"
SET "rol" = 'encargado_finca'
WHERE "rol" = 'encargado';

UPDATE "user_bodega_rol"
SET "rol" = 'operador_campo'
WHERE "rol" = 'operario'
   OR "rol" IS NULL
   OR BTRIM("rol") = '';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "user_bodega_rol"
    WHERE "rol" NOT IN (
      'admin_bodega',
      'encargado_finca',
      'productor',
      'operador_campo',
      'responsable_calidad_inocuidad',
      'responsable_ssyo'
    )
  ) THEN
    RAISE EXCEPTION 'Hay valores inválidos en user_bodega_rol.rol. Permitidos: admin_bodega|encargado_finca|productor|operador_campo|responsable_calidad_inocuidad|responsable_ssyo';
  END IF;
END $$;

ALTER TABLE "user_bodega_rol" DROP CONSTRAINT IF EXISTS "ck_user_bodega_rol_rol";
ALTER TABLE "user_bodega_rol"
ADD CONSTRAINT "ck_user_bodega_rol_rol"
CHECK (
  "rol" IN (
    'admin_bodega',
    'encargado_finca',
    'productor',
    'operador_campo',
    'responsable_calidad_inocuidad',
    'responsable_ssyo'
  )
);

INSERT INTO "rol" ("nombre")
VALUES
  ('admin_sistema'),
  ('auditor'),
  ('certificador')
ON CONFLICT ("nombre") DO NOTHING;

INSERT INTO "user_rol" ("user_id", "rol_id")
SELECT ur."user_id", rnew."rol_id"
FROM "user_rol" ur
JOIN "rol" rold ON rold."rol_id" = ur."rol_id" AND rold."nombre" = 'super_admin'
JOIN "rol" rnew ON rnew."nombre" = 'admin_sistema'
ON CONFLICT ("user_id", "rol_id") DO NOTHING;

ALTER TABLE "campania"
ADD COLUMN IF NOT EXISTS "bodega_id" UUID;

UPDATE "campania" c
SET "bodega_id" = x."bodega_id"
FROM (
  SELECT
    t."campania_id",
    (ARRAY_AGG(t."bodega_id" ORDER BY t."bodega_id"))[1] AS "bodega_id",
    COUNT(DISTINCT t."bodega_id") AS "bodegas_count"
  FROM "trazabilidad" t
  GROUP BY t."campania_id"
) x
WHERE c."campania_id" = x."campania_id"
  AND c."bodega_id" IS NULL
  AND x."bodegas_count" = 1;

UPDATE "campania" c
SET "bodega_id" = b."bodega_id"
FROM (
  SELECT "bodega_id"
  FROM "bodega"
  ORDER BY "created_at"
  LIMIT 1
) b
WHERE c."bodega_id" IS NULL
  AND (SELECT COUNT(*) FROM "bodega") = 1;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "campania"
    WHERE "bodega_id" IS NULL
  ) THEN
    RAISE EXCEPTION 'No se pudo inferir bodega_id para todas las campañas. Completá campania.bodega_id y re-ejecutá update.sql';
  END IF;
END $$;

ALTER TABLE "campania"
ALTER COLUMN "bodega_id" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'campania_bodega_id_fkey'
  ) THEN
    ALTER TABLE "campania"
    ADD CONSTRAINT "campania_bodega_id_fkey"
    FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id")
    ON DELETE RESTRICT ON UPDATE NO ACTION;
  END IF;
END $$;

DROP INDEX IF EXISTS "uq_campania_nombre";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "campania"
    GROUP BY "bodega_id", "nombre"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Hay campañas duplicadas por bodega (bodega_id, nombre). Resolvé duplicados antes de crear índice único';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "uq_campania_bodega_nombre"
ON "campania"("bodega_id", "nombre");

CREATE INDEX IF NOT EXISTS "idx_campania_bodega"
ON "campania"("bodega_id");

-- Cuartel: permitir códigos repetidos entre fincas (único solo por finca)
ALTER TABLE "cuartel" DROP CONSTRAINT IF EXISTS "cuartel_codigo_cuartel_key";
DROP INDEX IF EXISTS "cuartel_codigo_cuartel_key";
DROP INDEX IF EXISTS "uq_cuartel_codigo";

CREATE UNIQUE INDEX IF NOT EXISTS "cuartel_finca_id_codigo_cuartel_key"
ON "cuartel"("finca_id", "codigo_cuartel");

-- Trazabilidad multi-origen (finca/cuartel)
ALTER TABLE "trazabilidad"
ALTER COLUMN "finca_id" DROP NOT NULL;

ALTER TABLE "trazabilidad"
ALTER COLUMN "cuartel_id" DROP NOT NULL;

CREATE TABLE IF NOT EXISTS "trazabilidad_origen" (
  "trazabilidad_id" UUID NOT NULL,
  "finca_id" UUID NOT NULL,
  "cuartel_id" UUID NOT NULL,
  "estado" TEXT NOT NULL DEFAULT 'habilitada',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "trazabilidad_origen_pkey" PRIMARY KEY ("trazabilidad_id", "finca_id", "cuartel_id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'trazabilidad_origen_trazabilidad_id_fkey'
  ) THEN
    ALTER TABLE "trazabilidad_origen"
    ADD CONSTRAINT "trazabilidad_origen_trazabilidad_id_fkey"
    FOREIGN KEY ("trazabilidad_id") REFERENCES "trazabilidad"("trazabilidad_id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'trazabilidad_origen_finca_id_fkey'
  ) THEN
    ALTER TABLE "trazabilidad_origen"
    ADD CONSTRAINT "trazabilidad_origen_finca_id_fkey"
    FOREIGN KEY ("finca_id") REFERENCES "finca"("finca_id")
    ON DELETE RESTRICT ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'trazabilidad_origen_cuartel_id_fkey'
  ) THEN
    ALTER TABLE "trazabilidad_origen"
    ADD CONSTRAINT "trazabilidad_origen_cuartel_id_fkey"
    FOREIGN KEY ("cuartel_id") REFERENCES "cuartel"("cuartel_id")
    ON DELETE RESTRICT ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_trazabilidad_origen_finca"
ON "trazabilidad_origen"("finca_id");

INSERT INTO "trazabilidad_origen" ("trazabilidad_id", "finca_id", "cuartel_id")
SELECT t."trazabilidad_id", t."finca_id", t."cuartel_id"
FROM "trazabilidad" t
WHERE t."finca_id" IS NOT NULL
  AND t."cuartel_id" IS NOT NULL
ON CONFLICT ("trazabilidad_id", "finca_id", "cuartel_id") DO NOTHING;

-- Encargo con alcance operacional
ALTER TABLE "encargo"
ADD COLUMN IF NOT EXISTS "finca_id" UUID;

ALTER TABLE "encargo"
ADD COLUMN IF NOT EXISTS "cuartel_id" UUID;

ALTER TABLE "encargo"
ADD COLUMN IF NOT EXISTS "milestone_id" UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'encargo_finca_id_fkey'
  ) THEN
    ALTER TABLE "encargo"
    ADD CONSTRAINT "encargo_finca_id_fkey"
    FOREIGN KEY ("finca_id") REFERENCES "finca"("finca_id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'encargo_cuartel_id_fkey'
  ) THEN
    ALTER TABLE "encargo"
    ADD CONSTRAINT "encargo_cuartel_id_fkey"
    FOREIGN KEY ("cuartel_id") REFERENCES "cuartel"("cuartel_id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'encargo_milestone_id_fkey'
  ) THEN
    ALTER TABLE "encargo"
    ADD CONSTRAINT "encargo_milestone_id_fkey"
    FOREIGN KEY ("milestone_id") REFERENCES "milestone"("milestone_id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_encargo_finca_estado"
ON "encargo"("finca_id", "estado");

CREATE INDEX IF NOT EXISTS "idx_encargo_milestone"
ON "encargo"("milestone_id");

-- Asignación de milestones a operarios por finca/cuartel
CREATE TABLE IF NOT EXISTS "milestone_asignacion" (
  "milestone_id" UUID NOT NULL,
  "finca_id" UUID NOT NULL,
  "cuartel_id" UUID NOT NULL,
  "operario_user_id" UUID NOT NULL,
  "asignado_por_user_id" UUID NOT NULL,
  "estado" TEXT NOT NULL DEFAULT 'pendiente',
  "encargo_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "milestone_asignacion_pkey" PRIMARY KEY ("milestone_id", "operario_user_id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'milestone_asignacion_milestone_id_fkey'
  ) THEN
    ALTER TABLE "milestone_asignacion"
    ADD CONSTRAINT "milestone_asignacion_milestone_id_fkey"
    FOREIGN KEY ("milestone_id") REFERENCES "milestone"("milestone_id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'milestone_asignacion_finca_id_fkey'
  ) THEN
    ALTER TABLE "milestone_asignacion"
    ADD CONSTRAINT "milestone_asignacion_finca_id_fkey"
    FOREIGN KEY ("finca_id") REFERENCES "finca"("finca_id")
    ON DELETE RESTRICT ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'milestone_asignacion_cuartel_id_fkey'
  ) THEN
    ALTER TABLE "milestone_asignacion"
    ADD CONSTRAINT "milestone_asignacion_cuartel_id_fkey"
    FOREIGN KEY ("cuartel_id") REFERENCES "cuartel"("cuartel_id")
    ON DELETE RESTRICT ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'milestone_asignacion_operario_user_id_fkey'
  ) THEN
    ALTER TABLE "milestone_asignacion"
    ADD CONSTRAINT "milestone_asignacion_operario_user_id_fkey"
    FOREIGN KEY ("operario_user_id") REFERENCES "app_user"("user_id")
    ON DELETE RESTRICT ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'milestone_asignacion_asignado_por_user_id_fkey'
  ) THEN
    ALTER TABLE "milestone_asignacion"
    ADD CONSTRAINT "milestone_asignacion_asignado_por_user_id_fkey"
    FOREIGN KEY ("asignado_por_user_id") REFERENCES "app_user"("user_id")
    ON DELETE RESTRICT ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'milestone_asignacion_encargo_id_fkey'
  ) THEN
    ALTER TABLE "milestone_asignacion"
    ADD CONSTRAINT "milestone_asignacion_encargo_id_fkey"
    FOREIGN KEY ("encargo_id") REFERENCES "encargo"("encargo_id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_milestone_asignacion_finca_estado"
ON "milestone_asignacion"("finca_id", "estado");

CREATE INDEX IF NOT EXISTS "idx_milestone_asignacion_operario_estado"
ON "milestone_asignacion"("operario_user_id", "estado");

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
