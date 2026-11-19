# 🧩 Guía de Componentes (`frontend/src/components/`) y Cómo los Llaman las Vistas

Este documento explica qué hace cada archivo dentro de **`frontend/src/components/`**, cómo funciona internamente su código y de qué manera lo importan y llaman las vistas y `App.vue`.

---

## 1. Mapa General: Quién Llama a Quién

Los componentes se dividen en **componentes visuales reutilizables** y **diálogos (modales) conectados al store**:

```text
frontend/src/
├── App.vue
│   ├── llama a ──▶ PartidoDialog.vue   (v-model="store.dialogoPartido")
│   └── llama a ──▶ EquipoDialog.vue    (v-model="store.dialogoEquipo")
│
└── views/
    ├── PosicionesView.vue  ──▶ llama a AppActionButton.vue
    ├── InscripcionView.vue ──▶ llama a AppActionButton.vue y JugadorDialog.vue
    ├── EquiposView.vue     ──▶ llama a AppActionButton.vue y EquipoDialog.vue
    └── RankingView.vue     ──▶ llama a RankingTableCard.vue
                                          └── llama a RankingScoreBadge.vue
```

| Componente | Tipo | Quién lo importa y lo usa |
| --- | --- | --- |
| `AppActionButton.vue` | Botón visual reutilizable | `InscripcionView.vue`, `PosicionesView.vue`, `EquiposView.vue` |
| `RankingTableCard.vue` | Tarjeta + tabla de ranking | `RankingView.vue` |
| `RankingScoreBadge.vue` | Insignia de goles / asistencias | `RankingTableCard.vue` |
| `PartidoDialog.vue` | Modal para programar partidos + IA | `App.vue` |
| `EquipoDialog.vue` | Modal para registrar un club | `App.vue`, `EquiposView.vue` |
| `JugadorDialog.vue` | Modal para registrar un futbolista | `InscripcionView.vue` |

---

## 2. Cómo Funciona la Comunicación en Vue 3

Todos los componentes siguen el mismo patrón de comunicación con el archivo que los llama:

1. **Importación en `<script setup>`:** la vista importa el componente desde `../components/...` (o `./components/...` en `App.vue`).
2. **Entrada de datos (`props`):** el padre le envía datos mediante atributos (`:tabla="..."`, `tone="primary"`, `:equipo-preseleccionado="..."`).
3. **Salida / sincronización (`emits` y `v-model`):**
   - En los modales (`*Dialog.vue`), se usa `v-model="variableBooleana"`. Internamente eso equivale a pasar la prop `modelValue` y escuchar `@update:modelValue` para abrir o cerrar el diálogo.
   - En `AppActionButton.vue`, los eventos como `@click` y props nativas de Quasar (`to`, `label`, `icon`, `loading`) pasan directo al `<q-btn>` gracias a `v-bind="$attrs"`.
4. **Datos globales (`useTorneo`):** los diálogos y `RankingTableCard.vue` importan `useTorneo()` desde `frontend/src/store/torneo.js` para leer equipos, jugadores o guardar cambios en el backend sin tener que pedir todo por props.

---

## 3. Explicación Detallada de Cada Componente

### A. `AppActionButton.vue` — Botón Reutilizable con Estilo Centralizado

**Archivo:** `frontend/src/components/AppActionButton.vue`

#### Cómo funciona por dentro
- **Envoltura transparente sobre Quasar (`<q-btn>`):**
  - `defineOptions({ inheritAttrs: false })` evita que Vue pegue los atributos extra al elemento incorrecto y permite pasarlos manualmente con `v-bind="$attrs"` directo al `<q-btn>` (líneas 2–3 y 17).
  - Declara explícitamente `const emit = defineEmits(['click'])` y reenvía `@click="emit('click', $event)"` desde el `<q-btn>` hacia la vista padre.
  - Gracias a `$attrs` + `emit('click')`, cualquier vista puede pasarle `flat`, `outline`, `unelevated`, `dense`, `no-caps`, `to`, `type="submit"`, `:loading`, `:icon`, `:icon-right`, `@click` o incluso un `<q-tooltip>` dentro de `<slot />` (línea 14).
- **Paleta semántica (`tone` → `color`):**
  - El objeto `colorByTone` (líneas 47–53) traduce nombres simples a colores de Quasar:
    - `primary` → `'primary'`
    - `dark` → `'slate-800'`
    - `neutral` → `'grey-7'`
    - `indigo` → `'indigo-7'`
    - `warning` → `'amber-9'`
  - En la línea 5 (`:color="props.color || colorByTone[props.tone] || props.tone"`), si la vista pasa `color="..."` explícito, tiene prioridad sobre `tone`.
- **Personalización por variables CSS (líneas 6–11 y 56–66):**
  - Convierte las props `fontFamily`, `fontWeight`, `letterSpacing` y `borderRadius` en variables CSS (`--app-action-*`).
  - `.app-action-button :deep(.q-btn__content)` aplica tipografía, grosor y espaciado al contenido interno de Quasar.

#### Cómo lo llaman las otras vistas

1. **`PosicionesView.vue`** (líneas 368, 428, 467 e importación en línea 505) lo usa como enlace de navegación rápida (`to="/fixture"` o `to="/ranking"`):
   ```vue
   <AppActionButton
     flat
     dense
     no-caps
     tone="primary"
     label="Ver Fixture"
     to="/fixture"
     size="sm"
     :icon-right="matArrowForward"
   />
   ```

2. **`InscripcionView.vue`** (líneas 37–60, 171–180 e importación en línea 225) lo usa para el botón `submit` del formulario y para las acciones tras inscribir un club:
   ```vue
   <AppActionButton
     tone="primary"
     unelevated
     no-caps
     :icon="matPersonAdd"
     label="Registrar Jugadores a este Club"
     @click="abrirRegistroJugador(clubInscrito.id || clubInscrito._id)"
     class="text-weight-bold"
   />
   ```

3. **`EquiposView.vue`** (líneas 242–263 e importación en línea 637) lo usa con tonos `indigo` y `warning`, incluyendo `<q-tooltip>` dentro del slot:
   ```vue
   <AppActionButton
     unelevated
     tone="warning"
     text-color="white"
     no-caps
     :icon="matSwapHoriz"
     label="🔄 Cambiar de Equipo"
     class="text-weight-bold shadow-2"
     @click="abrirDialogoTraspaso"
   >
     <q-tooltip>Solicita transferirte a otro club...</q-tooltip>
   </AppActionButton>
   ```

---

### B. `RankingTableCard.vue` y `RankingScoreBadge.vue` — Tablas de Goleadores y Asistidores

**Archivos:**
- `frontend/src/components/RankingTableCard.vue`
- `frontend/src/components/RankingScoreBadge.vue`

#### Cómo funciona `RankingTableCard.vue` por dentro
1. **Recibe una única prop obligatoria (`tabla`)** (líneas 89–94) con toda la configuración de la tabla a renderizar:
   - `titulo`, `subtitulo`, `icon`, `avatarBg`, `avatarColor` (cabecera de la tarjeta).
   - `label` (encabezado de la última columna: `"Goles"` o `"Asistencias"`).
   - `campo` (`'goles'` o `'asistencias'`), usado para leer `jugador[tabla.campo]` dinámicamente.
   - `datos` (arreglo de jugadores ya filtrados y ordenados).
2. **Podio y estado vacío:**
   - Recorre `tabla.datos` con `v-for="(jugador, indice) in tabla.datos"` (línea 28).
   - Colorea los 3 primeros lugares con `gold-badge`, `silver-badge` y `bronze-badge` (líneas 32–37).
   - Si `tabla.datos` está vacío, muestra el mensaje *"Sin registros computados aún"* (líneas 69–77).
3. **Consulta al store (`useTorneo`):**
   - Usa `store.equipoPorId(...)` en `nombreEquipo(id)` y `colorEquipo(id)` (líneas 96–104) para mostrar el nombre y el punto de color del club de cada jugador.
4. **Llama a `RankingScoreBadge.vue` (líneas 65 y 87):**
   ```vue
   <RankingScoreBadge :valor="jugador[tabla.campo] ?? 0" :campo="tabla.campo" />
   ```

#### Cómo funciona `RankingScoreBadge.vue` por dentro
- Recibe `valor` (`Number | String`) y `campo` (`String`) (líneas 11–20).
- Si `campo === 'goles'`, pinta fondo naranja (`bg-orange-1 text-orange-9`) y el ícono `⚽`; en otro caso (asistencias), pinta fondo azul (`bg-blue-1 text-blue-9`) y el ícono `🎯` (líneas 4–6).

#### Cómo lo llama `RankingView.vue`
En `frontend/src/views/RankingView.vue` (líneas 86, 95 y 99–138):
- La vista mantiene la lógica de negocio: filtra `store.goleadores` y `store.asistidores` según el rol (`esJugador` / `esEntrenador` ven solo los de su club).
- Construye la propiedad computada `tablas` con dos objetos (uno para Goleadores y otro para Asistidores) y los renderiza en un ciclo:
  ```vue
  <div class="row q-col-gutter-lg">
    <RankingTableCard v-for="tabla in tablas" :key="tabla.titulo" :tabla="tabla" />
  </div>
  ```

---

### C. `PartidoDialog.vue` — Modal para Programar Partidos y Generador con IA

**Archivo:** `frontend/src/components/PartidoDialog.vue`

#### Cómo funciona por dentro
1. **Control de apertura (`v-model`):**
   - Recibe `modelValue` y emite `update:modelValue` (líneas 2, 384–385) para abrir/cerrar el `<q-dialog>`.
2. **Validaciones reglamentarias en tiempo real (`computed`):**
   - `opciones` (líneas 438–463): lista todos los clubes indicando si están habilitados (`cant >= 11`, sin exceso de titulares en cancha y con capitán asignado).
   - `conflictoDescanso` (líneas 484–526):
     - **Regla 1:** impide programar un club si ya tiene otro partido pendiente o en preparación.
     - **Regla 2:** impide asignar una fecha/hora anterior o igual al último encuentro de alguno de los dos clubes.
   - `alertaReglamentaria` (líneas 528–562) y `puedeGuardar` (líneas 600–611): muestran advertencias en pantalla y bloquean el botón **Programar Partido** si falta algún requisito.
3. **Guardado manual (`guardar`, líneas 625–683):**
   - Valida equipos, mínimo de 11 jugadores y capitán; luego llama a `store.guardarPartido(...)` y cierra el modal con `emit('update:modelValue', false)`.
4. **Sub-modal de IA Gemini (`mostrarModalIA`, líneas 245–375 y 570–598):**
   - Permite elegir cuántos partidos crear (1 a 6) y la separación en días (1, 2, 3 o 7 días).
   - Detecta qué clubes ya están jugando (`clubesConPartidoPendienteInfo`) y muestra el aviso oficial si aplica.
   - Al pulsar *Crear Partido(s) con IA*, llama a `store.generarPartidosConIA({ cantidadPartidos, intervaloDias })` y muestra la notificación con `$q.notify`.

#### Cómo lo llama `App.vue`
En `frontend/src/App.vue` (línea 753 e importación en línea 1173):
```vue
<PartidoDialog v-model="store.dialogoPartido" />
```
Cualquier vista o botón de la barra superior que ponga `store.dialogoPartido = true` abre automáticamente este modal global.

---

### D. `EquipoDialog.vue` — Modal para Registrar un Club

**Archivo:** `frontend/src/components/EquipoDialog.vue`

#### Cómo funciona por dentro
- Recibe `modelValue` y emite `update:modelValue` (líneas 2, 71–72).
- Mantiene un formulario local `form` con `nombre`, `barriada`, `capitan` y `escudocolor` (con paleta rápida de 8 colores en `colores`, líneas 75–84).
- Al ejecutar `guardar()` (líneas 89–111), valida que el nombre no esté vacío, llama a `store.agregarEquipo(...)` para guardarlo en MongoDB, reinicia el formulario y cierra el modal (`emit('update:modelValue', false)`).

#### Cómo lo llaman otros archivos
1. **`App.vue`** (línea 754 e importación en línea 1174):
   ```vue
   <EquipoDialog v-model="store.dialogoEquipo" />
   ```
2. **`EquiposView.vue`** (línea 413 e importación en línea 638):
   ```vue
   <EquipoDialog v-model="modalEquipo" />
   ```

---

### E. `JugadorDialog.vue` — Modal para Inscribir un Futbolista

**Archivo:** `frontend/src/components/JugadorDialog.vue`

#### Cómo funciona por dentro
1. **Props y sincronización (líneas 95–112):**
   - Recibe `modelValue` (para abrir/cerrar) y `equipoPreseleccionado` (`String`).
   - Un `watch(() => props.equipoPreseleccionado, ...)` actualiza automáticamente el club seleccionado en `form.equipo` cuando el usuario acaba de inscribir un club.
2. **Control de dorsales únicos (líneas 124–144):**
   - `jugadoresDelEquipo`: filtra `store.jugadores` por el club seleccionado.
   - `dorsalOcupadoPor`: detecta en vivo si el número ingresado ya lo usa otro compañero y muestra una advertencia en el input.
   - `siguienteDorsalDisponible`: busca el primer número libre del `1` al `99` y ofrece un botón rápido para asignarlo con un clic (líneas 56–58).
3. **Guardado (`guardar`, líneas 146–193):**
   - Valida equipo, nombre y dorsal disponible; luego llama a `store.agregarJugador(...)` y cierra el diálogo.

#### Cómo lo llama `InscripcionView.vue`
En `frontend/src/views/InscripcionView.vue` (líneas 215–218 e importación en línea 226):
```vue
<JugadorDialog
  v-model="mostrarDialogoJugador"
  :equipo-preseleccionado="clubRecienInscritoId"
/>
```
Cuando el usuario termina de registrar un club en `InscripcionView.vue` y hace clic en *"Registrar Jugadores a este Club"*, la vista asigna el ID a `clubRecienInscritoId` y cambia `mostrarDialogoJugador` a `true` para abrir el modal con ese club ya elegido.

---

## 4. ¿Por qué `FixtureView.vue` y `EntrenadorView.vue` no están en esa lista?

- **`FixtureView.vue`** y **`EntrenadorView.vue`** no importan ningún componente de `frontend/src/components/`: sus botones y diálogos propios (como la carga de marcador oficial, tarjetas, cambios o pizarra táctica) viven directamente dentro de cada vista.
- Sin embargo, si el Organizador abre **Programar Partido** o **Registrar Club** desde la barra de navegación global mientras está en cualquier ruta, quien se abre es `PartidoDialog.vue` o `EquipoDialog.vue` montado en `App.vue`.

---

## 5. Por Qué Existen `@` (`@click`), `:` (`v-bind`) y `v-model` en Componentes y Vistas

En Vue 3, estos tres símbolos cumplen papeles distintos para comunicar una vista (padre) con un componente (hijo) o con elementos de Quasar/HTML:

### 1. `@` (`v-on:`) — Escuchar Eventos ("Hijo → Padre" o "Usuario → Función")
El símbolo **`@`** sirve para **reaccionar a acciones que ocurren** (un clic, enviar un formulario, cambiar una selección).

- **`@click="funcion()"`**: ejecuta una función cuando el usuario hace clic.
  - Ejemplos en vistas llamando a componentes:
    - En `EquiposView.vue`: `<AppActionButton ... @click="abrirDialogoCambioDorsal(miFichaJugador)" />`
    - En `InscripcionView.vue`: `<AppActionButton ... @click="abrirRegistroJugador(...)" />`
    - Dentro de `AppActionButton.vue`: `<q-btn ... @click="emit('click', $event)" />` con `defineEmits(['click'])` para avisarle a la vista que se presionó el botón.
- **Otros eventos con `@` usados en el proyecto:**
  - `@update:model-value="..."`: avisa cuando cambia el valor de un diálogo, `q-select`, `q-input` o `q-toggle` (por ejemplo, en `PartidoDialog.vue`, `EquipoDialog.vue` y `JugadorDialog.vue`: `@update:model-value="$emit('update:modelValue', $event)"` para cerrar el modal cuando el usuario pulsa Esc, fuera del diálogo o *Cancelar*).
  - `@submit.prevent="..."`: intercepta el envío de un formulario (`<q-form>`) sin recargar la página (por ejemplo en `InscripcionView.vue` y `App.vue`).
  - `@click.stop="..."`: ejecuta el clic sin propagarlo a la tarjeta o fila contenedora (por ejemplo en `EntrenadorView.vue` línea 608).
  - `@change="..."`: detecta cuando el usuario elige un archivo de imagen para el escudo (`App.vue` línea 374).

### 2. `:` (`v-bind:`) — Enviar Datos Dinámicos ("Padre → Hijo")
El símbolo **`:`** (abreviatura de `v-bind:`) sirve para **pasar valores, variables, objetos, iconos o estilos JavaScript hacia adentro** de un componente o etiqueta HTML (si no lleva `:`, Vue lo interpreta como texto plano).

> **Aclaración importante (`@click` vs `:click`):**
> En Vue para escuchar un clic **siempre se usa `@click`** (evento con arroba), **no `:click`**, porque `:` pasa datos *hacia abajo* y `@` escucha acciones *hacia arriba*. Si ves `:icon`, `:tabla`, `:valor`, `:loading` o `:disable`, todos esos llevan `:` porque le pasan datos o estados al componente.

- Ejemplos reales en el proyecto con `:`:
  - `:tabla="tabla"` en `RankingView.vue` → le entrega a `RankingTableCard.vue` el objeto con título, ícono y lista de jugadores.
  - `:valor="jugador[tabla.campo] ?? 0"` y `:campo="tabla.campo"` en `RankingTableCard.vue` → le pasan el número y tipo (`'goles'` o `'asistencias'`) a `RankingScoreBadge.vue`.
  - `:equipo-preseleccionado="clubRecienInscritoId"` en `InscripcionView.vue` → le manda a `JugadorDialog.vue` el ID del club recién creado.
  - `:icon="matSwapHoriz"`, `:icon-right="matArrowForward"`, `:loading="guardando"`, `:disable="!puedeGuardar"`, `:model-value="modelValue"`, `:style="{ ... }"`, `:class="{ ... }"` → pasan iconos importados, booleanos y estilos dinámicos.

### 3. `v-model` — Enlace Bidireccional (`:` + `@` Juntos)
`v-model` **combina `:` y `@` en una sola directiva** para que el padre y el hijo compartan y actualicen la misma variable automáticamente:

```vue
<!-- Escribir esto: -->
<EquipoDialog v-model="modalEquipo" />

<!-- Equivale exactamente a escribir esto: -->
<EquipoDialog
  :model-value="modalEquipo"
  @update:model-value="modalEquipo = $event"
/>
```

- **Por qué existe en los modales (`*Dialog.vue`):**
  - La vista (`App.vue`, `EquiposView.vue`, `InscripcionView.vue`) abre el modal poniendo `modalEquipo = true` (entra por `:model-value`).
  - Cuando terminas de guardar o cierras con `v-close-popup`, el modal ejecuta `emit('update:modelValue', false)` (sale por `@update:model-value`) y la variable de la vista vuelve a `false` automáticamente.
- **Por qué existe en inputs y selects:**
  - `v-model="form.nombre"`, `v-model="form.equipo"` y `v-model.number="form.dorsal"` mantienen sincronizado lo que escribe o selecciona el usuario con la variable reactiva en JavaScript (`v-model.number` además convierte el texto a número automáticamente).

### Resumen por Componente (`frontend/src/components/`)

| Componente | Qué recibe con `:` (Props) | Qué emite / escucha con `@` | Usa `v-model` |
| --- | --- | --- | --- |
| `AppActionButton.vue` | `tone`, `color`, `fontFamily`, `fontWeight`, `letterSpacing`, `borderRadius`, `:icon`, `:icon-right`, `:loading`, `:disable` | `defineEmits(['click'])` + `@click` | No necesita (es un botón de acción) |
| `RankingTableCard.vue` | `:tabla` (datos e info de cabecera) y pasa `:valor`, `:campo` | No necesita (tabla informativa de solo lectura) | No necesita |
| `RankingScoreBadge.vue` | `:valor`, `:campo` | No necesita (etiqueta visual) | No necesita |
| `PartidoDialog.vue` | `:model-value` (estado abierto/cerrado) | `@update:model-value`, `@click` | Sí (`v-model="store.dialogoPartido"` desde `App.vue` + campos internos) |
| `EquipoDialog.vue` | `:model-value` (estado abierto/cerrado) | `@update:model-value`, `@click` | Sí (`v-model` desde `App.vue` y `EquiposView.vue` + campos internos) |
| `JugadorDialog.vue` | `:model-value`, `:equipo-preseleccionado` | `@update:model-value`, `@click` | Sí (`v-model="mostrarDialogoJugador"` desde `InscripcionView.vue` + campos internos) |

