-- Inventario por bodega: el insumo es único por (bodega, tipo, nombre),
-- no global. Permite que cada bodega tenga su propio "Oxicloruro", etc.
DROP INDEX IF EXISTS "insumo_catalogo_tipo_nombre_comercial_key";
CREATE UNIQUE INDEX "insumo_catalogo_bodega_id_tipo_nombre_comercial_key"
  ON "insumo_catalogo"("bodega_id", "tipo", "nombre_comercial");
