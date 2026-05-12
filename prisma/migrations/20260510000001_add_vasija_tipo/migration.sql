-- CreateEnum
CREATE TYPE "VasijaTipo" AS ENUM ('Hormigon', 'AceroInoxidable', 'Roble', 'FibraDeVidrio', 'Polietileno', 'Ceramica');

-- AlterTable
ALTER TABLE "vasija" DROP COLUMN "tipo",
ADD COLUMN     "tipo" "VasijaTipo";
