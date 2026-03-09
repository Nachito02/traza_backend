-- Actualiza el check constraint de user_bodega_rol para incluir encargado_bodega
-- Ejecutar en Supabase SQL Editor

ALTER TABLE "user_bodega_rol"
DROP CONSTRAINT IF EXISTS "ck_user_bodega_rol_rol";

ALTER TABLE "user_bodega_rol"
ADD CONSTRAINT "ck_user_bodega_rol_rol"
CHECK ("rol" IN (
  'admin_bodega',
  'encargado_bodega',
  'productor',
  'responsable_calidad_inocuidad',
  'responsable_ssyo',
  'enologo',
  'encargado_finca',
  'operador_campo'
));
