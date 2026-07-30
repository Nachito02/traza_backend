# Módulo de Lotes (trazabilidad de bodega) — Estado y pendientes

> Última actualización: 2026-07-30 (Fase 5)

Motivación: cada camión de uva trae un CIU (documento oficial del INV). Varios
camiones del mismo cuartel se juntan en una vasija y hacía falta un código interno
que los agrupe (**Lote**), poder emitir esos CIU para declarar al INV, y reconstruir
hacia atrás — desde cualquier botella — por qué vasijas pasó y de qué CIU viene,
incluyendo blends parciales y blends de blends.

Gran parte del modelo ya existía en el schema (`VasijaContenido`, `CorteComponente`)
pero estaba **huérfano**: ninguna función del backend los escribía. Este módulo los
activa y generaliza en vez de crear algo nuevo desde cero.

---

## ✅ Lo que YA está hecho (Fases 0–4)

### Fase 0 — Modelo de datos
- Migración: `prisma/migrations/20260730025643_lote_traceability/`
- **`Bodega.codigo`**: código corto (ej. `SDF`), nullable, `@unique`. Primer segmento del código de lote.
- **`Lote`** (`enum LoteOrigen: ingreso | corte`): entidad nueva, el lote interno de bodega. Sin campo de estado propio — se deriva de `VasijaContenido` al leer.
- **`LoteOrigenRecepcion`**: join Lote↔RecepcionBodega (una recepción pertenece a lo sumo un lote — `@unique` en `recepcion_bodega_id`). Es lo que permite exportar los CIU de un lote.
- **`LoteComposicion`**: genealogía de blends, self-referencial (`lote_id` = hijo, `lote_padre_id` = padre). Es un **grafo dirigido**, no un árbol: un lote puede tener varios padres (blend parcial) y a la vez ser padre de otro lote más adelante (blend de blends).
- **`VasijaContenido`** reactivada: `lote_cosecha_id` → `lote_id` (apuntaba a `EventoCosecha`, ahora a `Lote`). Se agregó `volumen_l` (antes solo tenía `kg_aportados`, pero todo el resto del sistema mide en litros).
- **`CorteComponente`**: mismo rename `lote_cosecha_id` → `lote_id` (ahora FK a `Lote`, ver nota en "Decisiones" sobre por qué casi no se usa en el flujo nuevo).
- `EventoCosecha.lote_cosecha_id` **no se tocó** — sigue siendo "lote de cosecha" (pasada de cosecha en la finca), un concepto distinto que ya se llamaba así. Ver nota de naming abajo.
- Endpoint nuevo: `PATCH /bodegas/:id` (no existía ninguna edición de bodega) + `GET /bodegas/:id`.
- Frontend: `BodegaConfigPage.tsx` (`/bodega/configuracion`) para editar nombre/razón social/CUIT/código.
- Verificado contra base local: migración limpia, `tsc` sin errores en ambos repos.

### Fase 1 — Motor de balance de volumen (`elaboracion.service.ts`)
- `aplicarMovimientoVasija(tx, params)`: corre **dentro de la misma transacción** que cada `OperacionVasija`.
  - `ingreso`: abre una fila en `VasijaContenido` (vasija destino, lote, volumen).
  - `trasiego` / `descube` / `correccion` / `corte_parcial`: suma las filas **activas** (`hasta IS NULL`) de la vasija de origen, **bloquea** si se pide más de lo disponible (`"Volumen insuficiente en origen: disponible X l, solicitado Y l"`), reparte proporcional si hay varios lotes mezclados, cierra las filas viejas y abre las nuevas (remanente en origen + porción movida en destino).
  - `fermentacion`: no-op (no cambia de vasija).
- `createOperacionVasija` ahora exige `loteId` cuando `tipo === "ingreso"`.
- Endpoint nuevo: `GET /elaboracion/vasijas/:id/composicion-actual` (lote(s) activos + % calculado al leer, no se persiste).
- Frontend: `VasijaComposicionPanel.tsx` — panel de "disponible: X l" en el form de Operaciones Vasija (usa el nuevo `onValuesChange` de `GenericCrudSection` para reaccionar a la vasija de origen elegida).
- **Bug propio encontrado y arreglado de paso**: `createCorte`/`updateCorte` (el endpoint viejo de cortes) seguía escribiendo `lote_cosecha_id` — TypeScript no lo marcó por laxitud del spread condicional al armar el `data` de Prisma. Se corrigió a `lote_id`.

### Fase 2 — Creación de Lote (`src/modules/lotes/`)
- Módulo nuevo: `lotes.service.ts` / `lotes.controller.ts` / `lotes.route.ts`, montado en `/elaboracion` (junto a `elaboracionRoutes`, **antes** en el orden de montaje para que `/recepciones-bodega/pendientes-lote` no choque con `/recepciones-bodega/:id`).
- `crearLote(input)`: junta 1+ `RecepcionBodega` (mismo cuartel, CIU emitido, ninguna ya asignada a otro lote) en un `Lote`.
- **Código**: `{BODEGA}-{CUARTEL}-{VARIEDAD}-{AÑO}-{SEQ}` (ej. `SDF-C12-SYR-26-01`). Año sale de `Campania.fecha_inicio` (no de parsear el nombre libre). Secuencial por combinación bodega+cuartel+variedad+año, con reintento ante colisión.
- `campaniaId` es **explícito** (viene del selector de campaña ya activo en la app), no se infiere del remito.
- Si alguna recepción tiene `variedad_pureza = mezclada`, el lote queda con `variedad = "Mezcla"`.
- Endpoints: `POST /elaboracion/lotes`, `GET /elaboracion/lotes`, `GET /elaboracion/lotes/:id`, `GET /elaboracion/recepciones-bodega/pendientes-lote`.
- Frontend: `LoteSelectorPanel.tsx` en el paso "Enviar a vasija" del wizard de Ingreso — lista recepciones pendientes del mismo cuartel+campaña, la actual pre-tildada, confirma y recién ahí se muestra el form de ingreso (con `loteId` fijo, campo bloqueado).

### Fase 3 — Corte guiado (blend)
- `crearCorteConVasijas(input)` en `lotes.service.ts`: en vez de tipear vasija+lote+% a mano, se eligen vasijas de origen + volumen a sacar de cada una.
  - `drenarVasijaParaCorte`: misma mecánica de balance que Fase 1 (valida, reparte proporcional, cierra/abre filas), pero devuelve qué lotes (y cuánto) se sacaron en vez de escribirlos directo en un destino.
  - Agrega los aportes por `lote_id` de todas las fuentes → arma `Corte` + `CorteComponente` (histórico, por vasija) + un **`Lote` nuevo** (`origen: "corte"`) + `LoteComposicion` (un registro por lote padre, con % efectivo).
  - Si hay vasija destino, ahí queda **una sola fila** de `VasijaContenido` con el lote-blend (no se repiten los lotes padre en el destino).
  - Código del lote-blend: `{BODEGA}-CORTE-{AÑO}-{SEQ}` (o con cuartel/variedad únicos si todos los padres coinciden).
- Endpoint: `POST /elaboracion/lotes/blend`.
- Frontend: `CortesProductoPage.tsx` reescrito — se sacó el campo de texto libre "Lote cosecha ID" y el `%` manual; ahora es "vasija origen + volumen a sacar" por fila, con `VasijaComposicionPanel` mostrando la composición actual de cada vasija elegida (solo lectura).
- El endpoint/flujo viejo (`createCorte`/`updateCorte`, manual) **se mantiene** para editar metadata de cortes existentes (fecha/objetivo/campaña/responsable/observaciones) — no vuelve a mover litros ni toca componentes.

### Fase 4 — Trazabilidad hacia atrás
- `resolverGenealogiaLote(loteId, porcentajeEnPadre, visitados)`: recursivo, arma el árbol de genealogía hasta lotes `origen: "ingreso"` (que resuelven a sus CIU vía `LoteOrigenRecepcion`). Protegido contra ciclos.
- `recolectarCiusDeGenealogia`: aplana el árbol a una lista de CIU con **% efectivo** sobre la raíz (multiplica porcentajes nivel a nivel).
- `getLoteGenealogia(loteId, userId)` y `getLoteCiusExport(loteId, userId)` (texto plano separado por comas, para el INV).
- **`getTrazabilidadInversaByCodigoEnvase` reescrita** (antes se cortaba en `EventoCosecha`, nunca llegaba a CIU):
  - Camino primario: `Corte.lote_creado` (el lote-blend de la Fase 3) → `resolverGenealogiaLote`.
  - Camino de respaldo (cortes viejos, manuales, sin `lote_creado`): recorre `CorteComponente` como antes, pero ahora cada lote encontrado también pasa por `resolverGenealogiaLote` (ver limitación en Pendientes).
- Endpoints: `GET /elaboracion/lotes/:id/genealogia`, `GET /elaboracion/lotes/:id/cius-export` (descarga `text/plain`).
- Frontend: `/operacion/lotes` (listado) y `/operacion/lotes/:id` (detalle: código/cuartel/variedad, árbol de genealogía navegable vía `LoteGenealogiaTree.tsx`, lista de CIU con % efectivo, botón "Exportar CIU"). Link agregado al menú de Bodega.

**Probado manualmente contra la base local** (scripts ad-hoc, sin dejar datos de prueba):
- Balance: 1000 L → sacar 200 L → quedan 800 L → pedir 900 L se rechaza. ✅
- `crearLote`: código correcto, secuencia incrementa, rechaza reusar una recepción ya asignada. ✅
- Blend simple (600 L lote X + 400 L lote Y → 60%/40%). ✅
- **Blend de blends** (dos generaciones): reconstruyó los % efectivos exactos (30% / 20% / 50%) hasta los 3 CIU de origen. ✅

### Fase 5 — Corrección del modelo del CIU + exportador real

Corrección de un malentendido de las fases anteriores, en dos vueltas:

1. Primera corrección: el CIU **no lo emite nuestra app** — no hay un botón
   "emitir CIU" que genere el documento oficial. La Fase 4 asumía (mal) eso y
   que el export era un listado simple de códigos separados por coma.
2. Segunda corrección (la que realmente importa para el flujo): el `.txt` de
   50 campos **no es un resumen de algo ya aprobado por el INV** — es el
   **formato de carga que el Sistema de Cosecha del INV entiende**. Se arma el
   Lote (agrupando viajes del mismo cuartel), se genera el `.txt` con sus CIU,
   y **eso** es lo que se sube al INV para declarar esos CIU. El número de CIU
   lo asigna la bodega (va dentro del archivo, no lo devuelve el INV), y recién
   después de cargar el archivo el INV procesa la declaración. Nuestra app no
   tiene integración con el INV (no hay API ni confirmación automática) — el
   `.txt` se descarga y se sube a mano en el sistema del INV.

- **El export tiene que ser un `.txt`**, no un CSV simplificado, con el layout
  **exacto** que usa el INV: una línea por CIU, **50 campos separados por `|`**
  (una línea = un viaje/CIU; el número de líneas del archivo depende de cuántos
  CIU tenga el lote, no está fijo en 50 — "50 campos" es ancho de columna, no
  cantidad de filas).
- El mapeo campo-a-campo se hizo **cruzando 6 ejemplos reales** (6 PDF de
  declaración + las 6 líneas `.txt` correspondientes, de un lote real que vino
  en 6 viajes), no adivinando. Quedaron con confianza alta las posiciones que
  aparecen en ambos formatos (código CIU, fecha, datos de bodega/viñatero, kg
  bruto/tara/neto, patente/modelo/CUIT del conductor, variedad INV, tenor
  azucarino, tipo de cosecha, orgánica, estado, RENSPA) y con confianza baja
  (constantes fijas, replicando el valor de los ejemplos) las posiciones sin
  contraparte visible en el PDF — ver detalle campo por campo en
  `construirLineaCiuInv` (`lotes.service.ts`).
- **Modalidad de comercialización quedó deferida a propósito**: aparece en el
  PDF pero no se pudo confirmar en qué posición(es) va del `.txt` con los
  ejemplos disponibles — no se agregó al schema para no adivinar un campo que
  después hay que migrar.
- Schema (migración `20260730061935_ciu_campos_declaracion_inv`): `Bodega.nro_inscripto_inv`,
  `Finca.nro_inscripto_inv`/`cuit`/`razon_social` (datos del viñatero, Rubro
  II-A — no siempre coinciden con los de la finca como propiedad),
  `RemitoUva.modelo_vehiculo`/`cuit_conductor` (Rubro IV), `Ciu.variedad_codigo_inv`/`variedad_nombre`/`tenor_azucarino_gl`/`uva_organica` (Rubro V).
- `crearLote` deriva la variedad del lote de `Ciu.variedad_nombre` real (Rubro
  V de cada CIU), no del dato estático `Cuartel.variedad` — un mismo cuartel
  puede tener viajes de variedades distintas declaradas.
- Wizard de Ingreso: el paso ya no se llama "Emitir CIU" sino **"Registrar
  CIU"**, y el título de éxito pasó de "CIU emitido" a "CIU registrado". Se
  evaluó fusionar el paso CIU dentro de Recepción pero se descartó por riesgo
  (los pasos del wizard están interconectados vía query params/estado
  compartido) — se hizo el cambio de menor riesgo (rename + campos nuevos).
- Frontend: `CiuQcPage.tsx` ahora pide `variedad_codigo_inv`, `variedad_nombre`,
  `tenor_azucarino_gl`, `uva_organica`; `RecepcionPage.tsx` pide `modelo_vehiculo`/`cuit_conductor`
  en el remito; `BodegaConfigPage.tsx` y `FincasAdmin.tsx` piden `nro_inscripto_inv`
  (+ `cuit`/`razon_social` en Fincas).
- **Corrección posterior (misma Fase 5, tras probar el flujo en el navegador)**:
  el texto de `CiuQcPage.tsx`/`IngresoUvaFlowPage.tsx` decía "el CIU ya viene
  aprobado" — se corrigió a "estos datos arman el lote y generan el .txt que se
  carga en el Sistema de Cosecha del INV para declararlos", acorde a la
  corrección del punto 2 de arriba. También se sacó del formulario el campo
  libre `estado` (`{ name: "estado", type: "text", placeholder: "aprobado" }`):
  `crearLote` exige que valga exactamente `"emitido"` para poder armar el lote,
  y el placeholder ("aprobado") invitaba a poner un valor que lo rompía sin dar
  ningún error claro — quedó sacado, `Ciu.estado` sigue con su default de
  schema (`"emitido"`) sin que haga falta tocarlo desde la UI.

### Fase 6 — Borrado en cascada + selector de lote rediseñado

Dos correcciones más, encontradas probando el flujo en vivo en el navegador:

- **Borrar un Remito/Recepción tiraba "Error interno"**: `deleteRemitoUva` y
  `deleteRecepcionBodega` hacían un `delete` directo, y como `Ciu`/`QcIngresoUva`/
  `LoteOrigenRecepcion` apuntan a `RecepcionBodega` con `onDelete: Restrict`,
  Postgres rechazaba el borrado con una foreign key que no se mapeaba a ningún
  mensaje claro. Se agregó `eliminarRecepcionEnCascada` (`elaboracion.service.ts`):
  borra CIU/QC y el `Lote` que haya armado esa recepción si nadie más lo usa. De
  paso, `elaboracion.controller.ts` mapea cualquier FK de Prisma (P2003/P2014)
  que se escape en otros borrados a un 409 legible en vez de un 500 genérico.
  - **Corrección (Fase 9, encontrado en vivo)**: la primera versión bloqueaba
    con 409 si ese lote ya tenía volumen movido a vasija o se había usado en un
    corte — muy estricto: en la práctica, en cuanto alguien mandaba el lote a
    vasija (el flujo normal), la recepción quedaba imposible de borrar aunque
    fuera un lote de prueba. Se relajó al mismo criterio que `eliminarLote`
    (Fase 9): **solo bloquea si el lote ya se usó como componente de OTRO lote**
    (`LoteComposicion.lote_padre_id` — ahí sí no hay cascada segura). Si no está
    bloqueado, ahora también borra `VasijaContenido`/`LoteComposicion` propia
    del lote al eliminarlo. `getImpactoBorradoRecepcion` avisa el volumen en
    vasija que se va a borrar (`volumenVasijaL`) en vez de tratarlo como motivo
    de bloqueo.
- **El selector de lote (`LoteSelectorPanel.tsx`) solo mostraba los ingresos del
  mismo cuartel que la recepción actual, filtrando afuera todo lo demás.**
  Se rediseñó para mostrar **todos** los ingresos de la bodega/campaña, más
  recientes primero, agrupados por cuartel (`GET /elaboracion/recepciones-bodega/para-lote`,
  reemplaza a `pendientes-lote`, ya no requiere `cuartelId`). Dentro de cada
  grupo: los del cuartel de la recepción actual son seleccionables (checkbox,
  cualquier combinación); los de otros cuarteles se listan igual pero no son
  seleccionables (la regla de "mismo cuartel" la sigue exigiendo el backend);
  los que ya están en un lote quedan grises y colapsados como historial
  (`<details>` "N ya en un lote"); los que todavía no tienen CIU se listan
  atenuados con "falta registrar el CIU".
- **"Nuevo registro" ya no deja duplicar análisis/CIU para el mismo ingreso —
  vía las opciones del `<select>`, no un botón bloqueado por wizard-lock**:
  `SelectOption` ganó un campo `disabled?: boolean` que `GenericCrudSection`
  respeta al renderizar las `<option>` (gris, con sufijo "· no disponible").
  Se usa para que la lista de remitos en el form de Recepción no ofrezca uno
  que ya tiene recepción cargada, y la lista de recepciones en Análisis/CIU no
  ofrezca una que ya tiene análisis/CIU cargado — cruzando, en
  `RecepcionPage.tsx`/`CiuQcPage.tsx`, la lista de opciones contra la lista de
  registros hijos ya existentes (fetch en paralelo, sin endpoints nuevos). Si
  **todas** las opciones de un select obligatorio quedan deshabilitadas,
  `GenericCrudSection` también deshabilita "Nuevo registro" (campo
  `sinOpcionesField`), con aviso.
  - Primera versión de este punto agregaba además un prop `duplicateCheckField`
    que bloqueaba "Nuevo registro" comparando contra el ingreso "recordado" por
    el wizard (`defaultValues`) — **se sacó**: como no hay paso de "continuar"
    entre Análisis y CIU, ese valor recordado queda desactualizado apenas se
    navega manualmente entre tabs, y terminaba bloqueando la creación de un CIU
    legítimo para un segundo ingreso (mostraba "ya hay un registro" aunque
    fuera el ingreso equivocado el que ya lo tenía). El grisado por opción no
    tiene ese problema porque sale siempre de la data real, no de un valor
    recordado.

**Probado manualmente contra la base local** (script ad-hoc con datos
sintéticos con todos los campos nuevos poblados, sin dejar datos de prueba):
crear Bodega/Finca/RemitoUva/CIU × 2 → `crearLote` → `getLoteCiusExport` →
confirmado 2 líneas (una por CIU), 50 campos por línea, y cada valor cayendo
en la posición esperada (código CIU, fecha, INV/razón/CUIT de bodega y finca,
kg, patente/modelo/CUIT conductor, variedad INV, tenor, cosecha, orgánica,
estado, RENSPA). ✅

### Fase 7 — El selector de lote no puede depender del "ingreso actual" del wizard

Dos bugs más de la misma familia, encontrados en el navegador, que terminaban en
"no puedo hacer nada en el último paso":

- **El filtro por campaña vaciaba la lista siempre**: `listRecepcionesParaLote`
  filtraba `remito_uva.evento_cosecha.campania_id`, pero `RemitoUva.lote_cosecha_id`
  es opcional y el formulario de remito (`remitoFields` en `RecepcionPage.tsx`)
  ni siquiera lo pide — en la práctica casi ningún remito tiene `evento_cosecha`
  seteado, así que ese filtro dejaba la lista de ingresos vacía apenas había una
  campaña activa (que es casi siempre). Se sacó el filtro por completo —
  `listRecepcionesParaLote`/`GET .../para-lote` ya no acepta `campaniaId`.
- **El panel dependía de "el ingreso actual" (`IngresoUvaFlowPage`'s
  `analisisDefaults.recepcionBodegaId`), y ese valor solo se actualiza cuando se
  pasa por el modal "Continuar" de cada paso** — que no existe entre Análisis y
  CIU (ver Fase 6/nota de pendientes). Apenas alguien navegaba manualmente entre
  tabs (lo normal, dado que ese modal no está en todos los pasos), ese valor
  quedaba vacío o desactualizado, y el paso "Enviar a vasija" no mostraba nada
  (`{currentRecepcionId && ... ? <LoteSelectorPanel/> : null}` — sin ese id, ni
  siquiera se montaba el panel).
  - **Fix**: `LoteSelectorPanel` dejó de depender de un `recepcionBodegaId`
    puntual — ahora es un componente a nivel bodega nada más: trae todos los
    ingresos frescos en cada visita, sin preseleccionar ni bloquear ningún
    checkbox por defecto (antes el "ingreso actual" quedaba tildado y no se
    podía destildar). `IngresoUvaFlowPage` ya no necesita rastrear cuál es el
    "ingreso actual" para este paso.
  - Se agregó un botón **"Armar otro lote"** (visible una vez que ya se armó uno
    y se pasó a vasija) que resetea el panel (via `key` para forzar remount) sin
    tener que volver a "Remito de uva".

### Fase 8 — Select de vasija que no dejaba elegir + reparto de un lote en varias vasijas

- **El select de "Vasija" en el paso "Enviar a vasija" no dejaba elegir nada**:
  el array `fields` de esa `GenericCrudSection` (Operaciones Vasija) se armaba
  inline en el JSX de `VasijasProcesoPage.tsx`, sin memoizar. Ese formulario usa
  `onValuesChange` para alimentar `VasijaComposicionPanel` — cada cambio de
  valor re-renderiza el componente padre, lo que creaba un array `fields` nuevo
  en cada render; el `useEffect` de `GenericCrudSection` que depende de `fields`
  lo detectaba como "cambiaron los campos" y pisaba la selección con
  `defaultValues` de nuevo en el mismo tick — cada clic se revertía solo. Fix:
  se memoizó como `operacionFields` (`useMemo`, mismo patrón que
  `recepcionFields`/`analisisFields`/`ciuFields` en las otras páginas).
- **¿Un lote va siempre entero a una sola vasija?** Investigado (proceso real de
  recepción de uva) y confirmado contra el código: no hace falta que sea así, y
  el sistema ya lo soportaba sin que se notara — el "ingreso" no manda "todo el
  lote", manda el número que se cargue en "Volumen movido (l)", así que ya se
  podía repetir la operación con el mismo `loteId` hacia otra vasija. Lo único
  que faltaba era hacerlo explícito en la UI: `VasijasProcesoPage.tsx` ahora
  lleva la cuenta de a qué vasijas ya se mandó ese lote (`asignacionesLote`,
  vía `onCreated` de la `GenericCrudSection`, solo en el flujo guiado
  `inlineOperacionForm`), muestra un resumen ("Ya se mandó a vasija: X — N l")
  y oculta el formulario hasta que el usuario clickea explícitamente **"Agregar
  otra vasija a este lote"** (`mostrarFormIngreso`). No se agregó (ni hace
  falta, según el análisis) una validación de "no superar el total del lote":
  el remito pesa la uva en kg, no hay litros totales del lote en ningún lado —
  quien carga el volumen es quien está parado frente al tanque midiendo lo que
  entró.

### Fase 9 — Editar/borrar Lote + lotes que quedaron sin enviar a vasija

- **Editar y eliminar un Lote**: nuevo `updateLote` (`codigo`/`variedad`/`observaciones`
  — no se puede editar `origen`/`cuartel_id`/`campania_id`, son estructurales a
  cómo se armó) y `eliminarLote` en `lotes.service.ts`. Igual criterio que con
  Remito/Recepción (Fase 6): **se bloquea con 409** solo cuando este lote ya se
  usó como componente de OTRO lote (`LoteComposicion.lote_padre_id` — ahí no
  hay cascada segura, corromper la genealogía de otro lote no es una opción).
  Si no está bloqueado, cascada completa: `VasijaContenido` (todo, activo e
  histórico), `LoteComposicion` propia (si es resultado de un corte),
  `LoteOrigenRecepcion` (las recepciones quedan liberadas, vuelven a aparecer
  como pendientes). `GET /lotes/:id/impacto-borrado` arma el aviso previo
  (mismo patrón que `getImpactoBorradoRecepcion`/`Remito`), y
  `LoteDetailPage.tsx` lo muestra en el modal de confirmación antes de dejar
  clickear "Eliminar" (el botón queda deshabilitado si el impacto trae
  `usadoComoComponenteDe`).
- **Un lote ya armado, sin enviar a vasija, no aparecía en ningún lado**:
  encontrado en vivo — dos ingresos ya estaban agrupados en un lote de una
  prueba anterior, ese lote nunca se mandó a vasija, y el nuevo
  `LoteSelectorPanel` (Fase 7) solo arma lotes *nuevos* a partir de ingresos
  *pendientes* — como esos dos ya estaban en el lote, no quedaba nada para
  seleccionar y no había forma de retomarlo. Fix: `listLotes`/`getLoteById`
  ahora incluyen `_count: { vasija_contenido, composicion_padre }`, y
  `LoteSelectorPanel` muestra una sección aparte **"Lotes armados, pendientes
  de enviar a vasija"** (los que tienen `_count.vasija_contenido === 0`) con
  un botón "Usar este lote" que salta directo a la pantalla de continuar a
  vasija, sin tener que re-armar nada.

**Probado manualmente contra la base local** (script ad-hoc, sin dejar datos
de prueba): crear lote simple → editar observaciones → impacto de borrado (1
recepción, sin vasija, sin uso como componente) → eliminar → confirmado que
el lote desaparece y su recepción queda liberada (`lote_origen_recepcion:
null`). Segundo caso: lote con volumen en vasija, usado luego como componente
de un corte (blend) → `eliminarLote` sobre el lote padre rechazado con el
mensaje esperado → `impacto-borrado` muestra `usadoComoComponenteDe` con el
código del lote-blend. ✅

### Fase 10 — "Lotes ya armados" no debía filtrar por si ya recibió algo en vasija

Encontrado en vivo: dos viajes que ya estaban agrupados en un único lote (no
eran dos lotes separados) — al mandar parte del volumen de ese lote a una
vasija, el lote desaparecía de la sección "Lotes armados, pendientes de
enviar a vasija" (Fase 9, filtraba por `_count.vasija_contenido === 0`) y no
quedaba forma de volver a agregarle el resto del volumen a otra vasija.

- `LoteSelectorPanel.tsx`: la sección ya no filtra — muestra **todos** los
  lotes armados (ahora "Lotes ya armados"), indicando si ya tiene volumen en
  vasija o no. "Usar este lote" sirve tanto para mandarlo por primera vez
  como para agregarle más volumen después.
- `VasijasProcesoPage.tsx`: el resumen "Ya se mandó a vasija" (`asignacionesLote`,
  Fase 8) se armaba solo con lo cargado en esa misma sesión del navegador — si
  recargabas la página o volvías más tarde, se perdía y el formulario volvía a
  arrancar en blanco sin reflejar lo que ya había en la base. Ahora, al llegar
  con un `loteId` fijo (flujo guiado), un `useEffect` trae el estado real vía
  `GET /elaboracion/lotes/:id/impacto-borrado` (reutilizado — ya traía
  `vasijaContenido` con `activo`) y arranca el resumen con eso.

### Fase 11 — "Agregar otra vasija" pedía elegir nuevo, cuando lo normal es seguir en la misma

Corrección de UX, no técnica: la Fase 8/9 escondían el formulario detrás de un
botón "Agregar otra vasija a este lote" que, al abrirse, arrancaba con el
select de "Vasija" en blanco — obligando a re-elegir la vasija a mano incluso
para el caso normal (seguir llenando la misma vasija porque no se completó).
Según el usuario (y confirma el proceso real): lo habitual es que un lote
entre entero a una sola vasija a lo largo de varios viajes; separarlo en más
de una vasija es la excepción (se llenó, o el enólogo decide separar algo a
propósito).

- Se sacó el botón/toggle de mostrar-ocultar el form — ahora el formulario de
  "ingreso" siempre está visible en el flujo guiado.
- `VasijasProcesoPage.tsx` calcula `vasijaSugeridaId`: si el lote ya está
  entrando a una única vasija, esa queda pre-cargada por defecto en el select
  de "Vasija" (`operacionDefaults.vasijaDestinoId`) — el enólogo solo tipea el
  volumen y confirma para seguir sumando a la misma. Si ya está repartido en
  más de una vasija, no se adivina ninguna (el enólogo elige). Para separar a
  otra vasija en cualquier caso, alcanza con cambiar la selección del propio
  select — no hace falta ningún flujo aparte.

### Fase 12 — "Estado de vasijas" mostraba vacío aunque ya tuviera vino real

`VasijaEstadoPanel.tsx` (el panel con los iconitos de tanque) leía el volumen
de `ExistenciaVasija` — una medición manual (volumen, grado alcohólico, azúcar
residual) que es una entidad totalmente aparte del ledger de movimientos
(`VasijaContenido`) que arma `aplicarMovimientoVasija` con cada ingreso/trasiego.
Como nadie carga esas mediciones a mano en el flujo guiado, el ícono aparecía
"Sin existencia registrada" aunque la vasija ya tuviera litros reales adentro
(visibles en su pestaña "Movimientos").

- Se cambió la fuente de datos a `GET /elaboracion/vasijas/:id/composicion-actual`
  (el mismo endpoint que ya usa `VasijaComposicionPanel` para "disponible: X l"
  durante un trasiego) — el ícono y el % ahora salen del ledger real, no de una
  medición manual. Se llama una vez por vasija (`Promise.all`), sin endpoint
  nuevo.
- De paso se agregó el/los código(s) de lote que tiene cada vasija en este
  momento, debajo del código de la vasija.
- "Existencias Vasija" (el CRUD manual) **no se tocó** — sigue siendo el lugar
  para cargar mediciones de laboratorio (grado alcohólico, azúcar residual),
  que es información que no sale de ningún movimiento y sigue haciendo falta
  cargar a mano. Solo se desacopló el ícono de fill de esa fuente.
- No se tocó la lista "Administración de vasijas" (`/bodega/vasijas`, las
  tarjetas con "Ver movimientos"/"Gestionar"/"Editar"/"Eliminar") — esa vista
  es de administración (tipo/capacidad/uso/etapa), no muestra volumen y no es
  donde se pidió el arreglo.

**Probado contra la base local**: confirmado que la vasija V-01 real (la que
usó el usuario probando el flujo) tiene 2 filas activas en `VasijaContenido`
(1000 l + 2000 l = 3000 l, lote `BODE-C99-MAL-25-01`) — el fix hace que el
panel calcule y muestre eso en vez de "Sin existencia registrada". ✅

### Fase 13 — Corrección de errores post-vasija: por operación, no por remito

Surgió de una operación de vasija huérfana (sin `VasijaContenido`, de antes de
que el flujo quedara bien conectado) que no se podía borrar ni corregir desde
ningún lado. Al pensarlo con el usuario, la conclusión fue: una vez que el
vino ya está físicamente en una vasija, borrar en cascada desde el remito
(Fase 9) está mal — el vino sigue estando ahí; borrar el papel de origen solo
hace que la vasija "mienta" sobre cuánto tiene. La corrección de un error en
ese punto tiene que hacerse a nivel de la operación de vasija puntual, no del
remito.

- **Se revirtió la Fase 9 en parte**: `eliminarRecepcionEnCascada`/
  `getImpactoBorradoRecepcion` vuelven a **bloquear** si el lote de la
  recepción ya tiene volumen en `VasijaContenido` (no solo si se usó como
  componente de un blend, como quedó tras la Fase 9). El caso "todavía no
  llegó a vasija" sigue pudiéndose borrar en cascada sin problema.
- **Nuevo: se puede borrar una operación de vasija puntual** (`DELETE
  /elaboracion/operaciones-vasija/:id`, ya existía el endpoint pero hacía un
  `delete` ciego sin tocar el ledger — quedaba volumen fantasma). Ahora:
  - `VasijaContenido` ganó `operacion_vasija_id` (migración
    `20260730161851_vasija_contenido_operacion_link`, nullable — las filas que
    vienen de un Corte no tienen operación asociada) para poder ubicar
    exactamente qué filas generó cada operación, sin adivinar por fecha/volumen.
    `aplicarMovimientoVasija` ahora recibe y estampa ese id en cada fila que crea.
  - `deleteOperacionVasija` solo revierte automáticamente el caso simple y
    seguro: un **"ingreso"** cuya fila en el ledger sigue activa (nadie la
    movió después) — ahí borra la operación y la fila del ledger juntas.
  - Para trasiego/descube/corrección, o un ingreso cuyo volumen ya se movió
    de nuevo, **bloquea** (409) — revertir esos automáticamente arriesgaría el
    balance de la vasija (reabrir exactamente la fila que se cerró no es
    seguro sin más infraestructura); hay que corregirlo con un movimiento
    inverso a mano.
  - `GET /elaboracion/operaciones-vasija/:id/impacto-borrado` avisa antes de
    confirmar. `BodegaVasijaDetailPage.tsx` (el detalle de vasija, sección
    "Movimientos") ganó un botón "Eliminar" por fila de operación con ese
    aviso.
- **Limpieza de datos de prueba, como práctica general**: en vez de un botón
  de "reset" permanente en la app (riesgoso si algún día se clickea sin
  querer, incluso en producción), el usuario prefirió pedirlo puntualmente
  cuando haga falta — se limpia con un script ad-hoc igual que los que se
  usaron para verificar cada fix de esta sesión, scopeado a una bodega
  puntual, sin tocar el resto.

**Probado contra la base local**: 1) la operación huérfana real (sin
`VasijaContenido`) del usuario se borró sin problema; 2) sintético: crear
ingreso → confirmar que la recepción de origen queda bloqueada para borrar →
borrar la operación puntual → confirmar que el `VasijaContenido` desaparece →
confirmar que la recepción **ya** se puede borrar. Los cuatro pasos dieron el
resultado esperado. ✅

---

## ⚠️ PENDIENTE

### 1. Aplicar las migraciones a producción (OBLIGATORIO antes de usar en prod)
```bash
cd traza_backend
DATABASE_URL="<url con el rol ideal-db, NO pablo>" npx prisma migrate deploy
```
La tabla `vasija` de producción está migrada (Fase 0 de la sesión anterior), pero
ni `Lote`/`LoteComposicion`/etc. (`20260730025643_lote_traceability`), ni los
campos de la Fase 5 (`20260730061935_ciu_campos_declaracion_inv`), ni
`VasijaContenido.operacion_vasija_id` de la Fase 13
(`20260730161851_vasija_contenido_operacion_link`) **existen todavía en prod**.
Las tres son aditivas/de bajo riesgo (no borran nada, tablas/columnas afectadas
vacías en prod). Igual: correrlas con el rol `ideal-db` (dueño del schema), no
con `pablo` (sin permisos de owner — ver incidente de la sesión anterior).

### 2. Fallback de trazabilidad inversa no filtra por fecha
En `getTrazabilidadInversaByCodigoEnvase`, el camino de respaldo (cortes viejos sin
`lote_creado`) lee `vasija.vasija_contenido` **sin filtrar `hasta: null`** — trae
TODOS los lotes que pasaron alguna vez por esa vasija, no solo el que estaba en el
momento del corte. Para cortes nuevos (con `lote_creado`) esto no aplica — el
camino primario es exacto. Si hace falta reconstruir trazabilidad de cortes viejos
con precisión temporal, hay que filtrar `vasija_contenido` por
`desde <= corte.fecha AND (hasta IS NULL OR hasta >= corte.fecha)`.

### 3. `corte_parcial` sigue disponible en el form manual de Operaciones Vasija
La idea original era dejar de ofrecerlo una vez que Corte tuviera su selector de
volumen propio (para que todo blend parcial pase por `LoteComposicion`), pero
**no se sacó** de `OPERACION_TIPOS` en `vasijaFields.ts` / el dropdown del
frontend. Hoy alguien todavía puede hacer un "corte parcial" manual vía
Operaciones Vasija que mueve litros correctamente (usa el mismo motor de Fase 1)
pero **no genera un Lote ni `LoteComposicion`** — la genealogía de ese movimiento
específico no queda registrada como blend.

### 4. No se construyó la "vía de escape" manual (`declarar-contenido`)
El plan original mencionaba un endpoint `POST /elaboracion/vasijas/:id/declarar-contenido`
para que un enólogo pudiera declarar a mano el contenido de una vasija que ya
tenía algo antes de arrancar el ledger (las 12 vasijas reales, por ejemplo, quedaron
`vacía` sin lote). **No se implementó.** Si hace falta completar el dato de una
vasija que ya tiene vino sin lote de origen, hoy no hay forma desde la UI — habría
que hacerlo a mano en la base o construir ese endpoint.

### 5. `QrInversaPage.tsx` no se rediseñó
Sigue mostrando la respuesta cruda en un `<pre>{JSON.stringify(...)}</pre>`. Sigue
funcionando (ya devuelve `genealogia`/`cius` en vez del `origenes` viejo), pero no
tiene una vista linda. `LoteGenealogiaTree.tsx` ya está armado y se podría reusar
ahí directamente.

### 6. Sin tests automatizados
Todo lo de arriba se probó con scripts ad-hoc contra la base local (creaban datos,
verificaban, borraban). No hay tests permanentes (unit/integration) para el motor
de balance, `crearLote` ni la genealogía.

### 7. Bodega sin `codigo` propio todavía
Ninguna bodega tiene `Bodega.codigo` seteado hoy — el generador de código de lote
cae al fallback (iniciales del nombre). Conviene que cada bodega configure su
código corto en `/bodega/configuracion` antes de que los códigos de lote se
vuelvan "oficiales" para uso externo (documentos al INV, etc.).

### 8. Posiciones "sin confirmar" del `.txt` de export (Fase 5)
`construirLineaCiuInv` tiene varias posiciones (2, 9-11, 15-23, 33, 34, 35, 36,
37-40, 42-46, 48, 49) que se llenan con una constante fija porque no aparecían
en ninguno de los 6 PDF de ejemplo — se copió el valor que traían los 6
ejemplos reales, así que el `.txt` generado es byte-idéntico a esos casos,
pero si el INV espera algo distinto en esas columnas para otros escenarios
(otro tipo de declaración, otra modalidad de comercialización, etc.) hoy no
se sabe. Si aparece un layout oficial del INV o más ejemplos reales, conviene
revisar esas posiciones contra `docs/` antes de confiar en el export para
casos fuera de "viaje normal, uva propia, sin mezcla". Modalidad de
comercialización (posiciones 42-46, tentativo) quedó explícitamente sin
mapear — ver Fase 5.

---

## 🔭 Deferido / decisiones ya tomadas, no re-litigar

- **Trasiego hacia una vasija ya ocupada está permitido** (se vuelve multi-lote sin pasar por Corte) — no se fuerza todo a pasar por el blend formal. Solo se valida que nunca se saque más de lo que hay.
- **`porcentaje_aporte` en `VasijaContenido` no se escribe** — se calcula siempre al leer, para evitar el bug de tener que recalcular "el resto" en cada movimiento.
- **Mezcla homogénea asumida**: al mover volumen de una vasija con varios lotes, se reparte proporcional entre todos — no se puede elegir "sacar solo el lote X" de una vasija ya mezclada.
- **`EventoCosecha.lote_cosecha_id` (lote de cosecha, finca) vs `Lote` (lote de bodega, nuevo)**: son conceptos distintos con nombres parecidos, a propósito no se unificaron ni se renombró el viejo (mucho blast radius del lado de finca). En la UI nueva siempre se dice "lote de bodega" o se muestra el código, nunca "lote" pelado.
- **`CorteComponente.lote_id` casi no se usa** en el flujo nuevo: el detalle multi-lote de lo que se saca de una vasija mezclada vive en `LoteComposicion`, no ahí. Queda solo como caso simple/legacy (blend directo desde un lote sin pasar por vasija, que no es el flujo esperado).

---

## Endpoints nuevos

### `/elaboracion/lotes` y relacionados
| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/lotes?bodegaId=` | Listado de lotes de la bodega |
| POST | `/lotes` | Crear lote de ingreso (junta recepciones/CIU) |
| POST | `/lotes/blend` | Corte guiado: vasijas+volumen → lote-blend + `LoteComposicion` |
| GET | `/lotes/:id` | Detalle (incluye `lote_origen_recepcion`, `composicion_hijo`) |
| GET | `/lotes/:id/genealogia` | Árbol recursivo + lista plana de CIU con % efectivo |
| GET | `/lotes/:id/cius-export` | Descarga `.txt`: una línea por CIU, 50 campos separados por `\|` (formato INV) |
| GET | `/recepciones-bodega/para-lote?bodegaId=&campaniaId=` | Todos los ingresos de la bodega/campaña (con CIU y lote asignado si ya tiene), para agrupar por cuartel en el selector |

### `/bodegas`
| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/bodegas/:id` | Detalle de bodega (antes no existía) |
| PATCH | `/bodegas/:id` | Editar nombre/razón social/CUIT/código |

### `/elaboracion/vasijas`
| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/vasijas/:id/composicion-actual` | Lotes activos + volumen/% en esa vasija ahora |

### Cambiado (no nuevo)
`GET /trazabilidades/codigo-envase/:codigoQr/inversa` — mismo endpoint, respuesta
distinta: antes `{ ..., origenes: EventoCosecha[] }`, ahora
`{ ..., genealogia: LoteGenealogiaNode, cius: CiuContribucion[] }`.
