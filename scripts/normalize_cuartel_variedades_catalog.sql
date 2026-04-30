-- Normaliza cuarteles para evitar texto libre en cultivo/variedad.
-- Usamos CHECK constraints NOT VALID para bloquear nuevos datos inválidos
-- sin romper registros históricos hasta que se limpien por completo.

ALTER TABLE cuartel
ADD COLUMN IF NOT EXISTS tipo_variedad TEXT;

UPDATE cuartel
SET cultivo = 'Vid'
WHERE cultivo IS NULL OR lower(trim(cultivo)) = 'vid';

UPDATE cuartel
SET variedad = CASE lower(
  regexp_replace(
    translate(trim(variedad), 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun'),
    '[^a-zA-Z0-9]+',
    '_',
    'g'
  )
)
  WHEN 'malbec' THEN 'malbec'
  WHEN 'bonarda' THEN 'bonarda'
  WHEN 'cabernet_sauvignon' THEN 'cabernet_sauvignon'
  WHEN 'syrah' THEN 'syrah'
  WHEN 'merlot' THEN 'merlot'
  WHEN 'tempranillo' THEN 'tempranillo'
  WHEN 'pinot_noir' THEN 'pinot_noir'
  WHEN 'sangiovese' THEN 'sangiovese'
  WHEN 'aspiran_bouschet' THEN 'aspiran_bouschet'
  WHEN 'aspirant_bouschet' THEN 'aspiran_bouschet'
  WHEN 'pedro_gimenez' THEN 'pedro_gimenez'
  WHEN 'pedro_jimenez' THEN 'pedro_gimenez'
  WHEN 'torrontes_riojano' THEN 'torrontes_riojano'
  WHEN 'torrontes_sanjuanino' THEN 'torrontes_sanjuanino'
  WHEN 'chardonnay' THEN 'chardonnay'
  WHEN 'sauvignon_blanc' THEN 'sauvignon_blanc'
  WHEN 'chenin' THEN 'chenin'
  WHEN 'semillon' THEN 'semillon'
  WHEN 'viognier' THEN 'viognier'
  WHEN 'ugni_blanc' THEN 'ugni_blanc'
  WHEN 'cereza' THEN 'cereza'
  WHEN 'criolla_grande' THEN 'criolla_grande'
  WHEN 'moscatel_rosado' THEN 'moscatel_rosado'
  ELSE variedad
END
WHERE variedad IS NOT NULL;

UPDATE cuartel
SET tipo_variedad = CASE
  WHEN variedad IN (
    'malbec',
    'bonarda',
    'cabernet_sauvignon',
    'syrah',
    'merlot',
    'tempranillo',
    'pinot_noir',
    'sangiovese',
    'aspiran_bouschet'
  ) THEN 'tinta'
  WHEN variedad IN (
    'pedro_gimenez',
    'torrontes_riojano',
    'torrontes_sanjuanino',
    'chardonnay',
    'sauvignon_blanc',
    'chenin',
    'semillon',
    'viognier',
    'ugni_blanc'
  ) THEN 'blanca'
  WHEN variedad IN (
    'cereza',
    'criolla_grande',
    'moscatel_rosado'
  ) THEN 'rosada'
  ELSE tipo_variedad
END;

ALTER TABLE cuartel
DROP CONSTRAINT IF EXISTS cuartel_cultivo_vid_chk,
DROP CONSTRAINT IF EXISTS cuartel_tipo_variedad_chk,
DROP CONSTRAINT IF EXISTS cuartel_variedad_catalogo_chk,
DROP CONSTRAINT IF EXISTS cuartel_variedad_tipo_chk;

ALTER TABLE cuartel
ADD CONSTRAINT cuartel_cultivo_vid_chk
CHECK (cultivo IS NOT NULL AND cultivo = 'Vid') NOT VALID,
ADD CONSTRAINT cuartel_tipo_variedad_chk
CHECK (tipo_variedad IS NOT NULL AND tipo_variedad IN ('tinta', 'blanca', 'rosada')) NOT VALID,
ADD CONSTRAINT cuartel_variedad_catalogo_chk
CHECK (
  variedad IS NOT NULL AND variedad IN (
    'malbec',
    'bonarda',
    'cabernet_sauvignon',
    'syrah',
    'merlot',
    'tempranillo',
    'pinot_noir',
    'sangiovese',
    'aspiran_bouschet',
    'pedro_gimenez',
    'torrontes_riojano',
    'torrontes_sanjuanino',
    'chardonnay',
    'sauvignon_blanc',
    'chenin',
    'semillon',
    'viognier',
    'ugni_blanc',
    'cereza',
    'criolla_grande',
    'moscatel_rosado'
  )
) NOT VALID,
ADD CONSTRAINT cuartel_variedad_tipo_chk
CHECK (
  (tipo_variedad = 'tinta' AND variedad IN (
    'malbec',
    'bonarda',
    'cabernet_sauvignon',
    'syrah',
    'merlot',
    'tempranillo',
    'pinot_noir',
    'sangiovese',
    'aspiran_bouschet'
  ))
  OR (tipo_variedad = 'blanca' AND variedad IN (
    'pedro_gimenez',
    'torrontes_riojano',
    'torrontes_sanjuanino',
    'chardonnay',
    'sauvignon_blanc',
    'chenin',
    'semillon',
    'viognier',
    'ugni_blanc'
  ))
  OR (tipo_variedad = 'rosada' AND variedad IN (
    'cereza',
    'criolla_grande',
    'moscatel_rosado'
  ))
) NOT VALID;

-- Auditoria opcional antes de validar constraints históricos:
-- SELECT cuartel_id, codigo_cuartel, cultivo, tipo_variedad, variedad
-- FROM cuartel
-- WHERE cultivo IS DISTINCT FROM 'Vid'
--    OR tipo_variedad NOT IN ('tinta', 'blanca', 'rosada')
--    OR variedad NOT IN (
--      'malbec','bonarda','cabernet_sauvignon','syrah','merlot','tempranillo',
--      'pinot_noir','sangiovese','aspiran_bouschet','pedro_gimenez',
--      'torrontes_riojano','torrontes_sanjuanino','chardonnay',
--      'sauvignon_blanc','chenin','semillon','viognier','ugni_blanc',
--      'cereza','criolla_grande','moscatel_rosado'
--    );
