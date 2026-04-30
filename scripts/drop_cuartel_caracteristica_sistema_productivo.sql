-- Elimina el campo descartado de caracteristicas del sistema productivo.

ALTER TABLE cuartel
DROP CONSTRAINT IF EXISTS cuartel_caracteristica_sistema_productivo_chk;

ALTER TABLE cuartel
DROP COLUMN IF EXISTS caracteristica_sistema_productivo;
