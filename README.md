# ⚽ Futbolito - Sistema Integral de Gestión de Torneos y Ligas Barriales

Plataforma web full-stack moderna para la organización, administración, seguimiento táctico y oficialización de torneos de fútbol barrial y comunitario. Conecta en tiempo real al **Organizador**, a los **Directores Técnicos (DT)** y a los **Futbolistas** con persistencia en la nube mediante **MongoDB Atlas**.

---

## 🚀 Características y Reglas Reglamentarias Oficiales

### 👑 Rol Organizador (Omar)
- **Generación de Fixture con IA Gemini & Heurística**: Algoritmo de emparejamiento deportivo que asegura paridad de puntos, balance de localía y sin cruces duplicados.
- **Oficialización de Marcadores y Goleadores**: Modal responsive estilizado (**440px**) con opción manual (autor, asistente, autogol y **selector de minuto de gol `⏱️ Minuto: [ ]'`**) o auto-asignación cronológica inteligente.
- **Intervalo Reglamentario de Tiempos**: Garantía de mínimo 5 minutos entre goles y separación estricta entre cambios y tarjetas.
- **Postergación de Encuentros**: Diálogo modal con causas reglamentarias (lluvias torrenciales, fuerza mayor), scroll adaptativo y notificación automática simultánea a ambos clubes.
- **Aprobación de Clubes Afiliados**: Autorización previa obligatoria para que un equipo pueda competir oficialmente.
- **Tabla de Posiciones en Tiempo Real**: Cómputo automático de Puntos (PTS), PJ, G, E, P, Goles a Favor (GF), Goles en Contra (GC), Diferencia de Gol (DG) y racha de forma (V, E, D).
- **Seguridad Institucional Blindada**: El usuario maestro `@omar` es el único facultado para generar y portar el código dinámico de nuevos organizadores; su cuenta está protegida contra eliminación.

### 📋 Rol Entrenador (Director Técnico)
- **Soberanía Deportiva Total**: El DT es la **única autoridad encargada de aceptar o rechazar a los jugadores** que solicitan ingresar a su club, evitando favoritismos del organizador.
- **Pizarra Táctica Interactiva**: Alineación de 11 titulares en campo de juego con césped virtual y dugout de suplentes (en banca).
- **Regla de Arquero Único**: Imposibilidad de alinear más de un arquero simultáneo en cancha (doble validación en frontend y backend).
- **Gestión de Capitán (Ⓒ) y Dorsales**: Designación obligatoria de Capitán para disputar partidos y validación de números de camiseta únicos e irrepetibles por club (del 1 al 99).
- **Circuito Federado de Traspasos**: Concede la carta de salida a futbolistas de su club o aprueba la incorporación definitiva de refuerzos que llegan de otros equipos.
- **Baja en Cascada del Club**: Si el DT decide eliminar su cuenta, se disuelve el club, se eliminan todas las cuentas de los futbolistas vinculados y se retiran sus partidos no disputados.

### 🏃 Rol Jugador (Futbolista)
- **Proceso de Admisión con Espera**: Al registrarse, el futbolista selecciona su club e ingresa automáticamente como **`🪑 En Banca`** con estado **`Pendiente`**; no podrá operar en el sistema hasta que su DT lo autorice formalmente.
- **Traspaso Federado (`🔄 Cambiar de Equipo`)**: Solicita formalmente su transferencia a otro club mediante doble aprobación deportiva (DT de origen + DT de destino).
- **Dorsal Oficial Exclusivo**: Selección del número de camiseta favorito (1 al 99) desde el registro inicial y personalización posterior desde la vista de Clubes, validando disponibilidad por equipo (excluyendo fichas rechazadas).
- **Baja Individual**: Puede eliminar su cuenta personal retirando su ficha sin perjudicar al club ni a sus compañeros.
- **Consulta Personalizada**: Visualización de calendario exclusivo de su equipo, estadísticas individuales y tabla general de goleo y asistencias.

---

## ⚙️ Gestión de Cuenta y Perfil

Cualquier usuario autenticado puede hacer clic en su pastilla de perfil (`@usuario ⚙️`) en la barra superior para:
1. **Editar Perfil**: Actualizar su nombre visible, modificar su nombre de usuario `@username` (con sincronización inmediata en MongoDB Atlas) o renovar su contraseña de acceso.
2. **Eliminar Cuenta**: Darse de baja del sistema aplicando las políticas reglamentarias de cascada según su rol.

---

## 🗂️ Arquitectura Modular del Store (Frontend)

Para reflejar fielmente la estructura documental de MongoDB en el backend (`backend/models/`), el store cliente se encuentra estructurado en submódulos especializados:

```text
frontend/src/store/
├── api.js                   # Configuración de Axios, URL base e inyección de tokens JWT
├── modules/
│   ├── authStore.js         # Refleja: Usuario.js (Sesión, roles, códigos y edición/eliminación de perfil)
│   ├── equipoStore.js       # Refleja: Equipo.js (Clubes, normalización de IDs, capitanes y afiliación)
│   ├── jugadorStore.js      # Refleja: Jugador.js (Planteles, posiciones, dorsales y traspasos federados)
│   ├── partidoStore.js      # Refleja: Partido.js (Fixture, actas oficiales, goles con minuto y tabla)
│   └── torneoStore.js       # Refleja: Torneo.js y Notificacion.js (Datos de liga y centro de alertas)
└── torneo.js                # Orquestador unificado y reactivo con retrocompatibilidad (useTorneo)
```

También existe `frontend/src/torneo.js`, que funciona como una capa de compatibilidad y reexporta desde `frontend/src/store/torneo.js`. La implementación y el estado compartido están en `store/torneo.js`; ambos caminos apuntan al mismo módulo, no crean dos stores independientes.

---

## 🧩 Componentes Reutilizables de Interfaz

La carpeta `frontend/src/components/` contiene tanto diálogos como componentes visuales compartidos:

- **`AppActionButton.vue`** (`@` / `@click`): envuelve el botón de Quasar y centraliza color, tipografía y bordes, reenviando eventos de clic a las vistas de inscripción, posiciones y equipos.
- **`RankingTableCard.vue`** (`v-model`): presenta cada tabla de ranking conectada bidireccionalmente desde `RankingView.vue`.
- **`RankingScoreBadge.vue`** (`:`): muestra los goles (`⚽`) o asistencias (`🎯`) recibiendo sus datos mediante propiedades enlazadas (`:valor` y `:campo`).

Los tonos, la familia y el peso tipográficos, el espaciado entre letras y el redondeo se pueden ajustar desde `AppActionButton.vue`. Más detalles sobre qué cambia en pantalla y por qué existen `@`, `v-model` y `:` están en [CAMBIOS_COMPONENTES_REUTILIZABLES.md](./CAMBIOS_COMPONENTES_REUTILIZABLES.md).

---

## 🛠️ Stack Tecnológico

- **Frontend**: Vue.js 3 (`<script setup>`, Composition API)
- **UI Framework**: Quasar Framework 2 (`@quasar/extras`, Material Icons)
- **Estilos**: Tailwind CSS + Quasar Variables
- **Enrutamiento**: Vue Router
- **Cliente HTTP**: Axios con interceptores JWT
- **Backend**: Node.js, Express y TSX
- **Base de Datos**: MongoDB Atlas con Mongoose ODM
- **Inteligencia Artificial**: Gemini API SDK (`@google/genai`) para fixture inteligente
- **Seguridad**: Autenticación RBAC (Role-Based Access Control) con JWT y contraseñas hasheadas con salt

---

## 📦 Estructura del Proyecto

```text
├── server.ts                          # Servidor Full-Stack local (Express + Vite en puerto 3000)
├── api/
│   └── index.js                       # Adaptador serverless del backend Express para Vercel
├── vercel.json                        # Configuración de compilación, salida (dist) y rewrites en Vercel
├── package.json                       # Dependencias y scripts
├── .env.example                       # Plantilla de variables de entorno
├── SUSTENTACION_PROYECTO.md           # Guía completa de defensa técnica del proyecto
├── ROLES_Y_FUNCIONES.md               # Matriz oficial de funciones y permisos RBAC
├── CAMBIOS_COMPONENTES_REUTILIZABLES.md # Documentación de componentes reutilizables (@, v-model, :)
│
├── frontend/                          # Aplicación SPA cliente (Vue 3 + Quasar)
│   ├── src/
│   │   ├── App.vue                    # Layout principal, barra de navegación, campana y Login/Registro
│   │   ├── store/                     # Store modular (auth, equipo, jugador, partido, torneo)
│   │   ├── views/                     # Vistas (Posiciones, Fixture, Equipos, Ranking, Entrenador, Inscripción)
│   │   └── components/                # Diálogos y componentes visuales reutilizables
│   │       ├── AppActionButton.vue
│   │       ├── RankingTableCard.vue
│   │       └── RankingScoreBadge.vue
│
└── backend/                           # API RESTful (Node.js + Express)
    ├── controllers/                   # Lógica del negocio y reglas reglamentarias
    ├── models/                        # Esquemas Mongoose (Torneo, Equipo, Jugador, Partido, etc.)
    ├── routes/                        # Endpoints de la API
    └── middlewares/                   # Validación de tokens JWT y roles
```

---

## ⚡ Instalación, Ejecución y Despliegue

```bash
# 1. Clonar el repositorio e ingresar a la carpeta del proyecto
cd applet

# 2. Instalar dependencias (resuelve compatibilidad de peer deps entre Vite 8 y esbuild)
npm install --legacy-peer-deps

# 3. Configurar variables de entorno (MongoDB Atlas, JWT y Gemini API)
cp .env.example .env

# 4. Iniciar servidor unificado (Frontend y Backend en el puerto 3000)
npm run dev

# 5. Compilar para producción (genera carpeta dist/)
npm run build
```

> **Despliegue en Vercel:** El proyecto está configurado en `vercel.json` desde la raíz (sin `Root Directory` apuntando a subcarpetas) para compilar el frontend en `dist/` y enrutar `/api/(.*)` hacia `api/index.js`.
