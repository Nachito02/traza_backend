# Spec: eventos y consultas generados desde tareas IA

## Objetivo

Hacer visibles desde `GET /api/ia/eventos` y `POST /api/ia/consultas` los eventos completos cargados por el bot mediante `guardar-progreso`, manteniendo compatibilidad con los eventos ya materializados en tablas tipadas.

## Stack y comandos

- TypeScript, Express, Prisma y PostgreSQL.
- Test focalizado: `node --import tsx --test src/modules/ia/ia-events.test.ts src/modules/tareas/tarea-state.test.ts`
- Build: `npm run build`
- Lint: `npm run lint`

## Estructura

- `src/modules/ia/ia-events.ts`: normalización, filtrado y deduplicación pura.
- `src/modules/ia/ia.service.ts`: consultas Prisma y composición de respuestas.
- `src/modules/tareas/tarea-state.ts`: estado agregado de la orden.
- `scripts/sync-task-statuses.ts`: reparación explícita por IDs que reutiliza la regla central.

## Reglas funcionales

1. Las tablas tipadas siguen siendo la fuente primaria de eventos.
2. Un `tarea_entrada` con formato `traza.v1.progreso`, validación completa y una asignación completada es una fuente complementaria consultable.
3. Si existen varios progresos completos para la misma tarea y tipo, se devuelve el más reciente.
4. Los filtros `tipo`, `bodegaId`, `fincaId`, `cuartelId`, `campaniaId` y `limit` se aplican a ambas fuentes.
5. Al combinar fuentes, los eventos se ordenan por fecha descendente antes de aplicar `limit`.
6. `POST /consultas` infiere el tipo de evento y el contexto de finca o cuartel mencionado en la pregunta, y devuelve eventos bajo `resultados.eventos`.
7. Una orden queda `completado` cuando todas las asignaciones son terminales y al menos una fue completada.
8. Una orden queda `cancelado` cuando todas las asignaciones fueron canceladas.
9. Las asignaciones pendientes o en progreso mantienen la orden abierta.

## Testing

- Pruebas unitarias sin I/O para extracción, deduplicación, filtros, inferencia y estados agregados.
- Build TypeScript y lint como verificación integral disponible en este repositorio.

## Límites

- No modificar el esquema de base de datos.
- No ejecutar escrituras contra producción.
- No inventar los tres IDs históricos faltantes.
- La reparación histórica requiere una lista explícita de `tareaId` o `tareaAsignacionId`.

## Criterios de éxito

- El riego de una tarea IA completada aparece en `/eventos` con filtros de finca y cuartel.
- Una consulta como `qué riegos hubo en el C-03` devuelve el grupo de eventos correspondiente.
- Una orden con asignaciones `completado + cancelado` queda completada.
- Una orden con todas las asignaciones canceladas queda cancelada.
- Tests, build y lint finalizan correctamente.

## Preguntas abiertas

- Faltan tres IDs para reparar las cuatro órdenes mencionadas por el equipo.
