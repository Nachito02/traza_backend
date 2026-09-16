-- La superficie intervenida deja de ser obligatoria: de los 27 procesos del catálogo, 13 no
-- tienen nada que ver con hectáreas (capacitaciones, accidentes, entrega de EPP, mantenimiento
-- de equipos...). Obligarla hacía que el operario inventara un número para poder guardar.
--
-- NULL significa "no aplica", y es distinto de 0 ("se intervinieron cero hectáreas"), que
-- sigue siendo un valor válido. Todas las filas existentes tienen superficie > 0 —la
-- validación estuvo vigente desde que se creó la tabla—, así que no hace falta backfill y el
-- histórico queda sin ambigüedad.
ALTER TABLE "tarea_ejecucion" ALTER COLUMN "superficie_intervenida" DROP NOT NULL;
