-- Tipo de cosecha (manual / mecánica) y observaciones en el remito de uva.

-- 1) Nuevo enum para el tipo de cosecha
CREATE TYPE "TipoCosecha" AS ENUM ('manual', 'mecanica');

-- 2) Columnas nuevas en remito_uva (ambas opcionales)
ALTER TABLE "remito_uva"
  ADD COLUMN "tipo_cosecha" "TipoCosecha",
  ADD COLUMN "observaciones" TEXT;

-- 3) Calidad de uva: pureza de variedad (pura / mezclada)
CREATE TYPE "VariedadPureza" AS ENUM ('pura', 'mezclada');

-- 4) Pesos del remito (bruto, tara del camión y neto calculado) y
--    variables de calidad de uva: pureza + % y escalas 1-10.
ALTER TABLE "remito_uva"
  ADD COLUMN "kg_bruto" DECIMAL(12,3),
  ADD COLUMN "kg_tara" DECIMAL(12,3),
  ADD COLUMN "kg_neto" DECIMAL(12,3),
  ADD COLUMN "variedad_pureza" "VariedadPureza",
  ADD COLUMN "variedad_pureza_pct" DECIMAL(5,2),
  ADD COLUMN "sanidad_escala" INTEGER,
  ADD COLUMN "presencia_hojas_escala" INTEGER;
