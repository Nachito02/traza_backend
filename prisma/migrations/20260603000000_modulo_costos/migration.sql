-- Módulo de costos: tarifas por dominio + captura de actividad + costos calculados.
-- Se apoya en el modelo de "eventos productivos" existente (tarea = actividad).

-- ── 1) Enums ────────────────────────────────────────────────────────────────
CREATE TYPE "ModalidadEjecucion" AS ENUM ('propia', 'contratada', 'mixta');
CREATE TYPE "RolManoObra" AS ENUM ('operario', 'tractorista', 'aplicador', 'tecnico', 'encargado', 'contratista');
CREATE TYPE "ClaseMaquinaria" AS ENUM ('motriz', 'implemento');
CREATE TYPE "TipoCombustible" AS ENUM ('gasoil', 'nafta', 'electricidad', 'glp', 'otro');
CREATE TYPE "CategoriaCosto" AS ENUM ('mano_obra', 'maquinaria', 'combustible', 'insumos', 'contratista');

-- ── 2) Extender insumo_catalogo con precio + bodega ─────────────────────────
ALTER TABLE "insumo_catalogo"
  ADD COLUMN "bodega_id" UUID,
  ADD COLUMN "costo_unitario" DECIMAL(14,4),
  ADD COLUMN "moneda" TEXT NOT NULL DEFAULT 'ARS';

CREATE INDEX "idx_insumo_catalogo_bodega" ON "insumo_catalogo"("bodega_id");

ALTER TABLE "insumo_catalogo"
  ADD CONSTRAINT "insumo_catalogo_bodega_id_fkey"
  FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

-- ── 3) Tarifas por dominio ──────────────────────────────────────────────────
CREATE TABLE "tarifa_mano_obra" (
  "tarifa_mano_obra_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "bodega_id"           UUID NOT NULL,
  "rol"                 "RolManoObra" NOT NULL,
  "costo_jornal"        DECIMAL(14,2) NOT NULL,
  "costo_hora"          DECIMAL(14,2),
  "moneda"              TEXT NOT NULL DEFAULT 'ARS',
  "vigencia_desde"      DATE NOT NULL,
  "activo"              BOOLEAN NOT NULL DEFAULT true,
  "created_at"          TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "tarifa_mano_obra_pkey" PRIMARY KEY ("tarifa_mano_obra_id")
);
CREATE INDEX "idx_tarifa_mano_obra_bodega_rol" ON "tarifa_mano_obra"("bodega_id", "rol", "vigencia_desde");
ALTER TABLE "tarifa_mano_obra"
  ADD CONSTRAINT "tarifa_mano_obra_bodega_id_fkey"
  FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE TABLE "tarifa_maquinaria" (
  "tarifa_maquinaria_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "bodega_id"            UUID NOT NULL,
  "nombre"               TEXT NOT NULL,
  "clase"                "ClaseMaquinaria" NOT NULL,
  "costo_hora"           DECIMAL(14,2) NOT NULL,
  "consumo_lts_hora"     DECIMAL(10,3),
  "moneda"               TEXT NOT NULL DEFAULT 'ARS',
  "vigencia_desde"       DATE NOT NULL,
  "activo"               BOOLEAN NOT NULL DEFAULT true,
  "created_at"           TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "tarifa_maquinaria_pkey" PRIMARY KEY ("tarifa_maquinaria_id")
);
CREATE INDEX "idx_tarifa_maquinaria_bodega_clase" ON "tarifa_maquinaria"("bodega_id", "clase");
ALTER TABLE "tarifa_maquinaria"
  ADD CONSTRAINT "tarifa_maquinaria_bodega_id_fkey"
  FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE TABLE "tarifa_combustible" (
  "tarifa_combustible_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "bodega_id"             UUID NOT NULL,
  "tipo"                  "TipoCombustible" NOT NULL,
  "costo_unitario"        DECIMAL(14,4) NOT NULL,
  "unidad"                TEXT NOT NULL DEFAULT 'lt',
  "moneda"                TEXT NOT NULL DEFAULT 'ARS',
  "vigencia_desde"        DATE NOT NULL,
  "activo"                BOOLEAN NOT NULL DEFAULT true,
  "created_at"            TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "tarifa_combustible_pkey" PRIMARY KEY ("tarifa_combustible_id")
);
CREATE INDEX "idx_tarifa_combustible_bodega_tipo" ON "tarifa_combustible"("bodega_id", "tipo");
ALTER TABLE "tarifa_combustible"
  ADD CONSTRAINT "tarifa_combustible_bodega_id_fkey"
  FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

-- ── 4) Captura de la actividad ──────────────────────────────────────────────
CREATE TABLE "tarea_ejecucion" (
  "tarea_ejecucion_id"     UUID NOT NULL DEFAULT gen_random_uuid(),
  "tarea_id"               UUID NOT NULL,
  "modalidad"              "ModalidadEjecucion" NOT NULL,
  "superficie_intervenida" DECIMAL(10,2) NOT NULL,
  "unidad_superficie"      TEXT NOT NULL DEFAULT 'ha',
  "pct_intervenido"        DECIMAL(5,2),
  "jornales_generales"     DECIMAL(10,2),
  "horas_generales"        DECIMAL(10,2),
  "jornales_tractorista"   DECIMAL(10,2),
  "horas_tractorista"      DECIMAL(10,2),
  "horas_tecnico"          DECIMAL(10,2),
  "contratista"            TEXT,
  "monto_contratista"      DECIMAL(14,2),
  "observaciones"          TEXT,
  "created_at"             TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"             TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "tarea_ejecucion_pkey" PRIMARY KEY ("tarea_ejecucion_id")
);
CREATE UNIQUE INDEX "tarea_ejecucion_tarea_id_key" ON "tarea_ejecucion"("tarea_id");
ALTER TABLE "tarea_ejecucion"
  ADD CONSTRAINT "tarea_ejecucion_tarea_id_fkey"
  FOREIGN KEY ("tarea_id") REFERENCES "tarea"("tarea_id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE TABLE "actividad_maquina" (
  "actividad_maquina_id"    UUID NOT NULL DEFAULT gen_random_uuid(),
  "tarea_id"                UUID NOT NULL,
  "tarifa_maquinaria_id"    UUID,
  "nombre"                  TEXT NOT NULL,
  "clase"                   "ClaseMaquinaria" NOT NULL,
  "propia"                  BOOLEAN NOT NULL DEFAULT true,
  "horas"                   DECIMAL(10,2) NOT NULL,
  "consumo_combustible_lts" DECIMAL(10,3),
  "costo_hora_snapshot"     DECIMAL(14,2),
  "costo_total"             DECIMAL(14,2),
  "created_at"              TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "actividad_maquina_pkey" PRIMARY KEY ("actividad_maquina_id")
);
CREATE INDEX "idx_actividad_maquina_tarea" ON "actividad_maquina"("tarea_id");
ALTER TABLE "actividad_maquina"
  ADD CONSTRAINT "actividad_maquina_tarea_id_fkey"
  FOREIGN KEY ("tarea_id") REFERENCES "tarea"("tarea_id")
  ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "actividad_maquina"
  ADD CONSTRAINT "actividad_maquina_tarifa_maquinaria_id_fkey"
  FOREIGN KEY ("tarifa_maquinaria_id") REFERENCES "tarifa_maquinaria"("tarifa_maquinaria_id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

CREATE TABLE "actividad_insumo" (
  "actividad_insumo_id"     UUID NOT NULL DEFAULT gen_random_uuid(),
  "tarea_id"                UUID NOT NULL,
  "insumo_id"               UUID,
  "descripcion"             TEXT,
  "dosis_ha"                DECIMAL(12,3) NOT NULL,
  "unidad_dosis"            TEXT NOT NULL,
  "cantidad_total"          DECIMAL(12,3) NOT NULL,
  "unidad_total"            TEXT NOT NULL,
  "costo_unitario_snapshot" DECIMAL(14,4),
  "costo_total"             DECIMAL(14,2),
  "created_at"              TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "actividad_insumo_pkey" PRIMARY KEY ("actividad_insumo_id")
);
CREATE INDEX "idx_actividad_insumo_tarea" ON "actividad_insumo"("tarea_id");
ALTER TABLE "actividad_insumo"
  ADD CONSTRAINT "actividad_insumo_tarea_id_fkey"
  FOREIGN KEY ("tarea_id") REFERENCES "tarea"("tarea_id")
  ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "actividad_insumo"
  ADD CONSTRAINT "actividad_insumo_insumo_id_fkey"
  FOREIGN KEY ("insumo_id") REFERENCES "insumo_catalogo"("insumo_id")
  ON DELETE RESTRICT ON UPDATE NO ACTION;

-- ── 5) Costos calculados (uno por categoría por actividad) ──────────────────
CREATE TABLE "actividad_costo" (
  "actividad_costo_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tarea_id"           UUID NOT NULL,
  "categoria"          "CategoriaCosto" NOT NULL,
  "monto"              DECIMAL(14,2) NOT NULL,
  "detalle"            JSONB NOT NULL DEFAULT '{}',
  "calculado_at"       TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "actividad_costo_pkey" PRIMARY KEY ("actividad_costo_id")
);
CREATE UNIQUE INDEX "uq_actividad_costo_tarea_categoria" ON "actividad_costo"("tarea_id", "categoria");
CREATE INDEX "idx_actividad_costo_tarea" ON "actividad_costo"("tarea_id");
ALTER TABLE "actividad_costo"
  ADD CONSTRAINT "actividad_costo_tarea_id_fkey"
  FOREIGN KEY ("tarea_id") REFERENCES "tarea"("tarea_id")
  ON DELETE CASCADE ON UPDATE NO ACTION;
