-- CreateEnum
CREATE TYPE "VasijaUso" AS ENUM ('ingreso', 'fermentacion_alcoholica', 'fermentacion_malolactica', 'conservacion', 'clarificacion', 'estabilizacion', 'corte', 'preparacion_fraccionamiento', 'pulmon_de_linea', 'fermentacion_en_barrica', 'crianza', 'microoxigenacion', 'otro');

-- AlterEnum
-- Traduce los valores viejos de "etapa" (que en realidad eran tipos de operación) a la
-- nueva semántica de "estado actual". "Roble" en tipo no distingue Francés/Americano en
-- los datos viejos: las vasijas afectadas quedan como "Otro" para revisión manual.
BEGIN;
CREATE TYPE "VasijaEtapa_new" AS ENUM ('vacia', 'disponible', 'en_limpieza', 'sanitizada', 'ocupada', 'en_fermentacion', 'en_maceracion', 'en_crianza', 'en_estabilizacion', 'lista_para_trasiego', 'lista_para_fraccionamiento', 'en_mantenimiento', 'bloqueada', 'fuera_de_servicio');
ALTER TABLE "vasija" ALTER COLUMN "etapa" TYPE "VasijaEtapa_new" USING (
  CASE "etapa"::text
    WHEN 'fermentacion' THEN 'en_fermentacion'
    WHEN 'ingreso' THEN 'ocupada'
    WHEN 'trasiego' THEN 'ocupada'
    WHEN 'descube' THEN 'ocupada'
    WHEN 'correccion' THEN 'ocupada'
    WHEN 'corte_parcial' THEN 'ocupada'
    ELSE NULL
  END::"VasijaEtapa_new"
);
ALTER TYPE "VasijaEtapa" RENAME TO "VasijaEtapa_old";
ALTER TYPE "VasijaEtapa_new" RENAME TO "VasijaEtapa";
DROP TYPE "public"."VasijaEtapa_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "VasijaTipo_new" AS ENUM ('TanqueAceroInoxidable', 'VasijaHormigon', 'VasijaMamposteria', 'TanqueFibraDeVidrio', 'TanquePRFV', 'BarricaRobleFrances', 'BarricaRobleAmericano', 'HuevoHormigon', 'TanqueMovilInoxidable', 'Otro');
ALTER TABLE "vasija" ALTER COLUMN "tipo" TYPE "VasijaTipo_new" USING (
  CASE "tipo"::text
    WHEN 'Hormigon' THEN 'VasijaHormigon'
    WHEN 'AceroInoxidable' THEN 'TanqueAceroInoxidable'
    WHEN 'FibraDeVidrio' THEN 'TanqueFibraDeVidrio'
    WHEN 'Roble' THEN 'Otro'
    WHEN 'Polietileno' THEN 'Otro'
    WHEN 'Ceramica' THEN 'Otro'
    ELSE NULL
  END::"VasijaTipo_new"
);
ALTER TYPE "VasijaTipo" RENAME TO "VasijaTipo_old";
ALTER TYPE "VasijaTipo_new" RENAME TO "VasijaTipo";
DROP TYPE "public"."VasijaTipo_old";
COMMIT;

-- AlterTable
ALTER TABLE "vasija" ADD COLUMN     "uso" "VasijaUso";
