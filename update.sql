-- CreateEnum (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'TipoOperacionVasija'
          AND n.nspname = 'public'
    ) THEN
        CREATE TYPE "TipoOperacionVasija" AS ENUM ('ingreso', 'fermentacion', 'trasiego', 'descube', 'correccion', 'corte_parcial');
    END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "remito_uva" (
    "remito_uva_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bodega_id" UUID NOT NULL,
    "lote_cosecha_id" UUID NOT NULL,
    "salida_finca" TIMESTAMPTZ(6) NOT NULL,
    "llegada_bodega" TIMESTAMPTZ(6),
    "transportista" TEXT,
    "patente" TEXT,
    "kg_declarados" DECIMAL(12,3),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "remito_uva_pkey" PRIMARY KEY ("remito_uva_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "recepcion_bodega" (
    "recepcion_bodega_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "remito_uva_id" UUID NOT NULL,
    "fecha_hora" TIMESTAMPTZ(6) NOT NULL,
    "kg_pesados" DECIMAL(12,3),
    "clasificacion" TEXT,
    "observaciones" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recepcion_bodega_pkey" PRIMARY KEY ("recepcion_bodega_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "analisis_recepcion" (
    "analisis_recepcion_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recepcion_bodega_id" UUID NOT NULL,
    "brix" DECIMAL(8,3),
    "ph" DECIMAL(5,2),
    "acidez" DECIMAL(8,3),
    "sanidad" TEXT,
    "temperatura_uva" DECIMAL(8,3),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analisis_recepcion_pkey" PRIMARY KEY ("analisis_recepcion_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ciu" (
    "ciu_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bodega_id" UUID NOT NULL,
    "codigo_ciu" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'emitido',
    "emitido_at" TIMESTAMPTZ(6) NOT NULL,
    "observaciones" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ciu_pkey" PRIMARY KEY ("ciu_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ciu_recepcion" (
    "ciu_id" UUID NOT NULL,
    "recepcion_bodega_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ciu_recepcion_pkey" PRIMARY KEY ("ciu_id","recepcion_bodega_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "qc_ingreso_uva" (
    "qc_ingreso_uva_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bodega_id" UUID NOT NULL,
    "recepcion_bodega_id" UUID NOT NULL,
    "fecha_hora" TIMESTAMPTZ(6) NOT NULL,
    "brix" DECIMAL(8,3),
    "ph" DECIMAL(5,2),
    "acidez" DECIMAL(8,3),
    "temperatura_uva" DECIMAL(8,3),
    "estado_pcc" TEXT,
    "aprobado" BOOLEAN,
    "observaciones" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qc_ingreso_uva_pkey" PRIMARY KEY ("qc_ingreso_uva_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "vasija" (
    "vasija_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bodega_id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" TEXT,
    "capacidad_litros" DECIMAL(12,3),
    "estado" TEXT DEFAULT 'disponible',
    "ubicacion" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vasija_pkey" PRIMARY KEY ("vasija_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "vasija_contenido" (
    "vasija_contenido_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vasija_id" UUID NOT NULL,
    "lote_cosecha_id" UUID NOT NULL,
    "desde" TIMESTAMPTZ(6) NOT NULL,
    "hasta" TIMESTAMPTZ(6),
    "kg_aportados" DECIMAL(12,3),
    "porcentaje_aporte" DECIMAL(7,4),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vasija_contenido_pkey" PRIMARY KEY ("vasija_contenido_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "existencia_vasija" (
    "existencia_vasija_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vasija_id" UUID NOT NULL,
    "fecha_hora" TIMESTAMPTZ(6) NOT NULL,
    "volumen_l" DECIMAL(12,3),
    "grado_alcohol" DECIMAL(5,2),
    "azucar_residual_g_l" DECIMAL(8,3),
    "observaciones" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "existencia_vasija_pkey" PRIMARY KEY ("existencia_vasija_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "control_fermentacion" (
    "control_fermentacion_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vasija_id" UUID NOT NULL,
    "fecha_hora" TIMESTAMPTZ(6) NOT NULL,
    "densidad" DECIMAL(8,3),
    "temperatura" DECIMAL(8,3),
    "brix" DECIMAL(8,3),
    "ph" DECIMAL(5,2),
    "acidez" DECIMAL(8,3),
    "estado_fermentacion" TEXT,
    "observaciones" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "control_fermentacion_pkey" PRIMARY KEY ("control_fermentacion_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "orden_enologo" (
    "orden_enologo_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bodega_id" UUID NOT NULL,
    "enologo_user_id" UUID,
    "fecha" TIMESTAMPTZ(6) NOT NULL,
    "instrucciones" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'activa',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orden_enologo_pkey" PRIMARY KEY ("orden_enologo_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "operacion_vasija" (
    "operacion_vasija_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bodega_id" UUID NOT NULL,
    "vasija_origen_id" UUID,
    "vasija_destino_id" UUID,
    "orden_enologo_id" UUID,
    "recepcion_bodega_id" UUID,
    "tipo" "TipoOperacionVasija" NOT NULL,
    "fecha_hora" TIMESTAMPTZ(6) NOT NULL,
    "user_id" UUID,
    "volumen_movido_l" DECIMAL(12,3),
    "observaciones" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operacion_vasija_pkey" PRIMARY KEY ("operacion_vasija_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "corte" (
    "corte_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bodega_id" UUID NOT NULL,
    "campania_id" UUID,
    "fecha" TIMESTAMPTZ(6) NOT NULL,
    "objetivo" TEXT,
    "responsable_user_id" UUID,
    "observaciones" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "corte_pkey" PRIMARY KEY ("corte_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "corte_componente" (
    "corte_componente_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "corte_id" UUID NOT NULL,
    "vasija_id" UUID,
    "lote_cosecha_id" UUID,
    "volumen_l" DECIMAL(12,3),
    "porcentaje" DECIMAL(7,4),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "corte_componente_pkey" PRIMARY KEY ("corte_componente_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "producto" (
    "producto_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bodega_id" UUID NOT NULL,
    "nombre_comercial" TEXT NOT NULL,
    "varietal" TEXT,
    "anio" INTEGER,
    "tipo" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "producto_pkey" PRIMARY KEY ("producto_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "lote_fraccionamiento" (
    "lote_fraccionamiento_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "corte_id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "botellas" INTEGER,
    "formato" TEXT,
    "codigo_lote_impreso" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lote_fraccionamiento_pkey" PRIMARY KEY ("lote_fraccionamiento_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "codigo_envase" (
    "codigo_envase_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lote_fraccionamiento_id" UUID NOT NULL,
    "codigo_qr" TEXT NOT NULL,
    "codigo_lote_impreso" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codigo_envase_pkey" PRIMARY KEY ("codigo_envase_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "despacho" (
    "despacho_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lote_fraccionamiento_id" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "destino" TEXT,
    "cantidad" INTEGER,
    "documento" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "despacho_pkey" PRIMARY KEY ("despacho_id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_remito_uva_bodega_fecha" ON "remito_uva"("bodega_id", "salida_finca");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_remito_uva_lote" ON "remito_uva"("lote_cosecha_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_recepcion_bodega_remito" ON "recepcion_bodega"("remito_uva_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_recepcion_bodega_fecha" ON "recepcion_bodega"("fecha_hora");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_analisis_recepcion_recepcion" ON "analisis_recepcion"("recepcion_bodega_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_ciu_bodega_emitido_at" ON "ciu"("bodega_id", "emitido_at");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ciu_codigo_ciu_key" ON "ciu"("codigo_ciu");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_ciu_recepcion_recepcion" ON "ciu_recepcion"("recepcion_bodega_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_qc_ingreso_uva_bodega_fecha" ON "qc_ingreso_uva"("bodega_id", "fecha_hora");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_qc_ingreso_uva_recepcion" ON "qc_ingreso_uva"("recepcion_bodega_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_vasija_bodega" ON "vasija"("bodega_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "uq_vasija_bodega_codigo" ON "vasija"("bodega_id", "codigo");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_vasija_contenido_vasija_desde" ON "vasija_contenido"("vasija_id", "desde");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_vasija_contenido_lote" ON "vasija_contenido"("lote_cosecha_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_existencia_vasija_vasija_fecha" ON "existencia_vasija"("vasija_id", "fecha_hora");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_control_fermentacion_vasija_fecha" ON "control_fermentacion"("vasija_id", "fecha_hora");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_orden_enologo_bodega_fecha" ON "orden_enologo"("bodega_id", "fecha");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_orden_enologo_enologo" ON "orden_enologo"("enologo_user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_operacion_vasija_bodega_fecha" ON "operacion_vasija"("bodega_id", "fecha_hora");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_operacion_vasija_origen" ON "operacion_vasija"("vasija_origen_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_operacion_vasija_destino" ON "operacion_vasija"("vasija_destino_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_operacion_vasija_orden" ON "operacion_vasija"("orden_enologo_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_corte_bodega_fecha" ON "corte"("bodega_id", "fecha");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_corte_campania" ON "corte"("campania_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_corte_responsable" ON "corte"("responsable_user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_corte_componente_corte" ON "corte_componente"("corte_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_corte_componente_vasija" ON "corte_componente"("vasija_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_corte_componente_lote" ON "corte_componente"("lote_cosecha_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_producto_bodega" ON "producto"("bodega_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "uq_producto_bodega_nombre" ON "producto"("bodega_id", "nombre_comercial");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_lote_fraccionamiento_corte" ON "lote_fraccionamiento"("corte_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_lote_fraccionamiento_producto" ON "lote_fraccionamiento"("producto_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_lote_fraccionamiento_fecha" ON "lote_fraccionamiento"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "codigo_envase_codigo_qr_key" ON "codigo_envase"("codigo_qr");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_codigo_envase_lote" ON "codigo_envase"("lote_fraccionamiento_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_despacho_lote" ON "despacho"("lote_fraccionamiento_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_despacho_fecha" ON "despacho"("fecha");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'remito_uva_bodega_id_fkey') THEN
        ALTER TABLE "remito_uva" ADD CONSTRAINT "remito_uva_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'remito_uva_lote_cosecha_id_fkey') THEN
        ALTER TABLE "remito_uva" ADD CONSTRAINT "remito_uva_lote_cosecha_id_fkey" FOREIGN KEY ("lote_cosecha_id") REFERENCES "evento_cosecha"("lote_cosecha_id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recepcion_bodega_remito_uva_id_fkey') THEN
        ALTER TABLE "recepcion_bodega" ADD CONSTRAINT "recepcion_bodega_remito_uva_id_fkey" FOREIGN KEY ("remito_uva_id") REFERENCES "remito_uva"("remito_uva_id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'analisis_recepcion_recepcion_bodega_id_fkey') THEN
        ALTER TABLE "analisis_recepcion" ADD CONSTRAINT "analisis_recepcion_recepcion_bodega_id_fkey" FOREIGN KEY ("recepcion_bodega_id") REFERENCES "recepcion_bodega"("recepcion_bodega_id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ciu_bodega_id_fkey') THEN
        ALTER TABLE "ciu" ADD CONSTRAINT "ciu_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ciu_recepcion_ciu_id_fkey') THEN
        ALTER TABLE "ciu_recepcion" ADD CONSTRAINT "ciu_recepcion_ciu_id_fkey" FOREIGN KEY ("ciu_id") REFERENCES "ciu"("ciu_id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ciu_recepcion_recepcion_bodega_id_fkey') THEN
        ALTER TABLE "ciu_recepcion" ADD CONSTRAINT "ciu_recepcion_recepcion_bodega_id_fkey" FOREIGN KEY ("recepcion_bodega_id") REFERENCES "recepcion_bodega"("recepcion_bodega_id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'qc_ingreso_uva_bodega_id_fkey') THEN
        ALTER TABLE "qc_ingreso_uva" ADD CONSTRAINT "qc_ingreso_uva_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'qc_ingreso_uva_recepcion_bodega_id_fkey') THEN
        ALTER TABLE "qc_ingreso_uva" ADD CONSTRAINT "qc_ingreso_uva_recepcion_bodega_id_fkey" FOREIGN KEY ("recepcion_bodega_id") REFERENCES "recepcion_bodega"("recepcion_bodega_id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vasija_bodega_id_fkey') THEN
        ALTER TABLE "vasija" ADD CONSTRAINT "vasija_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vasija_contenido_vasija_id_fkey') THEN
        ALTER TABLE "vasija_contenido" ADD CONSTRAINT "vasija_contenido_vasija_id_fkey" FOREIGN KEY ("vasija_id") REFERENCES "vasija"("vasija_id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vasija_contenido_lote_cosecha_id_fkey') THEN
        ALTER TABLE "vasija_contenido" ADD CONSTRAINT "vasija_contenido_lote_cosecha_id_fkey" FOREIGN KEY ("lote_cosecha_id") REFERENCES "evento_cosecha"("lote_cosecha_id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'existencia_vasija_vasija_id_fkey') THEN
        ALTER TABLE "existencia_vasija" ADD CONSTRAINT "existencia_vasija_vasija_id_fkey" FOREIGN KEY ("vasija_id") REFERENCES "vasija"("vasija_id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'control_fermentacion_vasija_id_fkey') THEN
        ALTER TABLE "control_fermentacion" ADD CONSTRAINT "control_fermentacion_vasija_id_fkey" FOREIGN KEY ("vasija_id") REFERENCES "vasija"("vasija_id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orden_enologo_bodega_id_fkey') THEN
        ALTER TABLE "orden_enologo" ADD CONSTRAINT "orden_enologo_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orden_enologo_enologo_user_id_fkey') THEN
        ALTER TABLE "orden_enologo" ADD CONSTRAINT "orden_enologo_enologo_user_id_fkey" FOREIGN KEY ("enologo_user_id") REFERENCES "app_user"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'operacion_vasija_bodega_id_fkey') THEN
        ALTER TABLE "operacion_vasija" ADD CONSTRAINT "operacion_vasija_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'operacion_vasija_vasija_origen_id_fkey') THEN
        ALTER TABLE "operacion_vasija" ADD CONSTRAINT "operacion_vasija_vasija_origen_id_fkey" FOREIGN KEY ("vasija_origen_id") REFERENCES "vasija"("vasija_id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'operacion_vasija_vasija_destino_id_fkey') THEN
        ALTER TABLE "operacion_vasija" ADD CONSTRAINT "operacion_vasija_vasija_destino_id_fkey" FOREIGN KEY ("vasija_destino_id") REFERENCES "vasija"("vasija_id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'operacion_vasija_orden_enologo_id_fkey') THEN
        ALTER TABLE "operacion_vasija" ADD CONSTRAINT "operacion_vasija_orden_enologo_id_fkey" FOREIGN KEY ("orden_enologo_id") REFERENCES "orden_enologo"("orden_enologo_id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'operacion_vasija_recepcion_bodega_id_fkey') THEN
        ALTER TABLE "operacion_vasija" ADD CONSTRAINT "operacion_vasija_recepcion_bodega_id_fkey" FOREIGN KEY ("recepcion_bodega_id") REFERENCES "recepcion_bodega"("recepcion_bodega_id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'operacion_vasija_user_id_fkey') THEN
        ALTER TABLE "operacion_vasija" ADD CONSTRAINT "operacion_vasija_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'corte_bodega_id_fkey') THEN
        ALTER TABLE "corte" ADD CONSTRAINT "corte_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'corte_campania_id_fkey') THEN
        ALTER TABLE "corte" ADD CONSTRAINT "corte_campania_id_fkey" FOREIGN KEY ("campania_id") REFERENCES "campania"("campania_id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'corte_responsable_user_id_fkey') THEN
        ALTER TABLE "corte" ADD CONSTRAINT "corte_responsable_user_id_fkey" FOREIGN KEY ("responsable_user_id") REFERENCES "app_user"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'corte_componente_corte_id_fkey') THEN
        ALTER TABLE "corte_componente" ADD CONSTRAINT "corte_componente_corte_id_fkey" FOREIGN KEY ("corte_id") REFERENCES "corte"("corte_id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'corte_componente_vasija_id_fkey') THEN
        ALTER TABLE "corte_componente" ADD CONSTRAINT "corte_componente_vasija_id_fkey" FOREIGN KEY ("vasija_id") REFERENCES "vasija"("vasija_id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'corte_componente_lote_cosecha_id_fkey') THEN
        ALTER TABLE "corte_componente" ADD CONSTRAINT "corte_componente_lote_cosecha_id_fkey" FOREIGN KEY ("lote_cosecha_id") REFERENCES "evento_cosecha"("lote_cosecha_id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'producto_bodega_id_fkey') THEN
        ALTER TABLE "producto" ADD CONSTRAINT "producto_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lote_fraccionamiento_corte_id_fkey') THEN
        ALTER TABLE "lote_fraccionamiento" ADD CONSTRAINT "lote_fraccionamiento_corte_id_fkey" FOREIGN KEY ("corte_id") REFERENCES "corte"("corte_id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lote_fraccionamiento_producto_id_fkey') THEN
        ALTER TABLE "lote_fraccionamiento" ADD CONSTRAINT "lote_fraccionamiento_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "producto"("producto_id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'codigo_envase_lote_fraccionamiento_id_fkey') THEN
        ALTER TABLE "codigo_envase" ADD CONSTRAINT "codigo_envase_lote_fraccionamiento_id_fkey" FOREIGN KEY ("lote_fraccionamiento_id") REFERENCES "lote_fraccionamiento"("lote_fraccionamiento_id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'despacho_lote_fraccionamiento_id_fkey') THEN
        ALTER TABLE "despacho" ADD CONSTRAINT "despacho_lote_fraccionamiento_id_fkey" FOREIGN KEY ("lote_fraccionamiento_id") REFERENCES "lote_fraccionamiento"("lote_fraccionamiento_id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;
END $$;

-- CreateTable (vinculo bodega<->finca, propia o proveedor tercero)
CREATE TABLE IF NOT EXISTS "bodega_finca_vinculo" (
    "bodega_id" UUID NOT NULL,
    "finca_id" UUID NOT NULL,
    "tipo_vinculo" TEXT NOT NULL DEFAULT 'propia',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bodega_finca_vinculo_pkey" PRIMARY KEY ("bodega_id","finca_id")
);

-- AddCheckConstraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'bodega_finca_vinculo_tipo_vinculo_check'
    ) THEN
        ALTER TABLE "bodega_finca_vinculo"
        ADD CONSTRAINT "bodega_finca_vinculo_tipo_vinculo_check"
        CHECK ("tipo_vinculo" IN ('propia', 'proveedor_tercero'));
    END IF;
END $$;

-- CreateTable (roles por finca puntual)
CREATE TABLE IF NOT EXISTS "user_finca_rol" (
    "user_id" UUID NOT NULL,
    "finca_id" UUID NOT NULL,
    "rol" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_finca_rol_pkey" PRIMARY KEY ("user_id","finca_id","rol")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_bodega_finca_vinculo_finca" ON "bodega_finca_vinculo"("finca_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_bodega_finca_vinculo_tipo" ON "bodega_finca_vinculo"("tipo_vinculo", "activo");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_user_finca_rol_finca_rol" ON "user_finca_rol"("finca_id", "rol");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_user_finca_rol_user" ON "user_finca_rol"("user_id");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bodega_finca_vinculo_bodega_id_fkey') THEN
        ALTER TABLE "bodega_finca_vinculo" ADD CONSTRAINT "bodega_finca_vinculo_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bodega_finca_vinculo_finca_id_fkey') THEN
        ALTER TABLE "bodega_finca_vinculo" ADD CONSTRAINT "bodega_finca_vinculo_finca_id_fkey" FOREIGN KEY ("finca_id") REFERENCES "finca"("finca_id") ON DELETE RESTRICT ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_finca_rol_user_id_fkey') THEN
        ALTER TABLE "user_finca_rol" ADD CONSTRAINT "user_finca_rol_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_finca_rol_finca_id_fkey') THEN
        ALTER TABLE "user_finca_rol" ADD CONSTRAINT "user_finca_rol_finca_id_fkey" FOREIGN KEY ("finca_id") REFERENCES "finca"("finca_id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
END $$;
