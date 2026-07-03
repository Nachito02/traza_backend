-- Detalle de ejecución: cantidad de operarios (headcount) y fechas inicio/fin.
ALTER TABLE "tarea_ejecucion"
  ADD COLUMN "fecha_inicio" DATE,
  ADD COLUMN "fecha_fin" DATE,
  ADD COLUMN "cantidad_operarios" INTEGER;
