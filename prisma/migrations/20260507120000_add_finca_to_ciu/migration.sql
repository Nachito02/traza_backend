ALTER TABLE "ciu" ADD COLUMN "finca_id" UUID;

UPDATE "ciu" c
SET "finca_id" = source."finca_id"
FROM (
  SELECT DISTINCT ON (cr."ciu_id")
    cr."ciu_id",
    ru."finca_id"
  FROM "ciu_recepcion" cr
  JOIN "recepcion_bodega" rb
    ON rb."recepcion_bodega_id" = cr."recepcion_bodega_id"
  JOIN "remito_uva" ru
    ON ru."remito_uva_id" = rb."remito_uva_id"
  ORDER BY cr."ciu_id", cr."created_at" DESC
) source
WHERE c."ciu_id" = source."ciu_id"
  AND c."finca_id" IS NULL;

CREATE INDEX "idx_ciu_finca_emitido_at" ON "ciu"("finca_id", "emitido_at");

DROP INDEX "ciu_codigo_ciu_key";

CREATE UNIQUE INDEX "ciu_finca_codigo_ciu_key" ON "ciu"("finca_id", "codigo_ciu");

ALTER TABLE "ciu"
  ADD CONSTRAINT "ciu_finca_id_fkey"
  FOREIGN KEY ("finca_id")
  REFERENCES "finca"("finca_id")
  ON DELETE RESTRICT
  ON UPDATE NO ACTION;
