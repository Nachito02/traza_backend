-- Normaliza el antiguo "sistema_productivo" para usarlo como catalogo de Manejo de cultivo.
-- La columna se mantiene por compatibilidad con API/Prisma, pero la UI la muestra como "Manejo de cultivo".

UPDATE cuartel
SET sistema_productivo = CASE lower(
  regexp_replace(
    translate(trim(sistema_productivo), 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun'),
    '[^a-zA-Z0-9]+',
    '_',
    'g'
  )
)
  WHEN 'convencional' THEN 'convencional'
  WHEN 'manejo_convencional' THEN 'convencional'
  WHEN 'organico' THEN 'organico_ecologico'
  WHEN 'ecologico' THEN 'organico_ecologico'
  WHEN 'organico_ecologico' THEN 'organico_ecologico'
  WHEN 'manejo_organico_ecologico' THEN 'organico_ecologico'
  WHEN 'regenerativo' THEN 'regenerativo'
  WHEN 'manejo_regenerativo' THEN 'regenerativo'
  WHEN 'viticultura_regenerativa' THEN 'regenerativo'
  WHEN 'labranza_cero' THEN 'labranza_cero_cobertura_vegetal'
  WHEN 'cobertura_vegetal' THEN 'labranza_cero_cobertura_vegetal'
  WHEN 'labranza_cero_cobertura_vegetal' THEN 'labranza_cero_cobertura_vegetal'
  WHEN 'manejo_labranza_cero_cobertura_vegetal' THEN 'labranza_cero_cobertura_vegetal'
  WHEN 'biodinamica' THEN 'biodinamica'
  WHEN 'biodinamico' THEN 'biodinamica'
  ELSE sistema_productivo
END
WHERE sistema_productivo IS NOT NULL
  AND trim(sistema_productivo) <> '';

UPDATE cuartel
SET sistema_productivo = NULL
WHERE sistema_productivo IS NOT NULL
  AND trim(sistema_productivo) = '';

ALTER TABLE cuartel
DROP CONSTRAINT IF EXISTS cuartel_manejo_cultivo_chk;

ALTER TABLE cuartel
ADD CONSTRAINT cuartel_manejo_cultivo_chk
CHECK (
  sistema_productivo IS NULL
  OR sistema_productivo IN (
    'convencional',
    'organico_ecologico',
    'regenerativo',
    'labranza_cero_cobertura_vegetal',
    'biodinamica'
  )
) NOT VALID;

-- Para auditar datos historicos antes de validar la constraint:
-- SELECT cuartel_id, codigo_cuartel, sistema_productivo
-- FROM cuartel
-- WHERE sistema_productivo IS NOT NULL
--   AND sistema_productivo NOT IN (
--     'convencional',
--     'organico_ecologico',
--     'regenerativo',
--     'labranza_cero_cobertura_vegetal',
--     'biodinamica'
--   );
