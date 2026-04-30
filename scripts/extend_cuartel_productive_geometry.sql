-- Extiende cuartel con datos de estructura productiva y geometria de hileras.

ALTER TABLE cuartel
ADD COLUMN IF NOT EXISTS cantidad_hileras INTEGER,
ADD COLUMN IF NOT EXISTS largo_hileras_m DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS densidad_hileras DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS distancia_plantacion TEXT;

UPDATE cuartel
SET sistema_riego = CASE lower(
  regexp_replace(
    translate(trim(sistema_riego), 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun'),
    '[^a-zA-Z0-9]+',
    '_',
    'g'
  )
)
  WHEN 'goteo' THEN 'goteo'
  WHEN 'surco' THEN 'surco'
  WHEN 'aspersion' THEN 'aspersion'
  WHEN 'microaspersion' THEN 'microaspersion'
  WHEN 'micro_aspersion' THEN 'microaspersion'
  WHEN 'secano' THEN 'secano'
  ELSE sistema_riego
END
WHERE sistema_riego IS NOT NULL
  AND trim(sistema_riego) <> '';

UPDATE cuartel
SET sistema_riego = NULL
WHERE sistema_riego IS NOT NULL
  AND trim(sistema_riego) = '';

ALTER TABLE cuartel
DROP CONSTRAINT IF EXISTS cuartel_sistema_riego_chk,
DROP CONSTRAINT IF EXISTS cuartel_cantidad_hileras_chk,
DROP CONSTRAINT IF EXISTS cuartel_largo_hileras_chk,
DROP CONSTRAINT IF EXISTS cuartel_densidad_hileras_chk;

ALTER TABLE cuartel
ADD CONSTRAINT cuartel_sistema_riego_chk
CHECK (
  sistema_riego IS NULL
  OR sistema_riego IN ('goteo', 'surco', 'aspersion', 'microaspersion', 'secano')
) NOT VALID,
ADD CONSTRAINT cuartel_cantidad_hileras_chk
CHECK (cantidad_hileras IS NULL OR cantidad_hileras >= 0) NOT VALID,
ADD CONSTRAINT cuartel_largo_hileras_chk
CHECK (largo_hileras_m IS NULL OR largo_hileras_m >= 0) NOT VALID,
ADD CONSTRAINT cuartel_densidad_hileras_chk
CHECK (densidad_hileras IS NULL OR densidad_hileras >= 0) NOT VALID;

-- Auditoria sugerida:
-- SELECT cuartel_id, codigo_cuartel, sistema_riego
-- FROM cuartel
-- WHERE sistema_riego IS NOT NULL
--   AND sistema_riego NOT IN ('goteo', 'surco', 'aspersion', 'microaspersion', 'secano');
