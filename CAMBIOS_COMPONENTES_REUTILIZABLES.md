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

| Archivo | Dónde encontrar el cambio |
| --- | --- |
| `frontend/src/components/AppActionButton.vue` | Envoltura de Quasar y estilos del botón: líneas 1–70; emisión `@click`: líneas 12 y 21; props: líneas 23–48; mapa de colores: líneas 50–56. |
| `frontend/src/views/InscripcionView.vue` | Botones reutilizables en el bloque de éxito: líneas 37–60; botón de confirmar inscripción: líneas 171–184; importación del componente: línea 225. |
| `frontend/src/views/PosicionesView.vue` | Botones de acceso rápido a Fixture, Tabla y Ranking: líneas 368, 428 y 467; importación: línea 505. |
| `frontend/src/views/EquiposView.vue` | Botones de dorsal y traspaso: líneas 217–227 y 263–284; importación: línea 658. |
| `frontend/src/views/RankingView.vue` | Uso de `RankingTableCard` con `v-model`: líneas 86–87; importación: línea 96; objetos `tablaGoleadores` y `tablaAsistidores`: líneas 118–144; marcado original comentado: líneas 2–83. |
| `frontend/src/components/RankingTableCard.vue` | Estructura de tarjeta y tabla: líneas 1–83; soporte `v-model` (`modelValue` y `update:modelValue`): líneas 90–112; estilos de tabla: líneas 125–197; incluye `RankingScoreBadge` con `:` en la línea 65. |
| `frontend/src/components/RankingScoreBadge.vue` | Presentación del valor de goles/asistencias recibido mediante `:`: líneas 1–28. |

`frontend/src/views/FixtureView.vue` no se modificó para estos cambios; sus botones y estilos permanecen como estaban.

Los botones que se actualizaron en cada vista conservan sus acciones, rutas y condiciones. Los botones restantes de esas vistas no fueron reemplazados y siguen con su implementación original.

## Componentes del ranking

En `frontend/src/views/RankingView.vue`, la presentación se delega a estos componentes:

- `frontend/src/components/RankingTableCard.vue`: muestra la tarjeta, el encabezado, la tabla, los jugadores y el estado vacío. Se conecta con la vista padre únicamente mediante `v-model` (`v-model="tablaGoleadores"` y `v-model="tablaAsistidores"`).
- `frontend/src/components/RankingScoreBadge.vue`: presenta el valor estadístico con su color e icono. Recibe sus datos dinámicos mediante `:` (`:valor` y `:campo`) para distinguir goles de asistencias.

La vista conserva el cálculo y filtrado de goleadores y asistidores. Las clases y estilos de la tabla se trasladaron junto con su estructura a `RankingTableCard.vue` para mantener la apariencia existente. Cada fila usa `RankingScoreBadge.vue` para mostrar el total correspondiente.

## Por qué existen `@`, `v-model` y `:` (uno por componente)

En Vue cada símbolo cumple un propósito distinto en la comunicación entre vistas y componentes, por lo que cada uno de los 3 componentes reutilizables se enfocó en **una sola** de estas directivas:

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
- **`RankingTableCard.vue` (en Ranking):** dibuja ambas tarjetas (*Tabla de Goleadores* y *Máximos Asistidores*) desde un único componente, manteniendo medallas de podio, dorsal, punto de color del club y estado vacío.
- **`RankingScoreBadge.vue` (dentro de Ranking):** define la insignia de cierre de cada fila según `:campo` (naranja con `⚽` para goles; azul con `🎯` para asistencias).

## Código original y comportamiento

En las vistas modificadas, las versiones originales de los botones reemplazados y del marcado del ranking se dejaron como comentarios, antes de la implementación nueva. Los comentarios no se muestran en la página. Las funciones, rutas y acciones originales de los botones se conservaron.

## Validación

Las dependencias del proyecto requieren `--legacy-peer-deps` al instalar debido al rango de `esbuild` pedido por Vite 8.3; la compilación de producción (`vite build frontend --config frontend/vite.config.js`) y la verificación de sintaxis/linting se ejecutaron correctamente generando la carpeta `dist/`.
