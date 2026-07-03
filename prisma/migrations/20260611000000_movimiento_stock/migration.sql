-- Sistema de inventario: movimientos de stock por insumo y bodega.
-- Existencia = Σ cantidad (ingreso +, egreso −, ajuste con signo).
CREATE TYPE "TipoMovimientoStock" AS ENUM ('ingreso', 'egreso', 'ajuste');

CREATE TABLE "movimiento_stock" (
  "movimiento_stock_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "insumo_id"           UUID NOT NULL,
  "bodega_id"           UUID NOT NULL,
  "tipo"                "TipoMovimientoStock" NOT NULL,
  "cantidad"            DECIMAL(14,3) NOT NULL,
  "unidad"              TEXT NOT NULL,
  "costo_unitario"      DECIMAL(14,4),
  "motivo"              TEXT,
  "actividad_insumo_id" UUID,
  "created_by"          UUID,
  "fecha"               TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "created_at"          TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "movimiento_stock_pkey" PRIMARY KEY ("movimiento_stock_id")
);
CREATE UNIQUE INDEX "movimiento_stock_actividad_insumo_id_key" ON "movimiento_stock"("actividad_insumo_id");
CREATE INDEX "idx_movimiento_stock_insumo_bodega" ON "movimiento_stock"("insumo_id", "bodega_id");

ALTER TABLE "movimiento_stock"
  ADD CONSTRAINT "movimiento_stock_insumo_id_fkey"
  FOREIGN KEY ("insumo_id") REFERENCES "insumo_catalogo"("insumo_id")
  ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "movimiento_stock"
  ADD CONSTRAINT "movimiento_stock_bodega_id_fkey"
  FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id")
  ON DELETE CASCADE ON UPDATE NO ACTION;
