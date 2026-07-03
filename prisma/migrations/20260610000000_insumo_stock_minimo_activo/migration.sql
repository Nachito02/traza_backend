-- ABM de insumos: stock mínimo (para alertas) y baja lógica (activo).
ALTER TABLE "insumo_catalogo"
  ADD COLUMN "stock_minimo" DECIMAL(14,3),
  ADD COLUMN "activo" BOOLEAN NOT NULL DEFAULT true;
