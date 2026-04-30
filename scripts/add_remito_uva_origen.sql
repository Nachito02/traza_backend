-- Agrega origen explícito al remito de uva para trazabilidad directa.
-- Backfill: toma cuartel desde evento_cosecha y finca desde cuartel.

ALTER TABLE remito_uva
ADD COLUMN IF NOT EXISTS finca_id uuid,
ADD COLUMN IF NOT EXISTS cuartel_id uuid;

UPDATE remito_uva r
SET
  cuartel_id = ec.cuartel_id,
  finca_id = c.finca_id
FROM evento_cosecha ec
JOIN cuartel c ON c.cuartel_id = ec.cuartel_id
WHERE r.lote_cosecha_id = ec.lote_cosecha_id
  AND (r.cuartel_id IS NULL OR r.finca_id IS NULL);

DO $$
DECLARE
  remitos_sin_origen integer;
BEGIN
  SELECT COUNT(*)
  INTO remitos_sin_origen
  FROM remito_uva
  WHERE finca_id IS NULL OR cuartel_id IS NULL;

  IF remitos_sin_origen > 0 THEN
    RAISE EXCEPTION
      'No se pudo inferir finca_id/cuartel_id para % remito(s). Revisar lote_cosecha_id antes de continuar.',
      remitos_sin_origen;
  END IF;
END $$;

ALTER TABLE remito_uva
ALTER COLUMN finca_id SET NOT NULL,
ALTER COLUMN cuartel_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_remito_uva_origen
ON remito_uva (finca_id, cuartel_id);

ALTER TABLE remito_uva
DROP CONSTRAINT IF EXISTS remito_uva_finca_id_fkey;

ALTER TABLE remito_uva
ADD CONSTRAINT remito_uva_finca_id_fkey
FOREIGN KEY (finca_id) REFERENCES finca(finca_id)
ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE remito_uva
DROP CONSTRAINT IF EXISTS remito_uva_cuartel_id_fkey;

ALTER TABLE remito_uva
ADD CONSTRAINT remito_uva_cuartel_id_fkey
FOREIGN KEY (cuartel_id) REFERENCES cuartel(cuartel_id)
ON DELETE RESTRICT ON UPDATE NO ACTION;
