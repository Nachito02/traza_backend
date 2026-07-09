-- Seed de insumos para UNA bodega (fertilizantes/orgánicos + fitosanitarios).
-- Se inyecta por ID de bodega vía la variable psql :bodega_id.
--   psql "$DATABASE_URL" -v bodega_id="'<uuid>'" -f seed-insumos.sql
-- (el wrapper scripts/seed-insumos.mjs lo hace desde .env: npm run seed:insumos -- <uuid>)
--
-- Idempotente: ON CONFLICT sobre (bodega_id, tipo, nombre_comercial) DO NOTHING,
-- así no pisa costos ni stock que la bodega ya haya cargado. costo_unitario y
-- stock_minimo quedan en NULL para que cada bodega los complete.

-- Falla claro si la bodega no existe (en vez de un error de FK poco legible).
-- (Se usan meta-comandos de psql: la sustitución de :bodega_id NO ocurre dentro
--  de un bloque DO $$...$$, por eso el chequeo va con \gset/\if.)
SELECT EXISTS (SELECT 1 FROM "bodega" WHERE "bodega_id" = :'bodega_id'::uuid) AS bodega_ok \gset
\if :bodega_ok
\else
\echo '✗ La bodega indicada no existe. Verificá el ID.'
-- Forzamos un error real para que ON_ERROR_STOP corte con exit != 0.
DO $$ BEGIN RAISE EXCEPTION 'La bodega indicada no existe'; END $$;
\endif

-- ── Fertilizantes minerales / inorgánicos ────────────────────────────────────
INSERT INTO "insumo_catalogo" ("bodega_id","tipo","nombre_comercial","principio_activo","unidad_base","activo")
SELECT :'bodega_id'::uuid, v.tipo, v.nombre, v.pa, v.unidad, true
FROM (VALUES
  ('fertilizante','Urea','Nitrógeno (N)','kg'),
  ('fertilizante','Nitrato de amonio','Nitrógeno (N)','kg'),
  ('fertilizante','Sulfato de amonio','Nitrógeno y Azufre','kg'),
  ('fertilizante','MAP','Fósforo y Nitrógeno','kg'),
  ('fertilizante','DAP','Fósforo y Nitrógeno','kg'),
  ('fertilizante','Sulfato de potasio','Potasio (K)','kg'),
  ('fertilizante','Nitrato de potasio','Potasio y Nitrógeno','kg'),
  ('fertilizante','Cloruro de potasio','Potasio (K)','kg'),
  ('fertilizante','Ácido fosfórico','Fósforo (P)','L'),
  ('fertilizante','Quelato de hierro','Hierro (Fe)','kg'),
  ('fertilizante','Sulfato de zinc','Zinc (Zn)','kg'),
  ('fertilizante','Boro etanolamina','Boro (B)','L'),
  ('fertilizante','Nitrato de calcio','Calcio y Nitrógeno','kg'),
  ('fertilizante','Sulfato de magnesio','Magnesio (Mg)','kg'),
  ('fertilizante','Harina de hueso','Fósforo y calcio','kg'),
  ('fertilizante','Harina de sangre','Nitrógeno (N)','kg')
) AS v(tipo,nombre,pa,unidad)
ON CONFLICT ("bodega_id","tipo","nombre_comercial") DO NOTHING;

-- ── Fertilizantes orgánicos / enmiendas ──────────────────────────────────────
INSERT INTO "insumo_catalogo" ("bodega_id","tipo","nombre_comercial","principio_activo","unidad_base","activo")
SELECT :'bodega_id'::uuid, v.tipo, v.nombre, v.pa, v.unidad, true
FROM (VALUES
  ('organico','Compost orgánico','Materia orgánica','ton'),
  ('organico','Guano compostado','Materia orgánica y NPK','ton'),
  ('organico','Guano de gallina compostado','NPK alto (N y P)','ton'),
  ('organico','Guano de cabra compostado','Materia orgánica, N y K','ton'),
  ('organico','Guano de vaca compostado','Materia orgánica','ton'),
  ('organico','Guano de caballo compostado','Materia orgánica','ton'),
  ('organico','Lombricompuesto','Humus y microorganismos','ton'),
  ('organico','Humus de lombriz','Materia orgánica estabilizada','ton'),
  ('organico','Compost vegetal','Materia orgánica','ton'),
  ('organico','Bocashi','NPK y microorganismos','ton'),
  ('organico','Té de compost','Microorganismos benéficos','L'),
  ('organico','Extracto de algas','Fitohormonas y micronutrientes','L'),
  ('organico','Ácidos húmicos','Carbono orgánico','L'),
  ('organico','Ácidos fúlvicos','Carbono orgánico soluble','L')
) AS v(tipo,nombre,pa,unidad)
ON CONFLICT ("bodega_id","tipo","nombre_comercial") DO NOTHING;

-- ── Fitosanitarios (control de plagas y enfermedades) ────────────────────────
INSERT INTO "insumo_catalogo" ("bodega_id","tipo","nombre_comercial","principio_activo","unidad_base","activo")
SELECT :'bodega_id'::uuid, v.tipo, v.nombre, v.pa, v.unidad, true
FROM (VALUES
  ('fitosanitario','Azufre mojable','Azufre','kg'),
  ('fitosanitario','Miclobutanil','Miclobutanil','L'),
  ('fitosanitario','Tebuconazole pasta poda','Tebuconazole','kg'),
  ('fitosanitario','Cyprodinil + Fludioxonil','Cyprodinil + Fludioxonil','kg'),
  ('fitosanitario','Oxicloruro de cobre','Cobre','kg'),
  ('fitosanitario','Metalaxil','Metalaxil','kg'),
  ('fitosanitario','Tiofanato metil','Tiofanato metílico','kg'),
  ('fitosanitario','Pasta cicatrizante fungicida','Fungicida de heridas','kg'),
  ('fitosanitario','Clorantraniliprole','Clorantraniliprole','L'),
  ('fitosanitario','Bacillus thuringiensis','Bacillus thuringiensis','kg'),
  ('fitosanitario','Abamectina','Abamectina','L'),
  ('fitosanitario','Aceite mineral','Aceite mineral','L'),
  ('fitosanitario','Imidacloprid','Imidacloprid','L'),
  ('fitosanitario','Spinosad','Spinosad','L')
) AS v(tipo,nombre,pa,unidad)
ON CONFLICT ("bodega_id","tipo","nombre_comercial") DO NOTHING;
