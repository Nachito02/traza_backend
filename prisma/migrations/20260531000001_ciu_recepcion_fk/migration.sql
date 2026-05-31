-- Cada CIU corresponde a un ingreso (recepción) específico: 1 ingreso ↔ 1 CIU.

-- 1) Nueva columna (nullable temporalmente para poder backfillear)
ALTER TABLE "ciu" ADD COLUMN "recepcion_bodega_id" UUID;

-- 2) Backfill desde la tabla puente existente (un vínculo por CIU)
UPDATE "ciu" c
SET "recepcion_bodega_id" = sub.recepcion_bodega_id
FROM (
  SELECT DISTINCT ON (ciu_id) ciu_id, recepcion_bodega_id
  FROM "ciu_recepcion"
  ORDER BY ciu_id, created_at ASC
) sub
WHERE c.ciu_id = sub.ciu_id;

-- 3) Forzar NOT NULL (falla si quedara algún CIU "suelto" sin recepción)
ALTER TABLE "ciu" ALTER COLUMN "recepcion_bodega_id" SET NOT NULL;

-- 4) Unicidad: un único CIU por ingreso
CREATE UNIQUE INDEX "ciu_recepcion_bodega_id_key" ON "ciu"("recepcion_bodega_id");

-- 5) FK hacia recepcion_bodega
ALTER TABLE "ciu"
  ADD CONSTRAINT "ciu_recepcion_bodega_id_fkey"
  FOREIGN KEY ("recepcion_bodega_id")
  REFERENCES "recepcion_bodega"("recepcion_bodega_id")
  ON DELETE RESTRICT ON UPDATE NO ACTION;

-- 6) La tabla puente M:N queda obsoleta
DROP TABLE "ciu_recepcion";
