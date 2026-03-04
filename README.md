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

## Roles, encargos y bot IA (WhatsApp)

### Roles recomendados

Se implementó autorización por roles usando las tablas `rol` y `user_rol`.

Roles sugeridos:
- `admin_sistema`: control total de la plataforma
- `bodega_admin`: administración de una o más bodegas
- `encargado`: crea y asigna encargos diarios
- `operario`: recibe encargos y reporta avance
- `bot_agent`: cuenta técnica del bot para operar por delegación

Podés consultar roles del usuario actual:
```bash
GET /api/auth/me/roles
```

### Encargos (tareas del día)

Endpoints:
- `GET /api/encargos/me/can-manage`
- `GET /api/encargos/me/asignaciones`
- `PATCH /api/encargos/me/asignaciones/:encargoAsignacionId/estado`
- `GET /api/encargos` (requiere `admin_sistema|bodega_admin|encargado`)
- `POST /api/encargos` (requiere `admin_sistema|bodega_admin|encargado`)
- `POST /api/encargos/:encargoId/asignaciones` (requiere `admin_sistema|bodega_admin|encargado`)

### Bot con delegación por usuario

Se agregó delegación explícita para que un bot actúe en nombre de un usuario y con scopes acotados.

Scopes sugeridos:
- `encargos.contactar`
- `encargos.cargar_datos`

Endpoints:
- `POST /api/bot/delegaciones`
- `GET /api/bot/delegaciones/me`
- `DELETE /api/bot/delegaciones/:botDelegationId`
- `POST /api/bot/asignaciones/:encargoAsignacionId/contactar` (requiere `bot_agent|admin_sistema`)
- `POST /api/bot/asignaciones/:encargoAsignacionId/ayudar-carga` (requiere `bot_agent|admin_sistema`)

### WhatsApp en usuarios

Se agregaron campos en `app_user`:
- `whatsapp_e164`
- `whatsapp_verified_at`
- `whatsapp_opt_in_at`
