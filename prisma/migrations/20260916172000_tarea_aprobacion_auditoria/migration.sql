ALTER TABLE "tarea"
ADD COLUMN "validada_por" UUID,
ADD COLUMN "validada_en" TIMESTAMPTZ(6);

CREATE INDEX "idx_tarea_validada_por" ON "tarea"("validada_por");

ALTER TABLE "tarea"
ADD CONSTRAINT "tarea_validada_por_fkey"
FOREIGN KEY ("validada_por") REFERENCES "app_user"("user_id")
ON DELETE SET NULL ON UPDATE NO ACTION;
