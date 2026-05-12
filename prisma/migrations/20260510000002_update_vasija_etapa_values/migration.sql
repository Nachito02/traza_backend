-- Limpiar valores del enum viejo antes de alterar el tipo
UPDATE "vasija" SET "etapa" = NULL WHERE "etapa" IS NOT NULL;

-- AlterEnum
CREATE TYPE "VasijaEtapa_new" AS ENUM ('ingreso', 'fermentacion', 'trasiego', 'descube', 'correccion', 'corte_parcial');
ALTER TABLE "vasija" ALTER COLUMN "etapa" TYPE "VasijaEtapa_new" USING ("etapa"::text::"VasijaEtapa_new");
ALTER TYPE "VasijaEtapa" RENAME TO "VasijaEtapa_old";
ALTER TYPE "VasijaEtapa_new" RENAME TO "VasijaEtapa";
DROP TYPE "public"."VasijaEtapa_old";
