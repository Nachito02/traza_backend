-- Observaciones carga inicial (Fase 3 · Insumos):
-- - Separación por ámbito (finca / bodega) y campos extra del tablero del doc:
--   familia, dosis mín/máx, unidad de dosis, proveedor, vigencia de precio, y
--   los propios del ámbito bodega (marca, fabricante, presentación).
--   (Lote y vencimiento siguen en insumo_lote, por lote de compra.)
-- - Catálogo maestro global (insumo_maestro) para autocompletar; cada bodega
--   crea su copia editable en insumo_catalogo al elegir un producto.

CREATE TYPE "AmbitoInsumo" AS ENUM ('finca', 'bodega');

ALTER TABLE "insumo_catalogo"
  ADD COLUMN IF NOT EXISTS "ambito"       "AmbitoInsumo" NOT NULL DEFAULT 'finca',
  ADD COLUMN IF NOT EXISTS "familia"      TEXT,
  ADD COLUMN IF NOT EXISTS "dosis_min"    DECIMAL(14,4),
  ADD COLUMN IF NOT EXISTS "dosis_max"    DECIMAL(14,4),
  ADD COLUMN IF NOT EXISTS "unidad_dosis" TEXT,
  ADD COLUMN IF NOT EXISTS "proveedor"    TEXT,
  ADD COLUMN IF NOT EXISTS "vigencia"     DATE,
  ADD COLUMN IF NOT EXISTS "marca"        TEXT,
  ADD COLUMN IF NOT EXISTS "fabricante"   TEXT,
  ADD COLUMN IF NOT EXISTS "presentacion" TEXT;

CREATE INDEX IF NOT EXISTS "idx_insumo_catalogo_bodega_ambito"
  ON "insumo_catalogo" ("bodega_id", "ambito");

CREATE TABLE IF NOT EXISTS "insumo_maestro" (
  "insumo_maestro_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ambito"            "AmbitoInsumo" NOT NULL,
  "categoria"         TEXT NOT NULL,
  "familia"           TEXT,
  "principio_activo"  TEXT,
  "nombre_comercial"  TEXT NOT NULL,
  "unidad"            TEXT,
  "dosis_min"         DECIMAL(14,4),
  "dosis_max"         DECIMAL(14,4),
  "unidad_dosis"      TEXT,
  "activo"            BOOLEAN NOT NULL DEFAULT true,
  "created_at"        TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "insumo_maestro_pkey" PRIMARY KEY ("insumo_maestro_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "insumo_maestro_ambito_categoria_nombre_key"
  ON "insumo_maestro" ("ambito", "categoria", "nombre_comercial");
CREATE INDEX IF NOT EXISTS "idx_insumo_maestro_ambito_categoria"
  ON "insumo_maestro" ("ambito", "categoria");
