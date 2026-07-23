-- Seed del módulo de costos: tarifas por bodega.
-- Idempotente: se puede correr varias veces sin duplicar.
-- ⚠️ Precios PLACEHOLDER (ARS) — ajustar a valores reales de la bodega.
-- NOTA: los insumos NO se seedean (inventario propio de cada bodega: cada una
-- carga los suyos desde /admin/insumos).

-- ── Tarifas por bodega ───────────────────────────────────────────────────────
-- Se insertan para TODAS las bodegas existentes. Guardas NOT EXISTS para idempotencia
-- (las tablas de tarifa no tienen unique natural).
-- NOTA: la mano de obra ya NO se seedea acá — cada bodega la carga desde
-- Bodega → Personal (personal_bodega) + operarios transitorios.

-- 2b) Maquinaria — cargada como en la UI: tractores con tipo (familia) + potencia +
-- uso + consumo; autopropulsadas e implementos con categoría/función. Alineado
-- con el catálogo maestro (seed-recursos-maestro.sql).
INSERT INTO "tarifa_maquinaria"
  ("bodega_id","ambito","nombre","clase","categoria","familia","potencia_hp","uso_principal","unidad_uso","consumo_descripcion","costo_hora","consumo_lts_hora","moneda","vigencia_desde","activo")
SELECT b."bodega_id",'finca'::"AmbitoRecurso",v.nombre,v.clase::"ClaseMaquinaria",v.cat,v.fam,v.pot,v.uso,v.uni,v.con,v.costo,v.lts,'ARS',CURRENT_DATE,true
FROM "bodega" b
JOIN (
  VALUES
    -- Tractores (categoria = 'Tractor', tipo en familia)
    ('Tractor Viñatero Angosto 75–85 HP','motriz','Tractor','Tractor Viñatero Angosto','75–85','Pulverización, desmalezado','Hora','6,5 l/h',18000.00,6.500::numeric),
    ('Tractor Agrícola 95–110 HP','motriz','Tractor','Tractor Agrícola','95–110','Rastras, cinceles, subsolado liviano','Hora','9,0 l/h',22000.00,9.000::numeric),
    -- Autopropulsadas (categoria = función)
    ('Cosechadora de Vid','motriz','Cosecha',NULL,NULL,NULL,'Hora',NULL,45000.00,18.000::numeric),
    ('Pulverizadora Autopropulsada','motriz','Pulverización',NULL,NULL,NULL,'Hora',NULL,38000.00,12.000::numeric),
    -- Implementos (categoria = función)
    ('Pulverizadora de arrastre','implemento','Aplicación fitosanitaria',NULL,NULL,NULL,'Hora',NULL,4000.00,NULL::numeric),
    ('Rastra de discos','implemento','Manejo de suelo',NULL,NULL,NULL,'Hora',NULL,3500.00,NULL::numeric),
    ('Desmalezadora','implemento','Manejo de suelo',NULL,NULL,NULL,'Hora',NULL,3000.00,NULL::numeric)
) AS v(nombre,clase,cat,fam,pot,uso,uni,con,costo,lts) ON true
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
