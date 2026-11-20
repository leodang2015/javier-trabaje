# Componentes reutilizables del frontend

Se separaron elementos de interfaz repetidos en componentes de Vue para que sus estilos y estructura puedan modificarse desde un solo lugar, sin cambiar las acciones que ya realiza cada pantalla.

## Botón compartido

`frontend/src/components/AppActionButton.vue` envuelve el botón de Quasar y se utiliza en:

- `frontend/src/views/InscripcionView.vue`: acciones de inscripción y confirmación.
- `frontend/src/views/PosicionesView.vue`: accesos al fixture y al ranking.
- `frontend/src/views/EquiposView.vue`: cambio de dorsal y solicitud de cambio de equipo.

El componente reenvía al botón de Quasar sus atributos y eventos habituales, enfocándose en el manejo de eventos con `@` (`@click="emit('click', $event)"` y `defineEmits(['click'])`). También centraliza opciones de presentación:

- `tone`: paleta semántica (`primary`, `dark`, `neutral`, `indigo` o `warning`), traducida a colores de Quasar en el componente.
- `color`: color de Quasar opcional que prevalece sobre `tone`.
- `fontFamily`, `fontWeight` y `letterSpacing`: tipografía.
- `borderRadius`: redondeo de las esquinas.

Por ejemplo, usando únicamente `@click` para la interacción:

```vue
<AppActionButton
  tone="warning"
  label="Confirmar"
  icon="check"
  @click="confirmar"
/>
```

Para ajustar el estilo predeterminado de todos los usos, se pueden cambiar los valores iniciales y el mapa de colores dentro de `AppActionButton.vue`. Para personalizar un solo botón se pueden pasar opciones en la etiqueta:

```vue
<AppActionButton
  tone="warning"
  font-family="Arial, sans-serif"
  letter-spacing="0.03em"
  border-radius="12px"
  label="Confirmar"
  @click="confirmar"
/>
```

El componente compartido solo afecta a los botones que se reemplazaron por `AppActionButton`; los demás botones de la aplicación conservan su estilo actual.

## Vistas actualizadas

Aquí están las ubicaciones concretas dentro del proyecto. Los números indican las líneas actuales y pueden cambiar si luego se edita el código.

| Archivo | Dónde encontrar el cambio (líneas) | Qué cambio le hizo a la página |
| --- | --- | --- |
| `frontend/src/components/AppActionButton.vue` | Envoltura de Quasar y estilos del botón: líneas 1–70; emisión `@click`: líneas 12 y 21; props: líneas 23–48; mapa de colores: líneas 50–56. | Centraliza el aspecto de los botones reemplazados (`border-radius: 8px`, peso de fuente `700`, espaciado `0.01em` y paleta `tone`) y permite cambiarles el estilo a todos desde un solo archivo. |
| `frontend/src/views/InscripcionView.vue` | Botones reutilizables en el bloque de éxito: líneas 37–60; botón de confirmar inscripción: líneas 171–184; importación del componente: línea 225. | Unifica el estilo del botón *"Confirmar Inscripción del Club"* y de los 3 botones al completar el registro (*"Registrar Jugadores a este Club"*, *"Ir a Pizarra Táctica (DT)"* e *"Inscribir Otro Equipo"*), manteniendo sus acciones y rutas intactas. |
| `frontend/src/views/PosicionesView.vue` | Tabla oficial (`PosicionesTableCard`): líneas 191–199; partidos recientes (`PartidosRecientesCard`): líneas 204–211; Top Goleadores y Top Asistidores (`ResumenRankingCard`): líneas 213–238; importaciones: líneas 247–249. | Extrae fuera de la vista tanto la tabla de posiciones como las listas laterales de *Partidos Recientes*, *Top Goleadores* y *Top Asistidores*, manteniendo intactos el diseño, filtros y cálculos. |
| `frontend/src/components/PosicionesTableCard.vue` | Toolbar, tabla y pie de posiciones: líneas 1–162; props y `v-model` del buscador: líneas 167–200; estilos de la tabla: líneas 202–331. | Dibuja toda la tabla oficial de posiciones (buscador, leyenda V/E/D, puestos, métricas PJ/G/E/P/GF/GC/DG/PTS, racha de forma, estado vacío y promedio del torneo) desde un único componente. |
| `frontend/src/components/PartidosRecientesCard.vue` | Lista lateral de partidos: líneas 1–64 (incluye `AppActionButton` en línea 7); props: líneas 69–98; estilos: líneas 101–116. | Muestra la tarjeta lateral de *Partidos Recientes / Partidos de tu Club* con jornada, marcador, goles, asistencias y acceso *"Ver Fixture"*. |
| `frontend/src/components/ResumenRankingCard.vue` | Tarjeta reutilizable de top jugadores: líneas 1–43 (incluye `AppActionButton` en línea 8); props: líneas 48–96; estilos: líneas 99–106. | Unifica en un solo componente los dos bloques laterales de *Top Goleadores* (`⚽`) y *Top Asistidores* (`🎯`) con medallas de podio, dorsal y club. |
| `frontend/src/views/EquiposView.vue` | Lista de clubes (`ClubesListaCard`): líneas 6–14; botones de dorsal y traspaso (`AppActionButton`): líneas 145–155 y 191–212; tabla de plantel (`PlantelTableCard`): líneas 218–224; importaciones: líneas 460–463. | Deja en componentes separados la lista de clubes y la tabla de nómina del plantel, conservando intactos los selectores, tarjetas del club, cambio de dorsal y traspasos. |
| `frontend/src/components/ClubesListaCard.vue` | Lista seleccionable de clubes: líneas 1–85; `v-model` (`modelValue`) y props: líneas 89–127; estilos: líneas 130–175. | Dibuja la columna *Clubes del Torneo* (escudo, estado de aprobación, badge *Tu Club* y conteo de jugadores habilitados) sincronizando el club activo con `v-model`. |
| `frontend/src/components/PlantelTableCard.vue` | Encabezado de nómina y tabla de plantel: líneas 1–116; props y evento `@cambiar-dorsal`: líneas 123–145; estilos de la tabla: líneas 148–206. | Dibuja la tabla de jugadores de cada club (dorsal, sanciones, botón de editar dorsal, capitán, posición en cancha/banca, goles y tarjetas) y corrige el conteo de titulares usando el ID del club seleccionado. |
| `frontend/src/views/EntrenadorView.vue` | Lista de participantes de la pizarra (`EntrenadorPlantelListCard`): líneas 662–676; importación: línea 971. | Separa la tabla/lista lateral *Asignar Posiciones de Jugadores* de la pizarra táctica, conservando la asignación de capitán, banca/cancha y selector de posición en vivo. |
| `frontend/src/components/EntrenadorPlantelListCard.vue` | Lista de participantes del DT: líneas 1–125; props y eventos `@nombrar-capitan` / `@cambiar-posicion`: líneas 135–193; estilos: líneas 196–215. | Dibuja la lista de futbolistas de la pizarra táctica con dorsal por color de posición, insignia `Ⓒ CAPITÁN OFICIAL`, botones de banca/cancha y selector desplegable de posición. |
| `frontend/src/views/RankingView.vue` | Uso de `RankingTableCard` con `v-model`: líneas 86–87; importación: línea 96; objetos `tablaGoleadores` y `tablaAsistidores`: líneas 118–144; marcado original comentado: líneas 2–83. | Reemplaza el HTML duplicado de las dos tablas de la página por dos tarjetas conectadas con `v-model`, manteniendo intactos el diseño, el filtrado por club y las estadísticas. |
| `frontend/src/components/RankingTableCard.vue` | Estructura de tarjeta y tabla: líneas 1–83; soporte `v-model` (`modelValue` y `update:modelValue`): líneas 90–112; estilos de tabla: líneas 125–197; incluye `RankingScoreBadge` con `:` en la línea 65. | Dibuja las tarjetas de *Tabla de Goleadores* y *Máximos Asistidores* (encabezado, medallas de podio oro/plata/bronce, dorsal, punto del club y mensaje vacío) desde un único lugar. |
| `frontend/src/components/RankingScoreBadge.vue` | Presentación del valor de goles/asistencias recibido mediante `:`: líneas 1–28. | Muestra la insignia de puntaje al final de cada fila en la página de Ranking: etiqueta naranja con `⚽` para goles y azul con `🎯` para asistencias. |

`frontend/src/views/FixtureView.vue` no se modificó para estos cambios; sus botones y estilos permanecen como estaban.

Los botones y tablas que se actualizaron en cada vista conservan sus acciones, rutas y condiciones. Los botones restantes de esas vistas no fueron reemplazados y siguen con su implementación original.

## Tablas y listas componentizadas del sistema

Todas las tablas y listados tabulares de la aplicación quedaron separados en componentes propios dentro de `frontend/src/components/`:

- **`PosicionesTableCard.vue`** (en *Posiciones*): encapsula la tabla general de posiciones, el buscador (`v-model`), la leyenda `V/E/D`, las columnas numéricas, los chips de racha y el pie informativo.
- **`PartidosRecientesCard.vue`** (en *Posiciones*): encapsula el resumen lateral de partidos recientes o de tu club.
- **`ResumenRankingCard.vue`** (en *Posiciones*): unifica en un único componente los dos bloques laterales repetidos de *Top Goleadores* y *Top Asistidores*.
- **`ClubesListaCard.vue`** (en *Clubes / Equipos*): encapsula la lista lateral seleccionable de *Clubes del Torneo* mediante `v-model`.
- **`PlantelTableCard.vue`** (en *Clubes / Equipos*): encapsula la tabla del plantel oficial del club seleccionado, el conteo de titulares/banca, las sanciones, la insignia de capitán y el acceso rápido para cambiar el dorsal (`@cambiar-dorsal`).
- **`EntrenadorPlantelListCard.vue`** (en *Pizarra Táctica DT*): encapsula la lista de participantes para asignar capitán, enviar a banca/cancha y elegir posición en la pizarra.
- **`RankingTableCard.vue`** y **`RankingScoreBadge.vue`** (en *Ranking*): presentan las dos tablas del ranking (Goleadores y Asistidores):

- `frontend/src/components/RankingTableCard.vue`: muestra la tarjeta, el encabezado, la tabla, los jugadores y el estado vacío. Se conecta con la vista padre únicamente mediante `v-model` (`v-model="tablaGoleadores"` y `v-model="tablaAsistidores"`).
- `frontend/src/components/RankingScoreBadge.vue`: presenta el valor estadístico con su color e icono. Recibe sus datos dinámicos mediante `:` (`:valor` y `:campo`) para distinguir goles de asistencias.

`RankingView.vue` conserva el cálculo y filtrado de goleadores y asistidores. Las clases y estilos de cada tabla se trasladaron junto con su estructura a su componente correspondiente para mantener la apariencia existente.

## Por qué existen `@`, `v-model` y `:` (uno por componente)

En Vue cada símbolo cumple un propósito distinto en la comunicación entre vistas y componentes, por lo que cada uno de los 3 componentes reutilizables principales se enfocó en **una sola** de estas directivas:

1. **`@` (`v-on`) → en `AppActionButton.vue` (`@click`)**
   - **Por qué existe:** `@` escucha eventos que suben del componente hijo (o del navegador) hacia la vista padre. En Vue un clic se escribe con `@click` y no con `:click`, porque `:` solo pasa datos hacia abajo y `@` ejecuta una función cuando ocurre la interacción del usuario.
   - **Cómo se usa:** `AppActionButton.vue` declara `defineEmits(['click'])` y reenvía `@click="emit('click', $event)"` para que vistas como `InscripcionView.vue` o `EquiposView.vue` disparen sus funciones al hacer clic.

2. **`v-model` → en `RankingTableCard.vue` (`v-model="..."`)**
   - **Por qué existe:** `v-model` crea un enlace bidireccional entre el padre y el hijo (internamente combina la prop `modelValue` y el evento `update:modelValue`), evitando repetir atributos separados cuando un componente maneja un bloque completo de estado o configuración.
   - **Cómo se usa:** `RankingView.vue` llama directamente `<RankingTableCard v-model="tablaGoleadores" />` y `<RankingTableCard v-model="tablaAsistidores" />`, sin mezclar `@` ni `:` en esa etiqueta.

3. **`:` (`v-bind`) → en `RankingScoreBadge.vue` (`:valor` y `:campo`)**
   - **Por qué existe:** `:` envía valores dinámicos de JavaScript (números, booleanos, objetos o expresiones) de padre a hijo en un solo sentido; sin `:`, HTML enviaría todo como texto plano literal.
   - **Cómo se usa:** Dentro de `RankingTableCard.vue`, la insignia se invoca exclusivamente con `:` mediante `<RankingScoreBadge :valor="jugador[tablaActual.campo] ?? 0" :campo="tablaActual.campo" />`, sin usar `@` ni `v-model`.

## Qué cambian en la página

En lo que ve y hace el usuario, **no se pierden ni modifican acciones, rutas ni permisos**; lo que cambia es la centralización visual y estructural:

- **`AppActionButton.vue` (en Inscripción, Posiciones y Equipos):** aplica un estilo base uniforme (`border-radius: 8px`, `font-weight: 700`, `letter-spacing: 0.01em` y paleta `tone`) a los botones reemplazados. Si se ajusta este archivo, todos esos botones se actualizan simultáneamente en las 3 pantallas.
- **`PosicionesTableCard.vue`, `PartidosRecientesCard.vue` y `ResumenRankingCard.vue` (en Posiciones):** separan en módulos propios la tabla oficial de posiciones, los partidos recientes y ambos bloques de goleadores/asistidores (`Top Goleadores` y `Top Asistidores`).
- **`ClubesListaCard.vue` y `PlantelTableCard.vue` (en Equipos):** separan la lista lateral de clubes y la tabla de nómina del club con dorsales, sanciones, posición y tarjetas, corrigiendo los contadores de titulares/banca para el club activo.
- **`EntrenadorPlantelListCard.vue` (en Pizarra DT):** separa la lista de participantes donde el entrenador asigna capitán y posiciones de juego o banca.
- **`RankingTableCard.vue` (en Ranking):** dibuja ambas tarjetas (*Tabla de Goleadores* y *Máximos Asistidores*) desde un único componente, manteniendo medallas de podio, dorsal, punto de color del club y estado vacío.
- **`RankingScoreBadge.vue` (dentro de Ranking):** define la insignia de cierre de cada fila según `:campo` (naranja con `⚽` para goles; azul con `🎯` para asistencias).

## Código original y comportamiento

En las vistas modificadas, las versiones originales de los botones reemplazados y del marcado del ranking se dejaron como comentarios, antes de la implementación nueva. Los comentarios no se muestran en la página. Las funciones, rutas y acciones originales de los botones se conservaron.

## Validación

Las dependencias del proyecto requieren `--legacy-peer-deps` al instalar debido al rango de `esbuild` pedido por Vite 8.3; la compilación de producción (`vite build frontend --config frontend/vite.config.js`) y la verificación de sintaxis/linting se ejecutaron correctamente generando la carpeta `dist/`.
