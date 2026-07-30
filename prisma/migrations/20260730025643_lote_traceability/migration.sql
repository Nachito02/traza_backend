-- CreateEnum
CREATE TYPE "LoteOrigen" AS ENUM ('ingreso', 'corte');

-- DropForeignKey
ALTER TABLE "corte_componente" DROP CONSTRAINT "corte_componente_lote_cosecha_id_fkey";

-- DropForeignKey
ALTER TABLE "vasija_contenido" DROP CONSTRAINT "vasija_contenido_lote_cosecha_id_fkey";

-- DropIndex
DROP INDEX "idx_corte_componente_lote";

-- DropIndex
DROP INDEX "idx_vasija_contenido_lote";

-- AlterTable
ALTER TABLE "bodega" ADD COLUMN     "codigo" TEXT;

-- AlterTable
ALTER TABLE "corte_componente" DROP COLUMN "lote_cosecha_id",
ADD COLUMN     "lote_id" UUID;

-- AlterTable
ALTER TABLE "vasija_contenido" DROP COLUMN "lote_cosecha_id",
ADD COLUMN     "lote_id" UUID NOT NULL,
ADD COLUMN     "volumen_l" DECIMAL(12,3);

-- CreateTable
CREATE TABLE "lote" (
    "lote_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bodega_id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "secuencia" INTEGER NOT NULL,
    "origen" "LoteOrigen" NOT NULL,
    "campania_id" UUID,
    "cuartel_id" UUID,
    "variedad" TEXT,
    "corte_origen_id" UUID,
    "observaciones" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lote_pkey" PRIMARY KEY ("lote_id")
);

-- CreateTable
CREATE TABLE "lote_origen_recepcion" (
    "lote_id" UUID NOT NULL,
    "recepcion_bodega_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lote_origen_recepcion_pkey" PRIMARY KEY ("lote_id","recepcion_bodega_id")
);

-- CreateTable
CREATE TABLE "lote_composicion" (
    "lote_composicion_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lote_id" UUID NOT NULL,
    "lote_padre_id" UUID NOT NULL,
    "corte_id" UUID,
    "porcentaje" DECIMAL(7,4),
    "volumen_l" DECIMAL(12,3),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lote_composicion_pkey" PRIMARY KEY ("lote_composicion_id")
);

-- CreateIndex
CREATE INDEX "idx_lote_bodega_cuartel_campania" ON "lote"("bodega_id", "cuartel_id", "campania_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_lote_bodega_codigo" ON "lote"("bodega_id", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "lote_origen_recepcion_recepcion_bodega_id_key" ON "lote_origen_recepcion"("recepcion_bodega_id");

-- CreateIndex
CREATE INDEX "idx_lote_origen_recepcion_lote" ON "lote_origen_recepcion"("lote_id");

-- CreateIndex
CREATE INDEX "idx_lote_composicion_padre" ON "lote_composicion"("lote_padre_id");

-- CreateIndex
CREATE INDEX "idx_lote_composicion_hijo" ON "lote_composicion"("lote_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_lote_composicion_hijo_padre_corte" ON "lote_composicion"("lote_id", "lote_padre_id", "corte_id");

-- CreateIndex
CREATE UNIQUE INDEX "bodega_codigo_key" ON "bodega"("codigo");

-- CreateIndex
CREATE INDEX "idx_corte_componente_lote" ON "corte_componente"("lote_id");

-- CreateIndex
CREATE INDEX "idx_vasija_contenido_vasija_activo" ON "vasija_contenido"("vasija_id", "hasta");

-- CreateIndex
CREATE INDEX "idx_vasija_contenido_lote" ON "vasija_contenido"("lote_id");

-- AddForeignKey
ALTER TABLE "vasija_contenido" ADD CONSTRAINT "vasija_contenido_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lote"("lote_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lote" ADD CONSTRAINT "lote_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lote" ADD CONSTRAINT "lote_campania_id_fkey" FOREIGN KEY ("campania_id") REFERENCES "campania"("campania_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lote" ADD CONSTRAINT "lote_cuartel_id_fkey" FOREIGN KEY ("cuartel_id") REFERENCES "cuartel"("cuartel_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lote" ADD CONSTRAINT "lote_corte_origen_id_fkey" FOREIGN KEY ("corte_origen_id") REFERENCES "corte"("corte_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lote_origen_recepcion" ADD CONSTRAINT "lote_origen_recepcion_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lote"("lote_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lote_origen_recepcion" ADD CONSTRAINT "lote_origen_recepcion_recepcion_bodega_id_fkey" FOREIGN KEY ("recepcion_bodega_id") REFERENCES "recepcion_bodega"("recepcion_bodega_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lote_composicion" ADD CONSTRAINT "lote_composicion_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lote"("lote_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lote_composicion" ADD CONSTRAINT "lote_composicion_lote_padre_id_fkey" FOREIGN KEY ("lote_padre_id") REFERENCES "lote"("lote_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lote_composicion" ADD CONSTRAINT "lote_composicion_corte_id_fkey" FOREIGN KEY ("corte_id") REFERENCES "corte"("corte_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "corte_componente" ADD CONSTRAINT "corte_componente_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lote"("lote_id") ON DELETE SET NULL ON UPDATE NO ACTION;
