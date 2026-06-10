-- Seed del módulo de costos: tarifas (por bodega) + insumos de referencia (globales).
-- Idempotente: se puede correr varias veces sin duplicar.
-- ⚠️ Precios PLACEHOLDER (ARS) — ajustar a valores reales de la bodega.

-- ── 1) Insumos de referencia (catálogo global, bodega_id NULL) ───────────────
-- Hardcodeados para arrancar; luego se reemplazan por inventario real.
INSERT INTO "insumo_catalogo" ("tipo", "nombre_comercial", "principio_activo", "unidad_base", "costo_unitario", "moneda")
VALUES
  ('Fitosanitario', 'Oxicloruro de cobre', 'Oxicloruro de cobre', 'kg', 8500.0000, 'ARS'),
  ('Fitosanitario', 'Azufre mojable',      'Azufre',              'kg', 3200.0000, 'ARS'),
  ('Fitosanitario', 'Mancozeb 80% WP',     'Mancozeb',            'kg', 9800.0000, 'ARS'),
  ('Fitosanitario', 'Caldo bordelés',      'Sulfato de cobre + cal','kg', 7600.0000, 'ARS'),
  ('Fertilizante',  'Urea granulada',      'Nitrógeno (46%)',     'kg',  950.0000, 'ARS'),
  ('Fertilizante',  'Fosfato diamónico',   'DAP (18-46-0)',       'kg', 1300.0000, 'ARS'),
  ('Enmienda',      'Sulfato de calcio',   'Yeso agrícola',       'kg',  420.0000, 'ARS')
ON CONFLICT ("tipo", "nombre_comercial")
DO UPDATE SET
  "principio_activo" = EXCLUDED."principio_activo",
  "unidad_base"      = EXCLUDED."unidad_base",
  "costo_unitario"   = EXCLUDED."costo_unitario",
  "moneda"           = EXCLUDED."moneda";

-- ── 2) Tarifas por bodega ────────────────────────────────────────────────────
-- Se insertan para TODAS las bodegas existentes. Guardas NOT EXISTS para idempotencia
-- (las tablas de tarifa no tienen unique natural).

-- 2a) Mano de obra
INSERT INTO "tarifa_mano_obra" ("bodega_id", "rol", "costo_jornal", "costo_hora", "moneda", "vigencia_desde", "activo")
SELECT b."bodega_id", v.rol::"RolManoObra", v.costo_jornal, v.costo_hora, 'ARS', CURRENT_DATE, true
FROM "bodega" b
JOIN (
  VALUES
    ('operario',    25000.00, NULL::numeric),
    ('tractorista', 32000.00, NULL::numeric),
    ('tecnico',     60000.00, 7500.00)
) AS v(rol, costo_jornal, costo_hora) ON true
WHERE NOT EXISTS (
  SELECT 1 FROM "tarifa_mano_obra" t
  WHERE t."bodega_id" = b."bodega_id" AND t."rol" = v.rol::"RolManoObra"
);

-- 2b) Maquinaria (motrices e implementos)
INSERT INTO "tarifa_maquinaria" ("bodega_id", "nombre", "clase", "costo_hora", "consumo_lts_hora", "moneda", "vigencia_desde", "activo")
SELECT b."bodega_id", v.nombre, v.clase::"ClaseMaquinaria", v.costo_hora, v.consumo, 'ARS', CURRENT_DATE, true
FROM "bodega" b
JOIN (
  VALUES
    ('Tractor',                   'motriz',     18000.00, 6.500::numeric),
    ('Cosechadora',               'motriz',     45000.00, 18.000::numeric),
    ('Pulverizadora autopropulsada','motriz',   38000.00, 12.000::numeric),
    ('Pulverizadora de arrastre', 'implemento',  4000.00, NULL::numeric),
    ('Rastra de discos',          'implemento',  3500.00, NULL::numeric),
    ('Desmalezadora',             'implemento',  3000.00, NULL::numeric)
) AS v(nombre, clase, costo_hora, consumo) ON true
WHERE NOT EXISTS (
  SELECT 1 FROM "tarifa_maquinaria" t
  WHERE t."bodega_id" = b."bodega_id" AND t."nombre" = v.nombre AND t."clase" = v.clase::"ClaseMaquinaria"
);

-- 2c) Combustible / energía
INSERT INTO "tarifa_combustible" ("bodega_id", "tipo", "costo_unitario", "unidad", "moneda", "vigencia_desde", "activo")
SELECT b."bodega_id", v.tipo::"TipoCombustible", v.costo_unitario, v.unidad, 'ARS', CURRENT_DATE, true
FROM "bodega" b
JOIN (
  VALUES
    ('gasoil',       1200.0000, 'lt'),
    ('nafta',        1350.0000, 'lt'),
    ('electricidad',   95.0000, 'kWh')
) AS v(tipo, costo_unitario, unidad) ON true
WHERE NOT EXISTS (
  SELECT 1 FROM "tarifa_combustible" t
  WHERE t."bodega_id" = b."bodega_id" AND t."tipo" = v.tipo::"TipoCombustible"
);
