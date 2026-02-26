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
