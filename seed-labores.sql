-- Seed de labores manuales (Manual Funcional TRAZA IA): matriz de sugerencias
-- por actividad + catálogo de herramientas + catálogo de insumos manuales.
-- Idempotente. Las claves de actividad coinciden con normalizeClaveActividad().

-- ── 1) Matriz de sugerencias por actividad (UI + bot) ────────────────────────
-- tipo: 'manual' (herramientas, sin tractor/combustible) | 'mecanizada' (tractor
-- o autopropulsada + combustible). aplica_*: qué secciones de costo tienen sentido
-- para la labor; la UI atenúa (no oculta) las que están en false.
INSERT INTO "actividad_sugerencia"
  ("clave", "nombre", "tipo", "productividad_unidad", "productividad_label",
   "equipos_sugeridos", "insumos_sugeridos",
   "aplica_maquinaria", "aplica_combustible", "aplica_insumos")
VALUES
  -- ── Tareas manuales (Cap. 1, 3, 6, 8) ──────────────────────────────────────
  ('poda', 'Poda', 'manual', 'plantas', 'Plantas podadas',
    '["Tijera manual","Tijera eléctrica","Serrucho de poda","Motosierra","Carro de poda"]',
    '["Alcohol desinfectante","Lubricante"]', true, false, true),
  ('atadura', 'Atadura', 'manual', 'plantas', 'Plantas atadas',
    '["Atadora manual","Carro de labores"]',
    '["Hilo atadura","Cinta biodegradable","Rafia"]', true, false, true),
  ('renuevos', 'Renuevos', 'manual', 'plantas', 'Plantas',
    '["Tijera manual","Cuchillo de poda"]',
    '["Pasta cicatrizante"]', true, false, true),
  ('desbrote', 'Desbrote', 'manual', 'plantas', 'Plantas desbrotadas',
    '["Tijera manual","Tijera eléctrica"]', '[]', true, false, false),
  ('deshojar', 'Deshojar', 'manual', 'plantas', 'Plantas',
    '["Tijera manual","Deshojadora manual"]', '[]', true, false, false),
  ('desmalezar', 'Desmalezar', 'manual', 'ha', 'Superficie desmalezada',
    '["Motoguadaña","Desmalezadora","Pala"]', '["Hilo nylon","Combustible mezcla"]', true, true, true),
  ('control_de_heladas_manual', 'Control de Heladas Manual', 'manual', NULL, NULL,
    '["Linterna","Radio"]', '["Combustible","Leña","Gas","Velas antiheladas","Briquetas"]', true, true, true),
  ('realizar_mugrones', 'Realizar Mugrones', 'manual', 'plantas', 'Plantas',
    '["Pala","Azada","Tijera manual"]', '["Hormona enraizante"]', true, false, true),
  ('mantenimiento_general', 'Mantenimiento General', 'manual', NULL, NULL,
    '["Herramientas manuales"]', '["Clavo","Alambre","Tornillo","Lubricante"]', true, false, true),
  ('realizar_injertos', 'Realizar Injertos', 'manual', 'plantas', 'Injertos realizados',
    '["Navaja injertar","Tijera manual","Cutter"]', '["Cinta injertar","Parafilm","Pasta cicatrizante"]', true, false, true),
  ('realizar_calicata', 'Realizar Calicata', 'manual', 'unidades', 'Calicatas',
    '["Pala","Barreno"]', '[]', true, false, false),
  ('contar_fallas', 'Contar Fallas', 'manual', 'plantas', 'Fallas contadas',
    '["Tablet","Celular","GPS"]', '[]', false, false, false),
  ('juntar_ramas', 'Juntar Ramas', 'manual', NULL, NULL,
    '["Rastrillo","Horquilla","Carro de poda"]', '[]', true, false, false),
  ('labores_tela_antigranizo', 'Labores Tela Antigranizo', 'manual', 'metros', 'Metros',
    '["Escalera","Plataforma elevadora"]', '["Gancho","Tensor","Alambre","Grampa","Malla"]', true, false, true),
  ('cosecha_manual', 'Cosecha Manual', 'manual', 'kg', 'Kg cosechados',
    '["Tijera cosecha","Bin","Carro cosechero","Balde"]', '["Etiqueta","Precinto","Ficha"]', true, false, true),
  ('cosecha_asistencia_a_maquina', 'Cosecha Asistencia a Máquina', 'manual', 'kg', 'Kg cosechados',
    '["Tolva","Carro de labores"]', '["Combustible"]', true, true, true),
  ('siembra_verdeo_manual', 'Siembra Verdeo Manual', 'manual', 'kg', 'Kg sembrados',
    '["Sembradora manual","Rastrillo"]', '["Semilla cobertura","Inoculante"]', true, false, true),
  ('varios_manual', 'Varios Manual', 'manual', NULL, NULL, '[]', '[]', true, true, true),
  ('barbecho_manual', 'Barbecho Manual', 'manual', 'ha', 'Superficie',
    '["Azada","Pala","Rastrillo"]', '[]', true, false, false),
  ('colgar_cepas', 'Colgar Cepas', 'manual', 'plantas', 'Plantas',
    '["Tijera manual","Atadora manual"]', '["Hilo atadura","Cinta"]', true, false, true),
  ('plantacion', 'Plantación', 'manual', 'plantas', 'Plantas implantadas',
    '["Pala","Ahoyadora","Barreno"]',
    '["Plantín","Tutor","Protector planta","Fertilizante arranque"]', true, false, true),
  ('mantenimiento_estructura', 'Mantenimiento Estructura', 'manual', NULL, NULL,
    '["Escalera","Herramientas manuales"]', '["Alambre","Grampa","Poste","Anclaje","Tensor"]', true, false, true),
  -- ── Tareas mecanizadas (Cap. 1, 3, 4, 6) ───────────────────────────────────
  ('cosecha_mecanizada', 'Cosecha Mecanizada', 'mecanizada', 'kg', 'Kg cosechados',
    '["Cosechadora"]', '[]', true, true, false),
  ('zanjear', 'Zanjear', 'mecanizada', 'ha', 'Superficie',
    '["Tractor","Zanjeadora"]', '[]', true, true, false),
  ('armado_de_estructura', 'Armado de Estructura', 'mecanizada', 'metros', 'Metros',
    '["Tractor","Hincadora","Hoyadora"]', '["Poste","Alambre","Anclaje"]', true, true, true),
  ('plantacion_mecanica', 'Plantación Mecánica', 'mecanizada', 'plantas', 'Plantas implantadas',
    '["Tractor","Plantadora","Hoyadora"]', '["Plantín","Tutor","Protector planta"]', true, true, true),
  ('desorillar', 'Desorillar', 'mecanizada', 'ha', 'Superficie',
    '["Tractor","Desorilladora"]', '[]', true, true, false),
  ('arar', 'Arar', 'mecanizada', 'ha', 'Superficie',
    '["Tractor","Arado"]', '[]', true, true, false),
  ('subsolar', 'Subsolar', 'mecanizada', 'ha', 'Superficie',
    '["Tractor","Subsolador"]', '[]', true, true, false),
  ('triturar_ramas', 'Triturar Ramas', 'mecanizada', 'ha', 'Superficie',
    '["Tractor","Trituradora"]', '[]', true, true, false),
  ('nivelar', 'Nivelar', 'mecanizada', 'ha', 'Superficie',
    '["Tractor","Niveladora"]', '[]', true, true, false),
  ('barbecho_mecanico', 'Barbecho Mecánico', 'mecanizada', 'ha', 'Superficie',
    '["Tractor","Rastra","Cultivador"]', '[]', true, true, false),
  ('sacar_ramas_sarmientos', 'Sacar Ramas / Sarmientos', 'mecanizada', 'ha', 'Superficie',
    '["Tractor","Carro","Trituradora"]', '[]', true, true, false),
  ('hoyar', 'Hoyar', 'mecanizada', 'plantas', 'Plantas',
    '["Tractor","Hoyadora"]', '[]', true, true, false),
  ('fertilizar', 'Fertilizar', 'mecanizada', 'ha', 'Superficie',
    '["Tractor","Fertilizadora"]', '["Fertilizante"]', true, true, true),
  ('aplicar_materia_organica', 'Aplicar Materia Orgánica / Enmienda', 'mecanizada', 'ha', 'Superficie',
    '["Tractor","Estercolera","Distribuidor"]', '["Guano","Compost","Orujo","Enmienda"]', true, true, true),
  ('siembra_verdeo', 'Siembra Verdeo', 'mecanizada', 'ha', 'Superficie',
    '["Tractor","Sembradora"]', '["Semilla cobertura","Inoculante"]', true, true, true),
  ('aplicar_herbicida', 'Aplicar Herbicida', 'mecanizada', 'ha', 'Superficie',
    '["Tractor","Pulverizadora"]', '["Herbicida","Coadyuvante","Agua"]', true, true, true),
  ('aplicacion_fitosanitaria', 'Aplicación Fitosanitaria', 'mecanizada', 'ha', 'Superficie',
    '["Tractor","Pulverizadora","Atomizadora"]', '["Fitosanitario","Coadyuvante","Agua"]', true, true, true),
  ('control_heladas_mecanica', 'Control Heladas Mecánica', 'mecanizada', NULL, NULL,
    '["Turbina","Tractor"]', '["Combustible"]', true, true, true)
ON CONFLICT ("clave") DO UPDATE SET
  "nombre"               = EXCLUDED."nombre",
  "tipo"                 = EXCLUDED."tipo",
  "productividad_unidad" = EXCLUDED."productividad_unidad",
  "productividad_label"  = EXCLUDED."productividad_label",
  "equipos_sugeridos"    = EXCLUDED."equipos_sugeridos",
  "insumos_sugeridos"    = EXCLUDED."insumos_sugeridos",
  "aplica_maquinaria"    = EXCLUDED."aplica_maquinaria",
  "aplica_combustible"   = EXCLUDED."aplica_combustible",
  "aplica_insumos"       = EXCLUDED."aplica_insumos";

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
