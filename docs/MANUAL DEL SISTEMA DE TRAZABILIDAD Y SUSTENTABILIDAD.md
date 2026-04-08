# **MANUAL DEL SISTEMA DE TRAZABILIDAD Y SUSTENTABILIDAD – NIVEL FINCA**

## **Documento Rector \+ Anexo Técnico**

---

## **PARTE I · DOCUMENTO RECTOR**

## **1\. Propósito del sistema**

El presente documento establece el **marco rector** del Sistema de Trazabilidad y Sustentabilidad Vitivinícola a nivel finca, diseñado para:

* Garantizar el **ORIGEN verificable** del producto.

* Registrar, ordenar y validar los **eventos productivos, ambientales, sanitarios y sociales**.

* Asegurar coherencia con los lineamientos de **Buenas Prácticas Agrícolas (BPA)** y los protocolos sectoriales vigentes (BA / COVIAR).

* Constituir una base sólida para **auditoría, interoperabilidad, inteligencia artificial y escalabilidad tecnológica**.

El sistema se concibe como una **plataforma operativa**, no solo documental, capaz de evolucionar por fases sin perder integridad histórica.

---

## **2\. Principios rectores**

El diseño del sistema se apoya en los siguientes principios innegociables:

1. **ORIGEN como condición de existencia**  
   Sin unidad productiva definida (Productor–Finca–Cuartel), no existe trazabilidad.

2. **Evento como unidad básica de registro**  
   Toda acción relevante se registra como evento con fecha, responsable y anclaje territorial.

3. **Herencia al Lote de Cosecha**  
   El Lote no duplica información: **hereda** todos los eventos del cuartel y la campaña.

4. **No reescritura de la historia**  
   Los datos no se sobrescriben: las correcciones se registran como nuevos eventos.

5. **Escalabilidad progresiva**  
   El sistema se implementa por fases, pasando de cumplimiento mínimo a excelencia técnica

## **3\. MARCO CONCEPTUAL: ESTRUCTURA POR CAPÍTULOS Y PLANILLAS**

## **CAPÍTULO 0 · GOBERNANZA TRANSFORMADORA**

### **Planilla: ORIGEN / UNIDAD PRODUCTIVA**

*(Planilla estructural – fundacional)*

---

### **0.1 Rol del capítulo (BA / COVIAR)**

Este capítulo **no gestiona una práctica**, gestiona el **sistema**.  
Su objetivo es garantizar que **todo lo que se registre después tenga anclaje territorial, temporal y responsable**.

Sin Capítulo 0 **no existe trazabilidad**, solo registros sueltos.

---

### **0.2 Planilla ORIGEN – Función**

* Define **quién produce**

* Define **dónde produce**

* Define **qué unidades productivas existen**

* Genera los **IDs base** del sistema

Esta planilla se carga:

* una vez por finca,

* se actualiza solo si hay cambios estructurales.

---

### **0.3 Unidad mínima asociada**

* **Finca**

* **Cuartel / Parcela** ← unidad mínima de ORIGEN

---

### **0.4 Campos obligatorios (productor carga)**

**Bloque A · Identificación**

* Productor / Razón social

* Finca

* Localidad / Provincia

**Bloque B · Unidad productiva**

* Código de cuartel / parcela

* Superficie (ha)

* Cultivo

* Variedad

**Bloque C · Sistema productivo**

* Sistema productivo (convencional / orgánico / integrado)

* Sistema de riego (goteo / aspersión / surco / otro)

* Sistema de conducción espaldero/ parral

* Distancia de plantación

---

### **0.5 Campos opcionales (muy recomendados)**

* RUT / RENSPA / catastro

* Observaciones técnicas

* Coordenadas / polígono (si existe)

---

### **0.6 Campos derivados por IA**

* **ID\_PRODUCTOR**

* **ID\_FINCA**

* **ID\_CUARTEL**

* Validación de duplicados

* Normalización de superficies y variedades

---

### **0.7 Tipo de dato**

* **Estructural / Catálogo**

* No es evento

* No tiene fecha de ocurrencia

---

### **0.8 Relación con otras planillas**

Todas dependen de esta:

* Riego

* Canopia

* Fertilización

* Fitosanitarios

* Cosecha

👉 Regla: **si no existe cuartel, la IA no permite cargar eventos**.

---

### **0.9 Resultado trazable**

* ORIGEN territorial definido

* Base para **herencia de eventos**

* Punto cero de blockchain / hash (si se usa)

---

## **CAPÍTULO 1 · GESTIÓN DE PROCESOS VITÍCOLAS RESPONSABLES**

Este capítulo **construye el ORIGEN productivo**, no solo territorial.

---

### **1.1 Planilla: MANEJO DE CANOPIA**

*(poda – desbrote – despampanado)*

---

**Rol del capítulo**

Demostrar que:

* el cultivo se maneja de forma planificada,

* se reduce presión sanitaria,

* se optimiza calidad y rendimiento.

---

**Función de la planilla**

Registrar **intervenciones físicas sobre la planta** que:

* condicionan sanidad,

* justifican (o evitan) fitosanitarios,

* impactan en rendimiento.

---

**Unidad mínima**

* **Cuartel \+ Campaña**

---

**Campos obligatorios**

* Fecha

* Cuartel

* Tipo de práctica:

  * poda

  * desbrote

  * despampanado

  * raleo (si aplica)

* Intensidad / criterio (texto o escala simple)

* Jornales u horas/cuartel

* Responsable

---

**Campos opcionales**

* Método (manual / mecánico)

* Observaciones técnicas

---

**Campos derivados por IA**

* Campaña (por fecha)

* Clasificación de práctica

* Indicadores de manejo (frecuencia / intensidad)

---

**Tipo de dato**

* **Evento productivo**

* Impacta en ORIGEN

---

**Relación con otras planillas**

* Monitoreo sanitario

* Aplicación de fitosanitarios

* Rendimiento en cosecha

---

**Resultado trazable**

* Evidencia directa de manejo sustentable

* Soporte técnico para decisiones posteriores

---

### **1.2 Planilla: MONITOREO DE ESTADO FENOLÓGICO**

---

**Función**

Registrar **en qué estado está el cultivo** para:

* contextualizar prácticas,

* justificar aplicaciones,

* ordenar la secuencia productiva.

---

**Unidad mínima**

* **Cuartel \+ Campaña**

---

**Campos obligatorios**

* Fecha

* Cuartel

* Estado fenológico (escala usada por el productor)(brotacion, floracion, envero, maduración)

* Responsable técnico

---

**Campos opcionales**

* Observaciones

* % avance ; en maduración °brix

---

**Campos derivados por IA**

* Orden temporal de estados

* Coherencia fenológica con fecha y variedad

---

**Tipo de dato**

* **Evento de monitoreo**

* No crea impacto directo, pero **justifica eventos críticos**

---

**Relación con otras planillas**

* Canopia

* Fitosanitarios

* Cosecha

---

**Resultado trazable**

* Línea temporal del cultivo

* Evidencia de gestión basada en observación

---

### **1.3 Planilla: COSECHA**

**(Creación del LOTE DE ORIGEN)**

---

**Rol crítico**

**Acá nace la trazabilidad del producto.**

Todo lo anterior **se hereda** al lote creado en este evento.

---

**Unidad mínima**

* **Cuartel \+ Campaña → Lote de cosecha**

---

**Campos obligatorios**

* Fecha de cosecha

* Cuartel

* Cantidad cosechada

* Unidad (kg / bins / cajas)

* Destino inmediato

* Responsable

---

**Campos derivados por IA (CRÍTICOS)**

* **ID\_LOTE\_COSECHA (único e inmutable)**

* Asociación automática:

  * cuartel

  * campaña

  * todos los eventos previos

---

**Tipo de dato**

* **Evento generador de entidad**

* Crea el LOTE

---

**Relación con otras planillas**

* Todo lo anterior (herencia)

* Todo lo posterior (bodega, transporte, etc.)

---

**Resultado trazable**

* ORIGEN del producto cerrado

* Base para QR, blockchain, auditoría, recall

---

**RESULTADO DE ESTA FASE**

Con **Capítulo 0 \+ Capítulo 1** definidos así:

✔ ORIGEN territorial  
✔ ORIGEN productivo  
✔ Secuencia lógica y auditada  
✔ Lenguaje alineado BA / COVIAR  
✔ Base lista para IA y plataforma

---

## **CAPÍTULO 2 · GESTIÓN DEL RECURSO HÍDRICO PARA USO AGRÍCOLA**

**Rol del capítulo (en el protocolo)**

Este capítulo demuestra que el productor:

* conoce **cómo, cuánto y cuándo riega**,

* gestiona el agua como **recurso crítico**,

* puede justificar eficiencia, consumos y decisiones,

* y evita impactos negativos por sobreuso o mala gestión.

👉 Para BA/COVIAR, el agua es **uno de los ejes más sensibles de sustentabilidad**.

---

### **2.1 Planilla: RIEGOS**

*(evento ambiental crítico)*

---

**Función de la planilla**

Registrar **cada evento de riego** aplicado a un cuartel, de forma que se pueda:

* cuantificar consumo,

* evaluar eficiencia,

* cruzar con fenología, clima y rendimiento,

* demostrar gestión responsable del recurso hídrico.

---

**Unidad mínima asociada**

* **Cuartel \+ Campaña**

---

**Campos obligatorios (productor)**

* Fecha

* Cuartel

* Volumen aplicado

* Unidad de volumen (m³ / mm)

* Tiempo de riego (horas)

* Sistema de riego (goteo / aspersión / surco / otro)

* Responsable del riego

---

**Campos opcionales (muy recomendados)**

* Hora de inicio

* Turno / bloque

* Fuente de agua (canal / pozo / mixto)

* Observaciones

---

**Campos derivados por IA**

* **Campaña** (por fecha)

* Conversión automática a **m³/ha**

* Acumulado hídrico por cuartel y campaña

* Indicadores de eficiencia (cuando hay caudal disponible)

---

**Tipo de dato**

* **Evento ambiental trazable**

* Impacta directamente en indicadores de sustentabilidad

---

**Relación con otras planillas**

* Precipitaciones

* Fenología

* Cosecha

* Energía (si hay bombeo)

---

**Resultado trazable**

* Historial hídrico por cuartel

* Evidencia objetiva de uso del agua

* Base para indicadores BA / COVIAR

---

### **2.2 Planilla: PRECIPITACIONES**

*(evento ambiental natural)*

---

**Función**

Registrar el **aporte hídrico natural**, necesario para:

* interpretar riegos,

* evaluar balances hídricos,

* contextualizar decisiones agronómicas.

---

**Unidad mínima asociada**

* **Finca**  
  *(se puede heredar a todos los cuarteles de la finca)*

---

**Campos obligatorios**

* Fecha

* Milímetros registrados

---

**Campos opcionales**

* Origen del dato (pluviómetro propio / estación cercana)

* Observaciones

---

**Campos derivados por IA**

* Asociación automática a cuarteles de la finca

* Acumulado mensual y por campaña

* Cruce con eventos de riego

---

**Tipo de dato**

* **Evento ambiental**

* No es acción del productor, pero **sí gestión del recurso**

---

**Relación con otras planillas**

* Riegos

* Fenología

* Producción / rendimiento

---

**Resultado trazable**

* Línea climática básica del ciclo productivo

* Soporte técnico para decisiones hídricas

---

### **2.3 Reglas de coherencia del Capítulo 2 (para IA y auditoría)**

Estas reglas **no las ve el productor**, pero son claves:

1. **No puede existir riego sin cuartel definido** (Cap. 0).

2. La IA debe alertar si:

   * hay riegos sin precipitaciones cargadas (si aplica),

   * hay consumos extremos respecto a superficie.

3. El acumulado hídrico debe poder calcularse:

   * por cuartel,

   * por campaña,

   * por kg producido (si hay cosecha).

---

**Relación del Capítulo 2 con el ORIGEN**

* El **agua no crea ORIGEN**, pero:

  * **califica** ese ORIGEN,

  * y se hereda al **Lote de Cosecha**.

Ejemplo de herencia:

“Este lote fue producido con X m³/ha de riego y Y mm de precipitación durante la campaña.”

---

**Resultado al cerrar el Capítulo 2**

Con este capítulo completo, la plataforma puede:

✔ mostrar uso de agua por cuartel  
✔ comparar campañas  
✔ generar indicadores BA/COVIAR  
✔ alimentar reportes ambientales  
✔ fortalecer la narrativa de sustentabilidad

## **CAPÍTULO 3 · GESTIÓN DEL SUELO PARA USO AGRÍCOLA**

Este capítulo demuestra que el productor **gestiona activamente el suelo** como recurso productivo y ambiental.

---

### **3.1 Planilla: LABORES CULTURALES / MANEJO DE SUELO**

**Unidad mínima**: Cuartel \+ Campaña

**Campos obligatorios**

* Fecha

* Cuartel

* Tipo de labor

* Intensidad / criterio

* Horas o jornales

* Responsable

**Tipo de dato**  
Evento productivo–ambiental

---

### **3.2 Planilla: FERTILIZACIÓN (APLICACIÓN)**

**Unidad mínima**: Cuartel \+ Campaña

**Campos obligatorios**

* Fecha

* Cuartel

* Producto / fuente nutricional

* Dosis

* Unidad

* Método de aplicación

* Responsable

**Campos derivados por IA**

* Coherencia dosis–superficie

* Acumulados por campaña

---

### **3.3 Planilla: ANÁLISIS DE SUELO**

**Unidad mínima**: Finca (opcionalmente Cuartel)

**Campos obligatorios**

* Fecha

* Unidad muestreada

* Origen / laboratorio

* Parámetros analizados

**Tipo de dato**  
Evento técnico de referencia

---

### **3.4 Planilla: ENMIENDAS (si aplica)**

**Unidad mínima**: Cuartel \+ Campaña

**Campos obligatorios**

* Fecha

* Tipo de enmienda

* Dosis

* Unidad

* Responsable

---

### **3.5 Planilla: COBERTURA VEGETAL / EROSIÓN**

**Unidad mínima**: Cuartel \+ Campaña

**Campos obligatorios**

* Fecha

* Tipo de cobertura

* Manejo aplicado

* Responsable

---

**Resultado Capítulo 3**

✔ Gestión documentada del suelo  
✔ Soporte técnico para fertilización y rendimiento  
✔ Evidencia BA / COVIAR de uso responsable del recurso suelo

*   
* ---

## **CAPÍTULO 4 · MANEJO INTEGRADO DE PLAGAS, ENFERMEDADES Y MALEZAS (MIP)**

**Rol del capítulo en el protocolo**

Este capítulo demuestra que el productor:

* **observa antes de intervenir**,

* aplica el enfoque de **manejo integrado**,

* reduce el uso innecesario de fitosanitarios,

* y controla riesgos ambientales, productivos y de inocuidad.

👉 Para BA/COVIAR, **no es aceptable aplicar sin monitorear**.

---

### **4.1 Planilla: MONITOREO DE ENFERMEDADES**

---

**Función de la planilla**

Registrar la **presencia y nivel de incidencia** de enfermedades para:

* justificar o descartar tratamientos,

* evaluar efectividad de prácticas culturales,

* demostrar gestión basada en evidencia.

---

**Unidad mínima asociada**

* **Cuartel \+ Campaña**

---

**Campos obligatorios**

* Fecha

* Cuartel

* Enfermedad observada

* Nivel de incidencia / severidad

* Responsable técnico

---

**Campos opcionales**

* Método de monitoreo

* Observaciones

* Ubicación puntual dentro del cuartel

---

**Campos derivados por IA**

* Campaña (por fecha)

* Tendencia temporal de incidencia

* Alertas por evolución rápida

---

**Tipo de dato**

* **Evento de monitoreo sanitario**

* No es intervención

---

**Relación con otras planillas**

* Manejo de canopia

* Monitoreo fenológico

* Aplicación de fitosanitarios

---

**Resultado trazable**

* Evidencia objetiva de presión sanitaria

* Soporte técnico para decisiones

---

### **4.2 Planilla: MONITOREO DE PLAGAS**

---

**Función**

Registrar la **presencia y dinámica de plagas** para:

* activar umbrales de acción,

* evaluar eficacia del manejo cultural,

* justificar tratamientos.

---

**Unidad mínima asociada**

* **Cuartel \+ Campaña**

---

**Campos obligatorios**

* Fecha

* Cuartel

* Plaga observada

* Nivel de incidencia / población

* Responsable técnico

---

**Campos opcionales**

* Método de muestreo

* Umbral de acción (si se usa)

* Observaciones

---

**Campos derivados por IA**

* Campaña

* Curva de incidencia

* Cruce con condiciones climáticas

---

**Tipo de dato**

* **Evento de monitoreo sanitario**

---

**Relación con otras planillas**

* Canopia

* Fenología

* Fitosanitarios

---

**Resultado trazable**

* Línea de presión de plagas por campaña

* Evidencia de manejo integrado

---

### **4.3 Planilla: APLICACIÓN DE FITOSANITARIOS**

*(evento ambiental crítico)*

---

**Función**

Registrar **toda intervención química**, demostrando que:

* está justificada,

* es técnicamente correcta,

* cumple con carencias y buenas prácticas,

* minimiza impactos ambientales.

---

**Unidad mínima asociada**

* **Cuartel \+ Campaña**

---

**Campos obligatorios**

* Fecha

* Cuartel

* Producto aplicado (nombre comercial)

* Dosis aplicada

* Unidad

* Carencia (días)

* Motivo / objetivo de la aplicación

* Responsable / aplicador

---

**Campos opcionales (muy relevantes)**

* Principio activo

* Volumen de caldo

* Equipo utilizado

* Condiciones climáticas

* Lote del producto (si se registra)

---

**Campos derivados por IA**

* Campaña

* Validación automática:

  * coherencia dosis–superficie,

  * carencia vs fecha de cosecha,

  * existencia de monitoreos previos.

* Clasificación de impacto (bajo/medio/alto)

---

**Tipo de dato**

* **Evento ambiental trazable**

* Alto nivel de auditoría

---

**Relación con otras planillas**

* Monitoreos (plagas y enfermedades)

* Inventario de insumos

* Sobrantes de caldos

* Cosecha (carencias)

---

**Resultado trazable**

* Historial completo de tratamientos

* Evidencia de cumplimiento normativo

---

**4.4 Planilla: SOBRANTES DE CALDOS / LAVADO DE EQUIPOS**

---

**Función**

Registrar la **gestión responsable de residuos líquidos** generados por:

* sobrantes de caldo,

* lavado de pulverizadoras.

---

**Unidad mínima asociada**

* **Finca**  
  *(puede asociarse a cuartel o aplicación si se desea)*

---

**Campos obligatorios**

* Fecha

* Tipo (sobrante de caldo / lavado)

* Volumen

* Forma de disposición

* Responsable

---

**Campos opcionales**

* Relación con aplicación específica

* Observaciones

---

**Campos derivados por IA**

* Identificación de eventos críticos

* Cruce con aplicaciones cercanas en fecha

---

**Tipo de dato**

* **Evento ambiental de gestión de residuos**

---

**Relación con otras planillas**

* Aplicación de fitosanitarios

* Gestión de residuos (Cap. 5\)

---

**Resultado trazable**

* Evidencia de control ambiental

* Reducción de riesgos de contaminación

---

**Reglas de coherencia del Capítulo 4 (clave para IA)**

1. **No debería existir aplicación sin monitoreo previo**  
   (la IA puede permitirlo, pero debe marcarlo).

2. Las **carencias** deben validarse contra fecha de cosecha.

3. La frecuencia de aplicaciones debe ser coherente con:

   * presión sanitaria,

   * manejo de canopia,

   * condiciones climáticas.

---

**Relación del Capítulo 4 con el ORIGEN**

Los eventos de este capítulo:

* **no crean ORIGEN**,

* pero **califican críticamente el ORIGEN**,

* y se heredan íntegramente al **Lote de Cosecha**.

Ejemplo:

“Este lote fue producido con X aplicaciones, justificadas por monitoreos Y, cumpliendo carencias.”

---

**Resultado al cerrar el Capítulo 4**

✔ Gestión integrada demostrable  
✔ Uso responsable de fitosanitarios  
✔ Evidencia sólida para BA / COVIAR  
✔ Insumos listos para indicadores y auditoría

---

---

## **CAPÍTULO 5 · GESTIÓN DE LA INOCUIDAD Y CALIDAD (FINCA)**

**Rol del capítulo en el protocolo**

Este capítulo demuestra que el productor:

* **previene la contaminación** del producto en origen,

* mantiene **condiciones higiénico–sanitarias adecuadas**,

* gestiona **desvíos y no conformidades**,

* y asegura **continuidad de la calidad** desde finca hacia bodega.

👉 Es el **puente crítico** entre producción primaria y etapas posteriores.

---

### **5.1 Planilla: LIMPIEZA DE ELEMENTOS DE COSECHA**

**Función**

Registrar la limpieza y estado sanitario de **bines, cajas y herramientas** que **entran en contacto directo** con el producto.

**Unidad mínima**

* **Finca** *(opcionalmente asociable a cuadrilla / lote de cosecha)*

**Campos obligatorios**

* Fecha

* Tipo de elemento (bines / cajas / herramientas)

* Método de limpieza (agua / detergente / desinfectante)

* Operario responsable

**Campos opcionales**

* Cantidad de elementos

* Observaciones (roturas, descartes)

**Campos derivados por IA**

* Vinculación temporal con **cosecha**

* Alertas si hay cosecha sin limpieza registrada

**Tipo de dato**

* **Evento de inocuidad**

**Relación**

* Cosecha (Cap. 1\)

* Productos no conformes (si se detectan desvíos)

**Resultado trazable**

* Evidencia de prevención de contaminación física y biológica

---

### **5.2 Planilla: SANITIZACIÓN DE BAÑOS (FIJOS Y QUÍMICOS)**

**Función**

Demostrar **condiciones higiénicas del personal**, clave para inocuidad del producto.

**Unidad mínima**

* **Finca / Área operativa**

**Campos obligatorios**

* Fecha

* Tipo de baño (fijo / químico)

* Checklist de limpieza (ítems sanitizados)

* Operario

* Supervisor (si aplica)

**Campos opcionales**

* Hora

* Observaciones

**Campos derivados por IA**

* Frecuencia de sanitización

* Alertas por períodos sin registro

**Tipo de dato**

* **Evento de higiene operativa**

**Relación**

* Cosecha

* Salud y seguridad (Cap. 7\)

**Resultado trazable**

* Evidencia de control sanitario del entorno humano

---

### **5.3 Planilla: PRODUCTOS NO CONFORMES *(si ocurre)***

**Función**

Registrar **desvíos de calidad o inocuidad** detectados en finca, y su gestión.

**Unidad mínima**

* **Cuartel / Lote / Proceso**

**Campos obligatorios**

* Fecha

* Descripción de la no conformidad

* Producto / proceso afectado

* Acción tomada (aislamiento, descarte, reproceso)

* Responsable

**Campos opcionales**

* Causa probable

* Acción correctiva/preventiva

**Campos derivados por IA**

* Clasificación de severidad

* Seguimiento de recurrencias

**Tipo de dato**

* **Evento de gestión de calidad**

**Relación**

* Limpieza

* Cosecha

* Reclamos

**Resultado trazable**

* Evidencia de **capacidad de control y corrección**

---

### **5.4 Planilla: RECLAMOS *(si ocurre)***

**Función**

Registrar **observaciones o reclamos** internos o externos relacionados con calidad/inocuidad en finca.

**Unidad mínima**

* **Finca / Proceso**

**Campos obligatorios**

* Fecha

* Origen del reclamo

* Descripción

* Responsable de gestión

**Campos opcionales**

* Acción tomada

* Estado (abierto/cerrado)

**Campos derivados por IA**

* Clasificación (calidad / higiene / proceso)

* Indicadores de recurrencia

**Tipo de dato**

* **Evento de gestión**

**Relación**

* Productos no conformes

* Capítulo 13 (cuando escale a comunidad/terceros)

**Resultado trazable**

* Evidencia de **escucha y respuesta**

---

### **5.5 Planilla: INVENTARIO DE INSUMOS Y PRODUCTOS CADUCADOS**

**Función**

Garantizar que **solo insumos habilitados y vigentes** estén disponibles para uso en finca.

**Unidad mínima**

* **Depósito / Finca**

**Campos obligatorios**

* Producto

* Cantidad

* Fecha de vencimiento

* Estado (vigente / bloqueado / vencido)

* Responsable

**Campos opcionales**

* Proveedor

* Lote del producto

**Campos derivados por IA**

* Alertas automáticas por vencimiento

* Bloqueo de uso en aplicaciones

**Tipo de dato**

* **Registro de gobernanza de inocuidad**

**Relación**

* Aplicación de fitosanitarios (Cap. 3\)

* Fertilización (Cap. 2\)

**Resultado trazable**

* Evidencia de **prevención de riesgos químicos**

---

**5.6 Planilla: GESTIÓN DE RESIDUOS**

**Función**

Registrar la **segregación y disposición** de residuos generados en finca, incluidos los asociados a inocuidad.

**Unidad mínima**

* **Finca** *(opcionalmente cuartel)*

**Campos obligatorios**

* Fecha

* Tipo de residuo

* Cantidad

* Destino final

* Responsable

**Campos opcionales**

* Gestor autorizado

* Observaciones

**Campos derivados por IA**

* Clasificación (peligroso / no peligroso)

* Indicadores de gestión ambiental

**Tipo de dato**

* **Evento ambiental–sanitario**

**Relación**

* Sobrantes de caldos (Cap. 3\)

* Inventarios

**Resultado trazable**

* Evidencia de **manejo responsable post-uso**

---

**Reglas de coherencia del Capítulo  5 (para IA/auditoría)**

1. **No debería haber cosecha sin limpieza de elementos** en fechas compatibles.

2. **Baños** deben tener registros durante períodos de actividad.

3. **Insumos vencidos** no pueden asociarse a aplicaciones.

4. **No conformidades** deben tener acción registrada.

---

**Relación del Capítulo 5 con el ORIGEN**

* No crea ORIGEN, pero **califica la aptitud sanitaria** del ORIGEN.

* Todos estos eventos **se heredan** al **Lote de Cosecha** como atributos de calidad/inocuidad.

---

**Resultado al cerrar el Capítulo 5**

✔ Prevención documentada  
✔ Control sanitario demostrable  
✔ Puente sólido finca → bodega  
✔ Base para auditorías BA / COVIAR

---

---

## **CAPÍTULO 6 · GESTIÓN DE LA EFICIENCIA ENERGÉTICA**

**Rol del capítulo en el protocolo**

Este capítulo demuestra que el productor:

* **mide y conoce** su consumo energético,

* identifica los **usos críticos** (riego, heladas),

* puede evaluar **eficiencia y oportunidades de mejora**,

* y aporta información a **acción climática** (Cap. 14).

👉 En BA/COVIAR **no se exige optimización inmediata**, pero sí **registro y gestión**.

---

### **6.1 Planilla: GASTO ENERGÉTICO PARA RIEGO**

**Función**

Registrar el consumo energético asociado al **uso del agua**.

**Unidad mínima**

* **Cuartel \+ Campaña**  
  *(puede ser mensual o por período)*

**Campos obligatorios**

* Período (mes / fecha desde–hasta)

* Cuartel

* Tipo de energía (eléctrica / combustible)

* Consumo (kWh / litros)

* Responsable

**Campos opcionales**

* Equipo asociado (bomba / sistema)

* Observaciones

**Campos derivados por IA**

* Consumo energético por ha

* Consumo energético por m³ de agua

* Cruce con eventos de riego (Cap. 2\)

**Tipo de dato**

* **Evento ambiental–energético**

**Relación**

* Riego (Cap. 2\)

* Acción climática (Cap. 14\)

**Resultado trazable**

* Evidencia de gestión del consumo energético hídrico

---

### **6.2 Planilla: GASTO ENERGÉTICO PARA DEFENSA CONTRA HELADAS**

**Función**

Registrar el consumo energético asociado a **eventos de defensa activa**.

**Unidad mínima**

* **Cuartel \+ Campaña**

**Campos obligatorios**

* Fecha / período

* Cuartel

* Tipo de energía

* Consumo

* Responsable

**Campos opcionales**

* Tipo de sistema (aspersión / calefacción / ventiladores)

* Observaciones

**Campos derivados por IA**

* Asociación con eventos climáticos

* Consumo por evento

* Indicadores de intensidad energética

**Tipo de dato**

* **Evento ambiental–energético**

**Relación**

* Precipitaciones / clima (Cap. 2\)

* Producción / rendimiento

**Resultado trazable**

* Evidencia de uso energético excepcional y justificado

---

**Reglas de coherencia Capítulo 6**

1. Debe existir **algún registro energético** si hay riego o heladas activas.

2. La IA puede estimar indicadores aun con datos parciales (fase 1).

3. No se bloquea operación si falta energía, pero **se marca como brecha**.

---

## **CAPÍTULO 7 · SALUD, HIGIENE Y SEGURIDAD DE LOS COLABORADORES**

**Rol del capítulo en el protocolo**

Demostrar que el productor:

* protege la **integridad física** del personal,

* capacita y previene riesgos,

* registra y gestiona incidentes.

👉 Es un capítulo **social crítico**, muy auditado.

---

### **7.1 Planilla: CAPACITACIONES**

**Función**

Registrar instancias de formación vinculadas a:

* seguridad,

* uso de insumos,

* higiene,

* buenas prácticas.

**Unidad mínima**

* **Productor / Finca**

**Campos obligatorios**

* Fecha

* Tema

* Participantes

* Responsable / capacitador

**Campos opcionales**

* Observaciones

* Documentación respaldatoria

**Campos derivados por IA**

* Frecuencia anual

* Temáticas cubiertas vs requeridas

**Tipo de dato**

* **Evento social preventivo**

**Relación**

* EPP

* Fitosanitarios (Cap. 4\)

---

### **7.2 Planilla: ENTREGA DE EPP**

**Función**

Registrar la **provisión de elementos de protección personal**.

**Unidad mínima**

* **Persona**

**Campos obligatorios**

* Fecha

* Persona

* Elemento entregado

* Responsable

**Campos opcionales**

* Cantidad

* Firma / conformidad

**Campos derivados por IA**

* Relación tarea–EPP

* Alertas por tareas sin EPP registrado

**Tipo de dato**

* **Evento social de protección**

---

### **7.3 Planilla: ACCIDENTES LABORALES**

**Función**

Registrar **incidentes y accidentes**, y demostrar capacidad de respuesta.

**Unidad mínima**

* **Persona / Finca**

**Campos obligatorios**

* Fecha

* Persona involucrada

* Tipo de accidente

* Lugar

* Acción tomada

**Campos opcionales**

* Días perdidos

* Acción correctiva/preventiva

**Campos derivados por IA**

* Clasificación de severidad

* Indicadores de recurrencia

**Tipo de dato**

* **Evento social crítico**

---

**Reglas de coherencia Capítulo 7**

1. Si hay personal activo → debe existir **alguna capacitación anual**.

2. Si hay fitosanitarios → debe existir **EPP registrado**.

3. Accidentes deben cerrar con acción documentada.

---

## **CAPÍTULO 8 · MANTENIMIENTO DE EQUIPOS Y MAQUINARIAS**

*(Capítulo de soporte – no bloqueante en fase 1\)*

**Rol del capítulo**

Asegurar que los equipos:

* funcionan correctamente,

* no generan riesgos ambientales,

* no comprometen seguridad ni calidad.

---

### **8.1 Planilla: MANTENIMIENTO DE EQUIPOS Y MAQUINARIAS**

**Función**

Registrar tareas de mantenimiento preventivo o correctivo.

**Unidad mínima**

* **Equipo / Maquinaria**

**Campos obligatorios**

* Fecha

* Equipo

* Tipo de mantenimiento

* Responsable

**Campos opcionales**

* Horas de uso

* Observaciones

**Campos derivados por IA**

* Historial por equipo

* Relación con fallas o incidentes

**Tipo de dato**

* **Evento de soporte operativo**

**Relación**

* Riego 

* Energía 

* Seguridad 

---

**CIERRE DEL BLOQUE PRODUCCIÓN EN FINCA**

Con los **Capítulos 0 a 8** definidos así, tenés:

✔ estructura 100 % alineada a BA / COVIAR  
✔ planillas mínimas, sin redundancias  
✔ ORIGEN blindado (territorial \+ productivo \+ sanitario)  
✔ base lista para IA, BD y blockchain  
✔ narrativa de sustentabilidad completa desde finca

---

# **4\. MODELO LÓGICO DE DATOS**

## **PASO A.1 — Entidades núcleo (tablas “madre”)**

### **1\) PRODUCTOR**

**PK:** id\_productor  
Campos típicos (mínimos):

* razon\_social

* cuit/cuit (opcional)

* contacto (opcional)

**Relación:** 1 Productor → N Fincas

---

### **2\) FINCA**

**PK:** id\_finca  
**FK:** id\_productor → PRODUCTOR  
Campos:

* nombre\_finca

* localidad, provincia

* catastro (opcional)

* geo\_poligono / coordenadas (opcional)

**Relación:** 1 Finca → N Cuarteles

---

### **3\) CUARTEL (unidad mínima de ORIGEN)**

**PK:** id\_cuartel  
**FK:** id\_finca → FINCA  
Campos (los estructurales del Cap. 0):

* codigo\_cuartel (el del productor)

* superficie\_ha

* cultivo, variedad

* sistema\_productivo (convencional/orgánico/integrado)

* sistema\_riego (goteo/aspersión/surco/otro)

* sistema\_conduccion (espaldero/parral)

* distancia\_plantacion

✅ **Regla:** sin id\_cuartel no se permite cargar eventos (Cap. 0). 

1\. MARCO CONCEPTUAL

---

### **4\) CAMPAÑA**

**PK:** id\_campania  
Campos:

* etiqueta (ej.: “2025/26”)

* fecha\_inicio, fecha\_fin (opcionales)

* estado (abierta/cerrada)

👉 Nota: la IA puede derivar campaña desde fecha\_evento, pero **en BD conviene que exista como entidad**.

---

### **5\) EVENTO (núcleo común a todas las planillas “con fecha”)**

**PK:** id\_evento  
**FK:** id\_cuartel → CUARTEL *(salvo eventos a nivel finca)*  
**FK:** id\_campania → CAMPAÑA  
Campos comunes:

* tipo\_evento (catálogo)

* fecha\_evento

* responsable

* observaciones

* origen\_carga (manual / IA / import)

* calidad\_dato (ok / alerta / incompleto) *(útil para auditoría)*

⚠️ Importante: algunas planillas son de **Finca** (p.ej. precipitaciones, sanitización de baños, residuos). Ahí el evento se ancla a id\_finca y opcionalmente se “hereda” a cuarteles por regla IA. Esto ya está contemplado en el marco (Cap. 2 precipitaciones; Cap. 5 higiene). 

1\. MARCO CONCEPTUAL

**Diseño recomendado (escalable):**

* EVENTO \= cabecera común

* Subtablas por tipo (abajo)

---

### **6\) LOTE\_COSECHA (entidad generada)**

**PK:** id\_lote\_cosecha (único e inmutable)  
**FK:** id\_cuartel, id\_campania  
Campos:

* fecha\_cosecha

* cantidad

* unidad (kg/bins/cajas)

* destino\_inmediato

* responsable

✅ **Regla:** nace SOLO en evento Cosecha (Cap. 1.3). 

1\. MARCO CONCEPTUAL

---

## **PASO A.2 — Subtablas (una por planilla “pesada”)**

Esto evita un “JSON gigante” y te deja auditoría \+ reporting limpios.

Ejemplos (alineados a tus capítulos):

### **Cap. 1 Manejo Canopia**

* evento\_canopia (FK id\_evento)

  * practica (poda/desbrote/…)

  * intensidad

  * horas\_jornales

  * metodo (opcional)

* evento\_fenologia

  * estado\_fenologico

  * %avance / brix (opcional)

* evento\_cosecha *(y además crea lote)*

  * cantidad, unidad, destino\_inmediato

  * id\_lote\_cosecha (FK)

### **Cap. 2 Riego**

* evento\_riego

  * volumen

  * unidad\_volumen (m3/mm)

  * tiempo\_horas

  * sistema\_riego

  * fuente\_agua (opcional)

  * hora\_inicio (opcional)

* evento\_precipitacion *(nivel finca)*

  * mm

  * origen\_dato (opcional)

### **Cap. 3 (Suelo en tu documento actual)**

* evento\_suelo\_labor

  * tipo\_labor

  * intensidad

  * horas\_jornales

* evento\_fertilizacion

  * producto\_fuente

  * dosis

  * unidad

  * metodo\_aplicacion

* evento\_analisis\_suelo *(finca o cuartel)*

  * laboratorio\_origen

  * parametros (estructura: ver catálogo abajo)

* evento\_enmienda

  * tipo\_enmienda

  * dosis, unidad

* evento\_cobertura\_erosion

  * tipo\_cobertura

  * manejo

### **Cap. 4 (MIP)**

* evento\_monitoreo\_enfermedades

  * enfermedad

  * incidencia\_severidad

  * metodo (opcional)

* evento\_monitoreo\_plagas

  * plaga

  * nivel

  * umbral (opcional)

* evento\_aplicacion\_fitosanitaria

  * producto\_comercial

  * principio\_activo (opcional)

  * dosis, unidad

  * carencia\_dias

  * motivo\_objetivo

  * volumen\_caldo (opcional)

  * condiciones\_climaticas (opcional)

  * lote\_producto (opcional)

* evento\_sobrantes\_lavado

  * tipo (sobrante/lavado)

  * volumen

  * disposicion

### **Cap. 5 (Inocuidad/Calidad)**

* evento\_limpieza\_cosecha *(finca)*

  * tipo\_elemento

  * metodo\_limpieza

  * cantidad (opcional)

* evento\_sanitizacion\_banios *(finca)*

  * tipo\_banio

  * checklist (estructura simple)

  * supervisor (opcional)

* evento\_no\_conformidad

  * descripcion

  * objeto\_afectado (lote/proceso)

  * accion\_tomada

  * causa\_probable (opcional)

* evento\_reclamo

  * origen

  * descripcion

  * estado

* inventario\_insumos *(no es evento puro; es “estado”)*

  * producto

  * cantidad

  * vencimiento

  * estado (vigente/bloqueado/vencido)

* evento\_residuos *(finca)*

  * tipo\_residuo

  * cantidad

  * destino\_final

  * gestor\_autorizado (opcional)

### **Cap. 6 (Energía)**

* evento\_energia\_riego

  * periodo\_desde/hasta (o mes)

  * tipo\_energia (kWh/litros)

  * consumo

  * equipo\_asociado (opcional)

* evento\_energia\_heladas

  * tipo\_sistema

  * consumo

### **Cap. 7 (SSyO)**

* evento\_capacitacion

  * tema

  * participantes

  * capacitador

* evento\_entrega\_epp

  * persona

  * elemento

  * cantidad

  * conformidad\_firma (opcional)

* evento\_accidente

  * persona

  * tipo\_accidente

  * lugar

  * accion\_tomada

  * dias\_perdidos (opcional)

### **Cap. 8 (Mantenimiento)**

* evento\_mantenimiento

  * equipo

  * tipo\_mantenimiento

  * horas\_uso (opcional)

---

## **PASO A.3 — Catálogos mínimos (para normalizar \+ IA)**

Estos catálogos evitan “texto libre” caótico y habilitan IA \+ indicadores.

* cat\_tipo\_evento

* cat\_practica\_canopia

* cat\_estado\_fenologico

* cat\_sistema\_riego, cat\_sistema\_productivo, cat\_sistema\_conduccion

* cat\_enfermedad, cat\_plaga

* cat\_producto\_insumo (para fertilizantes y fitosanitarios)

* cat\_unidades (kg, l, m3, mm, bins, etc.)

* cat\_residuo\_tipo

* cat\_equipo (si querés mantenimiento serio)

---

### **Reglas de integridad (las más importantes)**

1. **Evento exige ORIGEN:**  
   EVENTO.id\_cuartel obligatorio para todo lo que sea cuartel/campaña. (Cap. 0\) 

1\. MARCO CONCEPTUAL

2. **Evento exige CAMPAÑA:**  
   Siempre id\_campania (derivable por IA, pero guardado).

3. **Cosecha crea Lote:**  
   evento\_cosecha debe generar id\_lote\_cosecha inmutable. (Cap. 1.3) 

1\. MARCO CONCEPTUAL

4. **Eventos a nivel finca heredan:**  
   Precipitaciones, sanitización, residuos, etc. pueden registrarse en FINCA y heredarse a cuarteles por regla. (Cap. 2 y 5\) 

   1. MARCO CONCEPTUAL

## **PASO A.4 — Matriz Planilla → Modelo de datos**

**Leyenda rápida**

* **Anclaje**: dónde se “cuelga” el registro.

  * **Cuartel+Campaña** \= evento trazable directo

  * **Finca** \= evento de contexto (se hereda a cuarteles por regla)

  * **Depósito/Finca** \= estado/inventario

* **Herencia al Lote**: si el dato se incorpora a la narrativa del lote cosechado.

---

### **CAP. 0 — ORIGEN (estructural)**

| Cap | Planilla | Tipo de dato | Anclaje | Tabla | ¿Hereda al Lote? |
| :---- | :---- | :---- | :---- | :---- | :---- |
| 0 | ORIGEN / Unidad productiva | Estructural/Master Data | Productor→Finca→Cuartel | PRODUCTOR, FINCA, CUARTEL | Sí (como ORIGEN base) |

---

### **CAP. 1 — Procesos vitícolas responsables**

| Cap | Planilla | Tipo de dato | Anclaje | EVENTO.tipo\_evento | Subtabla | ¿Hereda al Lote? |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1.1 | Manejo de canopia | Evento productivo | Cuartel+Campaña | CANOPIA | EVENTO\_CANOPIA | Sí |
| 1.2 | Monitoreo fenológico | Evento monitoreo | Cuartel+Campaña | FENOLOGIA | EVENTO\_FENOLOGIA | Sí (contexto) |
| 1.3 | Cosecha | Evento generador | Cuartel+Campaña | COSECHA | EVENTO\_COSECHA \+ LOTE\_COSECHA | **Sí (crea lote)** |

---

### **CAP. 2 — Recurso hídrico**

| Cap | Planilla | Tipo de dato | Anclaje | EVENTO.tipo\_evento | Subtabla | ¿Hereda al Lote? |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 2.1 | Riegos | Evento ambiental crítico | Cuartel+Campaña | RIEGO | EVENTO\_RIEGO | Sí |
| 2.2 | Precipitaciones | Evento ambiental natural | **Finca** | PRECIPITACION | EVENTO\_PRECIPITACION | Sí (por herencia a cuarteles) |
| 2.3 | Reglas de coherencia | Regla (no dato) | — | — | Motor de reglas IA | — |

---

### **CAP. 3 — Suelo**

| Cap | Planilla | Tipo de dato | Anclaje | EVENTO.tipo\_evento | Subtabla | ¿Hereda al Lote? |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 3.1 | Labores culturales/manejo de suelo | Evento prod-ambiental | Cuartel+Campaña | SUELO\_LABOR | EVENTO\_SUELO\_LABOR | Sí |
| 3.2 | Fertilización (aplicación) | Evento prod-ambiental | Cuartel+Campaña | FERTILIZACION | EVENTO\_FERTILIZACION | Sí |
| 3.3 | Análisis de suelo | Evento técnico referencia | Finca (opt. Cuartel) | ANALISIS\_SUELO | EVENTO\_ANALISIS\_SUELO | Sí (como atributo contextual) |
| 3.4 | Enmiendas | Evento prod-ambiental | Cuartel+Campaña | ENMIENDA | EVENTO\_ENMIENDA | Sí |
| 3.5 | Cobertura/erosión | Evento prod-ambiental | Cuartel+Campaña | COBERTURA\_EROSION | EVENTO\_COBERTURA\_EROSION | Sí |

---

### **CAP. 4 — MIP (plagas/enfermedades/malezas)**

| Cap | Planilla | Tipo de dato | Anclaje | EVENTO.tipo\_evento | Subtabla | ¿Hereda al Lote? |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 4.1 | Monitoreo enfermedades | Evento monitoreo sanitario | Cuartel+Campaña | MON\_ENFERMEDAD | EVENTO\_MON\_ENFERMEDAD | Sí (justificación) |
| 4.2 | Monitoreo plagas | Evento monitoreo sanitario | Cuartel+Campaña | MON\_PLAGA | EVENTO\_MON\_PLAGA | Sí (justificación) |
| 4.3 | Aplicación fitosanitarios | Evento ambiental crítico | Cuartel+Campaña | FITO\_APLICACION | EVENTO\_FITO\_APLICACION | **Sí (crítico)** |
| 4.4 | Sobrantes/lavado equipos | Evento ambiental residuos | **Finca** (opt. cuartel) | FITO\_RESIDUOS | EVENTO\_FITO\_RESIDUOS | Sí (por herencia) |
| 4.x | Reglas coherencia | Regla | — | — | Motor IA | — |

---

### **CAP. 5 — Inocuidad y calidad (finca)**

| Cap | Planilla | Tipo de dato | Anclaje | EVENTO.tipo\_evento | Subtabla | ¿Hereda al Lote? |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 5.1 | Limpieza elementos cosecha | Evento inocuidad | **Finca** | LIMPIEZA\_COSECHA | EVENTO\_LIMPIEZA\_COSECHA | Sí (condiciona cosecha) |
| 5.2 | Sanitización de baños | Evento higiene | **Finca** | SANITIZACION\_BANIOS | EVENTO\_SANITIZACION\_BANIOS | Sí (contexto) |
| 5.3 | Productos no conformes | Evento calidad | Finca/Cuartel/Lote | NO\_CONFORMIDAD | EVENTO\_NO\_CONFORMIDAD | Sí (si vincula lote) |
| 5.4 | Reclamos | Evento gestión | Finca/Proceso | RECLAMO | EVENTO\_RECLAMO | Sí (si vincula lote) |
| 5.5 | Inventario insumos/caducados | **Estado** (no evento) | Depósito/Finca | — | INVENTARIO\_INSUMOS | Indirecto (bloqueos) |
| 5.6 | Gestión de residuos | Evento ambiental-sanitario | **Finca** | RESIDUOS | EVENTO\_RESIDUOS | Sí (contexto) |

---

### **CAP. 6 — Energía**

| Cap | Planilla | Tipo de dato | Anclaje | EVENTO.tipo\_evento | Subtabla | ¿Hereda al Lote? |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 6.1 | Gasto energético riego | Evento ambiental-energético | Cuartel+Campaña (por período) | ENERGIA\_RIEGO | EVENTO\_ENERGIA\_RIEGO | Sí (indicador) |
| 6.2 | Gasto energético heladas | Evento ambiental-energético | Cuartel+Campaña | ENERGIA\_HELADAS | EVENTO\_ENERGIA\_HELADAS | Sí (indicador) |

---

### **CAP. 7 — Salud, higiene y seguridad**

| Cap | Planilla | Tipo de dato | Anclaje | EVENTO.tipo\_evento | Subtabla | ¿Hereda al Lote? |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 7.1 | Capacitaciones | Evento social preventivo | Productor/Finca | CAPACITACION | EVENTO\_CAPACITACION | Sí (contexto social) |
| 7.2 | Entrega de EPP | Evento social protección | Persona (en finca) | ENTREGA\_EPP | EVENTO\_ENTREGA\_EPP | Sí (contexto) |
| 7.3 | Accidentes laborales | Evento social crítico | Persona/Finca | ACCIDENTE | EVENTO\_ACCIDENTE | Sí (contexto) |

---

### **CAP. 8 — Mantenimiento**

| Cap | Planilla | Tipo de dato | Anclaje | EVENTO.tipo\_evento | Subtabla | ¿Hereda al Lote? |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 8.1 | Mantenimiento equipos/maquinarias | Evento soporte operativo | Equipo/Finca | MANTENIMIENTO | EVENTO\_MANTENIMIENTO | Indirecto (riesgo/operación) |

---

## **PASO A.5 — Reglas de anclaje (lo más importante para que no se rompa ORIGEN)**

### **Regla 1 — Evento “técnico-trazable”**

Todo evento que impacta producción **debe** tener:

* id\_cuartel \+ id\_campania \+ fecha\_evento

### **Regla 2 — Eventos “contexto finca”**

Eventos como:

* precipitaciones

* sanitización

* residuos  
  pueden anclarse a **Finca**, pero deben:

* tener fecha\_evento

* poder heredarse a cuarteles por rango de fechas / campaña

### **Regla 3 — Lote \= sello de herencia**

El Lote de cosecha:

* se crea en COSECHA

* y referencia id\_cuartel \+ id\_campania

* todo evento de ese cuartel/campaña entra como “historia del lote” (por consulta)

## **ASO A.6 — Constraints, unicidad y herencia (esqueleto duro del sistema)**

### **6.1 Claves primarias y foráneas (PK/FK) obligatorias**

**Tablas “madre”**

* **PRODUCTOR**: id\_productor (PK)

* **FINCA**: id\_finca (PK), id\_productor (FK NOT NULL)

* **CUARTEL**: id\_cuartel (PK), id\_finca (FK NOT NULL)

* **CAMPANIA**: id\_campania (PK)

* **EVENTO**: id\_evento (PK)

**Entidad generada**

* **LOTE\_COSECHA**: id\_lote\_cosecha (PK), id\_cuartel (FK NOT NULL), id\_campania (FK NOT NULL)

✅ Esto garantiza el principio: **sin ORIGEN (cuartel) no hay trazabilidad**. 

1\. MARCO CONCEPTUAL

---

### **6.2 “NOT NULL” mínimos por tabla (lo que no puede faltar)**

**CUARTEL (ORIGEN mínimo)**

* codigo\_cuartel NOT NULL

* superficie\_ha NOT NULL

* cultivo NOT NULL

* variedad NOT NULL

*(sistema\_riego, sistema\_productivo, etc. pueden ser NOT NULL si querés madurez alta desde día 1; si no, quedan como “requeridos con alerta” por IA).*

**EVENTO (cabecera)**

* tipo\_evento NOT NULL

* fecha\_evento NOT NULL

* responsable NOT NULL (puede ser “N/D” si se permite)

* id\_campania NOT NULL

**Evento a Cuartel (trazable):**

* id\_cuartel NOT NULL

**Evento a Finca (contexto):**

* id\_finca NOT NULL

Implementación práctica: EVENTO lleva **id\_finca opcional** \+ **id\_cuartel opcional**, y se exige uno u otro según el tipo\_evento (ver CHECKs).

**LOTE\_COSECHA**

* fecha\_cosecha NOT NULL

* cantidad NOT NULL

* unidad NOT NULL

* destino\_inmediato NOT NULL

---

### **6.3 CHECK constraints (reglas que se validan automáticamente)**

### **6.3.1 Anclaje correcto según tipo de evento**

**Regla:**

* si tipo\_evento ∈ {RIEGO, CANOPIA, FENOLOGIA, FERTILIZACION, FITO\_APLICACION, etc.} ⇒ **requiere id\_cuartel**

* si tipo\_evento ∈ {PRECIPITACION, SANITIZACION\_BANIOS, RESIDUOS, LIMPIEZA\_COSECHA, FITO\_RESIDUOS} ⇒ **requiere id\_finca** (cuartel opcional)

Esto evita el error típico: “evento crítico cargado sin cuartel”.

### **6.3.2 Rangos de valores (ejemplos mínimos)**

* CUARTEL.superficie\_ha \> 0

* RIEGO.volumen \> 0

* PRECIPITACION.mm \>= 0

* FITO\_APLICACION.carencia\_dias \>= 0

* COSECHA.cantidad \> 0

---

### **6.4 Unicidad / deduplicación (la parte que evita caos)**

Acá definimos qué hace que algo sea “el mismo evento”. No es trivial: hay eventos repetibles (riegos) y otros más “únicos” (análisis de suelo).

### **6.4.1 Regla general (EVENTO)**

**Unique parcial por defecto (recomendado):**

* (tipo\_evento, id\_cuartel, fecha\_evento, hash\_contenido) UNIQUE

Donde hash\_contenido se calcula sobre los campos clave del subevento (p.ej. volumen \+ horas \+ sistema en riego).

👉 Ventaja: permite 2 eventos el mismo día si son distintos (p.ej. dos riegos), pero bloquea duplicados exactos.

### **6.4.2 Unicidad específica por planilla (más fuerte donde conviene)**

**FENOLOGIA (Cap. 1.2)**

* UNIQUE (id\_cuartel, id\_campania, fecha\_evento, estado\_fenologico)  
  *(evita repetir “envero” dos veces el mismo día para el mismo cuartel)*

**ANÁLISIS DE SUELO (Cap. 3.3)**

* UNIQUE (unidad\_muestreada, fecha\_evento, laboratorio\_origen)  
  *(unidad\_muestreada \= finca o cuartel)*

**SANITIZACIÓN BAÑOS (Cap. 5.2)**

* UNIQUE (id\_finca, fecha\_evento, tipo\_banio)  
  *(si cargan a la mañana y tarde, se puede extender con hora)*

**INVENTARIO INSUMOS (Cap. 5.5)** *(estado, no evento)*

* UNIQUE (id\_finca o id\_deposito, producto, fecha\_vencimiento, lote\_producto)  
  *(si existe lote; si no, sin lote)*

---

### **6.5 Integridad del Lote: creación, inmutabilidad y herencia**

### **6.5.1 Creación obligatoria**

Cuando se inserta EVENTO\_COSECHA:

* se debe **crear** LOTE\_COSECHA

* y guardar el id\_lote\_cosecha en EVENTO\_COSECHA

✅ Esto implementa literalmente tu regla: “Acá nace la trazabilidad del producto.” 

1\. MARCO CONCEPTUAL

### **6.5.2 Inmutabilidad del lote**

* id\_lote\_cosecha **nunca se edita**

* si hay corrección: se crea **lote corregido** \+ se “anula” el anterior (campo estado: activo/anulado) con motivo.

Esto es clave si después querés blockchain: no se reescribe historia.

### **6.5.3 Herencia formal (cómo se implementa sin duplicar datos)**

No copiamos eventos dentro del lote; se hace por **vista / consulta**:

**Vista conceptual: vw\_lote\_historia**  
Trae:

* todos los EVENTOS del id\_cuartel \+ id\_campania

* y opcionalmente los de FINCA que caen en el rango de campaña (precipitaciones, sanitización, residuos, etc.)

* con filtros “previos a cosecha” cuando corresponda (carencias)

Esto te da:

* auditoría completa,

* QR con resumen,

* y trazabilidad “cerrada”.

---

### **6.6 Reglas críticas que pasan de “documento” a “constraint” (bloqueos)**

Estas son las **3** que yo pondría como **bloqueantes** desde el MVP:

1. **No hay evento trazable sin cuartel** (para tipos críticos)

2. **No hay cosecha si existe una aplicación fitosanitaria con carencia activa**

   * condición: fecha\_cosecha \< fecha\_aplicacion \+ carencia\_dias

3. **No se permite usar insumos vencidos en fertilización/fitosanitarios**

   * condición: fecha\_evento \<= vencimiento del producto (si se gestiona inventario)

*(Todo lo demás puede ser alerta al principio, para facilitar adopción.)*

## **PASO A.7 — Diccionario de datos (core) \+ catálogos**

### **7.1 Convenciones generales**

* IDs: uuid (recomendado) o bigint autoincremental.

* Fechas: date (si hay hora, timestamp).

* Cantidades: numeric(12,3) (evita errores de coma).

* Textos controlados: **catálogos** (FK a tablas cat\_\*) en vez de texto libre.

* Campo “responsable”: varchar(120) (o FK a tabla PERSONA si se implementa).

* Siempre guardar:

  * created\_at timestamp

  * created\_by varchar(60) (usuario o “IA/import”)

  * source varchar(30) (manual / ia / import)

---

### **7.2 Tablas “madre” — Campos y tipos**

**PRODUCTOR**

| Campo | Tipo | Oblig. MVP | Comentario |
| :---- | :---- | :---- | :---- |
| id\_productor | uuid | Sí | PK |
| razon\_social | varchar(150) | Sí |  |
| cuit | varchar(20) | No | opcional (o RUT/RENSPA) |
| email | varchar(120) | No |  |
| telefono | varchar(50) | No |  |
| created\_at | timestamp | Sí |  |
| created\_by | varchar(60) | Sí |  |

**FINCA**

| Campo | Tipo | Oblig. MVP | Comentario |
| :---- | :---- | :---- | :---- |
| id\_finca | uuid | Sí | PK |
| id\_productor | uuid | Sí | FK PRODUCTOR |
| nombre\_finca | varchar(150) | Sí |  |
| localidad | varchar(120) | Sí |  |
| provincia | varchar(120) | Sí |  |
| catastro | varchar(80) | No |  |
| geo\_poligono | text / geometry | No | según stack GIS |
| created\_at | timestamp | Sí |  |
| created\_by | varchar(60) | Sí |  |

**CUARTEL**

| Campo | Tipo | Oblig. MVP | Comentario |
| :---- | :---- | :---- | :---- |
| id\_cuartel | uuid | Sí | PK |
| id\_finca | uuid | Sí | FK FINCA |
| codigo\_cuartel | varchar(60) | Sí | clave humana |
| superficie\_ha | numeric(10,3) | Sí | \>0 |
| cultivo | varchar(80) | Sí | o FK cat\_cultivo |
| variedad | varchar(80) | Sí | o FK cat\_variedad |
| sistema\_productivo | uuid | No\* | FK cat\_sistema\_productivo |
| sistema\_riego | uuid | No\* | FK cat\_sistema\_riego |
| sistema\_conduccion | uuid | No\* | FK cat\_conduccion |
| distancia\_plantacion | varchar(50) | No |  |
| observaciones | text | No |  |
| created\_at | timestamp | Sí |  |
| created\_by | varchar(60) | Sí |  |

\* Recomendación: en MVP puede ser “No pero alertable”. En fase 2 los volvés obligatorios (Cap. 0). 

1\. MARCO CONCEPTUAL

**CAMPANIA**

| Campo | Tipo | Oblig. MVP | Comentario |
| :---- | :---- | :---- | :---- |
| id\_campania | uuid | Sí | PK |
| etiqueta | varchar(20) | Sí | ej “2025/26” |
| fecha\_inicio | date | No |  |
| fecha\_fin | date | No |  |
| estado | varchar(20) | Sí | abierta/cerrada |
| created\_at | timestamp | Sí |  |
| created\_by | varchar(60) | Sí |  |

---

### **7.3 EVENTO (cabecera) — Campos y tipos**

**EVENTO**

| Campo | Tipo | Oblig. MVP | Comentario |
| :---- | :---- | :---- | :---- |
| id\_evento | uuid | Sí | PK |
| tipo\_evento | uuid | Sí | FK cat\_tipo\_evento |
| fecha\_evento | date | Sí |  |
| id\_campania | uuid | Sí | FK CAMPANIA |
| id\_cuartel | uuid | Condicional | requerido si evento “trazable” |
| id\_finca | uuid | Condicional | requerido si evento “contexto finca” |
| responsable | varchar(120) | Sí | o FK persona |
| observaciones | text | No |  |
| origen\_carga | varchar(20) | Sí | manual/ia/import |
| calidad\_dato | varchar(20) | Sí | ok/alerta/incompleto |
| hash\_contenido | char(64) | No | para deduplicación |
| created\_at | timestamp | Sí |  |
| created\_by | varchar(60) | Sí |  |

**Regla de CHECK (conceptual):**

* si tipo\_evento ∈ “cuartel” ⇒ id\_cuartel NOT NULL

* si tipo\_evento ∈ “finca” ⇒ id\_finca NOT NULL  
  (ya lo fijamos en A.6, acá queda documentado). 

1\. MARCO CONCEPTUAL

---

### **7.4 LOTE\_COSECHA — Campos y tipos**

**LOTE\_COSECHA**

| Campo | Tipo | Oblig. MVP | Comentario |
| :---- | :---- | :---- | :---- |
| id\_lote\_cosecha | varchar(40) | Sí | único e inmutable (puede ser uuid \+ prefijo) |
| id\_cuartel | uuid | Sí | FK CUARTEL |
| id\_campania | uuid | Sí | FK CAMPANIA |
| fecha\_cosecha | date | Sí |  |
| cantidad | numeric(12,3) | Sí |  |
| unidad | uuid | Sí | FK cat\_unidad |
| destino\_inmediato | varchar(120) | Sí |  |
| responsable | varchar(120) | Sí |  |
| estado | varchar(20) | Sí | activo/anulado |
| motivo\_anulacion | text | No |  |
| created\_at | timestamp | Sí |  |
| created\_by | varchar(60) | Sí |  |

**Nota técnica:** id\_lote\_cosecha conviene que sea “humano”:  
Ej.: LC-\<id\_cuartel\_corto\>-\<campania\>-\<yyyymmdd\>-\<correlativo\>.

---

### **7.5 Subtablas por tipo de evento — Campos mínimos**

A continuación, lo mínimo para implementar MVP sin “llenar de campos”:

**Cap. 1 — CANOPIA**

**EVENTO\_CANOPIA**

* id\_evento (PK/FK)

* practica (FK cat\_practica\_canopia)

* intensidad (varchar(50) o numeric)

* horas\_jornales (numeric(10,2))

* metodo (FK cat\_metodo) \[opcional\]

**Cap. 1 — FENOLOGIA**

**EVENTO\_FENOLOGIA**

* id\_evento

* estado\_fenologico (FK cat\_estado\_fenologico)

* avance\_pct (numeric(5,2)) \[opcional\]

* brix (numeric(5,2)) \[opcional\]

**Cap. 1 — COSECHA**

**EVENTO\_COSECHA**

* id\_evento

* id\_lote\_cosecha (FK)

* cantidad (numeric)

* unidad (FK cat\_unidad)

* destino\_inmediato (varchar)  
  *(y genera lote, según A.6)*

**Cap. 2 — RIEGO**

**EVENTO\_RIEGO**

* id\_evento

* volumen (numeric(12,3))

* unidad\_volumen (FK cat\_unidad\_volumen: m3/mm)

* tiempo\_horas (numeric(8,2))

* sistema\_riego (FK cat\_sistema\_riego)

* fuente\_agua (FK cat\_fuente\_agua) \[opcional\]

* hora\_inicio (timestamp) \[opcional\]

**Cap. 2 — PRECIPITACIÓN (Finca)**

**EVENTO\_PRECIPITACION**

* id\_evento

* mm (numeric(8,2))

* origen\_dato (FK cat\_origen\_precipitacion) \[opcional\]

**Cap. 3 — LABORES SUELO**

**EVENTO\_SUELO\_LABOR**

* id\_evento

* tipo\_labor (FK cat\_tipo\_labor\_suelo)

* intensidad (varchar(50))

* horas\_jornales (numeric)

**Cap. 3 — FERTILIZACIÓN**

**EVENTO\_FERTILIZACION**

* id\_evento

* producto\_fuente (FK cat\_insumo)

* dosis (numeric(12,3))

* unidad\_dosis (FK cat\_unidad)

* metodo\_aplicacion (FK cat\_metodo\_aplicacion)

**Cap. 3 — ANÁLISIS DE SUELO**

**EVENTO\_ANALISIS\_SUELO**

* id\_evento

* unidad\_muestreada\_tipo (varchar(10): FINCA/CUARTEL)

* unidad\_muestreada\_id (uuid)

* laboratorio\_origen (varchar(120))

* parametros\_json (jsonb) *(pH, MO, CE, P, N, K, etc.)*

**Cap. 4 — FITOSANITARIOS (aplicación)**

**EVENTO\_FITO\_APLICACION**

* id\_evento

* producto\_comercial (FK cat\_insumo)

* principio\_activo (varchar(120)) \[opcional\]

* dosis (numeric(12,3))

* unidad\_dosis (FK cat\_unidad)

* carencia\_dias (int)

* motivo (varchar(150))

* volumen\_caldo (numeric) \[opcional\]

* condiciones\_json (jsonb) \[opcional\]

* lote\_producto (varchar(60)) \[opcional\]

**Cap. 5 — INVENTARIO INSUMOS (estado)**

**INVENTARIO\_INSUMOS**

* id\_inventario (uuid PK)

* id\_finca (uuid)

* producto (FK cat\_insumo)

* cantidad (numeric)

* unidad (FK cat\_unidad)

* fecha\_vencimiento (date)

* estado (vigente/bloqueado/vencido)

* lote\_producto (varchar(60)) \[opcional\]

* updated\_at timestamp

*(Esto aplica a Cap. 5.5 y alimenta la regla de bloqueo A.6)* 

1\. MARCO CONCEPTUAL

---

### **7.6 Catálogos (tablas cat\_\*) — mínimos para empezar**

**cat\_tipo\_evento (obligatorio)**

Campos:

* id\_tipo\_evento (uuid PK)

* codigo (varchar(40)) ej: RIEGO, COSECHA, FITO\_APLICACION

* nivel\_anclaje (varchar(10)) CUARTEL / FINCA / PERSONA / EQUIPO

* es\_critico (bool)

* bloquea\_si\_incompleto (bool)

👉 Este catálogo permite implementar automáticamente el CHECK de anclaje.

**cat\_unidad**

* kg, bins, cajas, l, m3, mm, kWh, litros\_combustible, horas, jornales…

**cat\_insumo**

* nombre\_comercial

* categoria (fertilizante/fitosanitario/desinfectante/etc.)

* principio\_activo (si corresponde)

* riesgo (bajo/medio/alto) *(útil para indicadores)*

**cat\_estado\_fenologico / cat\_practica\_canopia / cat\_plaga / cat\_enfermedad / cat\_tipo\_residuo / cat\_tipo\_labor\_suelo**

*(mínimos para normalizar texto y entrenar IA)*

---

### **7.7 Obligatorio por fase (MVP vs ampliado)**

Para implementación realista (productores):

**MVP (bloqueante)**

* ORIGEN (Productor/Finca/Cuartel)

* CANOPIA, FENOLOGIA, COSECHA

* RIEGO

* FITO\_APLICACION

* LIMPIEZA\_COSECHA *(si hay cosecha)*

* INVENTARIO (solo si se quiere bloquear vencidos desde inicio)

**Ampliado (alerta primero, bloqueante después)**

* Análisis de suelo

* Cobertura/erosión

* Energía

* SSyO

* Mantenimiento

## **PASO B.1 — Motor de Reglas (IA \+ Auditoría)**

### **1\) Estructura de tabla para reglas (modelo lógico)**

Te conviene una tabla “catálogo de reglas” y una tabla de “resultados/ejecuciones”.

**A. cat\_regla**

* id\_regla (uuid)

* codigo (ej: R-ORIGEN-001)

* titulo

* capitulo\_referencia (0..8)

* gatillo\_tipo\_evento (ej: COSECHA, FITO\_APLICACION, RIEGO…)

* severidad (**BLOQUEO / ALERTA / INFO**)

* descripcion\_condicion (texto)

* logica\_condicion (expresión / pseudo-SQL / JSON rules)

* mensaje\_usuario (texto claro para productor)

* evidencia\_requerida (qué campos deben existir)

* activo (bool)

**B. regla\_resultado**

* id\_resultado

* id\_regla

* id\_evento (si aplica)

* id\_lote\_cosecha (si aplica)

* estado (cumple/no\_cumple)

* detalle (jsonb: valores hallados)

* fecha\_ejecucion

* resuelto (bool) \+ resuelto\_por \+ resuelto\_fecha

Esto te deja “traza de auditoría” de la IA: no solo decide; **explica y registra**.

---

### **2\) Reglas BLOQUEANTES (MVP) — las 12 críticas**

Estas son las que yo implementaría como **BLOQUEO** desde el arranque, porque sostienen ORIGEN y cumplimiento básico.

**R-ORIGEN-001 — No hay evento trazable sin Cuartel (Cap. 0\)**

* **Gatillo:** cualquier evento de nivel CUARTEL

* **Condición:** id\_cuartel IS NULL

* **Acción:** BLOQUEO

* **Mensaje:** “Para registrar este evento necesitás seleccionar un Cuartel (ORIGEN).”

* **Evidencia:** id\_cuartel

**R-CAMP-001 — Todo evento debe pertenecer a una Campaña**

* **Gatillo:** cualquier evento

* **Condición:** id\_campania IS NULL

* **Acción:** BLOQUEO

* **Mensaje:** “Falta definir Campaña. Se asigna automáticamente por fecha o seleccionála.”

* **Evidencia:** id\_campania

**R-COSECHA-001 — Cosecha debe crear Lote (Cap. 1.3)**

* **Gatillo:** COSECHA

* **Condición:** id\_lote\_cosecha IS NULL

* **Acción:** BLOQUEO

* **Mensaje:** “La cosecha debe generar un ID de Lote de Cosecha único.”

* **Evidencia:** id\_lote\_cosecha

**R-COSECHA-002 — Cosecha debe tener cantidad \> 0 y unidad**

* **Gatillo:** COSECHA

* **Condición:** cantidad\<=0 OR unidad IS NULL

* **Acción:** BLOQUEO

* **Mensaje:** “Completá cantidad cosechada y unidad (kg/bins/cajas).”

* **Evidencia:** cantidad, unidad

**R-FITO-001 — No permitir cosecha con carencia activa (Cap. 4.3 ↔ Cap. 1.3)**

* **Gatillo:** COSECHA

* **Condición:** existe FITO\_APLICACION en el mismo cuartel/campaña tal que  
  fecha\_cosecha \< (fecha\_aplicacion \+ carencia\_dias)

* **Acción:** BLOQUEO

* **Mensaje:** “No podés cosechar: hay carencia activa por una aplicación fitosanitaria.”

* **Evidencia:** fecha\_aplicacion, carencia\_dias, fecha\_cosecha

**R-FITO-002 — No permitir aplicación con dosis/unidad incompletas**

* **Gatillo:** FITO\_APLICACION

* **Condición:** dosis IS NULL OR unidad\_dosis IS NULL

* **Acción:** BLOQUEO

* **Mensaje:** “Completá dosis y unidad de aplicación.”

* **Evidencia:** dosis, unidad

**R-FITO-003 — No permitir uso de insumo vencido (si hay inventario) (Cap. 5.5 ↔ Cap. 4.3/3.2)**

* **Gatillo:** FITO\_APLICACION o FERTILIZACION

* **Condición:** existe inventario del producto con fecha\_vencimiento \< fecha\_evento y estado ≠ “vigente”

* **Acción:** BLOQUEO

* **Mensaje:** “El insumo está vencido o bloqueado. Actualizá inventario o cambiá de producto.”

* **Evidencia:** inventario\_insumos

**R-RIEGO-001 — Riego debe tener volumen y unidad (Cap. 2.1)**

* **Gatillo:** RIEGO

* **Condición:** volumen IS NULL OR unidad\_volumen IS NULL

* **Acción:** BLOQUEO

* **Mensaje:** “Completá volumen aplicado y unidad (m³ o mm).”

* **Evidencia:** volumen, unidad

**R-LIMPIEZA-001 — No permitir cosecha sin limpieza de elementos (ventana temporal) (Cap. 5.1 ↔ Cap. 1.3)**

* **Gatillo:** COSECHA

* **Condición:** no existe LIMPIEZA\_COSECHA en finca asociada en ventana \[fecha\_cosecha − X días, fecha\_cosecha\]

* **Acción:** BLOQUEO (o ALERTA fuerte en MVP inicial si querés adopción)

* **Mensaje:** “Antes de cosechar, registrá limpieza de bines/cajas/herramientas.”

* **Evidencia:** evento\_limpieza

X por defecto: **7 días** (configurable).

**R-ORIGEN-002 — Duplicados de cuartel en una misma finca**

* **Gatillo:** alta/modificación CUARTEL

* **Condición:** mismo id\_finca \+ codigo\_cuartel ya existe

* **Acción:** BLOQUEO

* **Mensaje:** “Ya existe un cuartel con ese código en la finca. Revisá duplicados.”

* **Evidencia:** codigo\_cuartel

**R-INV-001 — Inventario: vencidos pasan a “vencido” automáticamente**

* **Gatillo:** job diario / al consultar

* **Condición:** hoy \> fecha\_vencimiento

* **Acción:** BLOQUEO lógico (cambio de estado)

* **Mensaje:** (interno)

* **Evidencia:** inventario\_insumos

**R-EVENTO-001 — Bloqueo por duplicado exacto (hash)**

* **Gatillo:** cualquier evento

* **Condición:** existe evento con mismo (tipo\_evento, cuartel/finca, fecha\_evento, hash\_contenido)

* **Acción:** BLOQUEO

* **Mensaje:** “Este evento ya fue cargado (duplicado).”

* **Evidencia:** hash\_contenido

---

### **3\) Reglas ALERTA (MVP) — “calidad técnica” sin frenar operación**

Estas no bloquean, pero generan:

* bandera en calidad\_dato=alerta

* registro en regla\_resultado

* reportes BA/COVIAR

**A-MIP-001 — Aplicación sin monitoreo previo (Cap. 4\)**

* **Gatillo:** FITO\_APLICACION

* **Condición:** no existe MON\_PLAGA o MON\_ENFERMEDAD en ventana previa (ej. 14 días)

* **Severidad:** ALERTA

* **Mensaje:** “Aplicación sin monitoreo previo registrado. Para BA/COVIAR se recomienda monitorear antes.”

* **Evidencia:** monitoreos

**A-AGUA-001 — Riegos sin precipitaciones registradas (Cap. 2\)**

* **Gatillo:** RIEGO

* **Condición:** no hay PRECIPITACION en la campaña para esa finca

* **Severidad:** ALERTA

* **Mensaje:** “No hay precipitaciones registradas en la campaña. Esto mejora el balance hídrico.”

* **Evidencia:** precipitaciones

**A-SUELO-001 — Fertilización sin análisis de suelo (Cap. 3\)**

* **Gatillo:** FERTILIZACION

* **Condición:** no hay ANALISIS\_SUELO vigente (ej. últimos 12 meses)

* **Severidad:** ALERTA

* **Mensaje:** “Fertilización sin análisis de suelo reciente. Recomendado para evidencia técnica.”

* **Evidencia:** análisis\_suelo

**A-HIG-001 — Falta de sanitización durante período de cosecha (Cap. 5.2)**

* **Gatillo:** COSECHA (o período activo)

* **Condición:** no existe SANITIZACION\_BANIOS en ventana (ej. 7 días)

* **Severidad:** ALERTA

* **Mensaje:** “No hay sanitización de baños registrada en el período. Recomendado para inocuidad.”

* **Evidencia:** sanitización

**A-ENER-001 — Hay riego, pero no hay energía (Cap. 6\)**

* **Gatillo:** cierre de campaña / reporte

* **Condición:** existe RIEGO pero no existe ENERGIA\_RIEGO

* **Severidad:** ALERTA

* **Mensaje:** “No hay consumo energético asociado al riego. Se recomienda registrar para eficiencia.”

* **Evidencia:** energía\_riego

**A-SSO-001 — Si hay fitosanitarios, debería haber EPP (Cap. 7\)**

* **Gatillo:** FITO\_APLICACION

* **Condición:** no existe ENTREGA\_EPP en campaña para personal asociado

* **Severidad:** ALERTA

* **Mensaje:** “Hay aplicaciones fitosanitarias sin entrega de EPP registrada.”

* **Evidencia:** epp

---

### **4\) Reglas INFO (generación de indicadores automáticos)**

Estas reglas generan indicadores BA/COVIAR sin frenar nada.

**I-AGUA-IND-001 — m³/ha por cuartel/campaña**

* **Input:** RIEGO (volumen \+ unidad) \+ CUARTEL.superficie\_ha

* **Output:** m3\_ha\_campania, m3\_total\_campania

**I-FITO-IND-001 — Nº aplicaciones por cuartel/campaña \+ carencias cumplidas**

* **Output:** conteo, % con monitoreo previo, carencias OK

**I-SUELO-IND-001 — Fertilización acumulada por campaña (kg/ha)**

* **Output:** kg/ha por producto o por nutriente (si normalizás insumos)

**I-CALIDAD-IND-001 — Brechas de inocuidad**

* **Output:** eventos faltantes (limpieza, baños) durante cosecha

---

### **5\) Parámetros configurables (para que no quede “rígido”)**

Conviene una tabla config\_reglas con:

* ventana\_dias\_monitoreo\_previo \= 14

* ventana\_dias\_limpieza\_pre\_cosecha \= 7

* vigencia\_analisis\_suelo\_meses \= 12

* severidad\_limpieza \= BLOQUEO o ALERTA (según fase)

## **PASO B.2 — Mensajería, UI y Workflow de Corrección (IA \+ Auditoría)**

### **1\) Objetivo del paso**

Que cada regla (bloqueo/alerta/info) tenga:

* un **mensaje claro** (lenguaje productor),

* una **acción sugerida** (qué cargar / dónde),

* un **link directo** a la planilla/formulario correcto,

* una **evidencia** registrada (para auditoría),

* un **cierre trazable** (resuelto / aceptado con justificación).

---

### **2\) Diseño de experiencia: 3 niveles (BLOQUEO / ALERTA / INFO)**

**2.1 BLOQUEO (Hard stop)**

**Cuándo se usa:** incumplimiento que rompe trazabilidad o cumplimiento mínimo (ORIGEN, carencia, lote, etc.).  
**Qué ve el usuario:**

* Modal/banner rojo: “No se puede guardar”

* Lista de campos faltantes o conflicto

* Botón “Ir a corregir” (deep link)

**Qué registra el sistema:**

* regla\_resultado.estado \= no\_cumple

* snapshot en detalle con datos que dispararon el bloqueo

* intento\_guardado \= false \+ timestamp

**Cierre:**

* automático cuando se completa la corrección y se reintenta guardar

* queda evidencia de que **antes estaba bloqueado**

✅ Ejemplo UI (COSECHA con carencia activa):

* **Título:** “Cosecha bloqueada por carencia activa”

* **Detalle:** “Existe aplicación del 12/02 con carencia 21 días”

* **Acciones:** “Ver aplicación” / “Cambiar fecha de cosecha” / “Cargar corrección”

* **Evidencia:** links a id\_evento aplicación y a evento cosecha en borrador

---

**2.2 ALERTA (Soft stop)**

**Cuándo se usa:** brecha técnica o de protocolo, pero no crítica para operar (monitoreo previo, falta de análisis de suelo, etc.).  
**Qué ve el usuario:**

* Banner ámbar: “Recomendación / Brecha”

* “Impacto” (por qué importa)

* Dos caminos:

  1. “Completar ahora” (recomendado)

  2. “Continuar igual” \+ **Justificación** (obligatoria)

**Qué registra el sistema:**

* regla\_resultado.estado \= no\_cumple

* accion\_usuario \= continuar\_con\_justificacion

* justificacion\_texto \+ justificacion\_categoria (catálogo)

* responsable \+ timestamp

**Cierre:**

* Puede cerrarse de dos formas:

  1. **Resuelto** (se carga el dato faltante)

  2. **Aceptado** (se justifica y se firma)

✅ Ejemplo UI (Aplicación sin monitoreo previo):

* **Título:** “Alerta: aplicación sin monitoreo previo”

* **Impacto:** “Para BA/COVIAR se recomienda monitoreo antes de intervenir”

* **Acciones:** “Cargar monitoreo” / “Continuar con justificación”

* **Justificación (cat):** urgencia sanitaria / falta de tiempo / error de carga / otro

---

**2.3 INFO (Indicador)**

**Cuándo se usa:** cálculo automático (m³/ha, conteos, etc.)  
**Qué ve el usuario:**

* Tarjeta azul/gris en dashboard

* “Cómo se calculó” (transparencia)

* “Mejorar precisión” (si faltan datos)

**Qué registra el sistema:**

* indicador\_valor \+ metodo\_calculo \+ insumos\_usados

---

### **3\) Componentes de UI recomendados (mínimos)**

**3.1 “Centro de Cumplimiento” (tablero único)**

Filtros:

* Campaña

* Finca / Cuartel

* Tipo (BLOQUEO/ALERTA/INFO)

* Capítulo (0–8)

Cada ítem muestra:

* Severidad (color)

* Regla y resumen

* Fecha

* Estado (abierto/resuelto/aceptado)

* CTA: “Resolver”

**3.2 “Estado de Cuartel / Campaña”**

Una vista tipo checklist:

* ORIGEN completo ✅/⚠️

* Canopia ✅/⚠️

* Riego ✅/⚠️

* Fitosanitarios ✅/⚠️

* Inocuidad ✅/⚠️

* etc.

Esto ayuda al productor a “ver qué le falta” sin abrir planillas.

**3.3 “Vista de Lote” (historia trazable)**

Para cada Lote:

* Resumen ORIGEN

* Timeline de eventos (canopia, riego, fitosanitarios…)

* Indicadores (m³/ha, \#aplicaciones, carencias ok)

* Brechas/justificaciones asociadas

Esto materializa tu idea: **el lote hereda todo** (Cap. 1.3). 

1\. MARCO CONCEPTUAL

---

### **4\) Flujo de corrección (end-to-end)**

**4.1 Estados estándar de un hallazgo**

* **ABIERTO** (detectado por IA)

* **EN\_PROCESO** (usuario abrió para resolver)

* **RESUELTO** (se completó evidencia)

* **ACEPTADO** (se continuó con justificación)

* **ANULADO** (hallazgo inválido por corrección de datos base)

**4.2 Re-evaluación automática**

Cada vez que:

* se guarda un evento relacionado,

* se edita ORIGEN,

* se crea un lote,  
  la IA re-ejecuta reglas relevantes.

---

### **5\) Evidencia auditable (qué guardamos SIEMPRE)**

**5.1 “Snapshot” del contexto**

En regla\_resultado.detalle guardar:

* ids involucrados (evento, lote, cuartel, finca)

* valores clave (fechas, carencias, dosis, etc.)

* versión de regla (para trazabilidad)

* timestamp

**5.2 Justificaciones (cuando el usuario “sigue igual”)**

Campos mínimos:

* justificacion\_categoria (cat\_justificacion)

* justificacion\_texto (text)

* justificacion\_responsable

* justificacion\_fecha

* (opcional) adjunto: foto / pdf

Esto te da **defensa de auditoría**.

---

### **6\) Mensajes (plantillas) — estilo productor, consistentes**

Te propongo un estándar:

**\[SEVERIDAD\] · \[Título corto\]**  
**Qué detectamos:** …  
**Por qué importa:** …  
**Cómo resolver:** 1\) … 2\) …  
**Acción:** \[Ir a cargar\] \[Continuar con justificación\]\*

\* Solo para ALERTAS.

---

### **7\) Mapeo “regla → pantalla de corrección” (5 ejemplos clave)**

1. **R-FITO-001 (carencia activa)** → abre:

   * ficha de aplicación fitosanitaria (fecha \+ carencia)

   * borrador de cosecha (fecha)

2. **R-LIMPIEZA-001 (sin limpieza pre cosecha)** → abre:

   * formulario “Limpieza elementos de cosecha”

3. **A-SUELO-001 (fertilización sin análisis)** → abre:

   * “Análisis de suelo”

4. **A-MIP-001 (aplicación sin monitoreo)** → abre:

   * “Monitoreo plagas/enfermedades”

5. **R-ORIGEN-001 (sin cuartel)** → abre:

   * selector ORIGEN / cuartel (Cap. 0\)

## **PASO B.3 · Paquetes de implementación por fase**

**Sistema de Trazabilidad y Sustentabilidad – Nivel Finca**

### **Objetivo del paso**

Definir **qué reglas, validaciones e indicadores** se activan en cada etapa del sistema para:

* garantizar **adopción real** por productores,

* proteger el **ORIGEN y la trazabilidad**,

* cumplir BA / COVIAR desde el inicio,

* permitir **madurez progresiva** sin rediseños.

---

### **Principio rector de B.3**

**Todo lo que rompe trazabilidad u ORIGEN es BLOQUEO desde el día 1\.**  
**Todo lo que mejora calidad técnica empieza como ALERTA y escala.**

---

### **FASE 1 · MVP OPERATIVO (obligatorio mínimo)**

**Objetivo**

Sistema **usable, defendible y no expulsivo**.  
Debe permitir cargar datos reales de campo sin fricción excesiva, pero **cerrar el ORIGEN**.

---

**1.1 Reglas BLOQUEANTES (activas en Fase 1\)**

**ORIGEN y estructura**

* **ORIGEN completo** (Productor–Finca–Cuartel)

* Evento trazable **sin Cuartel → BLOQUEO**

* Evento **sin Campaña → BLOQUEO**

* Cuartel duplicado en la misma finca → BLOQUEO

**Producción y trazabilidad**

* **Cosecha sin Lote → BLOQUEO**

* Cosecha con **cantidad ≤ 0 o sin unidad → BLOQUEO**

* **Cosecha con carencia activa → BLOQUEO**

**Fitosanitarios y agua**

* Aplicación fitosanitaria **sin dosis o unidad → BLOQUEO**

* Riego **sin volumen o unidad → BLOQUEO**

* Uso de **insumo vencido** (si inventario activo) → BLOQUEO

**Datos**

* Evento duplicado exacto (hash) → BLOQUEO

---

**1.2 Reglas ALERTA (activas en Fase 1\)**

Estas **no frenan**, pero dejan evidencia.

* Aplicación fitosanitaria **sin monitoreo previo**

* Fertilización **sin análisis de suelo**

* Falta de limpieza de elementos de cosecha previa

* Riegos sin precipitaciones registradas

* Uso de fitosanitarios sin EPP registrado

* Falta de sanitización de baños en período activo

Todas permiten:

* continuar con **justificación obligatoria**,

* quedar marcadas para auditoría.

---

**1.3 Indicadores automáticos (Fase 1\)**

Se calculan aunque falten datos (con advertencias):

* m³/ha por cuartel y campaña

* Nº de aplicaciones fitosanitarias

* % de carencias cumplidas

* Eventos críticos por cuartel

---

**Resultado Fase 1**

✔ ORIGEN cerrado  
✔ Trazabilidad válida  
✔ Cumplimiento mínimo BA / COVIAR  
✔ Productor **no bloqueado por “perfección técnica”**

---

### **FASE 2 · CUMPLIMIENTO TÉCNICO AMPLIADO**

**Objetivo**

Elevar el sistema a **nivel técnico robusto**, sin cambiar arquitectura.

---

**2.1 Reglas que escalan de ALERTA → BLOQUEO**

* Fertilización **sin análisis de suelo vigente**

* Cosecha sin limpieza de elementos

* Aplicación fitosanitaria sin EPP registrado

* Riego sin registro energético

* Períodos activos sin sanitización de baños

Estas reglas:

* fueron “aprendidas” en Fase 1,

* ahora pasan a ser exigibles.

---

**2.2 Nuevos indicadores (Fase 2\)**

* kg/ha de fertilización por campaña

* energía/m³ de riego

* frecuencia de sanitización

* brechas de inocuidad por lote

---

**Resultado Fase 2**

✔ Evidencia técnica sólida  
✔ Preparado para auditorías más exigentes  
✔ Mejora continua documentada

---

### **FASE 3 · ESCALABILIDAD, MERCADOS Y CERTIFICACIÓN**

**Objetivo**

Convertir la trazabilidad en **activo estratégico**.

---

**3.1 Reglas e indicadores avanzados**

* Umbrales dinámicos (por zona, variedad, campaña)

* Score de sustentabilidad por:

  * cuartel

  * lote

  * campaña

* Comparabilidad interanual

---

**3.2 Interoperabilidad**

* Exportación EPCIS

* QR por lote

* Hash de lote \+ eventos (blockchain)

* Integración bodega / transporte

---

**Resultado Fase 3**

✔ Escalable  
✔ Interoperable  
✔ Comercializable  
✔ Defendible internacionalmente

---

### **RESUMEN EJECUTIVO DE B.3**

| Fase | Enfoque | Bloqueos | Alertas | Indicadores |
| :---- | :---- | :---- | :---- | :---- |
| Fase 1 | ORIGEN \+ operación | Mínimos críticos | Sí | Básicos |
| Fase 2 | Calidad técnica | Ampliados | Menos | Técnicos |
| Fase 3 | Mercado / escala | Totales | Residuales | Estratégicos |

Con **B.3 cerrado**, ya tenés definido:

✔ qué se exige  
✔ cuándo se exige  
✔ por qué se exige

Sin arbitrariedad ni rigidez innecesaria.

## **PASO C · Arquitectura EPCIS (GS1)**

**Traducción del sistema finca → estándar internacional**

### **Objetivo**

* Convertir **tus eventos internos** en **eventos EPCIS** estándar.

* Mantener **ORIGEN \+ herencia al Lote**.

* Dejar listo el puente a **bodega, transporte, blockchain y mercados**.

EPCIS \= *qué pasó, cuándo, dónde, por qué, con qué objeto*.

---

### **1\) Principios EPCIS que vamos a usar**

**1.1 Tipos de eventos EPCIS (los 3 que necesitamos)**

* **ObjectEvent** → acciones sobre un objeto (riego, monitoreo, limpieza).

* **TransformationEvent** → un objeto se transforma en otro (**COSECHA**).

* **AggregationEvent** → agrupar/desagrupar (opcional; bins, pallets, etc.).

👉 Con esto cubrimos **100 %** de tu Marco Conceptual.

---

### **2\) Identificadores (IDs) — cómo preservamos ORIGEN**

**2.1 Objeto trazable principal**

* **Lote de Cosecha** → epc

  * Ejemplo lógico:  
    urn:epc:id:sgtin:PROD.CUARTEL.CAMPANIA.FECHA

No hace falta definir ahora el esquema final; lo importante es:

* **un EPC único por lote**, inmutable.

**2.2 Ubicación (WHERE)**

* **Cuartel** → bizLocation

* **Finca** → bizLocation de nivel superior

**2.3 Contexto (WHY)**

Se expresa con:

* bizStep (etapa del proceso)

* disposition (estado)

---

### **3\) Mapeo directo: de tus capítulos a EPCIS**

**CAP. 0 — ORIGEN (Master Data, no evento)**

**EPCIS Master Data**

* Productor

* Finca

* Cuartel

* Superficie, cultivo, variedad, sistema productivo

👉 En EPCIS esto vive como **Master Data**, no como evento.

---

**CAP. 1 — Procesos vitícolas**

**1.1 Manejo de Canopia**

* **Tipo EPCIS:** ObjectEvent

* **epc:** urn:epc:id:cuartel:ID\_CUARTEL

* **bizStep:** urn:epcglobal:cbv:bizstep:crop\_management

* **bizLocation:** Cuartel

* **extensiones:** tipo\_práctica, intensidad, jornales

**1.2 Monitoreo Fenológico**

* **Tipo EPCIS:** ObjectEvent

* **bizStep:** urn:epcglobal:cbv:bizstep:inspection

* **extensiones:** estado fenológico, % avance, brix

**1.3 COSECHA (clave)**

* **Tipo EPCIS:** **TransformationEvent**

* **inputEPCList:** EPC del cuartel/cultivo en campaña

* **outputEPCList:** **EPC del LOTE DE COSECHA**

* **bizStep:** urn:epcglobal:cbv:bizstep:harvesting

* **disposition:** active

* **extensiones:** cantidad, unidad, destino inmediato

👉 **Acá nace oficialmente el EPC del producto.**

---

**CAP. 2 — Recurso hídrico**

**Riegos**

* **Tipo EPCIS:** ObjectEvent

* **bizStep:** crop\_irrigation

* **bizLocation:** Cuartel

* **extensiones:** volumen, unidad, tiempo, sistema

**Precipitaciones**

* **Tipo EPCIS:** ObjectEvent

* **bizLocation:** Finca

* **extensiones:** mm, origen\_dato

---

**CAP. 3 — Suelo**

**Labores / Fertilización / Enmiendas**

* **Tipo EPCIS:** ObjectEvent

* **bizStep:** soil\_management / fertilization

* **extensiones:** producto, dosis, unidad, método

**Análisis de suelo**

* **Tipo EPCIS:** ObjectEvent

* **bizStep:** inspection

* **extensiones:** parámetros (pH, MO, etc.)

---

**CAP. 4 — MIP**

**Monitoreos**

* **Tipo EPCIS:** ObjectEvent

* **bizStep:** inspection

* **extensiones:** plaga/enfermedad, incidencia

**Aplicación de fitosanitarios**

* **Tipo EPCIS:** ObjectEvent

* **bizStep:** chemical\_application

* **disposition:** in\_progress → active

* **extensiones:** producto, dosis, carencia, motivo

**Sobrantes / lavado**

* **Tipo EPCIS:** ObjectEvent

* **bizStep:** waste\_management

* **extensiones:** volumen, disposición

---

**CAP. 5 — Inocuidad y calidad**

**Limpieza cosecha**

* **Tipo EPCIS:** ObjectEvent

* **bizStep:** sanitation

* **bizLocation:** Finca

**No conformidades / Reclamos**

* **Tipo EPCIS:** ObjectEvent

* **bizStep:** quality\_management

* **extensiones:** descripción, acción tomada

---

**CAP. 6 — Energía**

* **Tipo EPCIS:** ObjectEvent

* **bizStep:** energy\_consumption

* **extensiones:** kWh/litros, equipo, período

---

**CAP. 7 — Salud y seguridad**

* **Tipo EPCIS:** ObjectEvent

* **bizStep:** training / safety\_management

* **extensiones:** tema, EPP, accidente

---

**CAP. 8 — Mantenimiento**

* **Tipo EPCIS:** ObjectEvent

* **bizStep:** maintenance

* **extensiones:** equipo, tipo, horas

---

### **4\) Extensiones EPCIS (clave para no perder información)**

Todo lo que **EPCIS no trae de fábrica** va en:

* extension (JSON)

Ejemplos:

* dosis, carencia, brix

* justificaciones de alertas

* indicadores calculados

* hash blockchain

👉 Esto preserva **toda tu riqueza técnica**.

---

### **5\) EPCIS \+ Blockchain (cómo encaja)**

* Cada **TransformationEvent (Cosecha)**:

  * genera hash del lote \+ eventos previos

  * se puede anclar a blockchain

* No se graban todos los eventos en blockchain:

  * se graba **el hash**

  * EPCIS queda como fuente de verdad operativa

---

### **6\) Qué queda listo con PASO C**

✔ Traducción 1 a 1 de tu sistema a EPCIS  
✔ Interoperabilidad con bodega y logística  
✔ Base para QR por lote  
✔ Base para blockchain sin sobrecargarla  
✔ Sin perder ORIGEN ni reglas BA/COVIAR

## **PASO D · Especificación técnica para desarrollo (MVP \+ escalable)**

### **D.1 Arquitectura funcional (módulos)**

1. **Maestros (ORIGEN)**

* Productor

* Finca

* Cuartel

* Campaña

* Catálogos (unidades, tipos de evento, insumos, etc.)

2. **Eventos (captura de planillas)**

* Alta/edición de EVENTO \+ subtabla por tipo

3. **Lote de Cosecha**

* Creación automática al guardar Cosecha

* Vista “Historia del Lote” (herencia)

4. **Motor de Reglas IA \+ Auditoría**

* Ejecuta reglas B.1

* Devuelve BLOQUEO/ALERTA/INFO

* Registra resultados trazables

5. **Reportes/Indicadores**

* m³/ha, \# aplicaciones, carencias OK, brechas

* Exportable (CSV/PDF más adelante)

6. **Interoperabilidad EPCIS (fase 2/3)**

* Export EPCIS events (mapeo PASO C)

---

### **D.2 Roles y permisos mínimos (RBAC)**

* **Admin**: gestiona catálogos, reglas, campañas, usuarios.

* **Técnico/Asesor**: carga/edita eventos, ve reportes, gestiona brechas.

* **Productor/Operador**: carga eventos y ORIGEN, ve su tablero y alertas.

* **Auditor (solo lectura)**: ve historia de lote, reglas y evidencia.

---

### **D.3 Flujos operativos obligatorios (end-to-end)**

**Flujo 1 — Onboarding ORIGEN (Cap. 0\)**

1. Crear Productor

2. Crear Finca

3. Cargar Cuarteles

4. Validación de duplicados (codigo\_cuartel en finca)

5. Campaña activa

**Criterio:** sin cuartel NO se habilita carga de eventos trazables. 

1\. MARCO CONCEPTUAL

---

**Flujo 2 — Carga de evento (cualquier planilla)**

1. Usuario selecciona: Campaña \+ (Cuartel o Finca según evento)

2. Completa campos del tipo de evento

3. Backend:

   * valida constraints (A.6/A.7)

   * calcula hash\_contenido

   * deduplica

   * guarda EVENTO \+ subtabla

4. Ejecuta reglas relevantes (B.1) y retorna:

   * OK

   * ALERTA (+ requiere justificación si “continuar”)

   * BLOQUEO (no guarda o guarda en borrador según diseño)

---

**Flujo 3 — Cosecha (creación de lote)**

1. Se carga COSECHA (Cap. 1.3)

2. Backend:

   * valida carencias (bloqueo)

   * valida limpieza (según fase)

   * genera id\_lote\_cosecha inmutable

   * guarda LOTE\_COSECHA \+ EVENTO\_COSECHA

3. Genera “Vista Historia del Lote” (por consulta, no por duplicación)

---

### **D.4 API / Endpoints recomendados (REST)**

*(Si usan GraphQL, la lógica es equivalente; dejo REST por claridad.)*

**1\) Maestros (ORIGEN)**

* POST /productores

* GET /productores/{id}

* POST /fincas

* GET /fincas?productor\_id=

* POST /cuarteles

* GET /cuarteles?finca\_id=

* POST /campanias

* GET /campanias?estado=abierta

**2\) Catálogos**

* GET /catalogos/tipos-evento

* GET /catalogos/unidades

* GET /catalogos/insumos

* GET /catalogos/plagas

* GET /catalogos/enfermedades

* GET /catalogos/practicas-canopia  
  *(y los que definimos en A.7)*

**3\) Eventos**

* POST /eventos *(crea cabecera \+ subtabla según tipo\_evento)*

* GET /eventos/{id}

* GET /eventos?campania\_id=\&cuartel\_id=\&tipo\_evento=\&fecha\_desde=\&fecha\_hasta=

* PATCH /eventos/{id} *(solo si política de edición lo permite; ver D.6)*

**Carga por planilla (opcional, para UX)**

* POST /eventos/riego

* POST /eventos/fito-aplicacion

* POST /eventos/canopia  
  … (wrappers que internamente llaman a /eventos)

**4\) Lotes**

* GET /lotes?campania\_id=\&cuartel\_id=

* GET /lotes/{id\_lote}

* GET /lotes/{id\_lote}/historia *(vista consolidada)*

* POST /lotes/{id\_lote}/anular *(con motivo, sin borrar)*

**5\) Reglas y auditoría**

* GET /reglas *(cat\_regla)*

* POST /reglas/ejecutar *(opcional: re-evaluación manual por campaña/cuarter/lote)*

* GET /hallazgos?estado=abierto\&severidad=

* POST /hallazgos/{id}/resolver

* POST /hallazgos/{id}/aceptar *(con justificación)*

**6\) Indicadores**

* GET /indicadores?campania\_id=\&cuartel\_id=

* GET /indicadores/lote/{id\_lote}

**7\) EPCIS (fase 2/3)**

* GET /epcis/lote/{id\_lote} *(export EPCIS JSON/XML)*

* GET /epcis/campania/{id}

---

### **D.5 Validaciones backend (orden de ejecución)**

**Orden recomendado (evita bugs):**

1. Validación de esquema (campos requeridos del tipo de evento)

2. Validación de anclaje (Cuartel vs Finca según tipo\_evento)

3. Validaciones numéricas/rangos

4. Deduplicación por hash (bloqueo)

5. Persistencia BD (EVENTO \+ subtabla)

6. Ejecución de reglas (B.1) y persistencia de hallazgos

7. Cálculo de indicadores (asincrónico o post-commit)

---

### **D.6 Política de edición vs inmutabilidad (muy importante)**

Para sostener auditoría y blockchain:

**6.1 Eventos**

* Se permite **editar** dentro de una ventana corta (ej. 48/72h) o con rol Técnico.

* Fuera de esa ventana:

  * se crea **evento de corrección** (tipo\_evento \= “CORRECCION”)

  * el evento original queda “vigente” pero marcado con referencia a corrección

**6.2 Lotes**

* id\_lote\_cosecha **inmutable**

* Correcciones:

  * anular lote \+ crear lote corregido

  * mantener trazabilidad de la anulación (motivo)

Esto calza con tu enfoque de “historia no reescrita”. 

1\. MARCO CONCEPTUAL

---

### **D.7 Vistas obligatorias (UI/Reporting)**

1. **Dashboard de Campaña**

* checklist por capítulo (0–8)

* bloqueos pendientes

* alertas abiertas

* indicadores top

2. **Ficha de Cuartel**

* ORIGEN

* timeline de eventos por campaña

* indicadores cuartel/campaña

* brechas y justificaciones

3. **Historia de Lote**

* resumen ORIGEN

* eventos heredados (cuartel \+ finca)

* carencias OK

* evidencia de inocuidad

* export (PDF/QR/EPCIS futuro)

4. **Centro de Cumplimiento**

* lista de hallazgos (bloqueos/alertas)

* filtro por campaña/cuartel/capítulo

* estado (abierto/resuelto/aceptado)

---

### **D.8 Decisiones técnicas “cerradas” (para que desarrollo no invente)**

1. **EVENTO como cabecera \+ subtablas por tipo** (no una tabla por planilla Excel)

2. **Herencia al lote por vista/consulta**, no por duplicación

3. **Reglas registradas** (cat\_regla \+ regla\_resultado) siempre

4. **Justificación obligatoria** cuando se continúa con ALERTA

5. **Inmutabilidad del lote** y corrección por anulación \+ nuevo lote

