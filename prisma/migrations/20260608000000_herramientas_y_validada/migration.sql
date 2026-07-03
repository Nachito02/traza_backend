-- Equipos/herramientas manuales: clase "herramienta" + cantidad en la línea.
ALTER TYPE "ClaseMaquinaria" ADD VALUE IF NOT EXISTS 'herramienta';

ALTER TABLE "actividad_maquina"
  ADD COLUMN "cantidad" INTEGER;

-- Estado "Validada" para tareas validadas por un encargado.
ALTER TYPE "TareaEstado" ADD VALUE IF NOT EXISTS 'validada';
