ALTER TABLE "actividad_maquina"
ADD COLUMN "implemento_tarifa_maquinaria_id" UUID,
ADD COLUMN "implemento_nombre" TEXT,
ADD COLUMN "modelo_conjunto" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "idx_actividad_maquina_implemento"
ON "actividad_maquina"("implemento_tarifa_maquinaria_id");

ALTER TABLE "actividad_maquina"
ADD CONSTRAINT "actividad_maquina_implemento_tarifa_maquinaria_id_fkey"
FOREIGN KEY ("implemento_tarifa_maquinaria_id")
REFERENCES "tarifa_maquinaria"("tarifa_maquinaria_id")
ON DELETE SET NULL ON UPDATE NO ACTION;
