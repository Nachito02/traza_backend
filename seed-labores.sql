-- Seed de labores manuales (Manual Funcional TRAZA IA): matriz de sugerencias
-- por actividad + catálogo de herramientas + catálogo de insumos manuales.
-- Idempotente. Las claves de actividad coinciden con normalizeClaveActividad().

-- ── 1) Matriz de sugerencias por actividad (UI + bot) ────────────────────────
INSERT INTO "actividad_sugerencia"
  ("clave", "nombre", "productividad_unidad", "productividad_label", "equipos_sugeridos", "insumos_sugeridos")
VALUES
  ('poda', 'Poda', 'plantas', 'Plantas podadas',
    '["Tijera manual","Tijera eléctrica","Serrucho de poda","Motosierra","Carro de poda"]',
    '["Alcohol desinfectante","Lubricante"]'),
  ('atadura', 'Atadura', 'plantas', 'Plantas atadas',
    '["Atadora manual","Carro de labores"]',
    '["Hilo atadura","Cinta biodegradable","Rafia"]'),
  ('renuevos', 'Renuevos', 'plantas', 'Plantas',
    '["Tijera manual","Cuchillo de poda"]',
    '["Pasta cicatrizante"]'),
  ('desbrote', 'Desbrote', 'plantas', 'Plantas desbrotadas',
    '["Tijera manual","Tijera eléctrica"]', '[]'),
  ('deshojar', 'Deshojar', 'plantas', 'Plantas',
    '["Tijera manual","Deshojadora manual"]', '[]'),
  ('desmalezar', 'Desmalezar', 'ha', 'Superficie desmalezada',
    '["Motoguadaña","Desmalezadora","Pala"]', '["Combustible"]'),
  ('control_de_heladas_manual', 'Control de Heladas Manual', NULL, NULL,
    '["Linterna"]', '["Combustible","Leña","Gas","Velas antiheladas"]'),
  ('realizar_mugrones', 'Realizar Mugrones', 'plantas', 'Plantas',
    '["Pala","Tijera manual"]', '["Hormona enraizante"]'),
  ('mantenimiento_general', 'Mantenimiento General', NULL, NULL,
    '[]', '["Alambre","Lubricante"]'),
  ('realizar_injertos', 'Realizar Injertos', 'plantas', 'Injertos realizados',
    '["Tijera manual"]', '["Cinta injertar","Parafilm","Pasta cicatrizante"]'),
  ('realizar_calicata', 'Realizar Calicata', 'unidades', 'Calicatas',
    '["Pala","Barreno"]', '[]'),
  ('contar_fallas', 'Contar Fallas', 'plantas', 'Fallas contadas',
    '["Tablet","GPS"]', '[]'),
  ('juntar_ramas', 'Juntar Ramas', NULL, NULL,
    '["Carro de poda"]', '[]'),
  ('labores_tela_antigranizo', 'Labores Tela Antigranizo', 'metros', 'Metros',
    '["Escalera","Plataforma elevadora"]', '["Alambre","Grampa","Tensor"]'),
  ('cosecha_manual', 'Cosecha Manual', 'kg', 'Kg cosechados',
    '["Tijera manual","Bin","Carro cosechero"]', '[]'),
  ('cosecha_asistencia_a_maquina', 'Cosecha Asistencia a Máquina', 'kg', 'Kg cosechados',
    '["Tolva","Carro de labores"]', '["Combustible"]'),
  ('siembra_verdeo_manual', 'Siembra Verdeo Manual', 'kg', 'Kg sembrados',
    '["Sembradora manual"]', '["Semilla cobertura","Inoculante"]'),
  ('varios_manual', 'Varios Manual', NULL, NULL, '[]', '[]'),
  ('barbecho_manual', 'Barbecho Manual', 'ha', 'Superficie',
    '["Pala"]', '[]'),
  ('colgar_cepas', 'Colgar Cepas', 'plantas', 'Plantas',
    '["Tijera manual","Atadora manual"]', '["Hilo atadura"]'),
  ('plantacion', 'Plantación', 'plantas', 'Plantas implantadas',
    '["Pala","Ahoyadora","Barreno"]',
    '["Plantín","Tutor","Protector planta","Fertilizante arranque"]'),
  ('mantenimiento_estructura', 'Mantenimiento Estructura', NULL, NULL,
    '["Escalera"]', '["Alambre","Grampa","Poste","Tensor"]')
ON CONFLICT ("clave") DO UPDATE SET
  "nombre"               = EXCLUDED."nombre",
  "productividad_unidad" = EXCLUDED."productividad_unidad",
  "productividad_label"  = EXCLUDED."productividad_label",
  "equipos_sugeridos"    = EXCLUDED."equipos_sugeridos",
  "insumos_sugeridos"    = EXCLUDED."insumos_sugeridos";

-- NOTA: los insumos NO se seedean. Cada bodega carga su inventario propio
-- desde /admin/insumos. Las sugerencias de arriba referencian insumos por
-- nombre (texto), así que funcionan aunque la bodega aún no los haya cargado.

-- ── Herramientas (catálogo por bodega, clase herramienta) ────────────────────
INSERT INTO "tarifa_maquinaria" ("bodega_id","nombre","clase","costo_hora","moneda","vigencia_desde","activo")
SELECT b."bodega_id", v.nombre, 'herramienta'::"ClaseMaquinaria", 0, 'ARS', CURRENT_DATE, true
FROM "bodega" b
JOIN (
  VALUES
    ('Tijera manual'),('Tijera eléctrica'),('Serrucho de poda'),('Motosierra'),
    ('Atadora manual'),('Motoguadaña'),('Escalera'),('Plataforma elevadora'),
    ('Carro de poda'),('Carro de labores'),('Carro cosechero'),('Bin'),('Tolva'),
    ('Tablet'),('GPS'),('Pala'),('Barreno'),('Ahoyadora'),('Cuchillo de poda'),
    ('Deshojadora manual'),('Sembradora manual'),('Linterna')
) AS v(nombre) ON true
WHERE NOT EXISTS (
  SELECT 1 FROM "tarifa_maquinaria" t
  WHERE t."bodega_id" = b."bodega_id" AND t."nombre" = v.nombre AND t."clase" = 'herramienta'::"ClaseMaquinaria"
);
