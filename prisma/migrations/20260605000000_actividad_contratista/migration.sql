-- Mano de obra contratada detallada (repetible por actividad): cuadrilla,
-- headcount, horas, jornales y monto cobrado por el contratista.
CREATE TABLE "actividad_contratista" (
  "actividad_contratista_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tarea_id"                 UUID NOT NULL,
  "cuadrilla"                TEXT NOT NULL,
  "cantidad_operarios"       INTEGER,
  "horas"                    DECIMAL(10,2),
  "jornales"                 DECIMAL(10,2),
  "monto"                    DECIMAL(14,2) NOT NULL,
  "created_at"               TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "actividad_contratista_pkey" PRIMARY KEY ("actividad_contratista_id")
);
CREATE INDEX "idx_actividad_contratista_tarea" ON "actividad_contratista"("tarea_id");
ALTER TABLE "actividad_contratista"
  ADD CONSTRAINT "actividad_contratista_tarea_id_fkey"
  FOREIGN KEY ("tarea_id") REFERENCES "tarea"("tarea_id")
  ON DELETE CASCADE ON UPDATE NO ACTION;
