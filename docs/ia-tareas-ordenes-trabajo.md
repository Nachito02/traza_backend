# IA + modulo de tareas: contrato de ordenes de trabajo

Este documento resume lo que el equipo de IA tiene que tener en cuenta despues de los cambios del modulo de tareas. El objetivo es mantener compatibilidad con lo ya construido, pero usando el nuevo flujo mental de la plataforma: una `tarea` de API representa una `orden de trabajo` operativa.

## Resumen del cambio

En frontend el flujo se movio hacia `/ordenes`, pero en backend se mantiene el recurso `/api/tareas` para no romper integraciones existentes.

Para IA/Bot esto significa:

- No cambiar el nombre tecnico de los endpoints todavia: siguen siendo `/api/ia/tareas...`, `/api/bot/tareas...` y `/api/tareas...`.
- En mensajes al usuario final conviene hablar de "orden de trabajo".
- En payloads, tablas y respuestas seguimos usando `tarea`, `tareaId` y `tareaAsignacionId`.

## Modelo operativo

Una orden de trabajo se compone de:

- `tarea`: cabecera de la orden. Define bodega, proceso de protocolo, destino operativo y estado global.
- `tarea_asignacion`: asignacion de esa orden a uno o varios usuarios/operarios.
- `tarea_entrada`: registros, notas, avances o datos capturados durante la ejecucion.

El identificador que usa IA para operar normalmente es `tareaAsignacionId`, no `tareaId`. Esto es importante porque el bot ayuda a una persona asignada, no solo a la cabecera de la orden.

## Creacion de ordenes desde IA/Bot

Endpoint recomendado:

```http
POST /api/ia/tareas/iniciar
```

Endpoint legacy equivalente:

```http
POST /api/bot/tareas/iniciar
```

Payload base:

```json
{
  "whatsapp": "+5491112345678",
  "bodegaId": "uuid",
  "procesoId": "uuid",
  "fincaId": "uuid",
  "cuartelId": "uuid",
  "descripcion": "Cosechar sector norte",
  "prioridad": "media",
  "fechaFin": "2026-04-30T14:00:00.000Z",
  "assigneeUserIds": ["uuid"]
}
```

Campos obligatorios generales:

- `whatsapp`: usuario en nombre del cual se inicia el flujo.
- `bodegaId`: bodega donde ocurre la orden.
- `procesoId`: proceso del protocolo. Define el titulo de la orden y el `evento_tipo`.

Campos condicionales:

- `fincaId` y `cuartelId` son obligatorios para ordenes de finca.
- Si se envia uno de los dos, se deben enviar ambos.
- `assigneeUserIds` debe contener usuarios que pertenezcan a la bodega.
- En `/api/ia/tareas/iniciar`, el usuario del `whatsapp` se agrega como asignado aunque no venga en `assigneeUserIds`.

## Ordenes de finca

El backend considera ordenes de finca a los procesos cuyo `evento_tipo` esta en esta lista:

```txt
riego
cosecha
fenologia
fertilizacion
labor_suelo
canopia
aplicacion_fitosanitaria
monitoreo_enfermedad
monitoreo_plaga
analisis_suelo
precipitacion
```

Para esos casos IA debe resolver primero el destino:

1. Obtener bodegas: `GET /api/ia/catalogos/bodegas`.
2. Obtener fincas por bodega: `GET /api/ia/catalogos/fincas?bodegaId=...`.
3. Obtener cuarteles por finca: `GET /api/ia/catalogos/cuarteles?fincaId=...`.
4. Crear la orden con `bodegaId`, `fincaId`, `cuartelId` y `procesoId`.

Si IA crea una orden de cosecha, riego o labor de finca sin finca/cuartel, el usuario no sabe donde ejecutar la orden y la trazabilidad queda incompleta.

## Cosecha y lote de cosecha

La cosecha tiene un comportamiento especial.

Cuando una asignacion de cosecha guarda una entrada con `draft` completo, el backend crea un registro en `evento_cosecha` y devuelve `loteCosechaId`.

Endpoint humano:

```http
POST /api/tareas/me/asignaciones/{tareaAsignacionId}/entradas
```

Payload esperado para generar lote:

```json
{
  "descripcion": "Cosecha registrada desde orden de trabajo",
  "draft": {
    "campaniaId": "uuid",
    "fecha_cosecha": "2026-04-30T10:30:00.000Z",
    "cantidad": 1200,
    "unidad": "kg",
    "destino": "Bodega Demo"
  }
}
```

Respuesta relevante:

```json
{
  "loteCosechaId": "uuid",
  "eventoCosecha": {
    "lote_cosecha_id": "uuid",
    "fecha_cosecha": "2026-04-30T10:30:00.000Z",
    "cantidad": 1200,
    "unidad": "kg",
    "destino": "Bodega Demo"
  }
}
```

Importante:

- El lote no se ingresa manualmente.
- El lote nace desde la orden de cosecha cuando el backend recibe los datos completos.
- La orden de cosecha debe tener `fincaId` y `cuartelId`, porque el lote hereda ese origen.
- `campaniaId` debe pertenecer a la misma bodega de la orden.

## Guardar progreso vs finalizar

Para IA existen dos conceptos distintos:

- Guardar progreso: `POST /api/ia/tareas/{tareaAsignacionId}/guardar-progreso`.
- Finalizar: `POST /api/ia/tareas/{tareaAsignacionId}/finalizar`.

Guardar progreso sirve para conversaciones paso a paso. Puede ejecutarse muchas veces y deja historial en `bot_action_log` y/o `tarea_entrada`.

Finalizar cambia el estado de la asignacion. Debe usarse cuando IA ya tiene datos suficientes y el usuario confirma el cierre.

Regla de producto:

- Si faltan datos, guardar progreso.
- Si los datos estan completos y confirmados, finalizar.
- No usar finalizar como reemplazo de una entrada operativa.

## Estados y permisos

Estados validos:

```txt
pendiente
en_progreso
completado
cancelado
```

Scopes relevantes:

```txt
tareas.crear
tareas.ver
tareas.contactar
tareas.cargar_datos
tareas.resolver
tareas.actualizar_estado
```

El flujo `/api/ia/tareas/iniciar` revisa delegacion. Si no hay delegacion con `tareas.crear`, devuelve `202` y una delegacion pendiente en vez de crear la orden.

## Compatibilidad con integraciones existentes

Para no romper integraciones previas:

- Mantener el consumo de `/api/ia/tareas/*` y `/api/bot/tareas/*`.
- No asumir que `tareaId` y `tareaAsignacionId` son equivalentes.
- No hardcodear nombres de procesos. Usar `procesoId` obtenido desde `GET /api/ia/catalogos/protocolos/{protocoloId}/procesos`.
- No inferir finca/cuartel desde texto libre si el proceso es de finca. Resolverlo con catalogos.
- No enviar `lote_cosecha_id` manualmente. Leerlo de la respuesta luego de registrar la cosecha.
- Mostrar `finca` y `cuartel` cuando el contexto de tarea los traiga.

## Checklist para el equipo de IA

- Al crear una orden, obtener primero el `evento_tipo` del proceso o consultar el contexto del proceso.
- Si `evento_tipo` es de finca, pedir o resolver `fincaId` y `cuartelId`.
- Si la orden es de cosecha, capturar `campaniaId`, `fecha_cosecha`, `cantidad`, `unidad` y `destino`.
- Despues de guardar la entrada de cosecha, persistir o mostrar el `loteCosechaId` devuelto por backend.
- Usar `guardar-progreso` para conversaciones incompletas.
- Usar `finalizar` solo despues de confirmar los datos.
- Seguir usando `tareaAsignacionId` para contactar, ayudar carga, guardar progreso y finalizar.

## Riesgo conocido a vigilar

El endpoint directo `/api/bot/tareas` existe por compatibilidad. Para nuevos desarrollos recomendamos usar `/api/ia/tareas/iniciar`, porque maneja mejor el flujo de delegacion y asignacion por WhatsApp.

Si una integracion legacy usa `/api/bot/tareas`, debe enviar los mismos campos de destino (`fincaId`, `cuartelId`) cuando el proceso sea de finca. En caso contrario puede crear ordenes incompletas desde el punto de vista operativo.
