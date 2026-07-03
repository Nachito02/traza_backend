-- Responsable de ejecución (FK a usuario) y personal asignado (lista de nombres).
ALTER TABLE "tarea_ejecucion"
  ADD COLUMN "responsable_user_id" UUID,
  ADD COLUMN "personal_asignado" JSONB NOT NULL DEFAULT '[]';

CREATE INDEX "idx_tarea_ejecucion_responsable" ON "tarea_ejecucion"("responsable_user_id");

ALTER TABLE "tarea_ejecucion"
  ADD CONSTRAINT "tarea_ejecucion_responsable_user_id_fkey"
  FOREIGN KEY ("responsable_user_id") REFERENCES "app_user"("user_id")
  ON DELETE SET NULL ON UPDATE NO ACTION;
