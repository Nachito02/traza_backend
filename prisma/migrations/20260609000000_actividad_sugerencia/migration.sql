-- Matriz de sugerencias por actividad (productividad + equipos/insumos sugeridos).
-- Configurable: la consumen la UI y el bot conversacional.
CREATE TABLE "actividad_sugerencia" (
  "actividad_sugerencia_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "clave"                   TEXT NOT NULL,
  "nombre"                  TEXT NOT NULL,
  "productividad_unidad"    TEXT,
  "productividad_label"     TEXT,
  "equipos_sugeridos"       JSONB NOT NULL DEFAULT '[]',
  "insumos_sugeridos"       JSONB NOT NULL DEFAULT '[]',
  "created_at"              TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "actividad_sugerencia_pkey" PRIMARY KEY ("actividad_sugerencia_id")
);
CREATE UNIQUE INDEX "actividad_sugerencia_clave_key" ON "actividad_sugerencia"("clave");
