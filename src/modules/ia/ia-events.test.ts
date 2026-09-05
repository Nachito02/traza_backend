import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractCompletedProgressEvents,
  findMentionedOperationalContext,
  inferEventTypeFromQuestion,
  mergeEventsByDate,
} from "./ia-events.js";

const baseTask = {
  tareaId: "tarea-1",
  bodegaId: "bodega-1",
  fincaId: "finca-1",
  fincaNombre: "Finca La Esperanza",
  cuartelId: "cuartel-3",
  cuartelCodigo: "C-03",
  hasCompletedAssignment: true,
};

function progressEntry(input: {
  entradaId: string;
  fecha: string;
  volumen: number;
  missingRequired?: string[];
}) {
  return {
    entradaId: input.entradaId,
    fecha: new Date(input.fecha),
    tarea: baseTask,
    adjuntos: {
      formato: "traza.v1.progreso",
      eventoTipo: "riego",
      draft: {
        fecha: "2026-09-03",
        volumen: input.volumen,
        unidad: "mm",
        sistema_riego: "goteo",
        campaniaId: "campania-1",
      },
      validation: {
        missingRequired: input.missingRequired ?? [],
        invalidFields: [],
        requiredTotal: 4,
      },
    },
  };
}

describe("extractCompletedProgressEvents", () => {
  it("expone como evento el último progreso completo de una tarea cerrada", () => {
    const events = extractCompletedProgressEvents([
      progressEntry({ entradaId: "latest", fecha: "2026-09-03T18:07:00Z", volumen: 2.5 }),
      progressEntry({ entradaId: "older", fecha: "2026-09-03T17:00:00Z", volumen: 1 }),
    ]);

    assert.equal(events.length, 1);
    assert.equal(events[0]?.entrada_id, "latest");
    assert.equal(events[0]?.volumen, 2.5);
    assert.equal(events[0]?.cuartel_id, "cuartel-3");
    assert.equal(events[0]?.finca_id, "finca-1");
  });

  it("ignora progresos incompletos y tareas sin asignación completada", () => {
    const incomplete = progressEntry({
      entradaId: "incomplete",
      fecha: "2026-09-03T18:07:00Z",
      volumen: 2.5,
      missingRequired: ["responsable_user_id"],
    });
    const open = {
      ...progressEntry({ entradaId: "open", fecha: "2026-09-03T18:08:00Z", volumen: 3 }),
      tarea: { ...baseTask, tareaId: "tarea-2", hasCompletedAssignment: false },
    };

    assert.deepEqual(extractCompletedProgressEvents([incomplete, open]), []);
  });
});

describe("mergeEventsByDate", () => {
  it("mantiene el evento más reciente aunque provenga del progreso del bot", () => {
    const events = mergeEventsByDate(
      [{ evento_id: "typed", fecha: new Date("2026-09-02T12:00:00Z") }],
      [{ evento_id: "bot", fecha_registro: new Date("2026-09-03T18:07:00Z") }],
      1,
    );

    assert.equal(events[0]?.evento_id, "bot");
  });
});

describe("consultas operativas", () => {
  it("infiere el tipo de evento desde una pregunta natural", () => {
    assert.equal(inferEventTypeFromQuestion("¿Qué riegos hubo en el C-03?"), "riego");
    assert.equal(inferEventTypeFromQuestion("¿Cuándo se cosechó La Esperanza?"), "cosecha");
    assert.equal(inferEventTypeFromQuestion("¿Qué se aplicó este mes?"), "aplicacion_fitosanitaria");
  });

  it("resuelve finca y cuartel mencionados en la pregunta", () => {
    const context = findMentionedOperationalContext(
      "¿Qué riegos hubo en el C-03 de La Esperanza?",
      [{ id: "finca-1", nombre: "Finca La Esperanza" }],
      [{ id: "cuartel-3", codigo: "C-03", fincaId: "finca-1" }],
    );

    assert.deepEqual(context, { fincaId: "finca-1", cuartelId: "cuartel-3" });
  });
});
