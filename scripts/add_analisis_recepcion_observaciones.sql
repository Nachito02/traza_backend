-- Agrega observaciones al analisis de recepcion sin perder datos existentes.

ALTER TABLE analisis_recepcion
ADD COLUMN IF NOT EXISTS observaciones text;
