# Componentes reutilizables del frontend

Se separaron elementos de interfaz repetidos en componentes de Vue para que sus estilos y estructura puedan modificarse desde un solo lugar, sin cambiar las acciones que ya realiza cada pantalla.

## Botón compartido

`frontend/src/components/AppActionButton.vue` envuelve el botón de Quasar y se utiliza en:

- `frontend/src/views/InscripcionView.vue`: acciones de inscripción y confirmación.
- `frontend/src/views/PosicionesView.vue`: accesos al fixture y al ranking.
- `frontend/src/views/EquiposView.vue`: cambio de dorsal y solicitud de cambio de equipo.

El componente reenvía al botón de Quasar sus atributos y eventos habituales, como `label`, `icon`, `to`, `@click`, `loading` y `disable`. También centraliza opciones de presentación:

- `tone`: paleta semántica (`primary`, `dark`, `neutral`, `indigo` o `warning`).
- `color`: color de Quasar opcional que prevalece sobre `tone`.
- `fontFamily`, `fontWeight` y `letterSpacing`: tipografía.
- `borderRadius`: redondeo de las esquinas.

Por ejemplo:

```vue
<AppActionButton
  tone="warning"
  label="Confirmar"
  icon="check"
  @click="confirmar"
/>
```

Para ajustar el estilo de todos los usos, se pueden modificar los valores predeterminados y el mapa de colores en `AppActionButton.vue`. Los tonos específicos se pueden seguir definiendo en cada uso.

## Componentes del ranking

En `frontend/src/views/RankingView.vue`, la presentación se delega a estos componentes:

- `frontend/src/components/RankingTableCard.vue`: muestra la tarjeta, el encabezado, la tabla, los jugadores y el estado vacío. Recibe los datos mediante la prop `tabla`.
- `frontend/src/components/RankingScoreBadge.vue`: presenta el valor estadístico con su color e icono. Recibe `valor` y `campo`; distingue goles de asistencias.

La vista conserva el cálculo y filtrado de goleadores y asistidores. Las clases y estilos de la tabla se trasladaron con su estructura para mantener la apariencia existente.

## Código original y comportamiento

En las vistas modificadas, las versiones originales de los botones reemplazados y del marcado del ranking se dejaron como comentarios, antes de la implementación nueva. Los comentarios no se muestran en la página. Las funciones, rutas y acciones originales de los botones se conservaron.

## Validación

`git diff --check` no reportó errores de formato. No se pudo completar la compilación: la instalación de dependencias encontró un conflicto entre la versión de Vite declarada y la versión de esbuild del proyecto.
