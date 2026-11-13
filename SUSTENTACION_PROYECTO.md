# 🏆 Guía Maestra de Sustentación y Defensa del Proyecto
**Sistema de Gestión Integral de Torneos y Ligas de Barrio ("Futbolito")**

Este documento está estructurado para responder de forma precisa, profesional y con fundamentos técnicos a cada uno de los puntos requeridos en la sustentación y defensa del proyecto, incorporando todas las reglas reglamentarias, de imparcialidad, modularización del store, gestión de perfil y eliminación en cascada implementadas.

---

## 📌 PARTE 1: La Necesidad que Suple el Software

> **Pregunta esperada:** *¿Cuál es la necesidad que suple el sistema / software?*

### Argumento para la Presentación:
> *"Tradicionalmente, los campeonatos y ligas deportivas de barrio, comunales o intercolegiales se gestionan de forma manual mediante cuadernos de apuntes o planillas de cálculo aisladas (Excel). Esto genera múltiples problemas:
> 1. **Pérdida y desorganización:** Se extravían actas físicas de partidos y reportes de goles/tarjetas.
> 2. **Conflictos y sospechas de favoritismo:** Disputas entre delegados de clubes por marcadores alterados, dobles dorsales repetidos o fichajes no autorizados por el técnico.
> 3. **Cálculo manual erróneo:** Errores constantes en la tabla de posiciones (diferencia de gol, goles a favor/en contra y puntos).
> 4. **Falta de inmediatez:** Directores técnicos y futbolistas tardan días en enterarse de los resultados, sanciones de tarjetas y tablas de goleo.
>
> **Nuestra solución:**  
> Desarrollamos una plataforma web full-stack colaborativa y segura que digitaliza y automatiza el ciclo de vida completo del campeonato en tiempo real:
> - **Al Organizador (Omar):** Le permite generar fixtures automáticos mediante IA Gemini o heurística deportiva, programar fechas del torneo, evaluar solicitudes de nuevos clubes, registrar actas oficiales de puntuación con minutos exactos y computar la tabla general con recálculo automático.
> - **A los Entrenadores (DT):** Les entrega la soberanía exclusiva sobre su club (pizarra táctica interactiva con 11 titulares reglamentarios, autorización obligatoria de nuevos futbolistas para evitar favoritismos y gestión de dorsales y capitanes).
> - **A los Jugadores:** Les otorga acceso con credenciales seguras para consultar el fixture de su club, su ficha individual, gestionar traspasos a otros clubes mediante doble carta de conformidad y consultar la tabla oficial de goleo y asistencias."*

---

## 🛡️ PARTE 2: Validaciones y Pertinencia de Datos

> **Prueba esperada:** *El evaluador o compañeros de otro grupo insertarán datos para evaluar si el sistema valida, si es intuitivo o si previene errores.*

### Validaciones Clave Implementadas en el Sistema:

1. **Autorización Previa Obligatoria de Futbolistas (Zero-Trust):**
   - El Organizador no puede decidir qué jugadores entran a un club, previniendo favoritismos.
   - Todo nuevo jugador registrado queda inicialmente en estado `Pendiente` y en posición `🪑 En Banca`.
   - **Bloqueo Total de Sesión (403):** El jugador **no puede ingresar ni operar** hasta que su DT ingrese y pulse **`Aceptar`**.

2. **Autorización Previa de Clubes Nuevos:**
   - Si un DT se registra proponiendo un nuevo equipo, el club queda en estado `Pendiente`.
   - El DT **no puede ingresar** hasta que el Organizador (Omar) autorice formalmente la afiliación del equipo.

3. **Cómputo Preciso del Minuto / Tiempo de Cada Gol:**
   - Cada gol ingresado en el acta oficial dispone de un selector explícito de tiempo (`⏱️ Minuto: [ ]'`).
   - El sistema valida cronología coherente: un intervalo reglamentario mínimo de 5 minutos entre goles y que los suplentes que anoten ingresen obligatoriamente antes de dicho minuto.

4. **Regla de 1 Solo Arquero Titular en Cancha:**
   - En el fútbol no pueden haber dos arqueros titulares simultáneos en el mismo club.
   - Si un DT intenta asignar a otro jugador como 'Arquero', el sistema bloquea la acción con una alerta clara y exige enviar al titular a la banca antes de ascender a otro al arco (doble validación frontend/backend).

5. **Dorsal Único por Club (1 al 99):**
   - Dos jugadores del mismo equipo no pueden usar el mismo número de camiseta. El backend (`jugadorController.js`) rechaza duplicados indicando el nombre del futbolista que ya porta ese número.

6. **Capitán Obligatorio para Disputar Partidos:**
   - Por reglamento, un club debe contar con un Capitán (Ⓒ) oficialmente designado por su DT para ser considerado habilitado para jugar.

7. **Normalización Automática y Conteo Real de Plantel:**
   - En la pestaña de Clubes, cada equipo calcula y refleja con precisión su nómina de jugadores inscritos (ej. `21/11 jug.`, `17/11 jug.`) gracias a la normalización de identificadores (`id` / `_id`).

8. **Circuito Federado de Traspasos (`🔄 Cambiar de Equipo`):**
   - Requiere la firma de la **Carta de Salida** por parte del DT de origen y la posterior **Aceptación del Fichaje** por parte del DT de destino antes de transferir la ficha deportiva en MongoDB.

9. **Eliminación Reglamentaria en Cascada:**
   - Si un DT elimina su cuenta, se da de baja automáticamente su club, **se eliminan todas las cuentas de sus futbolistas vinculados** y se remueven sus partidos no jugados.
   - El superadministrador `@omar` está protegido contra eliminación institucional.

---

## 💻 PARTE 3: Preguntas Técnicas y Arquitectura

> **Preguntas esperadas:** *¿Qué librerías usaron y por qué? ¿Cuál es la arquitectura de carpetas y por qué la organizaron así?*

### 1. Stack Tecnológico y Librerías:

| Capa | Tecnología / Librería | ¿Por qué se utilizó? |
| :--- | :--- | :--- |
| **Frontend Framework** | **Vue.js 3 (`<script setup>`, Composition API)** | Reactividad ultra-eficiente, código modular y vinculación bidireccional limpia sin sobrecarga de re-renders. |
| **UI Framework** | **Quasar Framework 2 (`@quasar/extras`)** | Componentes de nivel empresarial accesibles y listos para producción (diálogos modales con scroll, selects con autocompletado, toggles táctiles, badges con colores de rol y notificaciones flotantes). |
| **Estilos & Layout** | **Tailwind CSS + Quasar Variables** | Sistema de diseño atómico para la pizarra táctica virtual (césped interactivo) y maquetación flexible en tarjetas y rejillas. |
| **Enrutamiento** | **Vue Router** | Navegación SPA fluida sin recargas completas de navegador (`/posiciones`, `/fixture`, `/equipos`, `/ranking`, `/entrenador`). |
| **Cliente HTTP**| **Axios** | Cliente HTTP robusto con interceptor de cabeceras JWT (`Authorization: Bearer <token>`). |
| **Store Modular** | **Vue Reactive Stores (Módulos 1:1 con Backend)** | Desacoplamiento por dominios: `authStore`, `equipoStore`, `jugadorStore`, `partidoStore` y `torneoStore`. |
| **Backend Runtime** | **Node.js + Express** | Servidor ligero, concurrente y escalable con middlewares RESTful y controladores organizados. |
| **Base de Datos** | **MongoDB Atlas + Mongoose** | Base de datos NoSQL documental ideal para esquemas enriquecidos (partidos con subdocumentos embebidos de goleadores, tarjetas e incidencias). |
| **Seguridad** | **JSON Web Tokens (JWT) + Salt Hashing** | Sesiones seguras sin estado (*stateless*) y control de acceso por roles. |

### 2. Estructura de Carpetas del Proyecto:

```text
├── server.ts                  # Servidor unificado full-stack (Express + Vite middlewares en puerto 3000)
├── package.json               # Dependencias del proyecto y scripts de ejecución
├── .gitignore                 # Exclusión de credenciales (.env), dependencias y metadatos
├── .env.example               # Plantilla de variables de entorno segura para Git
│
├── frontend/                  # CÓDIGO DEL CLIENTE (VUE 3 + QUASAR)
│   ├── vite.config.js         # Configuración del bundler Vite y plugins Quasar
│   ├── index.html             # Entry point HTML de la aplicación
│   └── src/
│       ├── main.js            # Inicialización de Vue, Pinia/Store y Quasar
│       ├── App.vue            # Layout principal, barra de navegación, campana y Login/Registro
│       ├── router/            # Definición de rutas del sistema
│       ├── torneo.js          # Reexporta el store para mantener compatibilidad con imports anteriores
│       ├── store/             # STORE MODULAR (1:1 con modelos de MongoDB)
│       │   ├── api.js         # Configuración Axios y tokens JWT
│       │   ├── modules/       # Módulos especializados
│       │   │   ├── authStore.js     # Usuario.js (Sesión, roles, códigos y perfil)
│       │   │   ├── equipoStore.js   # Equipo.js (Clubes, normalización y estados)
│       │   │   ├── jugadorStore.js  # Jugador.js (Planteles, posiciones y traspasos)
│       │   │   ├── partidoStore.js  # Partido.js (Fixture, goles y tabla)
│       │   │   └── torneoStore.js   # Torneo.js y Notificaciones
│       │   └── torneo.js      # Orquestador reactivo unificado (useTorneo)
│       ├── components/        # Diálogos y componentes visuales reutilizables
│       │   ├── AppActionButton.vue     # Botón compartido con estilos configurables
│       │   ├── RankingTableCard.vue    # Tarjeta reutilizable de cada tabla de ranking
│       │   ├── RankingScoreBadge.vue   # Indicador de goles o asistencias
│       │   ├── PartidoDialog.vue       # Modal de creación y configuración de partidos
│       │   ├── EquipoDialog.vue        # Modal de creación de clubes
│       │   └── JugadorDialog.vue       # Modal de registro e inscripción de futbolistas
│       └── views/             # Vistas de página principales
│           ├── PosicionesView.vue  # Tabla de posiciones con racha y métricas
│           ├── FixtureView.vue     # Calendario de partidos y carga de actas (440px)
│           ├── EquiposView.vue     # Directorio de clubes registrados (excluye cancelados)
│           ├── RankingView.vue     # Tabla oficial de goleadores y asistentes
│           └── EntrenadorView.vue  # Pizarra táctica interactiva y panel de aprobación de jugadores
│
└── backend/                   # CÓDIGO DEL SERVIDOR (EXPRESS + MONGOOSE)
    ├── index.js               # Enrutador maestro y conexión a MongoDB Atlas
    ├── models/                # Modelos y esquemas de Mongoose
    │   ├── Torneo.js
    │   ├── Equipo.js
    │   ├── Jugador.js
    │   ├── Partido.js
    │   ├── Usuario.js
    │   └── Notificacion.js
    ├── routes/                # Rutas y endpoints RESTful (/api/...)
    ├── controllers/           # Lógica de negocio y reglas reglamentarias
    └── middlewares/           # Validación de autenticación JWT y roles
```

Hay dos archivos llamados `torneo.js`, pero no mantienen estados separados: `frontend/src/store/torneo.js` contiene la implementación del store y `frontend/src/torneo.js` solo reexporta sus símbolos para compatibilidad. Las vistas actuales importan directamente desde `store/torneo.js`; el archivo de `src/` puede seguir atendiendo imports antiguos sin duplicar la instancia del estado.

### Componentes compartidos de interfaz

`AppActionButton.vue` reutiliza el botón de Quasar en las vistas de inscripción, posiciones y equipos. Centraliza colores, tipografía y redondeo, mientras cada vista conserva sus propias rutas, condiciones por rol y eventos. Las vistas que no usan este componente mantienen sus botones actuales.

En Ranking, `RankingView.vue` conserva los cálculos de goleadores y asistidores y delega la presentación en `RankingTableCard.vue`; cada cifra se representa con `RankingScoreBadge.vue`. Esta separación permite ajustar la presentación sin duplicar la estructura de la tabla.

**¿Por qué se organizó así?**
> *"Adoptamos una arquitectura desacoplada por responsabilidades (**Separation of Concerns**). En el backend, `controllers` concentra estrictamente las reglas del negocio futbolístico, `routes` expone los endpoints limpios y `models` garantiza la integridad de datos en MongoDB Atlas. En el frontend, separamos las `views` de los `components`, y modularizamos el `store` en submódulos que reflejan directamente cada entidad de la base de datos, canalizados a través de `torneo.js` para asegurar coherencia en tiempo real en toda la interfaz."*

---

## 👥 PARTE 4: Dinámica de Exposición en Pareja (Paso a Paso)

| Rol / Integrante | Responsabilidad en la Sustentación | Acciones en Vivo en Pantalla |
| :--- | :--- | :--- |
| **Integrante A** | **Problema, Negocio y Gestión Oficial** | 1. Explicar la problemática de las ligas barriales.<br>2. Iniciar sesión como **Organizador** y abrir el modal de oficialización de un partido (**440px**).<br>3. Mostrar el selector explícito de **`⏱️ Minuto: [ ]'`** para cada gol y la separación reglamentaria de 5 minutos.<br>4. Demostrar el recálculo automático de la **Tabla de Posiciones** con PTS, DG y racha histórica (V, E, D). |
| **Integrante B** | **Validaciones Tácticas, Autonomía del DT y Arquitectura** | 1. Iniciar sesión como **Entrenador** e ingresar a la **Pizarra Táctica**.<br>2. Mostrar las solicitudes pendientes de jugadores y explicar la política **Zero-Trust** (el jugador no entra hasta que el DT lo acepte).<br>3. Demostrar la regla del arquero único y la solicitud de traspasos entre clubes.<br>4. Explicar la gestión de perfil (`@usuario ⚙️`) y las reglas de eliminación en cascada de clubes.<br>5. Explicar la arquitectura modular del Store (1:1 con backend) y la conexión con MongoDB Atlas. |
