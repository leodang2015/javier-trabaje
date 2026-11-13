# 🛡️ Matriz Oficial de Roles, Permisos y Seguridad (RBAC)
**Sistema de Gestión Integral de Torneos y Ligas de Barrio ("Futbolito")**

En este torneo de fútbol barrial rige una **separación estricta de poderes y funciones** respaldada por control de acceso basado en roles (**Role-Based Access Control - RBAC**). Cada participante cuenta con facultades exclusivas, responsabilidades intransferibles y límites éticos claros para garantizar la imparcialidad deportiva y la integridad de la base de datos en MongoDB Atlas.

> **Nota de interfaz:** los componentes visuales reutilizables, como `AppActionButton.vue`, centralizan la presentación de algunos botones, pero no conceden permisos ni modifican las reglas RBAC. Las condiciones de cada acción siguen dependiendo del rol y la lógica de la vista. Consulta [CAMBIOS_COMPONENTES_REUTILIZABLES.md](./CAMBIOS_COMPONENTES_REUTILIZABLES.md) para conocer su uso y personalización.

---

## 📊 Cuadro Comparativo de Responsabilidades

| Capacidad / Función del Sistema | 👑 Organizador (Omar) | 📋 Entrenador (DT) | 🏃 Jugador (Futbolista) |
| :--- | :---: | :---: | :---: |
| **Generación de Fixture con IA Gemini / Manual** | ✅ Exclusivo | ❌ | ❌ |
| **Oficialización de Marcadores y Minutos de Gol** | ✅ Exclusivo | ❌ | ❌ |
| **Postergación Reglamentaria de Partidos** | ✅ Exclusivo | ❌ | ❌ |
| **Aprobación de Solicitud de Nuevos Clubes** | ✅ Exclusivo | ❌ | ❌ |
| **Portar y Compartir Código Dinámico de Org** | ✅ Solo `@omar` | ❌ | ❌ |
| **Aceptar o Rechazar Nuevos Futbolistas** | ❌ (Imparcialidad) | ✅ Exclusivo | ❌ |
| **Pizarra Táctica (11 Titulares y Suplentes)** | ❌ | ✅ Exclusivo | ❌ |
| **Garantizar 1 Solo Arquero en Cancha** | ❌ | ✅ Obligatorio | ❌ |
| **Designar Capitán (Ⓒ) Oficial del Club** | ❌ | ✅ Obligatorio | ❌ |
| **Autorizar Carta de Salida de Traspaso (Fase 1)** | ❌ | ✅ DT Origen | ❌ |
| **Confirmar Fichaje de Llegada (Fase 2)** | ❌ | ✅ DT Destino | ❌ |
| **Solicitar Cambio de Equipo (`🔄 Traspaso`)** | ❌ | ❌ | ✅ Exclusivo |
| **Elegir y Personalizar Número de Dorsal** | ❌ | ❌ | ✅ Exclusivo |
| **Editar Datos de Perfil y Cambiar `@usuario`** | ✅ | ✅ | ✅ |
| **Eliminar su Cuenta de Usuario** | ⛔ Inmune `@omar` | 💥 Cascada Total | 🟢 Baja Individual |

---

## 👑 1. Rol Organizador (Omar)

El Organizador es la máxima autoridad civil e institucional de la liga deportiva. Su función es neutral: administra el calendario general, vela por el cumplimiento de las fechas y da fe pública de los resultados.

### 🌟 Funciones Únicas y Exclusivas:
1. **Generador Inteligente con IA Gemini:** Con un solo clic desde la cabecera del diálogo de programación, analiza los clubes disponibles, balancea la localía y distribuye automáticamente las jornadas separadas por días.
2. **Oficialización de Resultados y Minutos de Gol:**
   - Registra el marcador en un modal estilizado y compacto (**440px**).
   - Asigna manualmente el autor, asistidor, autogol y el minuto exacto (`⏱️ Minuto: [ ]'`).
   - El sistema valida un intervalo mínimo de 5 minutos entre goles y que los suplentes que anoten ingresen obligatoriamente antes de dicho minuto.
3. **Postergación de Encuentros Oficiales:** Diálogo con causales reglamentarias (lluvias torrenciales, fuerza mayor), scroll adaptativo y notificación automática en tiempo real a las directivas y planteles de ambos clubes.
4. **Autorización Previa de Clubes Afiliados:** Revisa las solicitudes de los nuevos directores técnicos que proponen inscribir un club; ningún club compite sin su aval formal.
5. **Generador Dinámico de Nuevos Organizadores:**
   - **Regla Estricta:** Únicamente el usuario maestro con login exacto **`@omar`** porta el código dinámico (`OMAR-XXXX`) en la barra superior. Ningún otro usuario (aunque se llame Omar de nombre de pila) recibe dicho código.

> 🚫 **Límite ético del Organizador:** El Organizador **NO puede manipular la alineación táctica de ningún equipo** ni decidir qué futbolistas juegan o son aceptados en un club.

---

## 📋 2. Rol Entrenador (Director Técnico - DT)

El Director Técnico es la máxima autoridad deportiva de su club. Ejerce la soberanía exclusiva sobre su plantel de futbolistas, la táctica en el terreno de juego y las decisiones de fichajes.

### 🌟 Funciones Únicas y Exclusivas:
1. **Autorización Previa Obligatoria de Futbolistas (Zero-Trust):**
   - Es el único con potestad para aceptar o rechazar solicitudes de incorporación a su plantilla.
   - El futbolista permanece inhabilitado y bloqueado hasta que el DT presione **`Aceptar`**.
2. **Pizarra Táctica Interactiva:**
   - Posiciona a sus 11 titulares en el césped virtual y mantiene el dugout de suplentes (`🪑 En Banca`).
   - Al cambiar la posición de cualquier jugador, el cambio se persiste instantáneamente en MongoDB Atlas vía `PATCH /api/jugadores/:id/posicion`.
3. **Regla de 1 Solo Arquero Titular en Cancha:**
   - El sistema impide alinear simultáneamente a dos arqueros titulares en cancha. Si el DT intenta promover a otro portero, el software le exige pasar al actual a la banca primero.
4. **Designación de Capitán (Ⓒ) y Gestión de Dorsales:**
   - Designa al capitán obligatorio para habilitar al club a disputar partidos y audita que los dorsales del 1 al 99 no se repitan entre compañeros.
5. **Firma y Gestión del Circuito de Traspasos:**
   - **Fase 1 (DT Origen):** Presiona **`✅ Conceder Salida`** para liberar la carta deportiva del futbolista hacia el club de destino.
   - **Fase 2 (DT Destino):** Presiona **`📥 Confirmar Llegada`** para incorporar formalmente al jugador como refuerzo en su plantilla.

> 🚫 **Límite ético del Entrenador:** El DT **NO puede modificar resultados de partidos ya finalizados** ni alterar el fixture general de la liga.

---

## 🏃 3. Rol Jugador (Futbolista)

El Futbolista es el protagonista del terreno de juego. Su perfil está enfocado en su trayectoria deportiva, rendimiento individual y pertenencia a su club.

### 🌟 Funciones Únicas y Exclusivas:
1. **Solicitud de Traspaso Federado (`🔄 Cambiar de Equipo`):**
   - Desde la pestaña **Clubes**, selecciona el nuevo equipo al que desea migrar y envía su petición formal, activando el circuito de doble aprobación entre directores técnicos.
2. **Personalización de Ficha y Dorsal Oficial:**
   - Solicita su número de camiseta predilecto (del 1 al 99), validando en tiempo real que no esté ocupado por otro compañero de su equipo.
3. **Recepción de Alertas Oficiales y Convocatorias:**
   - Recibe notificaciones automáticas cuando es aprobado en el plantel, cuando su partido es postergado o cuando avanza su traspaso.
4. **Consulta Personalizada:**
   - Accede a su fixture filtrado, estadísticas de goles (Pichichi), asistencias, tarjetas y suspensiones.

> 🚫 **Límite ético del Jugador:** El Jugador **NO puede colocarse a sí mismo como titular en el campo** (esa potestad es exclusiva de su DT) ni modificar actas de partidos.

---

## ⚙️ Gestión de Cuenta: Edición y Eliminación Reglamentaria

> **Acceso:** Cualquier usuario autenticado puede hacer clic sobre la pastilla de su perfil (`@usuario ⚙️`) en la barra superior para abrir el diálogo **"Mi Cuenta y Perfil"**.

### 1. Edición de Datos de Perfil:
- **Nombre de Usuario (@username):** Puede ser modificado por cualquier Entrenador o Jugador, actualizándose automáticamente todas sus referencias en MongoDB (fichas deportivas, planteles y autorizaciones).
- **Protección de `@omar`:** El identificador del Organizador Maestro está blindado y no puede cambiarse.
- **Nombre visible y contraseña:** Cada usuario puede actualizar su nombre real y renovar su contraseña de acceso previa confirmación de la clave actual.

### 2. Reglas Reglamentarias de Eliminación de Cuenta:

| Rol | Efecto al Eliminar Cuenta | Impacto Deportivo |
| :--- | :--- | :--- |
| 👑 **Organizador `@omar`** | ⛔ **PROHIBIDO ELIMINAR** | **Inmune.** Es el superadministrador fundacional; su cuenta está protegida contra eliminación para evitar dejar acéfalo el campeonato. |
| 📋 **Entrenador (DT)** | 💥 **CASCADA TOTAL** | **Baja completa del Club:** Al disolverse la dirección técnica, se elimina el equipo en MongoDB, **se eliminan todas las cuentas de los futbolistas de su plantel** y se cancelan sus partidos no jugados. |
| 🏃 **Jugador (Futbolista)** | 🟢 **BAJA INDIVIDUAL** | **Sin perjuicio al club:** Se elimina la cuenta y la ficha del jugador; el club y los demás compañeros conservan intacta su participación en la liga. |
| 👑 **Organizador Secundario** | ⚪ **BAJA INDIVIDUAL** | Se retira la cuenta del organizador adicional sin afectar la infraestructura del torneo. |

---

## 🚫 Regla de Bloqueo Total (Zero-Trust) para Usuarios No Aceptados

> **Principio de seguridad y reglamento deportivo:**  
> *"Al no estar aceptado formalmente por la autoridad correspondiente, el usuario queda **totalmente bloqueado** y no puede realizar ninguna acción en el sistema (HTTP 403 Forbidden)."*

### 1. El Jugador No Aceptado (Estado `Pendiente` o `Rechazado`):
- **Bloqueo Total de Sesión:** El servidor deniega la emisión del token JWT. No puede iniciar sesión.
- **Sin ficha activa:** No figura en la planilla de partidos, no puede ser convocado, no puede solicitar traspasos, no puede cambiar dorsales ni puede ver información privada del club.
- **Hasta que el DT no presione "Aceptar":** El jugador permanece completamente fuera del sistema y no puede hacer nada.

### 2. El Entrenador con Club No Aceptado (Estado `Pendiente` o `Rechazado`):
- **Bloqueo Total de Sesión:** El servidor deniega el acceso con mensaje `🚫 ACCESO BLOQUEADO`.
- **Club Inhabilitado:** El equipo no figura en la tabla de posiciones, no puede ser programado en el fixture ni por la IA ni manualmente, y no puede recibir futbolistas.
- **Hasta que el Organizador no presione "Autorizar Club":** El entrenador y su equipo no existen operativamente en el campeonato.
