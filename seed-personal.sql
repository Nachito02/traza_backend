-- Seed de PERSONAL DEMO para UNA bodega (personal_bodega).
-- Se inyecta por ID de bodega vía la variable psql :bodega_id.
--   psql "$DATABASE_URL" -v bodega_id="'<uuid>'" -f seed-personal.sql
--   (el wrapper scripts/seed-personal.mjs lo hace desde .env: npm run seed:personal -- <uuid>)
--
-- ⚠️ Son personas FICTICIAS, para poblar un demo y ejercitar el cálculo de costos.
-- Todos los legajos arrancan con "DEMO-" justamente para que se distingan de un
-- legajo real de un vistazo, y para poder borrarlos de una:
--   DELETE FROM "personal_bodega" WHERE "bodega_id" = '<uuid>' AND "legajo" LIKE 'DEMO-%';
--
-- Idempotente: guarda NOT EXISTS sobre (bodega_id, legajo). personal_bodega no tiene
-- unique natural, así que no se puede usar ON CONFLICT como en los otros seeds.
--
-- Cobertura del cálculo (src/modules/personal/personal.service.ts → costoHoraPersona):
--   modalidad 'mensual'  → sueldo_mensual / dias_mes / 8
--   modalidad 'por_hora' → costo_hora directo
--   'al_tanto' y 'otro'  → 0 por hora (se pagan por unidad, vía costo_unitario)
-- Los montos están elegidos para que el costo/hora dé redondo y se pueda verificar a ojo.

-- Falla claro si la bodega no existe (en vez de un error de FK poco legible).
SELECT EXISTS (SELECT 1 FROM "bodega" WHERE "bodega_id" = :'bodega_id'::uuid) AS bodega_ok \gset
\if :bodega_ok
\else
\echo '✗ La bodega indicada no existe. Verificá el ID.'
DO $$ BEGIN RAISE EXCEPTION 'La bodega indicada no existe'; END $$;
\endif

INSERT INTO "personal_bodega"
  ("bodega_id","nombre","legajo","fecha_ingreso","tipo","modalidad","rol",
   "sueldo_mensual","costo_hora","costo_unitario","dias_mes","activo")
SELECT :'bodega_id'::uuid, v.nombre, v.legajo, v.ingreso::date, v.tipo::"TipoPersonal",
       v.modalidad::"ModalidadPago", v.rol::"RolManoObra",
       v.sueldo, v.hora, v.unitario, v.dias, v.activo
FROM (VALUES
  -- ── Mensualizados: costo/hora = sueldo / dias_mes / 8 ──────────────────────
  -- 1.200.000 / 25 / 8 = 6.000 $/h
  ('Ramón Quiroga',      'DEMO-001','2021-03-01','interno','mensual','encargado',   1200000.00, NULL,    NULL,   25, true),
  -- 1.440.000 / 30 / 8 = 6.000 $/h — mismo costo/hora con dias_mes distinto,
  -- útil para verificar que el divisor de días se está aplicando de verdad.
  ('Marta Sosa',         'DEMO-002','2022-08-15','interno','mensual','tecnico',     1440000.00, NULL,    NULL,   30, true),
  -- 960.000 / 25 / 8 = 4.800 $/h
  ('Luis Paredes',       'DEMO-003','2023-01-10','interno','mensual','tractorista',  960000.00, NULL,    NULL,   25, true),

  -- ── Por hora: costo/hora = costo_hora, sin cuentas de por medio ─────────────
  ('Juana Ferreyra',     'DEMO-004','2023-09-05','interno','por_hora','operario',        NULL, 4500.00,  NULL,   25, true),
  ('Diego Molina',       'DEMO-005','2024-02-19','externo','por_hora','aplicador',       NULL, 7200.00,  NULL,   25, true),

  -- ── Al tanto / otro: NO aportan costo por hora, se pagan por unidad ─────────
  -- Sirven para comprobar que una actividad con solo esta gente da costo/hora 0
  -- aunque tengan horas cargadas.
  ('Cuadrilla Pérez',    'DEMO-006','2024-07-01','externo','al_tanto','contratista',     NULL,    NULL, 850.00,  25, true),
  ('Silvio Arce',        'DEMO-007','2025-01-20','externo','otro','operario',            NULL,    NULL,1200.00,  25, true),

  -- ── Inactivo: getCostosHoraPersonal filtra activo = true, así que este no
  --    debería aparecer nunca en un cálculo. Si aparece, hay un bug. ───────────
  ('Héctor Bulnes',      'DEMO-008','2020-05-11','interno','por_hora','operario',        NULL, 9999.00,  NULL,   25, false)
) AS v(nombre, legajo, ingreso, tipo, modalidad, rol, sueldo, hora, unitario, dias, activo)
WHERE NOT EXISTS (
  SELECT 1 FROM "personal_bodega" p
  WHERE p."bodega_id" = :'bodega_id'::uuid AND p."legajo" = v.legajo
);

\echo '✓ Personal demo sembrado (legajos DEMO-001..008).'
