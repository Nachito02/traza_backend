#!/usr/bin/env -S node --import tsx

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { resolveTareaEstadoFromAssignments } from "../src/modules/tareas/tarea-state.js";

const args = process.argv.slice(2);
const apply = args.includes("--apply");

function valuesFor(flag: string) {
  return args.flatMap((value, index) => value === flag && args[index + 1] ? [args[index + 1]!] : []);
}

const tareaIds = new Set(valuesFor("--tarea-id"));
const assignmentIds = valuesFor("--asignacion-id");

if (tareaIds.size === 0 && assignmentIds.length === 0) {
  console.error("Uso: node --import tsx scripts/sync-task-statuses.ts --tarea-id <uuid> [--asignacion-id <uuid>] [--apply]");
  process.exitCode = 1;
} else if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL no está configurada.");
  process.exitCode = 1;
} else {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    if (assignmentIds.length > 0) {
      const assignments = await prisma.tareaAsignacion.findMany({
        where: { tarea_asignacion_id: { in: assignmentIds } },
        select: { tarea_id: true },
      });
      for (const assignment of assignments) tareaIds.add(assignment.tarea_id);
    }

    const tasks = await prisma.tarea.findMany({
      where: { tarea_id: { in: [...tareaIds] } },
      select: {
        tarea_id: true,
        estado: true,
        tarea_asignacion: { select: { tarea_asignacion_id: true, estado: true } },
      },
    });

    for (const task of tasks) {
      const nextEstado = resolveTareaEstadoFromAssignments(
        task.tarea_asignacion.map((assignment) => assignment.estado),
      );
      console.log(JSON.stringify({
        tareaId: task.tarea_id,
        estadoActual: task.estado,
        estadoCalculado: nextEstado,
        asignaciones: task.tarea_asignacion,
        accion: apply && task.estado !== nextEstado ? "actualizar" : "sin_escritura",
      }));

      if (apply && task.estado !== nextEstado) {
        await prisma.tarea.update({
          where: { tarea_id: task.tarea_id },
          data: { estado: nextEstado, updated_at: new Date() },
        });
      }
    }

    const missing = [...tareaIds].filter((id) => !tasks.some((task) => task.tarea_id === id));
    if (missing.length > 0) {
      console.error(`No se encontraron tareas: ${missing.join(", ")}`);
      process.exitCode = 2;
    }
  } finally {
    await prisma.$disconnect();
  }
}
