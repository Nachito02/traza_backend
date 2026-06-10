# Módulo de Costos — Estado y pendientes

> Última actualización: 2026-06-10
> Basado en la spec `3. REGISTRO DE ACTIVIDADES. ESPECIFICACIÓN FUNCIONAL. MVP.docx`.

Cada actividad productiva = una **`tarea`** (orden de trabajo). Al completarla se
calculan y persisten sus costos. El módulo se apoya en el modelo de "eventos
productivos" que ya existía.

---

## ✅ Lo que YA está hecho (Fases 0–4)

### Fase 0 — Modelo de datos
- Migración: `prisma/migrations/20260603000000_modulo_costos/`
- **Enums:** `ModalidadEjecucion`, `RolManoObra`, `ClaseMaquinaria`, `TipoCombustible`, `CategoriaCosto`
- **Tarifas (precios por dominio):** `tarifa_mano_obra`, `tarifa_maquinaria`, `tarifa_combustible` (con `vigencia_desde` + `activo`)
- **Captura por actividad:** `tarea_ejecucion` (1:1), `actividad_maquina` (N), `actividad_insumo` (N)
- **Costos calculados:** `actividad_costo` (1 fila por categoría, `@@unique [tarea, categoria]`)
- `insumo_catalogo` extendido con `costo_unitario`, `moneda`, `bodega_id`
- Verificado: cero drift contra el schema (`prisma migrate diff` → "No difference detected")

### Fase 1 — Seed
- `seed-costos.sql` (idempotente) · script `npm run seed:costos`
- Insumos globales: oxicloruro de cobre, azufre, mancozeb, caldo bordelés, urea, DAP, yeso
- Tarifas por bodega: mano de obra (operario/tractorista/técnico), maquinaria (tractor, cosechadora, pulverizadoras, rastra, desmalezadora), combustible (gasoil/nafta/electricidad)
- ⚠️ **Todos los precios son PLACEHOLDER en ARS** — ajustar a valores reales.

### Fase 2 — Backend (`src/modules/costos/`)
- CRUD de tarifas (3 dominios), captura (ejecución/máquinas/insumos), `recalcularCostosTarea()` (motor), resúmenes.
- Hook en cierre de tarea: `completarTarea` y `finalizarTareaAsignacion` llaman a `recalcularCostosSafe()`.
- Montado en `/api/costos`.

### Fase 3 — Frontend
- `features/costos/api.ts` (capa API)
- `CostosActividadPanel` integrado en el modal de completar tarea (CampoPage)
- `TarifasPage` (`/admin/tarifas`) — ABM de tarifas
- Links en el sidebar

### Fase 4 — Vistas / indicadores
- `CostosResumenPage` (`/costos`): por cuartel/campaña, MetricCards, desglose por categoría, tabla de actividades
- Endpoint extra `GET /costos/resumen/cuartel/:id/actividades`

---

## ⚠️ PENDIENTE — para no olvidarme

### 1. Aplicar a la base de datos (OBLIGATORIO antes de usar)
```bash
cd traza-backend
npx prisma migrate deploy   # crea las tablas
npm run seed:costos         # carga tarifas + insumos (requiere $DATABASE_URL)
```
Reiniciar backend + frontend después.

### 2. Ajustar precios reales
Los precios del seed son inventados. Editar desde:
- UI: `/admin/tarifas` (mano de obra, maquinaria, combustible)
- Insumos: hoy sólo por SQL / seed (no hay UI de ABM de insumos todavía → ver pendiente #6).

### 3. Pruebas funcionales end-to-end en la app real
Todavía NO se probó con la UI corriendo. Flujo a validar:
- Crear orden → completar tarea → cargar ejecución + máquina + insumo → ver total y $/ha.
- Ver `/costos` por cuartel y por campaña.

---

## 🔭 Deferido / fuera del MVP (decisiones ya tomadas)

### A. Control de stock / inventario (bloque J de la spec) — NO implementado
Hoy el insumo se elige de un catálogo y sólo se registra el costo; **no se descuenta
stock**. Falta:
- Modelo de existencias por `insumo_lote` (stock inicial, consumo, stock final, valorización)
- Movimientos de stock al consumir insumos en una actividad
- Alertas de stock mínimo y de vencimiento

### B. Exactitud de costos por campaña
`getResumenPorCampania` es **aproximado**: como `tarea` no tiene `campania_id`,
agrega por TODA la bodega de la campaña. Para exactitud:
- Opción 1: agregar `campania_id` a `tarea` (+ migración + UI al crear orden)
- Opción 2: cruzar por los eventos materializados (que sí tienen `campania_id`)

### C. Indicadores de sustentabilidad (spec) — NO implementado
Agua/ha, combustible/ha, energía/ha, nutrientes/ha, fitosanitarios/ha, huella de carbono.

### D. Costo por kg producido — NO implementado
Requiere cruzar costo de actividad con `evento_cosecha` (producción obtenida).

### E. Combustible: sólo gasoil
El motor calcula combustible de máquinas motrices **siempre con la tarifa de gasoil**.
Nafta/eléctrico están en el catálogo pero el motor no los usa por máquina todavía.

### F. Sin ABM de insumos en la UI
El catálogo de insumos (con precio) sólo se carga por seed/SQL. Falta una página
para crear/editar insumos y sus precios desde la app.

### G. Carga de máquina "libre"
En `CostosActividadPanel` la máquina se elige sólo del catálogo de tarifas.
No se puede cargar una máquina ad-hoc con nombre/costo manual.

---

## 🧠 Decisiones de diseño a recordar
- **Snapshots de precio:** `actividad_maquina.costo_hora_snapshot` y
  `actividad_insumo.costo_unitario_snapshot` congelan el precio al momento de cargar.
  El recálculo vuelve a tomar el precio vigente del catálogo (si cambió la tarifa,
  el costo se actualiza al recalcular).
- **Dos métricas de $/ha distintas (a propósito):**
  - Resumen por cuartel → usa `cuartel.superficie_ha` (costo por ha del cuartel)
  - Cada actividad → usa `superficie_intervenida` (costo por ha trabajada)
- **`insumo_catalogo.bodega_id` nullable:** permite insumos globales (hardcodeados) o
  propios de una bodega.
- **El costeo no bloquea el cierre de la tarea:** si el recálculo falla, se loguea
  y la tarea se completa igual (`recalcularCostosSafe`).

---

## 📋 Reglas de negocio implementadas (de la spec)
- No hay actividad sin superficie intervenida (> 0).
- Insumo obliga: producto + dosis/ha + cantidad total.
- Máquina motriz propia obliga consumo de combustible (o tarifa con lts/hora).
- Modalidad contratada/mixta obliga contratista + monto.

---

## Endpoints (`/api/costos`)
| Método | Ruta | Qué hace |
|---|---|---|
| GET/POST/PATCH/DELETE | `/tarifas/mano-obra[/:id]` | ABM tarifas mano de obra |
| GET/POST/PATCH/DELETE | `/tarifas/maquinaria[/:id]` | ABM tarifas maquinaria |
| GET/POST/PATCH/DELETE | `/tarifas/combustible[/:id]` | ABM tarifas combustible |
| GET | `/insumos` | Catálogo de insumos (globales + bodega) |
| GET | `/tareas/:tareaId` | Costos completos de una actividad |
| PUT | `/tareas/:tareaId/ejecucion` | Upsert ejecución (superficie + mano de obra) |
| POST/DELETE | `/tareas/:tareaId/maquinas` · `/maquinas/:id` | Líneas de máquina |
| POST/DELETE | `/tareas/:tareaId/insumos` · `/insumos/:id` | Líneas de insumo |
| POST | `/tareas/:tareaId/recalcular` | Forzar recálculo |
| GET | `/resumen/cuartel/:id` | Agregado por cuartel |
| GET | `/resumen/cuartel/:id/actividades` | Actividades del cuartel con costo |
| GET | `/resumen/campania/:id` | Agregado por campaña (aproximado, ver B) |
