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
