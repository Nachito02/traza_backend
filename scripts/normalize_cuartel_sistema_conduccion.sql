-- Normaliza el sistema de conduccion de cuarteles y bloquea valores fuera de catalogo.

UPDATE cuartel
SET sistema_conduccion = CASE lower(
  regexp_replace(
    translate(trim(sistema_conduccion), 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun'),
    '[^a-zA-Z0-9]+',
    '_',
    'g'
  )
)
  WHEN 'espaldera' THEN 'espaldera'
  WHEN 'parral' THEN 'parral'
  WHEN 'vaso' THEN 'vaso'
  WHEN 'gobelet' THEN 'vaso'
  WHEN 'guyot' THEN 'guyot'
  WHEN 'doble_cordon' THEN 'cordon_bilateral_doble_cordon'
  WHEN 'cordon_bilateral' THEN 'cordon_bilateral_doble_cordon'
  WHEN 'cordon_bilateral_doble_cordon' THEN 'cordon_bilateral_doble_cordon'
  WHEN 'cordon_unilateral' THEN 'cordon_unilateral'
  ELSE sistema_conduccion
END
WHERE sistema_conduccion IS NOT NULL
  AND trim(sistema_conduccion) <> '';

UPDATE cuartel
SET sistema_conduccion = NULL
WHERE sistema_conduccion IS NOT NULL
  AND trim(sistema_conduccion) = '';

ALTER TABLE cuartel
DROP CONSTRAINT IF EXISTS cuartel_sistema_conduccion_chk;

ALTER TABLE cuartel
ADD CONSTRAINT cuartel_sistema_conduccion_chk
CHECK (
  sistema_conduccion IS NULL
  OR sistema_conduccion IN (
    'espaldera',
    'parral',
    'vaso',
    'guyot',
    'cordon_bilateral_doble_cordon',
    'cordon_unilateral'
  )
) NOT VALID;

-- Para auditar datos historicos antes de validar la constraint:
-- SELECT cuartel_id, codigo_cuartel, sistema_conduccion
-- FROM cuartel
-- WHERE sistema_conduccion IS NOT NULL
--   AND sistema_conduccion NOT IN (
--     'espaldera',
--     'parral',
--     'vaso',
--     'guyot',
--     'cordon_bilateral_doble_cordon',
--     'cordon_unilateral'
--   );
