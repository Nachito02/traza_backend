-- AlterTable
ALTER TABLE "bodega" ADD COLUMN     "nro_inscripto_inv" TEXT;

-- AlterTable
ALTER TABLE "ciu" ADD COLUMN     "tenor_azucarino_gl" DECIMAL(8,3),
ADD COLUMN     "uva_organica" BOOLEAN,
ADD COLUMN     "variedad_codigo_inv" TEXT,
ADD COLUMN     "variedad_nombre" TEXT;

-- AlterTable
ALTER TABLE "finca" ADD COLUMN     "cuit" TEXT,
ADD COLUMN     "nro_inscripto_inv" TEXT,
ADD COLUMN     "razon_social" TEXT;

-- AlterTable
ALTER TABLE "remito_uva" ADD COLUMN     "cuit_conductor" TEXT,
ADD COLUMN     "modelo_vehiculo" TEXT;
