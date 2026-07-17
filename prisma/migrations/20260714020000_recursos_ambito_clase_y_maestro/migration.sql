-- Observaciones carga inicial (Fase 4 · Máquinas, implementos, equipos y herramientas):
-- - tarifa_maquinaria pasa a ser el catálogo de recursos (setup) además de la
--   tarifa de costos: se agrega ámbito (finca/bodega), la clase 'equipo' y campos
--   de specs (categoría, familia, potencia, uso, unidad de uso, consumo, obs).
--   costo_hora y vigencia_desde pasan a opcionales para poder catalogar un
--   recurso sin cargarle todavía su precio. (Costos sigue exigiéndolos al crear.)
-- - recurso_maestro: catálogo global de referencia para autocompletar.

ALTER TYPE "ClaseMaquinaria" ADD VALUE IF NOT EXISTS 'equipo';

CREATE TYPE "AmbitoRecurso" AS ENUM ('finca', 'bodega');

ALTER TABLE "tarifa_maquinaria"
  ADD COLUMN IF NOT EXISTS "ambito"              "AmbitoRecurso" NOT NULL DEFAULT 'finca',
  ADD COLUMN IF NOT EXISTS "categoria"           TEXT,
  ADD COLUMN IF NOT EXISTS "familia"             TEXT,
  ADD COLUMN IF NOT EXISTS "potencia_hp"         TEXT,
  ADD COLUMN IF NOT EXISTS "uso_principal"       TEXT,
  ADD COLUMN IF NOT EXISTS "unidad_uso"          TEXT,
  ADD COLUMN IF NOT EXISTS "consumo_descripcion" TEXT,
  ADD COLUMN IF NOT EXISTS "observaciones"       TEXT;

ALTER TABLE "tarifa_maquinaria" ALTER COLUMN "costo_hora" DROP NOT NULL;
ALTER TABLE "tarifa_maquinaria" ALTER COLUMN "vigencia_desde" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_tarifa_maquinaria_bodega_ambito_clase"
  ON "tarifa_maquinaria" ("bodega_id", "ambito", "clase");

CREATE TABLE IF NOT EXISTS "recurso_maestro" (
  "recurso_maestro_id"  UUID NOT NULL DEFAULT gen_random_uuid(),
  "ambito"              "AmbitoRecurso" NOT NULL,
  "clase"               "ClaseMaquinaria" NOT NULL,
  "categoria"           TEXT,
  "familia"             TEXT,
  "nombre"              TEXT NOT NULL,
  "potencia_hp"         TEXT,
  "uso_principal"       TEXT,
  "unidad_uso"          TEXT,
  "consumo_descripcion" TEXT,
  "observaciones"       TEXT,
  "activo"              BOOLEAN NOT NULL DEFAULT true,
  "created_at"          TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "recurso_maestro_pkey" PRIMARY KEY ("recurso_maestro_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "recurso_maestro_ambito_clase_nombre_key"
  ON "recurso_maestro" ("ambito", "clase", "nombre");
CREATE INDEX IF NOT EXISTS "idx_recurso_maestro_ambito_clase"
  ON "recurso_maestro" ("ambito", "clase");
