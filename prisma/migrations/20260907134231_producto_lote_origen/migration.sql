-- AlterTable
ALTER TABLE "producto" ADD COLUMN     "lote_origen_id" UUID;

-- CreateIndex
CREATE INDEX "idx_producto_lote_origen" ON "producto"("lote_origen_id");

-- AddForeignKey
ALTER TABLE "producto" ADD CONSTRAINT "producto_lote_origen_id_fkey" FOREIGN KEY ("lote_origen_id") REFERENCES "lote"("lote_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- RenameIndex
-- IF EXISTS: la migración 20260715010000 ya hace este mismo rename (se arregló el drift
-- por duplicado, en dos ramas distintas). Como aquella corre antes por timestamp, sin el
-- IF EXISTS esta línea aborta el deploy en cualquier base donde ya se haya aplicado.
ALTER INDEX IF EXISTS "insumo_maestro_ambito_categoria_nombre_key" RENAME TO "insumo_maestro_ambito_categoria_nombre_comercial_key";
