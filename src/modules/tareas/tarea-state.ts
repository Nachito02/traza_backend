export type TareaAssignmentEstado =
  | "pendiente"
  | "en_progreso"
  | "completado"
  | "cancelado";

export type TareaEstado = TareaAssignmentEstado;

/**
 * Calcula el estado agregado de una tarea a partir de sus asignaciones.
 * Mantiene la misma regla utilizada por los flujos web y legacy del bot.
 */
export function resolveTareaEstadoFromAssignments(
  estados: readonly TareaAssignmentEstado[],
): TareaEstado {
  const allDone = estados.length > 0 && estados.every((estado) => estado === "completado");
  if (allDone) return "completado";

  const hasProgress = estados.some((estado) => estado === "en_progreso");
  return hasProgress ? "en_progreso" : "pendiente";
}
