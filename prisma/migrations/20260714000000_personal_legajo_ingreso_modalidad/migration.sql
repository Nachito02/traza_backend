-- Observaciones carga inicial (Fase 2 · Personal):
-- - Nuevos campos del legajo: número de legajo y fecha de ingreso. La antigüedad
--   se calcula a partir de fecha_ingreso, no se persiste.
-- - Modalidad de pago "al tanto" y "otro" (pago por unidad producida: planta,
--   surco, tacho, etc.), con su costo unitario asociado.
ALTER TYPE "ModalidadPago" ADD VALUE IF NOT EXISTS 'al_tanto';
ALTER TYPE "ModalidadPago" ADD VALUE IF NOT EXISTS 'otro';

ALTER TABLE "personal_bodega"
  ADD COLUMN IF NOT EXISTS "legajo"         TEXT,
  ADD COLUMN IF NOT EXISTS "fecha_ingreso"  DATE,
  ADD COLUMN IF NOT EXISTS "costo_unitario" DECIMAL(14,2);
