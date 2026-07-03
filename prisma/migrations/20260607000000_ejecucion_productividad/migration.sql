-- Productividad: volumen físico ejecutado (plantas podadas, kg cosechados, etc.).
ALTER TABLE "tarea_ejecucion"
  ADD COLUMN "cantidad_ejecutada" DECIMAL(14,2),
  ADD COLUMN "unidad_ejecutada" TEXT;
