-- AlterTable
ALTER TABLE "producto" ADD COLUMN     "lote_origen_id" UUID;

-- CreateIndex
CREATE INDEX "idx_producto_lote_origen" ON "producto"("lote_origen_id");

-- AddForeignKey
ALTER TABLE "producto" ADD CONSTRAINT "producto_lote_origen_id_fkey" FOREIGN KEY ("lote_origen_id") REFERENCES "lote"("lote_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- RenameIndex
ALTER INDEX "insumo_maestro_ambito_categoria_nombre_key" RENAME TO "insumo_maestro_ambito_categoria_nombre_comercial_key";
