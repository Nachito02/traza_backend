-- CreateEnum
CREATE TYPE "VasijaEtapa" AS ENUM ('Conservacion', 'Fermentacion', 'Descube');

-- AlterTable
ALTER TABLE "app_user" ADD COLUMN     "username" TEXT;

-- AlterTable
ALTER TABLE "vasija" DROP COLUMN "estado",
ADD COLUMN     "etapa" "VasijaEtapa";

-- CreateTable
CREATE TABLE "user_finca_rol" (
    "user_id" UUID NOT NULL,
    "finca_id" UUID NOT NULL,
    "rol" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_finca_rol_pkey" PRIMARY KEY ("user_id","finca_id","rol")
);

-- CreateTable
CREATE TABLE "bodega_finca_vinculo" (
    "bodega_id" UUID NOT NULL,
    "finca_id" UUID NOT NULL,
    "tipo_vinculo" TEXT NOT NULL DEFAULT 'propia',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bodega_finca_vinculo_pkey" PRIMARY KEY ("bodega_id","finca_id")
);

-- CreateIndex
CREATE INDEX "idx_user_finca_rol_finca_rol" ON "user_finca_rol"("finca_id", "rol");

-- CreateIndex
CREATE INDEX "idx_user_finca_rol_user" ON "user_finca_rol"("user_id");

-- CreateIndex
CREATE INDEX "idx_bodega_finca_vinculo_finca" ON "bodega_finca_vinculo"("finca_id");

-- CreateIndex
CREATE INDEX "idx_bodega_finca_vinculo_tipo" ON "bodega_finca_vinculo"("tipo_vinculo", "activo");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "app_user_username_key" ON "app_user"("username");

-- AddForeignKey
ALTER TABLE "user_finca_rol" ADD CONSTRAINT "user_finca_rol_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_finca_rol" ADD CONSTRAINT "user_finca_rol_finca_id_fkey" FOREIGN KEY ("finca_id") REFERENCES "finca"("finca_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bodega_finca_vinculo" ADD CONSTRAINT "bodega_finca_vinculo_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bodega_finca_vinculo" ADD CONSTRAINT "bodega_finca_vinculo_finca_id_fkey" FOREIGN KEY ("finca_id") REFERENCES "finca"("finca_id") ON DELETE RESTRICT ON UPDATE NO ACTION;
