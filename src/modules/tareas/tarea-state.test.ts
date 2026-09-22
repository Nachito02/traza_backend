import assert from "node:assert/strict";
import { describe, it } from "vitest";
import {
  buildTareaApprovalUpdate,
  resolveTareaEstadoFromAssignments,
} from "./tarea-state.js";

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

  it("completa la tarea cuando las demás asignaciones están canceladas", () => {
    assert.equal(
      resolveTareaEstadoFromAssignments(["completado", "cancelado"]),
      "completado",
    );
  });

  it("cancela la tarea cuando todas sus asignaciones están canceladas", () => {
    assert.equal(
      resolveTareaEstadoFromAssignments(["cancelado", "cancelado"]),
      "cancelado",
    );
  });
});

describe("buildTareaApprovalUpdate", () => {
  it("registra estado, responsable y fecha al aprobar una tarea completada", () => {
    const approvedAt = new Date("2026-09-16T20:30:00.000Z");

    assert.deepEqual(
      buildTareaApprovalUpdate("completado", "user-123", approvedAt),
      {
        estado: "validada",
        validada_por: "user-123",
        validada_en: approvedAt,
        updated_at: approvedAt,
      },
    );
  });

  it("rechaza la aprobación de una tarea que todavía no está completada", () => {
    assert.throws(
      () => buildTareaApprovalUpdate("en_progreso", "user-123", new Date()),
      /Solo se puede aprobar una tarea completada/,
    );
  });
});
