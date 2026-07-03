-- Legajo de costos del personal por bodega (modalidad mensual / por hora,
-- interno/externo). El personal NO necesita ser usuario de la plataforma:
-- se carga por nombre, con vínculo opcional a un app_user.
CREATE TYPE "TipoPersonal" AS ENUM ('interno', 'externo');
CREATE TYPE "ModalidadPago" AS ENUM ('mensual', 'por_hora');

CREATE TABLE "personal_bodega" (
  "personal_bodega_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "bodega_id"          UUID NOT NULL,
  "nombre"             TEXT NOT NULL,
  "user_id"            UUID,
  "tipo"               "TipoPersonal" NOT NULL DEFAULT 'interno',
  "modalidad"          "ModalidadPago" NOT NULL DEFAULT 'por_hora',
  "rol"                "RolManoObra",
  "sueldo_mensual"     DECIMAL(14,2),
  "costo_hora"         DECIMAL(14,2),
  "dias_mes"           INTEGER NOT NULL DEFAULT 25,
  "activo"             BOOLEAN NOT NULL DEFAULT true,
  "created_at"         TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"         TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "personal_bodega_pkey" PRIMARY KEY ("personal_bodega_id")
);
CREATE INDEX "idx_personal_bodega_bodega" ON "personal_bodega"("bodega_id");

ALTER TABLE "personal_bodega"
  ADD CONSTRAINT "personal_bodega_bodega_id_fkey"
  FOREIGN KEY ("bodega_id") REFERENCES "bodega"("bodega_id")
  ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "personal_bodega"
  ADD CONSTRAINT "personal_bodega_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "app_user"("user_id")
  ON DELETE SET NULL ON UPDATE NO ACTION;
