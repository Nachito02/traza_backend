import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveTareaEstadoFromAssignments } from "./tarea-state.js";

describe("resolveTareaEstadoFromAssignments", () => {
  it("completa la tarea cuando todas sus asignaciones están completadas", () => {
    assert.equal(
      resolveTareaEstadoFromAssignments(["completado", "completado"]),
      "completado",
    );
  });

  it("mantiene la tarea en progreso cuando todavía quedan asignaciones activas", () => {
    assert.equal(
      resolveTareaEstadoFromAssignments(["completado", "en_progreso"]),
      "en_progreso",
    );
  });

  it("mantiene la tarea pendiente si ninguna asignación avanzó", () => {
    assert.equal(
      resolveTareaEstadoFromAssignments(["completado", "pendiente"]),
      "pendiente",
    );
  });

  it("mantiene pendiente una tarea sin asignaciones", () => {
    assert.equal(
      resolveTareaEstadoFromAssignments([]),
      "pendiente",
    );
  });
});
