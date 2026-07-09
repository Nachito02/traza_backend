-- Metadatos por actividad para atenuar las secciones de costo que no aplican
-- (labor manual vs. mecanizada) y evitar que el usuario final vea lo innecesario.
ALTER TABLE "actividad_sugerencia"
  ADD COLUMN IF NOT EXISTS "tipo" TEXT,
  ADD COLUMN IF NOT EXISTS "aplica_maquinaria" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "aplica_combustible" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "aplica_insumos" BOOLEAN NOT NULL DEFAULT true;
