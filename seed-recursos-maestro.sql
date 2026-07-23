-- Catálogo MAESTRO GLOBAL de recursos (sin bodega) — tablas del documento de
-- observaciones (máquinas, implementos, equipos y herramientas). La UI lo usa
-- para autocompletar; cada bodega crea su copia editable en tarifa_maquinaria.
-- Idempotente: ON CONFLICT (ambito, clase, nombre) DO NOTHING.
--   npm run seed:recursos-maestro   (no requiere bodega)

-- ═══════════════ FINCA · MÁQUINAS (motriz) ═══════════════
-- A.1 Tractores (el nombre incluye la potencia para diferenciar variantes).
INSERT INTO "recurso_maestro"
  ("ambito","clase","categoria","familia","nombre","potencia_hp","uso_principal","unidad_uso","consumo_descripcion","observaciones")
SELECT 'finca'::"AmbitoRecurso",'motriz'::"ClaseMaquinaria",v.cat,v.fam,v.nom,v.pot,v.uso,v.uni,v.con,v.obs
FROM (VALUES
  ('Tractor','Tractor Viñatero Angosto','Tractor Viñatero Angosto 55–65 HP','55–65','Viñedos tradicionales','Hora','4,5 l/h',NULL),
  ('Tractor','Tractor Viñatero Angosto','Tractor Viñatero Angosto 65–75 HP','65–75','Labores generales','Hora','5,5 l/h',NULL),
  ('Tractor','Tractor Viñatero Angosto','Tractor Viñatero Angosto 75–85 HP','75–85','Pulverización, desmalezado','Hora','6,5 l/h',NULL),
  ('Tractor','Tractor Frutero','Tractor Frutero 85–95 HP','85–95','Pulverización pesada, fertilización','Hora','7,5 l/h',NULL),
  ('Tractor','Tractor Agrícola','Tractor Agrícola 95–110 HP','95–110','Rastras, cinceles, subsolado liviano','Hora','9,0 l/h',NULL),
  ('Tractor','Tractor Agrícola','Tractor Agrícola 110–130 HP','110–130','Subsolado, labores pesadas','Hora','11,0 l/h',NULL),
  ('Tractor','Tractor Alta Potencia','Tractor Alta Potencia 130–150 HP','130–150','Grandes implementos','Hora','13,0 l/h',NULL),
  -- A.1.1 Maquinaria autopropulsada
  ('Cosecha',NULL,'Cosechadora de Vid',NULL,NULL,'Hora',NULL,NULL),
  ('Pulverización',NULL,'Pulverizadora Autopropulsada',NULL,NULL,'Hora',NULL,NULL),
  ('Poda',NULL,'Prepodadora Autopropulsada',NULL,NULL,'Hora',NULL,NULL),
  ('Deshoje',NULL,'Deshojadora Autopropulsada',NULL,NULL,'Hora',NULL,NULL),
  ('Desmalezado',NULL,'Desmalezadora Autopropulsada',NULL,NULL,'Hora',NULL,NULL),
  ('Control de Heladas',NULL,'Turbina Antiheladas (Wind Machine)',NULL,NULL,'Hora',NULL,NULL),
  ('Movimiento',NULL,'Minicargadora',NULL,NULL,'Hora',NULL,NULL),
  ('Movimiento',NULL,'Retroexcavadora',NULL,NULL,'Hora',NULL,NULL),
  ('Movimiento',NULL,'Pala Cargadora Frontal',NULL,NULL,'Hora',NULL,NULL),
  ('Movimiento',NULL,'Manipulador Telescópico',NULL,NULL,'Hora',NULL,NULL),
  ('Movimiento',NULL,'Autoelevador Todo Terreno',NULL,NULL,'Hora',NULL,NULL),
  ('Transporte',NULL,'Camión',NULL,NULL,'Hora',NULL,NULL),
  ('Transporte',NULL,'Camioneta Pick-up',NULL,NULL,'Hora',NULL,NULL),
  ('Transporte',NULL,'Cuatriciclo',NULL,NULL,'Hora',NULL,NULL),
  ('Transporte',NULL,'Motocicleta',NULL,NULL,'Hora',NULL,NULL),
  ('Agricultura de Precisión',NULL,'Dron Pulverizador (autopropulsado)',NULL,NULL,'Hora de vuelo',NULL,NULL),
  ('Agricultura de Precisión',NULL,'Dron Multiespectral (autopropulsado)',NULL,NULL,'Hora de vuelo',NULL,NULL)
) AS v(cat,fam,nom,pot,uso,uni,con,obs)
ON CONFLICT ("ambito","clase","nombre") DO NOTHING;

-- ═══════════════ FINCA · IMPLEMENTOS ═══════════════
INSERT INTO "recurso_maestro"
  ("ambito","clase","categoria","familia","nombre","potencia_hp","uso_principal","unidad_uso","consumo_descripcion","observaciones")
SELECT 'finca'::"AmbitoRecurso",'implemento'::"ClaseMaquinaria",v.cat,NULL,v.nom,NULL,v.uso,'Hora',NULL,v.obs
FROM (VALUES
  ('Manejo de suelo','Zanjeadora','Zanjear','Tractor + implemento'),
  ('Manejo de suelo','Hincadora / hoyadora','Armado de estructura','Tractor + implemento'),
  ('Manejo de suelo','Plantadora / hoyadora','Plantación mecánica','Tractor + implemento'),
  ('Manejo de suelo','Desorilladora','Desorillar','Tractor + implemento'),
  ('Manejo de suelo','Arado','Arar','Tractor + implemento'),
  ('Manejo de suelo','Subsolador','Subsolar','Tractor + implemento'),
  ('Manejo de suelo','Trituradora','Triturar ramas','Tractor + implemento'),
  ('Manejo de suelo','Niveladora','Nivelar','Tractor + implemento'),
  ('Manejo de suelo','Rastra / cultivador','Barbecho mecánico','Tractor + implemento'),
  ('Manejo de suelo','Desmalezadora','Desmalezar','Tractor + implemento'),
  ('Manejo de suelo','Carro / trituradora','Sacar ramas / sarmientos','Tractor + implemento'),
  ('Manejo de suelo','Hoyadora','Hoyar','Tractor + implemento'),
  ('Fertilización','Fertilizadora','Fertilizar','Tractor + implemento'),
  ('Enmiendas','Estercolera / distribuidor','Aplicar materia orgánica / enmienda','Tractor + implemento'),
  ('Cobertura vegetal','Sembradora','Siembra verdeo','Tractor + implemento'),
  ('Fitosanitarios','Pulverizadora','Aplicar herbicida','Tractor + implemento'),
  ('Fitosanitarios','Pulverizadora / Atomizadora','Aplicación fitosanitaria','Tractor + implemento')
) AS v(cat,nom,uso,obs)
ON CONFLICT ("ambito","clase","nombre") DO NOTHING;

-- ═══════════════ FINCA · EQUIPOS ═══════════════
INSERT INTO "recurso_maestro"
  ("ambito","clase","categoria","familia","nombre","potencia_hp","uso_principal","unidad_uso","consumo_descripcion","observaciones")
SELECT 'finca'::"AmbitoRecurso",'equipo'::"ClaseMaquinaria",v.cat,NULL,v.nom,NULL,NULL,v.uni,v.con,v.obs
FROM (VALUES
  ('Riego','Bomba centrífuga eléctrica','Hora','kWh','Bombeo desde perforación o reservorio'),
  ('Riego','Bomba centrífuga diésel','Hora','l/h gasoil','Bombeo móvil'),
  ('Riego','Electrobomba sumergible','Hora','kWh','Perforaciones profundas'),
  ('Riego','Cabezal de riego','Hora','-','Filtros, válvulas, fertilización'),
  ('Fertirriego','Equipo de fertirriego','Hora','kWh','Inyección de fertilizantes'),
  ('Energía','Generador eléctrico','Hora','l/h gasoil','Respaldo eléctrico'),
  ('Energía','Grupo electrógeno','Hora','l/h gasoil','Emergencias'),
  ('Monitoreo','Torre meteorológica automática','Día','kWh / Solar','Variables climáticas'),
  ('Monitoreo','Estación agrometeorológica','Día','Solar','ET, temperatura, lluvia, viento'),
  ('Monitoreo','Sensor de humedad de suelo','Día','Batería','Tensiómetro o FDR/TDR'),
  ('Monitoreo','Sensor de humedad foliar','Día','Batería','Modelos sanitarios'),
  ('Monitoreo','Sensor de temperatura','Día','Batería','Ambiente'),
  ('Monitoreo','Sensor de radiación solar','Día','Solar','ET'),
  ('Monitoreo','Sensor de velocidad del viento','Día','Solar','Aplicaciones'),
  ('Monitoreo','Cámara de monitoreo','Día','kWh','Vigilancia'),
  ('Monitoreo','Cámara IA para monitoreo','Día','kWh','Conteo, detección'),
  ('Control de heladas','Torre antiheladas','Hora','kWh','Resistencias eléctricas'),
  ('Control de heladas','Ventilador antiheladas','Hora','l/h gasoil','Wind Machine'),
  ('Control de heladas','Turbina antiheladas','Hora','l/h gasoil','Muy utilizada en viñedos'),
  ('Control de heladas','Calefactor antiheladas a gas','Hora','kg GLP','Equipos móviles'),
  ('Control de heladas','Sistema de microaspersión antiheladas','Hora','m³ agua','Protección activa'),
  ('Taller','Compresor de aire','Hora','kWh','Herramientas neumáticas'),
  ('Taller','Soldadora eléctrica','Hora','kWh','Reparaciones'),
  ('Taller','Hidrolavadora','Hora','kWh','Limpieza maquinaria'),
  ('Operaciones y precisión','Balanza electrónica','Evento','kWh','Pesaje de uva e insumos'),
  ('Operaciones y precisión','Equipo GPS agrícola','Día','Batería','Relevamientos'),
  ('Operaciones y precisión','Tablet de campo','Día','Batería','Registro de actividades'),
  ('Operaciones y precisión','Equipo RTK','Día','Batería','Georreferenciación'),
  ('Operaciones y precisión','Dron multiespectral','Hora de vuelo','Batería','NDVI, vigor'),
  ('Operaciones y precisión','Dron pulverizador','Hora','Batería','Aplicaciones localizadas')
) AS v(cat,nom,uni,con,obs)
ON CONFLICT ("ambito","clase","nombre") DO NOTHING;

-- ═══════════════ FINCA · HERRAMIENTAS ═══════════════
INSERT INTO "recurso_maestro"
  ("ambito","clase","categoria","familia","nombre","potencia_hp","uso_principal","unidad_uso","consumo_descripcion","observaciones")
SELECT 'finca'::"AmbitoRecurso",'herramienta'::"ClaseMaquinaria",v.cat,NULL,v.nom,NULL,v.uso,NULL,NULL,NULL
FROM (VALUES
  ('Poda','Tijera de poda manual','Poda manual'),
  ('Poda','Tijera de poda eléctrica','Poda intensiva'),
  ('Poda','Tijera de poda neumática','Poda intensiva'),
  ('Poda','Serrucho de poda','Corte de ramas gruesas'),
  ('Poda','Motosierra liviana','Renovación de plantas'),
  ('Poda','Navaja de poda','Cortes finos'),
  ('Atadura','Atadora manual','Atado de brotes'),
  ('Atadura','Atadora eléctrica','Atado intensivo'),
  ('Atadura','Pinza atadora','Colocación de clips'),
  ('Injertos','Cuchillo de injertar','Injertos'),
  ('Injertos','Navaja de injertar','Injertos especializados'),
  ('Labores de Suelo','Azada','Escardillo y desmalezado'),
  ('Labores de Suelo','Pala de punta','Excavaciones'),
  ('Labores de Suelo','Pala ancha','Movimiento de suelo'),
  ('Labores de Suelo','Pala pocera','Plantación'),
  ('Labores de Suelo','Pico','Suelos compactados'),
  ('Labores de Suelo','Barreta','Hoyos y postes'),
  ('Labores de Suelo','Escardillo','Labores superficiales'),
  ('Labores de Suelo','Rastrillo','Nivelación y limpieza'),
  ('Plantación','Cuerda de replanteo','Alineación'),
  ('Plantación','Cinta métrica','Medición'),
  ('Plantación','Nivel','Nivelación'),
  ('Plantación','Martillo','Colocación de tutores'),
  ('Plantación','Mazo de goma','Postes y estructuras'),
  ('Alambrado y Estructuras','Tenaza','Tensado de alambres'),
  ('Alambrado y Estructuras','Alicate','Corte de alambres'),
  ('Alambrado y Estructuras','Pinza universal','Reparaciones'),
  ('Alambrado y Estructuras','Llave francesa','Ajustes'),
  ('Alambrado y Estructuras','Juego de llaves','Reparaciones'),
  ('Alambrado y Estructuras','Destornilladores','Reparaciones'),
  ('Aplicaciones','Pulverizador manual','Aplicaciones localizadas'),
  ('Aplicaciones','Mochila pulverizadora','Tratamientos fitosanitarios'),
  ('Aplicaciones','Mochila fertilizadora','Fertilización manual'),
  ('Aplicaciones','Balde graduado','Preparación de mezclas'),
  ('Aplicaciones','Bidón graduado','Dosificación'),
  ('Aplicaciones','Embudo','Carga de productos'),
  ('Transporte Manual','Carretilla','Transporte de materiales'),
  ('Transporte Manual','Carro de herramientas','Transporte de herramientas'),
  ('Cosecha','Tijera de vendimia','Corte de racimos'),
  ('Cosecha','Balde de cosecha','Recolección de uva'),
  ('Cosecha','Gancho para bins','Movimiento de bins'),
  ('Control de Heladas','Linterna LED','Recorridas nocturnas'),
  ('Control de Heladas','Radio portátil','Comunicación'),
  ('Control de Heladas','Termómetro portátil','Control de temperatura'),
  ('Uso General','Escalera de aluminio','Trabajos en altura'),
  ('Uso General','Caja de herramientas','Mantenimiento general'),
  ('Uso General','Linterna recargable','Trabajos nocturnos')
) AS v(cat,nom,uso)
ON CONFLICT ("ambito","clase","nombre") DO NOTHING;

-- ═══════════════ BODEGA · EQUIPOS ═══════════════
INSERT INTO "recurso_maestro"
  ("ambito","clase","categoria","familia","nombre","potencia_hp","uso_principal","unidad_uso","consumo_descripcion","observaciones")
SELECT 'bodega'::"AmbitoRecurso",'equipo'::"ClaseMaquinaria",v.cat,NULL,v.nom,NULL,v.uso,NULL,NULL,NULL
FROM (VALUES
  ('Recepción de Uva','Balanza camionera','Pesaje de uva'),
  ('Recepción de Uva','Tolva de recepción','Recepción de uva'),
  ('Recepción de Uva','Cinta transportadora','Transporte de uva'),
  ('Recepción de Uva','Mesa de selección','Selección manual'),
  ('Recepción de Uva','Despalilladora','Separación de escobajos'),
  ('Recepción de Uva','Moledora','Molienda de uva'),
  ('Recepción de Uva','Tornillo sin fin','Transporte de vendimia'),
  ('Recepción de Uva','Bomba de vendimia','Bombeo de vendimia'),
  ('Fermentación y Elaboración','Tanque de acero inoxidable','Fermentación y almacenamiento'),
  ('Fermentación y Elaboración','Tanque de fibra de vidrio','Fermentación'),
  ('Fermentación y Elaboración','Pileta de hormigón','Fermentación'),
  ('Fermentación y Elaboración','Bomba centrífuga para vino','Trasiego'),
  ('Fermentación y Elaboración','Bomba de pistón','Trasiego'),
  ('Fermentación y Elaboración','Bomba peristáltica','Bombeo delicado'),
  ('Fermentación y Elaboración','Intercambiador de calor','Enfriamiento'),
  ('Fermentación y Elaboración','Equipo de frío (Chiller)','Control de temperatura'),
  ('Fermentación y Elaboración','Placa refrigerante','Control térmico'),
  ('Fermentación y Elaboración','Remontador automático','Remontajes'),
  ('Fermentación y Elaboración','Equipo de microoxigenación','Microoxigenación'),
  ('Fermentación y Elaboración','Generador de nitrógeno','Inertización'),
  ('Fermentación y Elaboración','Compresor de aire (bodega)','Servicios generales'),
  ('Crianza y Guarda','Barrica de roble francés','Crianza'),
  ('Crianza y Guarda','Barrica de roble americano','Crianza'),
  ('Crianza y Guarda','Tonel de madera','Crianza'),
  ('Crianza y Guarda','Tanque inoxidable (guarda)','Guarda'),
  ('Crianza y Guarda','Jaula porta barricas','Almacenamiento'),
  ('Crianza y Guarda','Lavadora de barricas','Limpieza'),
  ('Crianza y Guarda','Vaporizador de barricas','Sanitización'),
  ('Clarificación y Estabilización','Filtro de placas','Filtrado'),
  ('Clarificación y Estabilización','Filtro de tierras','Filtrado'),
  ('Clarificación y Estabilización','Filtro tangencial','Filtrado'),
  ('Clarificación y Estabilización','Filtro de membrana','Filtrado final'),
  ('Clarificación y Estabilización','Dosificador de bentonita','Clarificación'),
  ('Clarificación y Estabilización','Equipo de estabilización tartárica','Estabilización'),
  ('Clarificación y Estabilización','Centrífuga','Separación de sólidos'),
  ('Laboratorio y Control de Calidad','pHmetro','Análisis'),
  ('Laboratorio y Control de Calidad','Conductímetro','Análisis'),
  ('Laboratorio y Control de Calidad','Refractómetro','Azúcares'),
  ('Laboratorio y Control de Calidad','Densímetro','Densidad'),
  ('Laboratorio y Control de Calidad','Alcoholímetro','Graduación alcohólica'),
  ('Laboratorio y Control de Calidad','Espectrofotómetro','Color y análisis'),
  ('Laboratorio y Control de Calidad','Microscopio','Microbiología'),
  ('Laboratorio y Control de Calidad','Estufa de cultivo','Microbiología'),
  ('Laboratorio y Control de Calidad','Balanza analítica','Pesadas'),
  ('Laboratorio y Control de Calidad','Agitador magnético','Preparación de muestras'),
  ('Fraccionamiento','Lavadora de botellas','Limpieza'),
  ('Fraccionamiento','Enjuagadora','Enjuague'),
  ('Fraccionamiento','Llenadora','Llenado'),
  ('Fraccionamiento','Taponadora','Colocación de corchos'),
  ('Fraccionamiento','Capsuladora','Colocación de cápsulas'),
  ('Fraccionamiento','Etiquetadora','Etiquetado'),
  ('Fraccionamiento','Codificadora','Lote y fecha'),
  ('Fraccionamiento','Encajonadora','Armado de cajas'),
  ('Fraccionamiento','Cerradora de cajas','Cierre'),
  ('Fraccionamiento','Paletizadora','Armado de pallets'),
  ('Fraccionamiento','Envolvedora de pallets','Film stretch'),
  ('Movimiento Interno','Autoelevador','Movimiento de pallets'),
  ('Movimiento Interno','Zorra hidráulica','Movimiento interno'),
  ('Movimiento Interno','Apilador eléctrico','Movimiento de pallets'),
  ('Movimiento Interno','Carro porta bins','Movimiento de bins'),
  ('Movimiento Interno','Carro porta barricas','Movimiento de barricas'),
  ('Limpieza y Sanitización','Hidrolavadora (bodega)','Limpieza'),
  ('Limpieza y Sanitización','Equipo CIP','Limpieza automática'),
  ('Limpieza y Sanitización','Generador de vapor','Sanitización'),
  ('Limpieza y Sanitización','Lavadora de tanques','Limpieza'),
  ('Limpieza y Sanitización','Espumadora','Aplicación detergentes'),
  ('Servicios Generales','Grupo electrógeno (bodega)','Energía de respaldo'),
  ('Servicios Generales','Compresor de aire (servicios)','Aire comprimido'),
  ('Servicios Generales','Caldera','Vapor'),
  ('Servicios Generales','Sistema de agua caliente','Limpieza'),
  ('Servicios Generales','Sistema de tratamiento de efluentes','Tratamiento'),
  ('Servicios Generales','Equipo de ósmosis inversa','Agua de proceso')
) AS v(cat,nom,uso)
ON CONFLICT ("ambito","clase","nombre") DO NOTHING;

-- ═══════════════ BODEGA · HERRAMIENTAS ═══════════════
INSERT INTO "recurso_maestro"
  ("ambito","clase","categoria","familia","nombre","potencia_hp","uso_principal","unidad_uso","consumo_descripcion","observaciones")
SELECT 'bodega'::"AmbitoRecurso",'herramienta'::"ClaseMaquinaria",'Herramientas de Bodega',NULL,v.nom,NULL,v.uso,NULL,NULL,NULL
FROM (VALUES
  ('Mangueras alimentarias','Trasiego'),
  ('Acoples sanitarios','Conexiones'),
  ('Válvulas sanitarias','Operación'),
  ('Lanzas de lavado','Limpieza'),
  ('Cepillos para barricas','Limpieza'),
  ('Cepillos para tanques','Limpieza'),
  ('Baldes de acero inoxidable','Preparación de insumos'),
  ('Jarras graduadas','Dosificación'),
  ('Probetas graduadas','Laboratorio'),
  ('Pipetas','Laboratorio'),
  ('Embudos alimentarios','Trasvases'),
  ('Termómetro digital','Control de temperatura'),
  ('Muestreador de vino','Extracción de muestras'),
  ('Oxímetro portátil','Oxígeno disuelto'),
  ('Linterna de inspección','Inspección de tanques')
) AS v(nom,uso)
ON CONFLICT ("ambito","clase","nombre") DO NOTHING;
