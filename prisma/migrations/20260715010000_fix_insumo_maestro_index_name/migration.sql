-- Alinea el nombre del índice único de insumo_maestro con el que espera el schema
-- (@@unique([ambito, categoria, nombre_comercial])). Era drift cosmético.
ALTER INDEX IF EXISTS "insumo_maestro_ambito_categoria_nombre_key"
  RENAME TO "insumo_maestro_ambito_categoria_nombre_comercial_key";
