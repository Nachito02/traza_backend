# Traza Backend

## Setup

1) Install deps:
```
npm install
```

2) Create `.env` with your Supabase pooler URL (IPv4-friendly):
```
DATABASE_URL="postgresql://<USER>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

## Initialize schema in Supabase (Free plan / IPv4)

Supabase direct connections require IPv6 (or paid IPv4). Prisma Migrate also conflicts with PgBouncer.
Use SQL-based initialization instead:

1) Generate SQL from the Prisma schema:
```
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > init.sql
```

2) Run `init.sql` in Supabase:
- Supabase dashboard -> SQL Editor -> New query -> paste `init.sql` -> Run

`init.sql` también incluye datos base idempotentes para `protocolo`, `protocolo_etapa` y `protocolo_proceso` (cadena vitivinícola v1.0.0).

## SQL workflow (init / update / seed)

- `init.sql`: crea toda la base desde cero y también puebla datos base.
- `update.sql`: aplica cambios incrementales sobre una base ya existente y vuelve a sincronizar datos base.
- `seed.sql`: solo puebla/sincroniza datos base (sin cambios de esquema).

Uso recomendado:
1) Ambiente nuevo: ejecutar `init.sql`.
2) Ambiente existente tras cambios: ejecutar `update.sql`.
3) Solo refrescar catálogos/datos iniciales: ejecutar `seed.sql`.

## Migrations (when direct connection is available)

If you have IPv6 or paid IPv4, use a direct DB URL just for migrations:
```
DATABASE_URL="postgresql://<USER>:<PASSWORD>@db.<project>.supabase.co:5432/postgres" \
npx prisma migrate dev --name init
```

## ERD diagram

Generate the Mermaid ERD:
```
npx prisma generate
```

Open `erDiagram.md` with a Mermaid preview extension in VSCode.

## API docs (Swagger UI)

Swagger UI is available at:
```
http://localhost:3000/docs
```

The spec lives in `src/config/openapi.ts`.

## Docker + Cloud Run

### Build and run locally

```bash
docker build -t traza-backend .
docker run --rm -p 8080:8080 \
  -e PORT=8080 \
  -e DATABASE_URL="postgresql://<USER>:<PASSWORD>@<HOST>:<PORT>/postgres?pgbouncer=true" \
  traza-backend
```

### Deploy to Cloud Run (una sola vez: setup)

```bash
export PROJECT_ID="proyecto-trazabilidad-488013"
export REGION="southamerica-east1"
export SERVICE="traza-backend"
export REPO="traza"
export IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/traza-backend:latest"

gcloud auth login
gcloud config set project "$PROJECT_ID"
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
gcloud auth configure-docker "$REGION-docker.pkg.dev"

gcloud artifacts repositories create "$REPO" \
  --repository-format=docker \
  --location="$REGION" || true
```

### Deploy en cada cambio de la API

```bash
export PROJECT_ID="proyecto-trazabilidad-488013"
export REGION="southamerica-east1"
export SERVICE="traza-backend"
export REPO="traza"
export IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/traza-backend:latest"

# Crear/usar builder para Cloud Run (linux/amd64)
docker buildx create --use --name cloudrun-builder 2>/dev/null || docker buildx use cloudrun-builder

# Build + push de imagen compatible con Cloud Run
docker buildx build \
  --platform linux/amd64 \
  -t "$IMAGE" \
  --push \
  .

gcloud run deploy "$SERVICE" \
  --image="$IMAGE" \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --set-env-vars="NODE_ENV=production,DATABASE_URL=postgresql://<USER>:<PASSWORD>@<HOST>:<PORT>/postgres?pgbouncer=true"
```

### Verificar deploy

```bash
gcloud run services describe "$SERVICE" --region="$REGION" --format='value(status.url)'
gcloud run services logs read "$SERVICE" --region="$REGION" --limit=100
```

## API Bot IA

La API IA (`/api/ia/*`) es la superficie de integración para bots y agentes externos. El bot opera **en nombre de usuarios humanos** que le otorgaron una delegación explícita con scopes acotados.

### Flujo completo

```
1. Admin sistema crea el bot
        POST /api/ia/auth/register  (con token de admin_sistema)

2. Bot hace login → obtiene access_token
        POST /api/ia/auth/login

3. Usuario humano otorga delegación al bot
        POST /api/bot/delegaciones  (con token del usuario humano)

4. Bot consume endpoints de /api/ia/*
        Authorization: Bearer <access_token>
```

> **Importante:** Sin delegaciones activas, todos los endpoints de catálogos y trabajos devuelven `[]`. El bot solo ve los datos de los usuarios que le delegaron.

---

## Autenticación del bot

### `POST /api/ia/auth/register`

Crea un usuario bot con rol `bot_agent`. **Solo puede llamarlo un `admin_sistema`.**

**Headers requeridos**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body**
```json
{
  "email": "bot@traza.com",
  "password": "contraseña_segura",
  "nombre": "Bot Traza"
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `email` | string | sí | Email único del bot |
| `password` | string | sí | Contraseña (mín. 8 caracteres) |
| `nombre` | string | sí | Nombre descriptivo |

**Respuesta `201`**
```json
{
  "id": "3f2a1b4c-...",
  "email": "bot@traza.com",
  "nombre": "Bot Traza"
}
```

**Errores**
| Código | Mensaje |
|---|---|
| `401` | unauthorized |
| `403` | Solo admin_sistema puede crear usuarios bot |
| `409` | El usuario ya existe |

**curl**
```bash
curl -X POST https://api.traza.com/api/ia/auth/register \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bot@traza.com",
    "password": "contraseña_segura",
    "nombre": "Bot Traza"
  }'
```

---

### `POST /api/ia/auth/login`

Login del bot. A diferencia del login humano, **devuelve los tokens en el body** (no en cookies) para uso programático.

**Body**
```json
{
  "email": "bot@traza.com",
  "password": "contraseña_segura"
}
```

**Respuesta `200`**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "user": {
    "id": "3f2a1b4c-...",
    "email": "bot@traza.com",
    "nombre": "Bot Traza"
  }
}
```

> El `access_token` expira en **15 minutos**. Usar `refresh_token` para renovarlo (via `/api/auth/refresh`).

**Errores**
| Código | Mensaje |
|---|---|
| `401` | Credenciales inválidas |

**curl**
```bash
curl -X POST https://api.traza.com/api/ia/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bot@traza.com",
    "password": "contraseña_segura"
  }'
```

---

## Delegaciones

> Estos endpoints los llama el **usuario humano** con su propio token de sesión, no el bot.

### Scopes disponibles

| Scope | Descripción |
|---|---|
| `encargos.ver` | Ver trabajos asignados al usuario |
| `encargos.contactar` | Registrar que se contactó al usuario vía WhatsApp |
| `encargos.cargar_datos` | Cargar datos en nombre del usuario |
| `encargos.resolver` | Enviar resultado final de un trabajo |

---

### `POST /api/bot/delegaciones`

Otorga al bot permiso para operar en nombre del usuario autenticado.

**Headers requeridos**
```
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Body**
```json
{
  "botUserId": "3f2a1b4c-...",
  "bodegaId": "a1b2c3d4-...",
  "scopes": ["encargos.ver", "encargos.contactar", "encargos.cargar_datos", "encargos.resolver"],
  "expiresAt": "2026-12-31T00:00:00Z"
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `botUserId` | string (uuid) | sí | ID del usuario bot |
| `bodegaId` | string (uuid) | no | Limita la delegación a una bodega. Si se omite, aplica a todas las bodegas del usuario |
| `scopes` | string[] | sí | Al menos un scope |
| `expiresAt` | string (ISO 8601) | no | Fecha de vencimiento. Si se omite, no vence |

**Respuesta `201`**
```json
{
  "bot_delegation_id": "d9e8f7a6-...",
  "granted_by_user_id": "b5c4d3e2-...",
  "bot_user_id": "3f2a1b4c-...",
  "bodega_id": "a1b2c3d4-...",
  "scopes": ["encargos.ver", "encargos.contactar", "encargos.cargar_datos", "encargos.resolver"],
  "activo": true,
  "revoked_at": null,
  "expires_at": "2026-12-31T00:00:00Z",
  "created_at": "2026-03-09T12:00:00Z"
}
```

**Errores**
| Código | Mensaje |
|---|---|
| `400` | Debe delegar al menos un scope |
| `400` | El usuario indicado no tiene rol bot_agent |
| `403` | No autorizado para delegar en esta bodega |
| `404` | Usuario bot no encontrado |

**curl**
```bash
curl -X POST https://api.traza.com/api/bot/delegaciones \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "botUserId": "3f2a1b4c-...",
    "scopes": ["encargos.ver", "encargos.contactar", "encargos.cargar_datos", "encargos.resolver"]
  }'
```

---

### `GET /api/bot/delegaciones/me`

Lista todas las delegaciones activas otorgadas por el usuario logueado.

**Headers requeridos**
```
Authorization: Bearer <user_token>
```

**Respuesta `200`**
```json
[
  {
    "bot_delegation_id": "d9e8f7a6-...",
    "granted_by_user_id": "b5c4d3e2-...",
    "bot_user_id": "3f2a1b4c-...",
    "bodega_id": "a1b2c3d4-...",
    "scopes": ["encargos.ver", "encargos.contactar"],
    "activo": true,
    "revoked_at": null,
    "expires_at": null,
    "created_at": "2026-03-09T12:00:00Z"
  }
]
```

**curl**
```bash
curl https://api.traza.com/api/bot/delegaciones/me \
  -H "Authorization: Bearer <user_token>"
```

---

### `DELETE /api/bot/delegaciones/:botDelegationId`

Revoca una delegación. Solo puede hacerlo quien la otorgó o un `admin_sistema`.

**Headers requeridos**
```
Authorization: Bearer <user_token>
```

**Respuesta `200`**
```json
{
  "bot_delegation_id": "d9e8f7a6-...",
  "activo": false,
  "revoked_at": "2026-03-09T15:30:00Z"
}
```

**Errores**
| Código | Mensaje |
|---|---|
| `403` | No autorizado para revocar esta delegación |
| `404` | Delegación no encontrada |

**curl**
```bash
curl -X DELETE https://api.traza.com/api/bot/delegaciones/d9e8f7a6-... \
  -H "Authorization: Bearer <user_token>"
```

---

## Endpoints del bot (`/api/ia/*`)

> Todos los endpoints de esta sección requieren `Authorization: Bearer <bot_token>` y rol `bot_agent`.

---

### `GET /api/ia/me`

Devuelve la identidad del bot y todas sus delegaciones activas.

**Respuesta `200`**
```json
{
  "user": {
    "id": "3f2a1b4c-...",
    "nombre": "Bot Traza",
    "email": "bot@traza.com"
  },
  "rolesGlobales": ["bot_agent"],
  "activeDelegations": [
    {
      "botDelegationId": "d9e8f7a6-...",
      "grantedBy": {
        "user_id": "b5c4d3e2-...",
        "nombre": "Pablo García",
        "email": "pablo@bodega.com"
      },
      "bodega": {
        "bodega_id": "a1b2c3d4-...",
        "nombre": "Bodega Norte"
      },
      "scopes": ["encargos.ver", "encargos.contactar", "encargos.cargar_datos"],
      "expiresAt": null,
      "createdAt": "2026-03-09T12:00:00Z"
    }
  ]
}
```

**curl**
```bash
curl https://api.traza.com/api/ia/me \
  -H "Authorization: Bearer <bot_token>"
```

---

## Catálogos

### `GET /api/ia/catalogos/bodegas`

Devuelve las bodegas visibles para el bot según sus delegaciones activas. Solo incluye bodegas con delegación directa (no las globales).

**Respuesta `200`**
```json
[
  { "bodega_id": "a1b2c3d4-...", "nombre": "Bodega Norte" },
  { "bodega_id": "e5f6a7b8-...", "nombre": "Bodega Sur" }
]
```

**curl**
```bash
curl https://api.traza.com/api/ia/catalogos/bodegas \
  -H "Authorization: Bearer <bot_token>"
```

---

### `GET /api/ia/catalogos/fincas`

Fincas visibles para el bot. Filtra automáticamente por las bodegas a las que tiene acceso.

**Query params**
| Param | Tipo | Descripción |
|---|---|---|
| `bodegaId` | uuid | Filtra por bodega específica |

**Respuesta `200`**
```json
[
  {
    "finca_id": "f1a2b3c4-...",
    "nombre_finca": "Finca La Consulta",
    "bodega_id": "a1b2c3d4-...",
    "rut": "20-12345678-9",
    "ubicacion_texto": "Luján de Cuyo, Mendoza"
  }
]
```

**curl**
```bash
curl "https://api.traza.com/api/ia/catalogos/fincas?bodegaId=a1b2c3d4-..." \
  -H "Authorization: Bearer <bot_token>"
```

---

### `GET /api/ia/catalogos/cuarteles`

Cuarteles visibles. Filtrable por finca o bodega.

**Query params**
| Param | Tipo | Descripción |
|---|---|---|
| `bodegaId` | uuid | Filtra por bodega |
| `fincaId` | uuid | Filtra por finca específica |

**Respuesta `200`**
```json
[
  {
    "cuartel_id": "c1d2e3f4-...",
    "codigo_cuartel": "A-01",
    "superficie_ha": 3.5,
    "cultivo": "Vid",
    "variedad": "Malbec",
    "sistema_productivo": "Trellis",
    "finca": {
      "finca_id": "f1a2b3c4-...",
      "nombre_finca": "Finca La Consulta",
      "bodega_id": "a1b2c3d4-..."
    }
  }
]
```

**curl**
```bash
curl "https://api.traza.com/api/ia/catalogos/cuarteles?fincaId=f1a2b3c4-..." \
  -H "Authorization: Bearer <bot_token>"
```

---

### `GET /api/ia/catalogos/campanias`

Campañas de las bodegas visibles, ordenadas por fecha de inicio descendente.

**Query params**
| Param | Tipo | Descripción |
|---|---|---|
| `bodegaId` | uuid | Filtra por bodega |

**Respuesta `200`**
```json
[
  {
    "campania_id": "ca1b2c3d-...",
    "nombre": "Vendimia 2026",
    "fecha_inicio": "2026-01-15T00:00:00Z",
    "fecha_fin": "2026-04-30T00:00:00Z",
    "estado": "en_curso",
    "bodega_id": "a1b2c3d4-..."
  }
]
```

**curl**
```bash
curl https://api.traza.com/api/ia/catalogos/campanias \
  -H "Authorization: Bearer <bot_token>"
```

---

### `GET /api/ia/catalogos/personas`

Personas (operarios, técnicos, etc.) de las bodegas visibles.

**Query params**
| Param | Tipo | Descripción |
|---|---|---|
| `bodegaId` | uuid | Filtra por bodega |

**Respuesta `200`**
```json
[
  {
    "persona_id": "p1a2b3c4-...",
    "nombre_apellido": "Juan Pérez",
    "tipo": "operario",
    "activo": true,
    "bodega_id": "a1b2c3d4-..."
  }
]
```

---

### `GET /api/ia/catalogos/protocolos`

Lista todos los protocolos activos del sistema.

**Respuesta `200`**
```json
[
  {
    "protocolo_id": "pr1a2b3c-...",
    "nombre": "Cadena Vitivinícola",
    "version": "1.0.0",
    "descripcion": "Protocolo estándar para trazabilidad vitivinícola",
    "activo": true
  }
]
```

**curl**
```bash
curl https://api.traza.com/api/ia/catalogos/protocolos \
  -H "Authorization: Bearer <bot_token>"
```

---

### `GET /api/ia/catalogos/protocolos/:protocoloId/procesos`

Procesos de un protocolo, organizados por etapa.

**Respuesta `200`**
```json
[
  {
    "proceso_id": "proc1-...",
    "nombre": "Aplicación fitosanitaria",
    "evento_tipo": "evento_aplicacion_fitosanitaria",
    "obligatorio": true,
    "orden": 1,
    "protocolo_etapa": {
      "etapa_id": "etapa1-...",
      "nombre": "Manejo del viñedo",
      "orden": 1
    }
  }
]
```

**curl**
```bash
curl https://api.traza.com/api/ia/catalogos/protocolos/pr1a2b3c-.../procesos \
  -H "Authorization: Bearer <bot_token>"
```

---

### `GET /api/ia/catalogos/insumos`

Catálogo de insumos (fitosanitarios, fertilizantes) con sus lotes habilitados.

**Respuesta `200`**
```json
[
  {
    "insumo_id": "ins1-...",
    "tipo": "fitosanitario",
    "nombre_comercial": "Fungicida X",
    "principio_activo": "Mancozeb",
    "unidad_base": "kg",
    "insumo_lote": [
      {
        "insumo_lote_id": "lote1-...",
        "nro_lote": "L-2025-001",
        "fecha_vencimiento": "2027-01-01T00:00:00Z",
        "estado": "habilitado"
      }
    ]
  }
]
```

---

## Trabajos

### `GET /api/ia/trabajos`

Lista los trabajos (encargos asignados) de todos los usuarios que delegaron al bot. El bot solo ve trabajos de usuarios con delegación activa que incluya `encargos.ver`.

**Query params**
| Param | Tipo | Descripción |
|---|---|---|
| `estado` | string | Filtra por estado: `pendiente`, `en_progreso`, `completado`, `cancelado` |
| `bodegaId` | uuid | Filtra por bodega |

**Respuesta `200`** — array de objetos con estructura:
```json
[
  {
    "encargoAsignacionId": "ea1b2c3d-...",
    "estado": "pendiente",
    "assignee": {
      "user_id": "b5c4d3e2-...",
      "nombre": "Pablo García",
      "email": "pablo@bodega.com",
      "whatsapp_e164": "+5491112345678"
    },
    "encargo": {
      "encargoId": "enc1-...",
      "titulo": "Riego cuartel A-01",
      "descripcion": "Registrar riego programado",
      "bodega": { "bodega_id": "a1b2c3d4-...", "nombre": "Bodega Norte" },
      "finca": { "finca_id": "f1a2b3c4-...", "nombre_finca": "La Consulta" },
      "cuartel": { "cuartel_id": "c1d2e3f4-...", "codigo_cuartel": "A-01" }
    },
    "delegation": {
      "botDelegationId": "d9e8f7a6-...",
      "scopes": ["encargos.ver", "encargos.contactar", "encargos.cargar_datos"]
    }
  }
]
```

**curl**
```bash
curl "https://api.traza.com/api/ia/trabajos?estado=pendiente&bodegaId=a1b2c3d4-..." \
  -H "Authorization: Bearer <bot_token>"
```

---

### `GET /api/ia/trabajos/:encargoAsignacionId`

Detalle completo de un trabajo específico, incluyendo milestone y trazabilidad asociada.

**curl**
```bash
curl https://api.traza.com/api/ia/trabajos/ea1b2c3d-... \
  -H "Authorization: Bearer <bot_token>"
```

---

### `GET /api/ia/trabajos/:encargoAsignacionId/contexto`

Contexto completo del trabajo: milestone con sus evidencias, validaciones, eventos registrados y hallazgos de cumplimiento abiertos.

**curl**
```bash
curl https://api.traza.com/api/ia/trabajos/ea1b2c3d-.../contexto \
  -H "Authorization: Bearer <bot_token>"
```

---

### `POST /api/ia/trabajos/:encargoAsignacionId/contactar`

Registra que el bot contactó al usuario asignado (por ejemplo, vía WhatsApp). Actualiza `whatsapp_contactado_at` y `ultima_interaccion_bot_at` en la asignación.

**Requiere scope:** `encargos.contactar`

**Body**
```json
{
  "message": "Hola Pablo, te recordamos que tenés pendiente registrar el riego del cuartel A-01."
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `message` | string | no | Mensaje enviado al usuario (se registra en el log) |

**Respuesta `200`**
```json
{
  "bot_action_log_id": "log1-...",
  "bot_user_id": "3f2a1b4c-...",
  "on_behalf_user_id": "b5c4d3e2-...",
  "encargo_asignacion_id": "ea1b2c3d-...",
  "action": "encargos.contactar",
  "input_payload": { "message": "Hola Pablo..." },
  "output_payload": { "status": "contactado" },
  "created_at": "2026-03-09T14:00:00Z"
}
```

**Errores**
| Código | Mensaje |
|---|---|
| `403` | No hay delegación activa para esta acción |
| `404` | Asignación no encontrada |

**curl**
```bash
curl -X POST https://api.traza.com/api/ia/trabajos/ea1b2c3d-.../contactar \
  -H "Authorization: Bearer <bot_token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola Pablo, te recordamos que tenés pendiente registrar el riego."}'
```

---

### `POST /api/ia/trabajos/:encargoAsignacionId/save-progress`

El bot carga datos en nombre del usuario. Actualiza el estado de la asignación a `en_progreso`.

**Requiere scope:** `encargos.cargar_datos`

**Body** — payload libre con los datos cargados (depende del tipo de evento):
```json
{
  "tipo_evento": "evento_riego",
  "fecha": "2026-03-09",
  "volumen": 150.5,
  "unidad": "m3",
  "sistema_riego": "goteo"
}
```

**Respuesta `200`** — log de la acción del bot.

**curl**
```bash
curl -X POST https://api.traza.com/api/ia/trabajos/ea1b2c3d-.../save-progress \
  -H "Authorization: Bearer <bot_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo_evento": "evento_riego",
    "fecha": "2026-03-09",
    "volumen": 150.5,
    "unidad": "m3"
  }'
```

---

### `POST /api/ia/trabajos/:encargoAsignacionId/resultado`

Envía el resultado final de un trabajo. Actualiza el estado de la asignación.

**Requiere scope:** `encargos.resolver`

**Body**
```json
{
  "estado": "completado",
  "observaciones": "Riego registrado correctamente. Volumen: 150m³.",
  "outputPayload": {
    "evento_riego_id": "er1-...",
    "resumen": "OK"
  }
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `estado` | string | sí | `pendiente` \| `en_progreso` \| `completado` \| `cancelado` |
| `observaciones` | string | no | Notas del resultado |
| `outputPayload` | object | no | Datos adicionales del resultado |

**Respuesta `200`**
```json
{
  "assignment": {
    "encargoAsignacionId": "ea1b2c3d-...",
    "estado": "completado",
    "observaciones": "Riego registrado correctamente.",
    "updatedAt": "2026-03-09T15:00:00Z",
    "completedAt": "2026-03-09T15:00:00Z"
  },
  "botActionLogId": "log2-..."
}
```

**curl**
```bash
curl -X POST https://api.traza.com/api/ia/trabajos/ea1b2c3d-.../resultado \
  -H "Authorization: Bearer <bot_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "estado": "completado",
    "observaciones": "Riego registrado correctamente."
  }'
```

---

## Flujo de conversación del bot

Secuencia completa desde que el bot detecta una tarea hasta que la cierra.

### Paso 1 — Ver tareas pendientes

```
GET /api/ia/trabajos?estado=pendiente
```

La respuesta incluye `operario.whatsapp_e164` — no hace falta endpoint separado para obtener el WhatsApp.

```json
[{
  "encargoAsignacionId": "a555c7f5-...",
  "estado": "pendiente",
  "operario": {
    "nombre": "Juan",
    "email": "juan@bodega.com",
    "whatsapp_e164": "+5491112345678"
  },
  "encargo": {
    "titulo": "Registrar cosecha Malbec",
    "descripcion": "Completar datos del lote 3"
  }
}]
```

---

### Paso 2 — Leer el contexto completo antes de contactar

```
GET /api/ia/trabajos/:encargoAsignacionId/contexto
```

Devuelve el milestone, protocolo, trazabilidad, hallazgos abiertos e historial de acciones previas del bot. Usarlo para preparar el mensaje inicial.

---

### Paso 3 — Registrar el primer contacto con el operario

```
POST /api/ia/trabajos/:encargoAsignacionId/contactar
```

**Body**
```json
{
  "message": "Hola Juan, necesito que registres los datos de cosecha del lote 3"
}
```

Guarda el log y marca `whatsapp_contactado_at` en el trabajo.

**Scope requerido:** `encargos.contactar`

---

### Paso 4 — Guardar datos a medida que el usuario responde (repetible)

```
POST /api/ia/trabajos/:encargoAsignacionId/save-progress
```

Llamar una vez por turno de conversación. Cada llamada crea un `botActionLog` independiente. Marca el trabajo como `en_progreso`.

**Body** (libre, guardar lo relevante de cada turno)
```json
{
  "turno": 1,
  "respuesta_usuario": "La cosecha fue de 500kg",
  "datos_extraidos": {
    "peso_kg": 500,
    "variedad": "Malbec"
  }
}
```

**Scope requerido:** `encargos.cargar_datos`

---

### Paso 5 — Cerrar el trabajo

```
POST /api/ia/trabajos/:encargoAsignacionId/resultado
```

**Body**
```json
{
  "estado": "completado",
  "observaciones": "Datos confirmados por el operario",
  "outputPayload": {
    "peso_kg": 500,
    "variedad": "Malbec",
    "confirmado_por": "Juan"
  }
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `estado` | string | `completado` o `cancelado` |
| `observaciones` | string | Opcional. Nota libre del bot |
| `outputPayload` | object | Opcional. Resultado estructurado final |

**Scope requerido:** `encargos.resolver`

---

### Resumen de endpoints por paso

| Paso | Método | Endpoint | Scope |
|---|---|---|---|
| Ver tareas | GET | `/api/ia/trabajos` | `encargos.ver` |
| Ver contexto | GET | `/api/ia/trabajos/:id/contexto` | `encargos.ver` |
| Contactar | POST | `/api/ia/trabajos/:id/contactar` | `encargos.contactar` |
| Guardar parcial | POST | `/api/ia/trabajos/:id/save-progress` | `encargos.cargar_datos` |
| Cerrar | POST | `/api/ia/trabajos/:id/resultado` | `encargos.resolver` |

> Para que el bot pueda hacer el flujo completo, la delegación debe incluir los 4 scopes: `encargos.ver`, `encargos.contactar`, `encargos.cargar_datos`, `encargos.resolver`.

---

## Trazabilidades

### `GET /api/ia/trazabilidades`

Lista trazabilidades visibles para el bot.

**Query params**
| Param | Tipo | Descripción |
|---|---|---|
| `bodegaId` | uuid | Filtra por bodega |
| `campaniaId` | uuid | Filtra por campaña |
| `fincaId` | uuid | Filtra por finca |
| `cuartelId` | uuid | Filtra por cuartel |
| `estado` | string | `draft` \| `en_curso` \| `finalizada` \| `certificada` |

**Respuesta `200`**
```json
[
  {
    "trazabilidad_id": "tr1-...",
    "estado": "en_curso",
    "nombre_producto": "Malbec Reserva 2026",
    "bodega": { "bodega_id": "a1b2c3d4-...", "nombre": "Bodega Norte" },
    "finca": { "finca_id": "f1a2b3c4-...", "nombre_finca": "La Consulta" },
    "cuartel": { "cuartel_id": "c1d2e3f4-...", "codigo_cuartel": "A-01" },
    "campania": { "campania_id": "ca1-...", "nombre": "Vendimia 2026", "estado": "en_curso" },
    "protocolo": { "protocolo_id": "pr1-...", "nombre": "Cadena Vitivinícola", "version": "1.0.0" }
  }
]
```

**curl**
```bash
curl "https://api.traza.com/api/ia/trazabilidades?estado=en_curso&bodegaId=a1b2c3d4-..." \
  -H "Authorization: Bearer <bot_token>"
```

---

### `GET /api/ia/trazabilidades/:trazabilidadId`

Detalle completo de una trazabilidad.

**curl**
```bash
curl https://api.traza.com/api/ia/trazabilidades/tr1-... \
  -H "Authorization: Bearer <bot_token>"
```

---

### `GET /api/ia/trazabilidades/:trazabilidadId/contexto`

Contexto completo de la trazabilidad: todos los milestones con sus eventos, evidencias, validaciones y hallazgos de cumplimiento abiertos.

**curl**
```bash
curl https://api.traza.com/api/ia/trazabilidades/tr1-.../contexto \
  -H "Authorization: Bearer <bot_token>"
```

---

## Hallazgos

### `GET /api/ia/hallazgos`

Hallazgos de cumplimiento visibles para el bot.

**Query params**
| Param | Tipo | Descripción |
|---|---|---|
| `trazabilidadId` | uuid | Filtra por trazabilidad |
| `estado` | string | `abierto` \| `en_proceso` \| `resuelto` \| `aceptado` \| `anulado` |
| `severidad` | string | `bloqueo` \| `alerta` \| `info` |

**Respuesta `200`**
```json
[
  {
    "hallazgo_id": "h1-...",
    "regla_codigo": "CARENCIA_FITOSANITARIA",
    "severidad": "bloqueo",
    "estado": "abierto",
    "titulo": "Período de carencia no cumplido",
    "mensaje": "El cuartel A-01 tiene una aplicación con carencia activa hasta el 2026-03-15.",
    "detalle": { "producto": "Fungicida X", "carencia_hasta": "2026-03-15" },
    "trazabilidad": {
      "trazabilidad_id": "tr1-...",
      "bodega_id": "a1b2c3d4-..."
    },
    "created_at": "2026-03-09T10:00:00Z"
  }
]
```

**curl**
```bash
curl "https://api.traza.com/api/ia/hallazgos?severidad=bloqueo&estado=abierto" \
  -H "Authorization: Bearer <bot_token>"
```

---

### `GET /api/ia/hallazgos/:hallazgoId`

Detalle de un hallazgo específico.

**curl**
```bash
curl https://api.traza.com/api/ia/hallazgos/h1-... \
  -H "Authorization: Bearer <bot_token>"
```

---

## Eventos

### `GET /api/ia/eventos`

Eventos agropecuarios agrupados por tipo. Filtra automáticamente por bodegas visibles.

**Query params**
| Param | Tipo | Descripción |
|---|---|---|
| `tipo` | string | Tipo específico (ver tabla abajo). Si se omite, devuelve todos |
| `trazabilidadId` | uuid | Contexto de trazabilidad (aplica bodega/finca/cuartel/campaña automáticamente) |
| `bodegaId` | uuid | Filtra por bodega |
| `campaniaId` | uuid | Filtra por campaña |
| `fincaId` | uuid | Filtra por finca |
| `cuartelId` | uuid | Filtra por cuartel |
| `limit` | number | Máximo de eventos por tipo (default: 50, max: 200) |

**Tipos de evento disponibles**

| Tipo | Descripción |
|---|---|
| `riego` | Eventos de riego |
| `fertilizacion` | Aplicaciones de fertilizantes |
| `fitosanitario` | Aplicaciones fitosanitarias |
| `fenologia` | Estados fenológicos |
| `cosecha` | Eventos de cosecha |
| `canopia` | Manejo de canopia |
| `labor_suelo` | Labores de suelo |
| `monitoreo_plaga` | Monitoreo de plagas |
| `monitoreo_enfermedad` | Monitoreo de enfermedades |
| `precipitacion` | Registro de precipitaciones |
| `analisis_suelo` | Análisis de suelo |

**Respuesta `200`**
```json
[
  {
    "tipo": "riego",
    "items": [
      {
        "evento_riego_id": "er1-...",
        "fecha": "2026-03-08T00:00:00Z",
        "volumen": 150.5,
        "unidad": "m3",
        "sistema_riego": "goteo",
        "campania_id": "ca1-...",
        "cuartel_id": "c1d2e3f4-..."
      }
    ]
  },
  {
    "tipo": "fertilizacion",
    "items": []
  }
]
```

**curl**
```bash
# Todos los tipos
curl "https://api.traza.com/api/ia/eventos?campaniaId=ca1-...&cuartelId=c1d2e3f4-..." \
  -H "Authorization: Bearer <bot_token>"

# Solo riegos
curl "https://api.traza.com/api/ia/eventos?tipo=riego&limit=10" \
  -H "Authorization: Bearer <bot_token>"
```

---

## Usuarios (bot)

### `GET /api/ia/usuarios/:userId`

Devuelve los datos de un usuario por ID, incluyendo el WhatsApp. Solo accesible si el usuario pertenece a una bodega con delegación activa del bot.

**Headers**
```
Authorization: Bearer <bot_token>
```

**Respuesta `200`**
```json
{
  "user_id": "25f158ae-f7f3-425d-948a-957b29136ed2",
  "nombre": "Juan Pérez",
  "email": "juan@bodega.com",
  "whatsapp_e164": "+5491112345678",
  "is_active": true
}
```

**Errores**
| Código | Mensaje |
|---|---|
| `403` | Sin delegaciones activas |
| `404` | Usuario no encontrado o sin acceso |

**curl**
```bash
curl https://api.traza.com/api/ia/usuarios/25f158ae-f7f3-425d-948a-957b29136ed2 \
  -H "Authorization: Bearer <bot_token>"
```

---

## Consultas semánticas

### `POST /api/ia/consultas`

Busca texto de forma transversal en fincas, cuarteles, campañas, trazabilidades y hallazgos visibles para el bot.

**Body**
```json
{
  "pregunta": "Malbec carencia",
  "bodegaId": "a1b2c3d4-...",
  "trazabilidadId": "tr1-...",
  "limit": 50
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `pregunta` | string | sí | Término de búsqueda (case-insensitive) |
| `bodegaId` | uuid | no | Limita la búsqueda a una bodega |
| `trazabilidadId` | uuid | no | Limita a una trazabilidad específica |
| `limit` | number | no | Máximo de resultados por entidad (default: 50, max: 200) |

**Respuesta `200`**
```json
{
  "pregunta": "Malbec carencia",
  "resumen": "Se encontraron resultados en fincas, trazabilidades y hallazgos.",
  "resultados": {
    "fincas": [],
    "cuarteles": [
      { "cuartel_id": "c1d2e3f4-...", "codigo_cuartel": "A-01", "variedad": "Malbec" }
    ],
    "campanias": [],
    "trazabilidades": [
      { "trazabilidad_id": "tr1-...", "nombre_producto": "Malbec Reserva 2026" }
    ],
    "hallazgos": [
      { "hallazgo_id": "h1-...", "titulo": "Período de carencia no cumplido", "severidad": "bloqueo" }
    ]
  }
}
```

**curl**
```bash
curl -X POST https://api.traza.com/api/ia/consultas \
  -H "Authorization: Bearer <bot_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "pregunta": "Malbec carencia",
    "limit": 20
  }'
```

---

## Roles del sistema

| Rol | Descripción |
|---|---|
| `admin_sistema` | Control total de la plataforma |
| `admin_bodega` | Administración de una bodega |
| `encargado_bodega` | Crea y asigna encargos |
| `bot_agent` | Cuenta técnica del bot, opera por delegación |

## WhatsApp en usuarios

Campos en `app_user`:
- `whatsapp_e164` — número en formato internacional (ej: `+5491112345678`)
- `whatsapp_verified_at` — fecha de verificación del número
- `whatsapp_opt_in_at` — fecha en que el usuario aceptó recibir mensajes
