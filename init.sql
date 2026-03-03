-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EvidenciaTipo" AS ENUM ('imagen', 'pdf', 'planilla', 'otro');

-- CreateEnum
CREATE TYPE "MilestoneEstado" AS ENUM ('pendiente', 'completado', 'validado', 'rechazado');

-- CreateEnum
CREATE TYPE "TrazabilidadEstado" AS ENUM ('draft', 'en_curso', 'finalizada', 'certificada');

-- CreateEnum
CREATE TYPE "ValidadoPorTipo" AS ENUM ('sistema', 'ia', 'tecnico');

-- CreateEnum
CREATE TYPE "SeveridadRegla" AS ENUM ('bloqueo', 'alerta', 'info');

-- CreateEnum
CREATE TYPE "EstadoHallazgo" AS ENUM ('abierto', 'en_proceso', 'resuelto', 'aceptado', 'anulado');

-- CreateEnum
CREATE TYPE "EncargoEstado" AS ENUM ('pendiente', 'en_progreso', 'completado', 'cancelado');

-- CreateEnum
CREATE TYPE "EncargoAsignacionEstado" AS ENUM ('pendiente', 'en_progreso', 'completado', 'cancelado');

-- CreateEnum
CREATE TYPE "TipoOperacionVasija" AS ENUM ('ingreso', 'fermentacion', 'trasiego', 'descube', 'correccion', 'corte_parcial');

-- CreateTable
CREATE TABLE "app_user" (
    "user_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" TEXT NOT NULL,
    "email" TEXT,
    "whatsapp_e164" TEXT,
    "whatsapp_verified_at" TIMESTAMPTZ(6),
    "whatsapp_opt_in_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "password_hash" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "app_user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "bodega" (
    "bodega_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "productor_id" UUID,
    "nombre" TEXT NOT NULL,
    "razon_social" TEXT,
    "cuit" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bodega_pkey" PRIMARY KEY ("bodega_id")
);

-- CreateTable
CREATE TABLE "campania" (
    "campania_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bodega_id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'abierta',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campania_pkey" PRIMARY KEY ("campania_id")
);

-- CreateTable
CREATE TABLE "capacitacion_asistente" (
    "evento_capacitacion_id" UUID NOT NULL,
    "persona_id" UUID NOT NULL,

    CONSTRAINT "capacitacion_asistente_pkey" PRIMARY KEY ("evento_capacitacion_id","persona_id")
);

-- CreateTable
CREATE TABLE "cuartel" (
    "cuartel_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "finca_id" UUID NOT NULL,
    "codigo_cuartel" TEXT NOT NULL,
    "superficie_ha" DECIMAL(10,2),
    "cultivo" TEXT,
    "variedad" TEXT,
    "sistema_productivo" TEXT,
    "sistema_conduccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cuartel_pkey" PRIMARY KEY ("cuartel_id")
);

-- CreateTable
CREATE TABLE "cuartel_campania" (
    "cuartel_id" UUID NOT NULL,
    "campania_id" UUID NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'habilitada',

    CONSTRAINT "cuartel_campania_pkey" PRIMARY KEY ("cuartel_id","campania_id")
);

-- CreateTable
CREATE TABLE "evento_accidente" (
    "evento_accidente_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fecha" DATE NOT NULL,
    "bodega_id" UUID,
    "persona_id" UUID NOT NULL,
    "accion_correctiva" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_accidente_pkey" PRIMARY KEY ("evento_accidente_id")
);

-- CreateTable
CREATE TABLE "evento_analisis_suelo" (
    "evento_analisis_suelo_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fecha" DATE NOT NULL,
    "unidad_muestreada" TEXT NOT NULL,
    "cuartel_id" UUID,
    "campania_id" UUID,
    "laboratorio" TEXT,
    "parametros" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_analisis_suelo_pkey" PRIMARY KEY ("evento_analisis_suelo_id")
);

-- CreateTable
CREATE TABLE "evento_aplicacion_fitosanitaria" (
    "evento_fito_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fecha" DATE NOT NULL,
    "cuartel_id" UUID NOT NULL,
    "campania_id" UUID NOT NULL,
    "insumo_lote_id" UUID,
    "dosis" DECIMAL(12,3) NOT NULL,
    "unidad" TEXT NOT NULL,
    "carencia_dias" INTEGER NOT NULL,
    "motivo" TEXT,
    "responsable_persona_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_aplicacion_fitosanitaria_pkey" PRIMARY KEY ("evento_fito_id")
);

-- CreateTable
CREATE TABLE "evento_canopia" (
    "evento_canopia_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fecha" DATE NOT NULL,
    "cuartel_id" UUID NOT NULL,
    "campania_id" UUID NOT NULL,
    "tipo_practica" TEXT NOT NULL,
    "intensidad" TEXT,
    "jornales" DECIMAL(10,2),
    "responsable_persona_id" UUID,
    "observaciones" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_canopia_pkey" PRIMARY KEY ("evento_canopia_id")
);

-- CreateTable
CREATE TABLE "evento_capacitacion" (
    "evento_capacitacion_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fecha" DATE NOT NULL,
    "bodega_id" UUID,
    "tema" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_capacitacion_pkey" PRIMARY KEY ("evento_capacitacion_id")
);

-- CreateTable
CREATE TABLE "evento_cosecha" (
    "lote_cosecha_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fecha_cosecha" DATE NOT NULL,
    "cuartel_id" UUID NOT NULL,
    "campania_id" UUID NOT NULL,
    "cantidad" DECIMAL(12,3) NOT NULL,
    "unidad" TEXT NOT NULL,
    "destino" TEXT,
    "responsable_persona_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_cosecha_pkey" PRIMARY KEY ("lote_cosecha_id")
);

-- CreateTable
CREATE TABLE "remito_uva" (
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
CREATE TABLE "recepcion_bodega" (
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
CREATE TABLE "analisis_recepcion" (
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
CREATE TABLE "ciu" (
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
CREATE TABLE "ciu_recepcion" (
    "ciu_id" UUID NOT NULL,
    "recepcion_bodega_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ciu_recepcion_pkey" PRIMARY KEY ("ciu_id","recepcion_bodega_id")
);

-- CreateTable
CREATE TABLE "qc_ingreso_uva" (
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
CREATE TABLE "vasija" (
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
CREATE TABLE "vasija_contenido" (
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
CREATE TABLE "existencia_vasija" (
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
CREATE TABLE "control_fermentacion" (
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
CREATE TABLE "orden_enologo" (
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
CREATE TABLE "operacion_vasija" (
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
CREATE TABLE "corte" (
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
CREATE TABLE "corte_componente" (
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
CREATE TABLE "producto" (
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
CREATE TABLE "lote_fraccionamiento" (
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
CREATE TABLE "codigo_envase" (
    "codigo_envase_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lote_fraccionamiento_id" UUID NOT NULL,
    "codigo_qr" TEXT NOT NULL,
    "codigo_lote_impreso" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codigo_envase_pkey" PRIMARY KEY ("codigo_envase_id")
);

-- CreateTable
CREATE TABLE "despacho" (
    "despacho_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lote_fraccionamiento_id" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "destino" TEXT,
    "cantidad" INTEGER,
    "documento" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "despacho_pkey" PRIMARY KEY ("despacho_id")
);

-- CreateTable
CREATE TABLE "evento_energia" (
    "evento_energia_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "periodo" TEXT NOT NULL,
    "cuartel_id" UUID,
    "campania_id" UUID,
    "tipo" TEXT NOT NULL,
    "consumo" DECIMAL(12,3) NOT NULL,
    "unidad" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_energia_pkey" PRIMARY KEY ("evento_energia_id")
);

-- CreateTable
CREATE TABLE "evento_entrega_epp" (
    "evento_entrega_epp_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fecha" DATE NOT NULL,
    "bodega_id" UUID,
    "persona_id" UUID NOT NULL,
    "epp" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_entrega_epp_pkey" PRIMARY KEY ("evento_entrega_epp_id")
);

-- CreateTable
CREATE TABLE "evento_fenologia" (
    "evento_fenologia_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fecha" DATE NOT NULL,
    "cuartel_id" UUID NOT NULL,
    "campania_id" UUID NOT NULL,
    "estado_fenologico" TEXT NOT NULL,
    "porcentaje_avance" DECIMAL(5,2),
    "responsable_persona_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_fenologia_pkey" PRIMARY KEY ("evento_fenologia_id")
);

-- CreateTable
CREATE TABLE "evento_fertilizacion" (
    "evento_fertilizacion_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fecha" DATE NOT NULL,
    "cuartel_id" UUID NOT NULL,
    "campania_id" UUID NOT NULL,
    "insumo_id" UUID,
    "dosis" DECIMAL(12,3) NOT NULL,
    "unidad" TEXT NOT NULL,
    "cantidad_total" DECIMAL(12,3),
    "responsable_persona_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_fertilizacion_pkey" PRIMARY KEY ("evento_fertilizacion_id")
);

-- CreateTable
CREATE TABLE "evento_labor_suelo" (
    "evento_labor_suelo_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fecha" DATE NOT NULL,
    "cuartel_id" UUID NOT NULL,
    "campania_id" UUID NOT NULL,
    "tipo_labor" TEXT NOT NULL,
    "horas" DECIMAL(10,2),
    "hs_por_ha" DECIMAL(10,2),
    "total_horas_cuartel" DECIMAL(10,2),
    "responsable_persona_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_labor_suelo_pkey" PRIMARY KEY ("evento_labor_suelo_id")
);

-- CreateTable
CREATE TABLE "evento_limpieza_cosecha" (
    "evento_limpieza_cosecha_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fecha" DATE NOT NULL,
    "bodega_id" UUID,
    "elemento" TEXT NOT NULL,
    "metodo" TEXT,
    "responsable_persona_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_limpieza_cosecha_pkey" PRIMARY KEY ("evento_limpieza_cosecha_id")
);

-- CreateTable
CREATE TABLE "evento_mantenimiento" (
    "evento_mantenimiento_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fecha" DATE NOT NULL,
    "bodega_id" UUID,
    "equipo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "responsable_persona_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_mantenimiento_pkey" PRIMARY KEY ("evento_mantenimiento_id")
);

-- CreateTable
CREATE TABLE "evento_monitoreo_enfermedad" (
    "evento_monitoreo_enfermedad_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fecha" DATE NOT NULL,
    "cuartel_id" UUID NOT NULL,
    "campania_id" UUID NOT NULL,
    "enfermedad" TEXT NOT NULL,
    "incidencia" TEXT,
    "responsable_persona_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_monitoreo_enfermedad_pkey" PRIMARY KEY ("evento_monitoreo_enfermedad_id")
);

-- CreateTable
CREATE TABLE "evento_monitoreo_plaga" (
    "evento_monitoreo_plaga_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fecha" DATE NOT NULL,
    "cuartel_id" UUID NOT NULL,
    "campania_id" UUID NOT NULL,
    "plaga" TEXT NOT NULL,
    "nivel" TEXT,
    "responsable_persona_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_monitoreo_plaga_pkey" PRIMARY KEY ("evento_monitoreo_plaga_id")
);

-- CreateTable
CREATE TABLE "evento_no_conforme" (
    "evento_no_conforme_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fecha" DATE NOT NULL,
    "bodega_id" UUID,
    "descripcion" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'abierta',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_no_conforme_pkey" PRIMARY KEY ("evento_no_conforme_id")
);

-- CreateTable
CREATE TABLE "evento_precipitacion" (
    "evento_precipitacion_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fecha" DATE NOT NULL,
    "finca_id" UUID NOT NULL,
    "campania_id" UUID,
    "milimetros" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_precipitacion_pkey" PRIMARY KEY ("evento_precipitacion_id")
);

-- CreateTable
CREATE TABLE "evento_reclamo" (
    "evento_reclamo_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fecha" DATE NOT NULL,
    "bodega_id" UUID,
    "origen" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'abierto',
    "descripcion" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_reclamo_pkey" PRIMARY KEY ("evento_reclamo_id")
);

-- CreateTable
CREATE TABLE "evento_residuo" (
    "evento_residuo_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fecha" DATE NOT NULL,
    "bodega_id" UUID,
    "tipo_residuo" TEXT NOT NULL,
    "cantidad" DECIMAL(12,3),
    "unidad" TEXT,
    "destino" TEXT NOT NULL,
    "responsable_persona_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_residuo_pkey" PRIMARY KEY ("evento_residuo_id")
);

-- CreateTable
CREATE TABLE "evento_riego" (
    "evento_riego_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fecha" DATE NOT NULL,
    "cuartel_id" UUID NOT NULL,
    "campania_id" UUID NOT NULL,
    "volumen" DECIMAL(12,3) NOT NULL,
    "unidad" TEXT NOT NULL,
    "sistema_riego" TEXT,
    "responsable_persona_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_riego_pkey" PRIMARY KEY ("evento_riego_id")
);

-- CreateTable
CREATE TABLE "evento_sanitizacion_banos" (
    "evento_sanitizacion_banos_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fecha" DATE NOT NULL,
    "bodega_id" UUID,
    "tipo_bano" TEXT NOT NULL,
    "checklist" JSONB NOT NULL DEFAULT '{}',
    "responsable_persona_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_sanitizacion_banos_pkey" PRIMARY KEY ("evento_sanitizacion_banos_id")
);

-- CreateTable
CREATE TABLE "evento_sobrante_lavado" (
    "evento_sobrante_lavado_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fecha" DATE NOT NULL,
    "bodega_id" UUID,
    "tipo" TEXT NOT NULL,
    "volumen" DECIMAL(12,3),
    "disposicion" TEXT,
    "responsable_persona_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_sobrante_lavado_pkey" PRIMARY KEY ("evento_sobrante_lavado_id")
);

-- CreateTable
CREATE TABLE "evidencia" (
    "evidencia_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "milestone_id" UUID NOT NULL,
    "tipo" "EvidenciaTipo" NOT NULL DEFAULT 'otro',
    "url" TEXT NOT NULL,
    "hash" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidencia_pkey" PRIMARY KEY ("evidencia_id")
);

-- CreateTable
CREATE TABLE "finca" (
    "finca_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bodega_id" UUID NOT NULL,
    "nombre_finca" TEXT NOT NULL,
    "rut" TEXT,
    "renspa" TEXT,
    "catastro" TEXT,
    "ubicacion_texto" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finca_pkey" PRIMARY KEY ("finca_id")
);

-- CreateTable
CREATE TABLE "insumo_catalogo" (
    "insumo_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tipo" TEXT NOT NULL,
    "nombre_comercial" TEXT NOT NULL,
    "principio_activo" TEXT,
    "unidad_base" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insumo_catalogo_pkey" PRIMARY KEY ("insumo_id")
);

-- CreateTable
CREATE TABLE "insumo_lote" (
    "insumo_lote_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "insumo_id" UUID NOT NULL,
    "nro_lote" TEXT NOT NULL,
    "fecha_vencimiento" DATE NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'habilitado',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insumo_lote_pkey" PRIMARY KEY ("insumo_lote_id")
);

-- CreateTable
CREATE TABLE "milestone" (
    "milestone_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trazabilidad_id" UUID NOT NULL,
    "proceso_id" UUID NOT NULL,
    "estado" "MilestoneEstado" NOT NULL DEFAULT 'pendiente',
    "event_date" DATE,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestone_pkey" PRIMARY KEY ("milestone_id")
);

-- CreateTable
CREATE TABLE "milestone_evento" (
    "milestone_evento_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "milestone_id" UUID NOT NULL,
    "evento_tabla" TEXT NOT NULL,
    "evento_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestone_evento_pkey" PRIMARY KEY ("milestone_evento_id")
);

-- CreateTable
CREATE TABLE "persona" (
    "persona_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bodega_id" UUID,
    "nombre_apellido" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'empleado',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "persona_pkey" PRIMARY KEY ("persona_id")
);

-- CreateTable
CREATE TABLE "productor" (
    "productor_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "razon_social" TEXT NOT NULL,
    "cuit" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "productor_pkey" PRIMARY KEY ("productor_id")
);

-- CreateTable
CREATE TABLE "protocolo" (
    "protocolo_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "protocolo_pkey" PRIMARY KEY ("protocolo_id")
);

-- CreateTable
CREATE TABLE "protocolo_etapa" (
    "etapa_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "protocolo_id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "protocolo_etapa_pkey" PRIMARY KEY ("etapa_id")
);

-- CreateTable
CREATE TABLE "protocolo_proceso" (
    "proceso_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "etapa_id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "evento_tipo" TEXT NOT NULL,
    "obligatorio" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "protocolo_proceso_pkey" PRIMARY KEY ("proceso_id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "token_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("token_id")
);

-- CreateTable
CREATE TABLE "rol" (
    "rol_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" TEXT NOT NULL,

    CONSTRAINT "rol_pkey" PRIMARY KEY ("rol_id")
);

-- CreateTable
CREATE TABLE "trazabilidad" (
    "trazabilidad_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "protocolo_id" UUID NOT NULL,
    "productor_id" UUID,
    "bodega_id" UUID NOT NULL,
    "finca_id" UUID,
    "cuartel_id" UUID,
    "campania_id" UUID NOT NULL,
    "estado" "TrazabilidadEstado" NOT NULL DEFAULT 'draft',
    "nombre_producto" TEXT,
    "imagen_producto" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trazabilidad_pkey" PRIMARY KEY ("trazabilidad_id")
);

-- CreateTable
CREATE TABLE "config_regla" (
    "config_regla_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "codigo" TEXT NOT NULL,
    "valor_json" JSONB NOT NULL DEFAULT '{}',
    "descripcion" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "config_regla_pkey" PRIMARY KEY ("config_regla_id")
);

-- CreateTable
CREATE TABLE "hallazgo_cumplimiento" (
    "hallazgo_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trazabilidad_id" UUID,
    "milestone_id" UUID,
    "regla_codigo" TEXT NOT NULL,
    "severidad" "SeveridadRegla" NOT NULL,
    "estado" "EstadoHallazgo" NOT NULL DEFAULT 'abierto',
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "detalle" JSONB NOT NULL DEFAULT '{}',
    "evento_tabla" TEXT,
    "evento_id" UUID,
    "justificacion_categoria" TEXT,
    "justificacion_texto" TEXT,
    "justificacion_responsable" UUID,
    "justificacion_fecha" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),

    CONSTRAINT "hallazgo_cumplimiento_pkey" PRIMARY KEY ("hallazgo_id")
);

-- CreateTable
CREATE TABLE "evento_fingerprint" (
    "evento_fingerprint_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tipo_evento" TEXT NOT NULL,
    "hash_contenido" TEXT NOT NULL,
    "evento_tabla" TEXT NOT NULL,
    "evento_id" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "cuartel_id" UUID,
    "finca_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_fingerprint_pkey" PRIMARY KEY ("evento_fingerprint_id")
);

-- CreateTable
CREATE TABLE "user_bodega" (
    "user_id" UUID NOT NULL,
    "bodega_id" UUID NOT NULL,

    CONSTRAINT "user_bodega_pkey" PRIMARY KEY ("user_id","bodega_id")
);

-- CreateTable
CREATE TABLE "user_bodega_rol" (
    "user_id" UUID NOT NULL,
    "bodega_id" UUID NOT NULL,
    "rol" TEXT NOT NULL,

    CONSTRAINT "user_bodega_rol_pkey" PRIMARY KEY ("user_id","bodega_id","rol")
);

-- CreateTable
CREATE TABLE "user_rol" (
    "user_id" UUID NOT NULL,
    "rol_id" UUID NOT NULL,

    CONSTRAINT "user_rol_pkey" PRIMARY KEY ("user_id","rol_id")
);

-- CreateTable
CREATE TABLE "encargo" (
    "encargo_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bodega_id" UUID NOT NULL,
    "finca_id" UUID,
    "cuartel_id" UUID,
    "milestone_id" UUID,
    "created_by" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha_objetivo" DATE,
    "prioridad" TEXT NOT NULL DEFAULT 'media',
    "estado" "EncargoEstado" NOT NULL DEFAULT 'pendiente',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "encargo_pkey" PRIMARY KEY ("encargo_id")
);

-- CreateTable
CREATE TABLE "encargo_asignacion" (
    "encargo_asignacion_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "encargo_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "estado" "EncargoAsignacionEstado" NOT NULL DEFAULT 'pendiente',
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "whatsapp_contactado_at" TIMESTAMPTZ(6),
    "ultima_interaccion_bot_at" TIMESTAMPTZ(6),
    "observaciones" TEXT,

    CONSTRAINT "encargo_asignacion_pkey" PRIMARY KEY ("encargo_asignacion_id")
);

-- CreateTable
CREATE TABLE "trazabilidad_origen" (
    "trazabilidad_id" UUID NOT NULL,
    "finca_id" UUID NOT NULL,
    "cuartel_id" UUID NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'habilitada',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trazabilidad_origen_pkey" PRIMARY KEY ("trazabilidad_id","finca_id","cuartel_id")
);

-- CreateTable
CREATE TABLE "milestone_asignacion" (
    "milestone_id" UUID NOT NULL,
    "finca_id" UUID NOT NULL,
    "cuartel_id" UUID NOT NULL,
    "operario_user_id" UUID NOT NULL,
    "asignado_por_user_id" UUID NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "encargo_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestone_asignacion_pkey" PRIMARY KEY ("milestone_id","operario_user_id")
);

-- CreateTable
CREATE TABLE "bot_delegation" (
    "bot_delegation_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "granted_by_user_id" UUID NOT NULL,
    "bot_user_id" UUID NOT NULL,
    "bodega_id" UUID,
    "scopes" TEXT[],
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bot_delegation_pkey" PRIMARY KEY ("bot_delegation_id")
);

-- CreateTable
CREATE TABLE "bot_action_log" (
    "bot_action_log_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bot_user_id" UUID NOT NULL,
    "on_behalf_user_id" UUID NOT NULL,
    "bot_delegation_id" UUID,
    "encargo_asignacion_id" UUID,
    "action" TEXT NOT NULL,
    "input_payload" JSONB NOT NULL DEFAULT '{}',
    "output_payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bot_action_log_pkey" PRIMARY KEY ("bot_action_log_id")
);

-- CreateTable
CREATE TABLE "validacion_milestone" (
    "validacion_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "milestone_id" UUID NOT NULL,
    "validado" BOOLEAN NOT NULL,
    "observacion" TEXT,
    "validado_por" "ValidadoPorTipo" NOT NULL DEFAULT 'sistema',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validacion_milestone_pkey" PRIMARY KEY ("validacion_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_user_email_key" ON "app_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "app_user_whatsapp_e164_key" ON "app_user"("whatsapp_e164");

-- CreateIndex
CREATE INDEX "idx_bodega_productor" ON "bodega"("productor_id");

-- CreateIndex
CREATE INDEX "idx_campania_bodega" ON "campania"("bodega_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_campania_bodega_nombre" ON "campania"("bodega_id", "nombre");

-- CreateIndex
CREATE INDEX "idx_cuartel_finca" ON "cuartel"("finca_id");

-- CreateIndex
CREATE UNIQUE INDEX "cuartel_finca_id_codigo_cuartel_key" ON "cuartel"("finca_id", "codigo_cuartel");

-- CreateIndex
CREATE INDEX "idx_analisis_suelo_fecha" ON "evento_analisis_suelo"("fecha");

-- CreateIndex
CREATE INDEX "idx_fito_cuartel_campania_fecha" ON "evento_aplicacion_fitosanitaria"("cuartel_id", "campania_id", "fecha");

-- CreateIndex
CREATE INDEX "idx_canopia_cuartel_campania_fecha" ON "evento_canopia"("cuartel_id", "campania_id", "fecha");

-- CreateIndex
CREATE INDEX "idx_cosecha_cuartel_campania_fecha" ON "evento_cosecha"("cuartel_id", "campania_id", "fecha_cosecha");

-- CreateIndex
CREATE INDEX "idx_remito_uva_bodega_fecha" ON "remito_uva"("bodega_id", "salida_finca");

-- CreateIndex
CREATE INDEX "idx_remito_uva_lote" ON "remito_uva"("lote_cosecha_id");

-- CreateIndex
CREATE INDEX "idx_recepcion_bodega_remito" ON "recepcion_bodega"("remito_uva_id");

-- CreateIndex
CREATE INDEX "idx_recepcion_bodega_fecha" ON "recepcion_bodega"("fecha_hora");

-- CreateIndex
CREATE INDEX "idx_analisis_recepcion_recepcion" ON "analisis_recepcion"("recepcion_bodega_id");

-- CreateIndex
CREATE INDEX "idx_ciu_bodega_emitido_at" ON "ciu"("bodega_id", "emitido_at");

-- CreateIndex
CREATE UNIQUE INDEX "ciu_codigo_ciu_key" ON "ciu"("codigo_ciu");

-- CreateIndex
CREATE INDEX "idx_ciu_recepcion_recepcion" ON "ciu_recepcion"("recepcion_bodega_id");

-- CreateIndex
CREATE INDEX "idx_qc_ingreso_uva_bodega_fecha" ON "qc_ingreso_uva"("bodega_id", "fecha_hora");

-- CreateIndex
CREATE INDEX "idx_qc_ingreso_uva_recepcion" ON "qc_ingreso_uva"("recepcion_bodega_id");

-- CreateIndex
CREATE INDEX "idx_vasija_bodega" ON "vasija"("bodega_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_vasija_bodega_codigo" ON "vasija"("bodega_id", "codigo");

-- CreateIndex
CREATE INDEX "idx_vasija_contenido_vasija_desde" ON "vasija_contenido"("vasija_id", "desde");

-- CreateIndex
CREATE INDEX "idx_vasija_contenido_lote" ON "vasija_contenido"("lote_cosecha_id");

-- CreateIndex
CREATE INDEX "idx_existencia_vasija_vasija_fecha" ON "existencia_vasija"("vasija_id", "fecha_hora");

-- CreateIndex
CREATE INDEX "idx_control_fermentacion_vasija_fecha" ON "control_fermentacion"("vasija_id", "fecha_hora");

-- CreateIndex
CREATE INDEX "idx_orden_enologo_bodega_fecha" ON "orden_enologo"("bodega_id", "fecha");

-- CreateIndex
CREATE INDEX "idx_orden_enologo_enologo" ON "orden_enologo"("enologo_user_id");

-- CreateIndex
CREATE INDEX "idx_operacion_vasija_bodega_fecha" ON "operacion_vasija"("bodega_id", "fecha_hora");

-- CreateIndex
CREATE INDEX "idx_operacion_vasija_origen" ON "operacion_vasija"("vasija_origen_id");

-- CreateIndex
CREATE INDEX "idx_operacion_vasija_destino" ON "operacion_vasija"("vasija_destino_id");

-- CreateIndex
CREATE INDEX "idx_operacion_vasija_orden" ON "operacion_vasija"("orden_enologo_id");

-- CreateIndex
CREATE INDEX "idx_corte_bodega_fecha" ON "corte"("bodega_id", "fecha");

-- CreateIndex
CREATE INDEX "idx_corte_campania" ON "corte"("campania_id");

-- CreateIndex
CREATE INDEX "idx_corte_responsable" ON "corte"("responsable_user_id");

-- CreateIndex
CREATE INDEX "idx_corte_componente_corte" ON "corte_componente"("corte_id");

-- CreateIndex
CREATE INDEX "idx_corte_componente_vasija" ON "corte_componente"("vasija_id");

-- CreateIndex
CREATE INDEX "idx_corte_componente_lote" ON "corte_componente"("lote_cosecha_id");

-- CreateIndex
CREATE INDEX "idx_producto_bodega" ON "producto"("bodega_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_producto_bodega_nombre" ON "producto"("bodega_id", "nombre_comercial");

-- CreateIndex
CREATE INDEX "idx_lote_fraccionamiento_corte" ON "lote_fraccionamiento"("corte_id");

-- CreateIndex
CREATE INDEX "idx_lote_fraccionamiento_producto" ON "lote_fraccionamiento"("producto_id");

-- CreateIndex
CREATE INDEX "idx_lote_fraccionamiento_fecha" ON "lote_fraccionamiento"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "codigo_envase_codigo_qr_key" ON "codigo_envase"("codigo_qr");

-- CreateIndex
CREATE INDEX "idx_codigo_envase_lote" ON "codigo_envase"("lote_fraccionamiento_id");

-- CreateIndex
CREATE INDEX "idx_despacho_lote" ON "despacho"("lote_fraccionamiento_id");

-- CreateIndex
CREATE INDEX "idx_despacho_fecha" ON "despacho"("fecha");

-- CreateIndex
CREATE INDEX "idx_energia_periodo_tipo" ON "evento_energia"("periodo", "tipo");

-- CreateIndex
CREATE INDEX "idx_fenologia_cuartel_campania_fecha" ON "evento_fenologia"("cuartel_id", "campania_id", "fecha");

-- CreateIndex
CREATE INDEX "idx_fertilizacion_cuartel_campania_fecha" ON "evento_fertilizacion"("cuartel_id", "campania_id", "fecha");

-- CreateIndex
CREATE INDEX "idx_labor_suelo_cuartel_campania_fecha" ON "evento_labor_suelo"("cuartel_id", "campania_id", "fecha");

-- CreateIndex
CREATE INDEX "idx_limpieza_cosecha_fecha" ON "evento_limpieza_cosecha"("fecha");

-- CreateIndex
CREATE INDEX "idx_mantenimiento_fecha" ON "evento_mantenimiento"("fecha");

-- CreateIndex
CREATE INDEX "idx_mon_enf_cuartel_campania_fecha" ON "evento_monitoreo_enfermedad"("cuartel_id", "campania_id", "fecha");

-- CreateIndex
CREATE INDEX "idx_mon_plaga_cuartel_campania_fecha" ON "evento_monitoreo_plaga"("cuartel_id", "campania_id", "fecha");

-- CreateIndex
CREATE INDEX "idx_precipitacion_finca_fecha" ON "evento_precipitacion"("finca_id", "fecha");

-- CreateIndex
CREATE INDEX "idx_riego_cuartel_campania_fecha" ON "evento_riego"("cuartel_id", "campania_id", "fecha");

-- CreateIndex
CREATE INDEX "idx_sanitizacion_banos_fecha" ON "evento_sanitizacion_banos"("fecha");

-- CreateIndex
CREATE INDEX "idx_sobrante_lavado_fecha" ON "evento_sobrante_lavado"("fecha");

-- CreateIndex
CREATE INDEX "idx_evidencia_milestone" ON "evidencia"("milestone_id");

-- CreateIndex
CREATE INDEX "idx_finca_bodega" ON "finca"("bodega_id");

-- CreateIndex
CREATE UNIQUE INDEX "insumo_catalogo_tipo_nombre_comercial_key" ON "insumo_catalogo"("tipo", "nombre_comercial");

-- CreateIndex
CREATE UNIQUE INDEX "insumo_lote_insumo_id_nro_lote_key" ON "insumo_lote"("insumo_id", "nro_lote");

-- CreateIndex
CREATE INDEX "idx_milestone_trazabilidad" ON "milestone"("trazabilidad_id");

-- CreateIndex
CREATE UNIQUE INDEX "milestone_trazabilidad_id_proceso_id_key" ON "milestone"("trazabilidad_id", "proceso_id");

-- CreateIndex
CREATE INDEX "idx_milestone_evento_milestone" ON "milestone_evento"("milestone_id");

-- CreateIndex
CREATE UNIQUE INDEX "milestone_evento_milestone_id_evento_tabla_evento_id_key" ON "milestone_evento"("milestone_id", "evento_tabla", "evento_id");

-- CreateIndex
CREATE INDEX "idx_persona_bodega" ON "persona"("bodega_id");

-- CreateIndex
CREATE UNIQUE INDEX "protocolo_nombre_version_key" ON "protocolo"("nombre", "version");

-- CreateIndex
CREATE INDEX "idx_etapa_protocolo" ON "protocolo_etapa"("protocolo_id");

-- CreateIndex
CREATE UNIQUE INDEX "protocolo_etapa_protocolo_id_nombre_key" ON "protocolo_etapa"("protocolo_id", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "protocolo_etapa_protocolo_id_orden_key" ON "protocolo_etapa"("protocolo_id", "orden");

-- CreateIndex
CREATE INDEX "idx_proceso_etapa" ON "protocolo_proceso"("etapa_id");

-- CreateIndex
CREATE UNIQUE INDEX "protocolo_proceso_etapa_id_nombre_key" ON "protocolo_proceso"("etapa_id", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "protocolo_proceso_etapa_id_orden_key" ON "protocolo_proceso"("etapa_id", "orden");

-- CreateIndex
CREATE INDEX "idx_refresh_user" ON "refresh_token"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "rol_nombre_key" ON "rol"("nombre");

-- CreateIndex
CREATE INDEX "idx_trazabilidad_origen" ON "trazabilidad"("bodega_id", "finca_id", "cuartel_id", "campania_id");

-- CreateIndex
CREATE INDEX "idx_trazabilidad_protocolo" ON "trazabilidad"("protocolo_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_trazabilidad_unica" ON "trazabilidad"("protocolo_id", "cuartel_id", "campania_id");

-- CreateIndex
CREATE UNIQUE INDEX "config_regla_codigo_key" ON "config_regla"("codigo");

-- CreateIndex
CREATE INDEX "idx_hallazgo_trazabilidad" ON "hallazgo_cumplimiento"("trazabilidad_id");

-- CreateIndex
CREATE INDEX "idx_hallazgo_milestone" ON "hallazgo_cumplimiento"("milestone_id");

-- CreateIndex
CREATE INDEX "idx_hallazgo_estado_severidad" ON "hallazgo_cumplimiento"("estado", "severidad");

-- CreateIndex
CREATE UNIQUE INDEX "evento_fingerprint_hash_contenido_key" ON "evento_fingerprint"("hash_contenido");

-- CreateIndex
CREATE INDEX "idx_evento_fp_tipo_fecha" ON "evento_fingerprint"("tipo_evento", "fecha");

-- CreateIndex
CREATE INDEX "idx_user_bodega_bodega" ON "user_bodega"("bodega_id");

-- CreateIndex
CREATE INDEX "idx_user_bodega_rol_bodega_rol" ON "user_bodega_rol"("bodega_id", "rol");

-- CreateIndex
CREATE INDEX "idx_encargo_bodega_estado" ON "encargo"("bodega_id", "estado");

-- CreateIndex
CREATE INDEX "idx_encargo_finca_estado" ON "encargo"("finca_id", "estado");

-- CreateIndex
CREATE INDEX "idx_encargo_milestone" ON "encargo"("milestone_id");

-- CreateIndex
CREATE INDEX "idx_encargo_created_by" ON "encargo"("created_by");

-- CreateIndex
CREATE INDEX "idx_encargo_asignacion_user_estado" ON "encargo_asignacion"("user_id", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "uq_encargo_asignacion_unica" ON "encargo_asignacion"("encargo_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_trazabilidad_origen_finca" ON "trazabilidad_origen"("finca_id");

-- CreateIndex
CREATE INDEX "idx_milestone_asignacion_finca_estado" ON "milestone_asignacion"("finca_id", "estado");

-- CreateIndex
CREATE INDEX "idx_milestone_asignacion_operario_estado" ON "milestone_asignacion"("operario_user_id", "estado");

-- CreateIndex
CREATE INDEX "idx_bot_delegation_grantor_activo" ON "bot_delegation"("granted_by_user_id", "activo");

-- CreateIndex
CREATE INDEX "idx_bot_delegation_bot_activo" ON "bot_delegation"("bot_user_id", "activo");

-- CreateIndex
CREATE INDEX "idx_bot_action_actor_date" ON "bot_action_log"("bot_user_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_bot_action_on_behalf_date" ON "bot_action_log"("on_behalf_user_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_bot_action_encargo_asignacion" ON "bot_action_log"("encargo_asignacion_id");

-- CreateIndex
CREATE INDEX "idx_validacion_milestone" ON "validacion_milestone"("milestone_id");

-- AddForeignKey
ALTER TABLE "bodega" ADD CONSTRAINT "bodega_productor_id_fkey" FOREIGN KEY ("productor_id") REFERENCES "productor"("productor_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "campania" ADD CONSTRAINT "campania_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "capacitacion_asistente" ADD CONSTRAINT "capacitacion_asistente_evento_capacitacion_id_fkey" FOREIGN KEY ("evento_capacitacion_id") REFERENCES "evento_capacitacion"("evento_capacitacion_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "capacitacion_asistente" ADD CONSTRAINT "capacitacion_asistente_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "persona"("persona_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cuartel" ADD CONSTRAINT "cuartel_finca_id_fkey" FOREIGN KEY ("finca_id") REFERENCES "finca"("finca_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cuartel_campania" ADD CONSTRAINT "cuartel_campania_campania_id_fkey" FOREIGN KEY ("campania_id") REFERENCES "campania"("campania_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cuartel_campania" ADD CONSTRAINT "cuartel_campania_cuartel_id_fkey" FOREIGN KEY ("cuartel_id") REFERENCES "cuartel"("cuartel_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_accidente" ADD CONSTRAINT "evento_accidente_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_accidente" ADD CONSTRAINT "evento_accidente_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "persona"("persona_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_analisis_suelo" ADD CONSTRAINT "evento_analisis_suelo_campania_id_fkey" FOREIGN KEY ("campania_id") REFERENCES "campania"("campania_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_analisis_suelo" ADD CONSTRAINT "evento_analisis_suelo_cuartel_id_fkey" FOREIGN KEY ("cuartel_id") REFERENCES "cuartel"("cuartel_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_aplicacion_fitosanitaria" ADD CONSTRAINT "evento_aplicacion_fitosanitaria_campania_id_fkey" FOREIGN KEY ("campania_id") REFERENCES "campania"("campania_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_aplicacion_fitosanitaria" ADD CONSTRAINT "evento_aplicacion_fitosanitaria_cuartel_id_fkey" FOREIGN KEY ("cuartel_id") REFERENCES "cuartel"("cuartel_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_aplicacion_fitosanitaria" ADD CONSTRAINT "evento_aplicacion_fitosanitaria_insumo_lote_id_fkey" FOREIGN KEY ("insumo_lote_id") REFERENCES "insumo_lote"("insumo_lote_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_aplicacion_fitosanitaria" ADD CONSTRAINT "evento_aplicacion_fitosanitaria_responsable_persona_id_fkey" FOREIGN KEY ("responsable_persona_id") REFERENCES "persona"("persona_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_canopia" ADD CONSTRAINT "evento_canopia_campania_id_fkey" FOREIGN KEY ("campania_id") REFERENCES "campania"("campania_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_canopia" ADD CONSTRAINT "evento_canopia_cuartel_id_fkey" FOREIGN KEY ("cuartel_id") REFERENCES "cuartel"("cuartel_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_canopia" ADD CONSTRAINT "evento_canopia_responsable_persona_id_fkey" FOREIGN KEY ("responsable_persona_id") REFERENCES "persona"("persona_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_capacitacion" ADD CONSTRAINT "evento_capacitacion_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_cosecha" ADD CONSTRAINT "evento_cosecha_campania_id_fkey" FOREIGN KEY ("campania_id") REFERENCES "campania"("campania_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_cosecha" ADD CONSTRAINT "evento_cosecha_cuartel_id_fkey" FOREIGN KEY ("cuartel_id") REFERENCES "cuartel"("cuartel_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_cosecha" ADD CONSTRAINT "evento_cosecha_responsable_persona_id_fkey" FOREIGN KEY ("responsable_persona_id") REFERENCES "persona"("persona_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "remito_uva" ADD CONSTRAINT "remito_uva_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "remito_uva" ADD CONSTRAINT "remito_uva_lote_cosecha_id_fkey" FOREIGN KEY ("lote_cosecha_id") REFERENCES "evento_cosecha"("lote_cosecha_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recepcion_bodega" ADD CONSTRAINT "recepcion_bodega_remito_uva_id_fkey" FOREIGN KEY ("remito_uva_id") REFERENCES "remito_uva"("remito_uva_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "analisis_recepcion" ADD CONSTRAINT "analisis_recepcion_recepcion_bodega_id_fkey" FOREIGN KEY ("recepcion_bodega_id") REFERENCES "recepcion_bodega"("recepcion_bodega_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ciu" ADD CONSTRAINT "ciu_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ciu_recepcion" ADD CONSTRAINT "ciu_recepcion_ciu_id_fkey" FOREIGN KEY ("ciu_id") REFERENCES "ciu"("ciu_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ciu_recepcion" ADD CONSTRAINT "ciu_recepcion_recepcion_bodega_id_fkey" FOREIGN KEY ("recepcion_bodega_id") REFERENCES "recepcion_bodega"("recepcion_bodega_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "qc_ingreso_uva" ADD CONSTRAINT "qc_ingreso_uva_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "qc_ingreso_uva" ADD CONSTRAINT "qc_ingreso_uva_recepcion_bodega_id_fkey" FOREIGN KEY ("recepcion_bodega_id") REFERENCES "recepcion_bodega"("recepcion_bodega_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vasija" ADD CONSTRAINT "vasija_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vasija_contenido" ADD CONSTRAINT "vasija_contenido_vasija_id_fkey" FOREIGN KEY ("vasija_id") REFERENCES "vasija"("vasija_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vasija_contenido" ADD CONSTRAINT "vasija_contenido_lote_cosecha_id_fkey" FOREIGN KEY ("lote_cosecha_id") REFERENCES "evento_cosecha"("lote_cosecha_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "existencia_vasija" ADD CONSTRAINT "existencia_vasija_vasija_id_fkey" FOREIGN KEY ("vasija_id") REFERENCES "vasija"("vasija_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "control_fermentacion" ADD CONSTRAINT "control_fermentacion_vasija_id_fkey" FOREIGN KEY ("vasija_id") REFERENCES "vasija"("vasija_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orden_enologo" ADD CONSTRAINT "orden_enologo_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orden_enologo" ADD CONSTRAINT "orden_enologo_enologo_user_id_fkey" FOREIGN KEY ("enologo_user_id") REFERENCES "app_user"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "operacion_vasija" ADD CONSTRAINT "operacion_vasija_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "operacion_vasija" ADD CONSTRAINT "operacion_vasija_vasija_origen_id_fkey" FOREIGN KEY ("vasija_origen_id") REFERENCES "vasija"("vasija_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "operacion_vasija" ADD CONSTRAINT "operacion_vasija_vasija_destino_id_fkey" FOREIGN KEY ("vasija_destino_id") REFERENCES "vasija"("vasija_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "operacion_vasija" ADD CONSTRAINT "operacion_vasija_orden_enologo_id_fkey" FOREIGN KEY ("orden_enologo_id") REFERENCES "orden_enologo"("orden_enologo_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "operacion_vasija" ADD CONSTRAINT "operacion_vasija_recepcion_bodega_id_fkey" FOREIGN KEY ("recepcion_bodega_id") REFERENCES "recepcion_bodega"("recepcion_bodega_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "operacion_vasija" ADD CONSTRAINT "operacion_vasija_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "corte" ADD CONSTRAINT "corte_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "corte" ADD CONSTRAINT "corte_campania_id_fkey" FOREIGN KEY ("campania_id") REFERENCES "campania"("campania_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "corte" ADD CONSTRAINT "corte_responsable_user_id_fkey" FOREIGN KEY ("responsable_user_id") REFERENCES "app_user"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "corte_componente" ADD CONSTRAINT "corte_componente_corte_id_fkey" FOREIGN KEY ("corte_id") REFERENCES "corte"("corte_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "corte_componente" ADD CONSTRAINT "corte_componente_vasija_id_fkey" FOREIGN KEY ("vasija_id") REFERENCES "vasija"("vasija_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "corte_componente" ADD CONSTRAINT "corte_componente_lote_cosecha_id_fkey" FOREIGN KEY ("lote_cosecha_id") REFERENCES "evento_cosecha"("lote_cosecha_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "producto" ADD CONSTRAINT "producto_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lote_fraccionamiento" ADD CONSTRAINT "lote_fraccionamiento_corte_id_fkey" FOREIGN KEY ("corte_id") REFERENCES "corte"("corte_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lote_fraccionamiento" ADD CONSTRAINT "lote_fraccionamiento_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "producto"("producto_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "codigo_envase" ADD CONSTRAINT "codigo_envase_lote_fraccionamiento_id_fkey" FOREIGN KEY ("lote_fraccionamiento_id") REFERENCES "lote_fraccionamiento"("lote_fraccionamiento_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "despacho" ADD CONSTRAINT "despacho_lote_fraccionamiento_id_fkey" FOREIGN KEY ("lote_fraccionamiento_id") REFERENCES "lote_fraccionamiento"("lote_fraccionamiento_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_energia" ADD CONSTRAINT "evento_energia_campania_id_fkey" FOREIGN KEY ("campania_id") REFERENCES "campania"("campania_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_energia" ADD CONSTRAINT "evento_energia_cuartel_id_fkey" FOREIGN KEY ("cuartel_id") REFERENCES "cuartel"("cuartel_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_entrega_epp" ADD CONSTRAINT "evento_entrega_epp_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_entrega_epp" ADD CONSTRAINT "evento_entrega_epp_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "persona"("persona_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_fenologia" ADD CONSTRAINT "evento_fenologia_campania_id_fkey" FOREIGN KEY ("campania_id") REFERENCES "campania"("campania_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_fenologia" ADD CONSTRAINT "evento_fenologia_cuartel_id_fkey" FOREIGN KEY ("cuartel_id") REFERENCES "cuartel"("cuartel_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_fenologia" ADD CONSTRAINT "evento_fenologia_responsable_persona_id_fkey" FOREIGN KEY ("responsable_persona_id") REFERENCES "persona"("persona_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_fertilizacion" ADD CONSTRAINT "evento_fertilizacion_campania_id_fkey" FOREIGN KEY ("campania_id") REFERENCES "campania"("campania_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_fertilizacion" ADD CONSTRAINT "evento_fertilizacion_cuartel_id_fkey" FOREIGN KEY ("cuartel_id") REFERENCES "cuartel"("cuartel_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_fertilizacion" ADD CONSTRAINT "evento_fertilizacion_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "insumo_catalogo"("insumo_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_fertilizacion" ADD CONSTRAINT "evento_fertilizacion_responsable_persona_id_fkey" FOREIGN KEY ("responsable_persona_id") REFERENCES "persona"("persona_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_labor_suelo" ADD CONSTRAINT "evento_labor_suelo_campania_id_fkey" FOREIGN KEY ("campania_id") REFERENCES "campania"("campania_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_labor_suelo" ADD CONSTRAINT "evento_labor_suelo_cuartel_id_fkey" FOREIGN KEY ("cuartel_id") REFERENCES "cuartel"("cuartel_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_labor_suelo" ADD CONSTRAINT "evento_labor_suelo_responsable_persona_id_fkey" FOREIGN KEY ("responsable_persona_id") REFERENCES "persona"("persona_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_limpieza_cosecha" ADD CONSTRAINT "evento_limpieza_cosecha_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_limpieza_cosecha" ADD CONSTRAINT "evento_limpieza_cosecha_responsable_persona_id_fkey" FOREIGN KEY ("responsable_persona_id") REFERENCES "persona"("persona_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_mantenimiento" ADD CONSTRAINT "evento_mantenimiento_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_mantenimiento" ADD CONSTRAINT "evento_mantenimiento_responsable_persona_id_fkey" FOREIGN KEY ("responsable_persona_id") REFERENCES "persona"("persona_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_monitoreo_enfermedad" ADD CONSTRAINT "evento_monitoreo_enfermedad_campania_id_fkey" FOREIGN KEY ("campania_id") REFERENCES "campania"("campania_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_monitoreo_enfermedad" ADD CONSTRAINT "evento_monitoreo_enfermedad_cuartel_id_fkey" FOREIGN KEY ("cuartel_id") REFERENCES "cuartel"("cuartel_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_monitoreo_enfermedad" ADD CONSTRAINT "evento_monitoreo_enfermedad_responsable_persona_id_fkey" FOREIGN KEY ("responsable_persona_id") REFERENCES "persona"("persona_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_monitoreo_plaga" ADD CONSTRAINT "evento_monitoreo_plaga_campania_id_fkey" FOREIGN KEY ("campania_id") REFERENCES "campania"("campania_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_monitoreo_plaga" ADD CONSTRAINT "evento_monitoreo_plaga_cuartel_id_fkey" FOREIGN KEY ("cuartel_id") REFERENCES "cuartel"("cuartel_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_monitoreo_plaga" ADD CONSTRAINT "evento_monitoreo_plaga_responsable_persona_id_fkey" FOREIGN KEY ("responsable_persona_id") REFERENCES "persona"("persona_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_no_conforme" ADD CONSTRAINT "evento_no_conforme_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_precipitacion" ADD CONSTRAINT "evento_precipitacion_campania_id_fkey" FOREIGN KEY ("campania_id") REFERENCES "campania"("campania_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_precipitacion" ADD CONSTRAINT "evento_precipitacion_finca_id_fkey" FOREIGN KEY ("finca_id") REFERENCES "finca"("finca_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_reclamo" ADD CONSTRAINT "evento_reclamo_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_residuo" ADD CONSTRAINT "evento_residuo_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_residuo" ADD CONSTRAINT "evento_residuo_responsable_persona_id_fkey" FOREIGN KEY ("responsable_persona_id") REFERENCES "persona"("persona_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_riego" ADD CONSTRAINT "evento_riego_campania_id_fkey" FOREIGN KEY ("campania_id") REFERENCES "campania"("campania_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_riego" ADD CONSTRAINT "evento_riego_cuartel_id_fkey" FOREIGN KEY ("cuartel_id") REFERENCES "cuartel"("cuartel_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_riego" ADD CONSTRAINT "evento_riego_responsable_persona_id_fkey" FOREIGN KEY ("responsable_persona_id") REFERENCES "persona"("persona_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_sanitizacion_banos" ADD CONSTRAINT "evento_sanitizacion_banos_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_sanitizacion_banos" ADD CONSTRAINT "evento_sanitizacion_banos_responsable_persona_id_fkey" FOREIGN KEY ("responsable_persona_id") REFERENCES "persona"("persona_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_sobrante_lavado" ADD CONSTRAINT "evento_sobrante_lavado_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento_sobrante_lavado" ADD CONSTRAINT "evento_sobrante_lavado_responsable_persona_id_fkey" FOREIGN KEY ("responsable_persona_id") REFERENCES "persona"("persona_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evidencia" ADD CONSTRAINT "evidencia_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestone"("milestone_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "finca" ADD CONSTRAINT "finca_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "insumo_lote" ADD CONSTRAINT "insumo_lote_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "insumo_catalogo"("insumo_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "milestone" ADD CONSTRAINT "milestone_proceso_id_fkey" FOREIGN KEY ("proceso_id") REFERENCES "protocolo_proceso"("proceso_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "milestone" ADD CONSTRAINT "milestone_trazabilidad_id_fkey" FOREIGN KEY ("trazabilidad_id") REFERENCES "trazabilidad"("trazabilidad_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "milestone_evento" ADD CONSTRAINT "milestone_evento_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestone"("milestone_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "persona" ADD CONSTRAINT "persona_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "protocolo_etapa" ADD CONSTRAINT "protocolo_etapa_protocolo_id_fkey" FOREIGN KEY ("protocolo_id") REFERENCES "protocolo"("protocolo_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "protocolo_proceso" ADD CONSTRAINT "protocolo_proceso_etapa_id_fkey" FOREIGN KEY ("etapa_id") REFERENCES "protocolo_etapa"("etapa_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trazabilidad" ADD CONSTRAINT "trazabilidad_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trazabilidad" ADD CONSTRAINT "trazabilidad_campania_id_fkey" FOREIGN KEY ("campania_id") REFERENCES "campania"("campania_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trazabilidad" ADD CONSTRAINT "trazabilidad_cuartel_id_fkey" FOREIGN KEY ("cuartel_id") REFERENCES "cuartel"("cuartel_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trazabilidad" ADD CONSTRAINT "trazabilidad_finca_id_fkey" FOREIGN KEY ("finca_id") REFERENCES "finca"("finca_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trazabilidad" ADD CONSTRAINT "trazabilidad_productor_id_fkey" FOREIGN KEY ("productor_id") REFERENCES "productor"("productor_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trazabilidad" ADD CONSTRAINT "trazabilidad_protocolo_id_fkey" FOREIGN KEY ("protocolo_id") REFERENCES "protocolo"("protocolo_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hallazgo_cumplimiento" ADD CONSTRAINT "hallazgo_cumplimiento_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestone"("milestone_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hallazgo_cumplimiento" ADD CONSTRAINT "hallazgo_cumplimiento_trazabilidad_id_fkey" FOREIGN KEY ("trazabilidad_id") REFERENCES "trazabilidad"("trazabilidad_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_bodega" ADD CONSTRAINT "user_bodega_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_bodega" ADD CONSTRAINT "user_bodega_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_bodega_rol" ADD CONSTRAINT "user_bodega_rol_user_id_bodega_id_fkey" FOREIGN KEY ("user_id", "bodega_id") REFERENCES "user_bodega"("user_id", "bodega_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_rol" ADD CONSTRAINT "user_rol_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "rol"("rol_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_rol" ADD CONSTRAINT "user_rol_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "encargo" ADD CONSTRAINT "encargo_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "encargo" ADD CONSTRAINT "encargo_finca_id_fkey" FOREIGN KEY ("finca_id") REFERENCES "finca"("finca_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "encargo" ADD CONSTRAINT "encargo_cuartel_id_fkey" FOREIGN KEY ("cuartel_id") REFERENCES "cuartel"("cuartel_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "encargo" ADD CONSTRAINT "encargo_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestone"("milestone_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "encargo" ADD CONSTRAINT "encargo_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app_user"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "encargo_asignacion" ADD CONSTRAINT "encargo_asignacion_encargo_id_fkey" FOREIGN KEY ("encargo_id") REFERENCES "encargo"("encargo_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "encargo_asignacion" ADD CONSTRAINT "encargo_asignacion_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trazabilidad_origen" ADD CONSTRAINT "trazabilidad_origen_trazabilidad_id_fkey" FOREIGN KEY ("trazabilidad_id") REFERENCES "trazabilidad"("trazabilidad_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trazabilidad_origen" ADD CONSTRAINT "trazabilidad_origen_finca_id_fkey" FOREIGN KEY ("finca_id") REFERENCES "finca"("finca_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trazabilidad_origen" ADD CONSTRAINT "trazabilidad_origen_cuartel_id_fkey" FOREIGN KEY ("cuartel_id") REFERENCES "cuartel"("cuartel_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "milestone_asignacion" ADD CONSTRAINT "milestone_asignacion_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestone"("milestone_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "milestone_asignacion" ADD CONSTRAINT "milestone_asignacion_finca_id_fkey" FOREIGN KEY ("finca_id") REFERENCES "finca"("finca_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "milestone_asignacion" ADD CONSTRAINT "milestone_asignacion_cuartel_id_fkey" FOREIGN KEY ("cuartel_id") REFERENCES "cuartel"("cuartel_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "milestone_asignacion" ADD CONSTRAINT "milestone_asignacion_operario_user_id_fkey" FOREIGN KEY ("operario_user_id") REFERENCES "app_user"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "milestone_asignacion" ADD CONSTRAINT "milestone_asignacion_asignado_por_user_id_fkey" FOREIGN KEY ("asignado_por_user_id") REFERENCES "app_user"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "milestone_asignacion" ADD CONSTRAINT "milestone_asignacion_encargo_id_fkey" FOREIGN KEY ("encargo_id") REFERENCES "encargo"("encargo_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bot_delegation" ADD CONSTRAINT "bot_delegation_granted_by_user_id_fkey" FOREIGN KEY ("granted_by_user_id") REFERENCES "app_user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bot_delegation" ADD CONSTRAINT "bot_delegation_bot_user_id_fkey" FOREIGN KEY ("bot_user_id") REFERENCES "app_user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bot_delegation" ADD CONSTRAINT "bot_delegation_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bot_action_log" ADD CONSTRAINT "bot_action_log_bot_user_id_fkey" FOREIGN KEY ("bot_user_id") REFERENCES "app_user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bot_action_log" ADD CONSTRAINT "bot_action_log_on_behalf_user_id_fkey" FOREIGN KEY ("on_behalf_user_id") REFERENCES "app_user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bot_action_log" ADD CONSTRAINT "bot_action_log_bot_delegation_id_fkey" FOREIGN KEY ("bot_delegation_id") REFERENCES "bot_delegation"("bot_delegation_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bot_action_log" ADD CONSTRAINT "bot_action_log_encargo_asignacion_id_fkey" FOREIGN KEY ("encargo_asignacion_id") REFERENCES "encargo_asignacion"("encargo_asignacion_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "validacion_milestone" ADD CONSTRAINT "validacion_milestone_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestone"("milestone_id") ON DELETE CASCADE ON UPDATE NO ACTION;

