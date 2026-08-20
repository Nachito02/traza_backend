-- AlterTable: Tarea gets an optional vasija_id, same pattern as finca_id/cuartel_id
ALTER TABLE "tarea" ADD COLUMN     "vasija_id" UUID;

-- AlterTable: OperacionVasija gets an optional link back to the Tarea that
-- originated it (nullable + unique: at most one OperacionVasija per Tarea)
ALTER TABLE "operacion_vasija" ADD COLUMN     "tarea_id" UUID;

-- CreateIndex
CREATE INDEX "idx_tarea_vasija_estado" ON "tarea"("vasija_id", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "operacion_vasija_tarea_id_key" ON "operacion_vasija"("tarea_id");

-- AddForeignKey
ALTER TABLE "tarea" ADD CONSTRAINT "tarea_vasija_id_fkey" FOREIGN KEY ("vasija_id") REFERENCES "vasija"("vasija_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "operacion_vasija" ADD CONSTRAINT "operacion_vasija_tarea_id_fkey" FOREIGN KEY ("tarea_id") REFERENCES "tarea"("tarea_id") ON DELETE SET NULL ON UPDATE NO ACTION;
