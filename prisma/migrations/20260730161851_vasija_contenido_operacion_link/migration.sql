-- AlterTable
ALTER TABLE "vasija_contenido" ADD COLUMN     "operacion_vasija_id" UUID;

-- CreateIndex
CREATE INDEX "idx_vasija_contenido_operacion" ON "vasija_contenido"("operacion_vasija_id");

-- AddForeignKey
ALTER TABLE "vasija_contenido" ADD CONSTRAINT "vasija_contenido_operacion_vasija_id_fkey" FOREIGN KEY ("operacion_vasija_id") REFERENCES "operacion_vasija"("operacion_vasija_id") ON DELETE SET NULL ON UPDATE NO ACTION;
