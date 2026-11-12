<template>
  <q-layout view="hHh lpr fFf" class="app-layout">
    <!-- PANTALLA DE ACCESO OBLIGATORIA (Si no inicia sesión, no entra al sistema) -->
    <div v-if="!store.isAuthenticated" class="login-gatekeeper-page flex flex-center q-pa-md">
      <q-card style="width: 500px; max-width: 95vw;" class="rounded-borders bg-white shadow-10 overflow-hidden login-card">
        <!-- Encabezado de la Pantalla de Ingreso -->
        <div class="login-card-header q-pa-lg text-center">
          <div class="brand-crest-wrapper q-mx-auto q-mb-sm">
            <img
              :src="logoCrest"
              alt="Logo"
              class="brand-crest-img"
              referrerPolicy="no-referrer"
            />
          </div>
          <div class="text-h5 text-weight-bolder letter-spacing-1 text-white q-mt-xs">FUTBOLITO</div>
          <div class="text-caption text-emerald-400 text-weight-bold q-mt-xs">
            Control de Acceso Oficial · Liga Barrial
          </div>
          <div class="text-caption text-slate-300 q-mt-xs font-mono font-11">
            Inicia sesión con tu cuenta o regístrate para ingresar
          </div>

          <q-tabs
            v-model="tabAcceso"
            dense
            no-caps
            class="login-header-tabs q-mt-md"
            active-color="positive"
            indicator-color="positive"
            align="justify"
          >
            <q-tab name="login" :icon="matLogin" label="Iniciar Sesión" class="text-weight-bold" />
            <q-tab name="registro" :icon="matPersonAdd" label="Crear Cuenta" class="text-weight-bold" />
          </q-tabs>
        </div>

        <!-- Banner de Error o Equipo Cancelado -->
        <div v-if="errorAcceso" class="q-px-md q-py-sm bg-negative text-white rounded-borders q-mx-md q-mt-sm">
          <div class="row items-start no-wrap q-gutter-xs">
            <q-icon :name="matErrorOutline" size="20px" class="q-mr-xs shrink-0" />
            <div class="col">
              <div class="text-caption text-weight-bold">
                {{ esEquipoCancelado ? '⚠️ Equipo Cancelado / Denegado' : 'Error al iniciar sesión' }}
              </div>
              <div class="text-caption font-11" style="line-height: 1.4;">
                {{ errorAcceso }}
              </div>

              <!-- Botón si el equipo o la solicitud de jugador fue rechazada -->
              <div v-if="esEquipoCancelado" class="q-mt-xs">
                <q-btn
                  unelevated
                  dense
                  no-caps
                  size="sm"
                  color="amber-4"
                  text-color="dark"
                  :icon="matPersonAdd"
                  label="Crear otra cuenta / elegir otro equipo"
                  class="text-weight-bolder q-px-sm shadow-1"
                  @click="abrirRegistroNuevoEquipoRechazado"
                />
              </div>
            </div>
          </div>
        </div>

        <q-tab-panels v-model="tabAcceso" animated class="q-pa-lg">
          <!-- PANEL 1: INICIAR SESIÓN -->
          <q-tab-panel name="login" class="q-pa-none">
            <form @submit.prevent="ejecutarLogin" class="q-gutter-y-md">
              <div>
                <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">Usuario</div>
                <q-input
                  v-model="loginForm.usuario"
                  outlined
                  dense
                  bg-color="white"
                  placeholder="Tu nombre de usuario"
                  autofocus
                  :rules="[val => !!val || 'El usuario es obligatorio']"
                >
                  <template #prepend>
                    <q-icon :name="matPerson" color="grey-6" />
                  
    

</template>
                </q-input>
              </div>

              <div>
                <div class="row items-center justify-between q-mb-xs">
                  <div class="text-caption text-weight-bold text-grey-8">Contraseña</div>
                  <div class="text-caption text-indigo-8 font-10">Acceso oficial para futbolistas y cuerpo técnico</div>
                </div>
                <q-input
                  v-model="loginForm.password"
                  :type="verPasswordLogin ? 'text' : 'password'"
                  outlined
                  dense
                  bg-color="white"
                  placeholder="Ingresa tu contraseña"
                  :rules="[val => !!val || 'La contraseña es obligatoria']"
                >
                  <template #prepend>
                    <q-icon :name="matLock" color="grey-6" />
                  </template>
                  <template #append>
                    <q-btn
                      flat
                      round
                      dense
                      size="sm"
                      :icon="verPasswordLogin ? matVisibilityOff : matVisibility"
                      color="grey-6"
                      @click="verPasswordLogin = !verPasswordLogin"
                    />
                  </template>
                </q-input>
              </div>

              <q-btn
                type="submit"
                color="primary"
                unelevated
                no-caps
                class="full-width q-py-sm text-weight-bold shadow-1"
                :loading="store.cargando"
                label="Ingresar al Sistema"
                :icon="matLogin"
              />

              <div class="text-center q-pt-xs">
                <span class="text-caption text-grey-7">¿No tienes cuenta registrada? </span>
                <q-btn
                  flat
                  dense
                  no-caps
                  color="primary"
                  label="Crear cuenta nueva"
                  class="text-weight-bold text-caption"
                  @click="tabAcceso = 'registro'"
                />
              </div>
            </form>
          </q-tab-panel>

          <!-- PANEL 2: REGISTRO -->
          <q-tab-panel name="registro" class="q-pa-none">
            <form @submit.prevent="ejecutarRegistro" class="q-gutter-y-sm">
              <!-- Selección de Rol -->
              <div>
                <div class="text-caption text-weight-bolder text-grey-9 q-mb-xs">
                  Selecciona tu Rol:
                </div>
                <div class="row q-col-gutter-xs">
                  <div class="col-4">
                    <q-card
                      flat
                      bordered
                      class="cursor-pointer text-center q-pa-sm"
                      :class="registroForm.rol === 'organizador' ? 'bg-amber-1 border-amber-8 text-amber-10 shadow-2 text-weight-bolder' : 'bg-grey-1 text-grey-8'"
                      @click="seleccionarRolRegistro('organizador')"
                    >
                      <div class="text-subtitle2 text-weight-bold">👑 Organizador</div>
                    </q-card>
                  </div>
                  <div class="col-4">
                    <q-card
                      flat
                      bordered
                      class="cursor-pointer text-center q-pa-sm"
                      :class="registroForm.rol === 'entrenador' ? 'bg-emerald-1 border-emerald-8 text-emerald-10 shadow-2 text-weight-bolder' : 'bg-grey-1 text-grey-8'"
                      @click="seleccionarRolRegistro('entrenador')"
                    >
                      <div class="text-subtitle2 text-weight-bold">📋 Entrenador</div>
                    </q-card>
                  </div>
                  <div class="col-4">
                    <q-card
                      flat
                      bordered
                      class="cursor-pointer text-center q-pa-sm"
                      :class="registroForm.rol === 'jugador' ? 'bg-indigo-1 border-indigo-8 text-indigo-10 shadow-2 text-weight-bolder' : 'bg-grey-1 text-grey-8'"
                      @click="seleccionarRolRegistro('jugador')"
                    >
                      <div class="text-subtitle2 text-weight-bold">⚽ Jugador</div>
                    </q-card>
                  </div>
                </div>
              </div>

              <!-- Nombre y Usuario -->
              <div class="row q-col-gutter-xs">
                <div class="col-6">
                  <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">Usuario *</div>
                  <q-input
                    v-model="registroForm.usuario"
                    dense
                    outlined
                    bg-color="white"
                    placeholder="Ej: admin1"
                    :rules="[val => !!val && val.length >= 3 || 'Mínimo 3 letras']"
                  />
                </div>
                <div class="col-6">
                  <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">Nombre Completo</div>
                  <q-input
                    v-model="registroForm.nombre"
                    dense
                    outlined
                    bg-color="white"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>
              </div>

              <!-- Contraseña de Cuenta -->
              <div>
                <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">Contraseña de Cuenta *</div>
                <q-input
                  v-model="registroForm.password"
                  :type="verPasswordReg ? 'text' : 'password'"
                  outlined
                  dense
                  bg-color="white"
                  placeholder="Mínimo 4 caracteres"
                  :rules="[val => !!val && val.length >= 4 || 'Mínimo 4 caracteres']"
                >
                  <template #append>
                    <q-btn
                      flat
                      round
                      dense
                      size="sm"
                      :icon="verPasswordReg ? matVisibilityOff : matVisibility"
                      color="grey-6"
                      @click="verPasswordReg = !verPasswordReg"
                    />
                  </template>
                </q-input>
              </div>

              <!-- CONDICIONAL SEGÚN ROL -->

              <!-- CASO 1: Entrenador (Obligatorio crear un equipo propio único) -->
              <div v-if="registroForm.rol === 'entrenador'" class="q-gutter-y-xs bg-emerald-50 q-pa-sm rounded-borders border-emerald-8">
                <div class="row items-center justify-between">
                  <span class="text-caption text-weight-bolder text-emerald-10">
                    🛡️ Nombre de tu Nuevo Club * (Obligatorio)
                  </span>
                  <q-badge color="positive" text-color="white">1 DT por club</q-badge>
                </div>
                <q-input
                  v-model="registroForm.nombreEquipo"
                  outlined
                  dense
                  bg-color="white"
                  placeholder="Ej: Huracán del Norte"
                  :rules="[val => !!val && val.trim().length >= 3 || 'Debes ingresar el nombre de tu equipo (mínimo 3 letras)']"
                >
                  <template #prepend>
                    <q-icon :name="matShield" color="positive" />
                  </template>
                </q-input>

                <div class="row q-col-gutter-xs">
                  <div class="col-12">
                    <q-input
                      v-model="registroForm.barriada"
                      outlined
                      dense
                      bg-color="white"
                      placeholder="Barrio / Sector (Ej: Barrio Norte)"
                    />
                  </div>
                </div>

                <!-- Creador / Selector de Escudo Oficial del Club -->
                <div class="q-mt-xs bg-white q-pa-sm rounded-borders border border-emerald-3">
                  <div class="row items-center justify-between q-mb-xs">
                    <span class="text-caption text-weight-bolder text-emerald-10">
                      🛡️ Escudo Oficial del Club *
                    </span>
                    <span class="text-caption text-grey-6 font-10">
                      Elige figura, sube tu imagen o pega una URL
                    </span>
                  </div>

                  <!-- Vista Previa del Escudo -->
                  <div class="row items-center q-gutter-sm q-mb-xs bg-slate-50 q-pa-xs rounded-borders border">
                    <div
                      class="escudo-preview-box flex flex-center rounded-borders shadow-1"
                      :style="{ backgroundColor: registroForm.escudocolor || '#059669' }"
                    >
                      <img
                        v-if="registroForm.escudoUrl"
                        :src="registroForm.escudoUrl"
                        alt="Escudo"
                        class="escudo-preview-img"
                      />
                      <span v-else class="text-h6">{{ registroForm.escudoFigura || '🛡️' }}</span>
                    </div>
                    <div class="col">
                      <div class="text-caption text-weight-bold text-slate-800 ellipsis">
                        {{ registroForm.nombreEquipo || 'Tu Club Oficial' }}
                      </div>
                      <div class="text-caption text-grey-6 font-10">
                        {{ registroForm.escudoUrl ? 'Imagen personalizada activa' : `Emblema: ${registroForm.escudoFigura}` }}
                      </div>
                    </div>
                  </div>

                  <!-- Selector de Método de Escudo -->
                  <q-tabs
                    v-model="tabEscudo"
                    dense
                    no-caps
                    active-color="positive"
                    indicator-color="positive"
                    class="text-grey-7 border-b q-mb-xs font-11"
                    align="justify"
                  >
                    <q-tab name="figuras" label="Figuras" />
                    <q-tab name="subir" label="Subir Archivo" />
                    <q-tab name="url" label="Pegar URL" />
                  </q-tabs>

                  <q-tab-panels v-model="tabEscudo" animated class="q-pa-none bg-transparent">
                    <!-- Panel 1: Figuras Prediseñadas y Colores -->
                    <q-tab-panel name="figuras" class="q-pa-none">
                      <div class="text-caption text-weight-medium text-grey-7 q-mb-xs font-11">Selecciona una figura para tu escudo:</div>
                      <div class="row q-col-gutter-xs q-mb-xs">
                        <div
                          v-for="fig in figurasEscudoDisponibles"
                          :key="fig.emoji"
                          class="col-2 text-center"
                        >
                          <div
                            class="cursor-pointer q-pa-xs rounded-borders text-center border transition-all"
                            :class="registroForm.escudoFigura === fig.emoji && !registroForm.escudoUrl ? 'bg-emerald-1 border-emerald-6 shadow-1' : 'bg-white border-grey-3'"
                            @click="seleccionarFiguraEscudo(fig.emoji)"
                          >
                            <span class="text-subtitle1">{{ fig.emoji }}</span>
                          </div>
                        </div>
                      </div>

                      <div class="text-caption text-weight-medium text-grey-7 q-mb-xs font-11">Color de fondo:</div>
                      <div class="row q-gutter-xs items-center q-mb-xs">
                        <div
                          v-for="c in coloresEscudoDisponibles"
                          :key="c"
                          class="color-dot cursor-pointer shadow-1"
                          :style="{ backgroundColor: c }"
                          :class="{ 'ring-active': registroForm.escudocolor === c }"
                          @click="registroForm.escudocolor = c"
                        />
                      </div>
                    </q-tab-panel>

                    <!-- Panel 2: Subir Archivo desde Computadora -->
                    <q-tab-panel name="subir" class="q-pa-xs text-center">
                      <div class="text-caption text-grey-7 q-mb-xs font-11">
                        Sube una foto o imagen de escudo desde tu equipo:
                      </div>
                      <input
                        type="file"
                        id="archivoEscudoInput"
                        accept="image/*"
                        style="display: none;"
                        @change="cargarArchivoEscudo"
                      />
                      <q-btn
                        unelevated
                        dense
                        no-caps
                        color="positive"
                        icon="cloud_upload"
                        label="Elegir archivo de imagen"
                        class="q-px-sm text-weight-bold font-11"
                        onclick="document.getElementById('archivoEscudoInput').click()"
                      />
                      <div v-if="registroForm.escudoUrl" class="q-mt-xs">
                        <q-btn
                          flat
                          dense
                          no-caps
                          size="xs"
                          color="negative"
                          label="Quitar imagen subida"
                          @click="registroForm.escudoUrl = ''"
                        />
                      </div>
                    </q-tab-panel>

                    <!-- Panel 3: Pegar Enlace de una Página Web -->
                    <q-tab-panel name="url" class="q-pa-none">
                      <div class="text-caption text-grey-7 q-mb-xs font-11">
                        Pega el enlace web (URL) del escudo:
                      </div>
                      <q-input
                        v-model="registroForm.escudoUrl"
                        outlined
                        dense
                        bg-color="white"
                        placeholder="https://ejemplo.com/escudo.png"
                      >
                        <template #append v-if="registroForm.escudoUrl">
                          <q-btn flat round dense size="xs" icon="close" @click="registroForm.escudoUrl = ''" />
                        </template>
                      </q-input>
                    </q-tab-panel>
                  </q-tab-panels>
                </div>

                <div class="text-caption text-emerald-9 font-11 bg-white q-pa-xs rounded border border-emerald-3">
                  📋 <strong>Regla Oficial:</strong> Propondrás este nuevo club para que el <strong>Organizador del Torneo</strong> evalúe y autorice su afiliación oficial.
                </div>
              </div>

              <!-- CASO 2: Jugador (Obligatorio escoger club de la plataforma y su posición táctica) -->
              <div v-else-if="registroForm.rol === 'jugador'" class="q-gutter-y-sm bg-indigo-50 q-pa-sm rounded-borders border border-indigo-2">
                <div class="row items-center justify-between">
                  <span class="text-caption text-weight-bolder text-indigo-9">
                    ⚽ 1. Escoger Club de la Plataforma * (Obligatorio)
                  </span>
                  <q-badge color="indigo-7" text-color="white">
                    {{ store.equipos.length }} clubes en torneo
                  </q-badge>
                </div>
                <q-select
                  v-model="registroForm.equipo"
                  :options="opcionesEquipos"
                  outlined
                  dense
                  emit-value
                  map-options
                  bg-color="white"
                  placeholder="Selecciona el club en el que jugarás"
                  :rules="[val => !!val || 'Debes escoger un club obligatorio']"
                >
                  <template #prepend>
                    <q-icon :name="matShield" color="indigo-7" />
                  </template>
                  <template #no-option>
                    <q-item>
                      <q-item-section class="text-grey-8 text-caption">
                        No hay clubes registrados todavía. Un entrenador debe registrar su club primero.
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>

                <!-- Posición Reglamentaria Inicial: En Banca (El Entrenador decide la posición) -->
                <div class="bg-indigo-50 border border-indigo-2 rounded-borders q-pa-sm">
                  <div class="row items-center justify-between q-mb-xs">
                    <div class="row items-center q-gutter-xs text-indigo-9 text-weight-bold font-12">
                      <q-icon :name="matEventSeat" size="18px" />
                      <span>Posición Inicial: Suplente en Banca</span>
                    </div>
                    <q-badge color="indigo-8" text-color="white" class="text-weight-bold font-10">
                      🪑 En Banca
                    </q-badge>
                  </div>
                  <div class="text-caption text-slate-700 font-11" style="line-height: 1.4;">
                    Al registrarte ingresarás a la banca de suplentes. El <strong>Director Técnico</strong> de tu club es la única persona encargada de autorizar tu ingreso y decidir en qué posición táctica (Arquero, Defensor, Mediocampista o Delantero) jugarás en la cancha.
                  </div>
                </div>
              </div>

              <!-- CASO 3: Organizador -->
              <div v-else class="bg-amber-1 q-pa-sm rounded-borders border-amber-8">
                <div class="text-caption text-weight-bold text-amber-10">
                  👑 Administrador de la Liga Barrial
                </div>
                <div class="text-caption text-grey-8 font-11">
                  Control general de la programación, actas y tabla general.
                </div>
              </div>

              <!-- Campo de Código de Seguridad para Organizador -->
              <div v-if="registroForm.rol === 'organizador'" class="bg-amber-50 q-pa-sm rounded-borders border border-amber-3 q-mt-xs">
                <div class="row items-center justify-between q-mb-xs">
                  <div class="text-caption text-weight-bold text-amber-10">🔑 Código de Autorización de Organizador *</div>
                  <span class="text-caption text-grey-7 font-10">Generado por Omar</span>
                </div>
                <q-input
                  v-model="registroForm.codigo"
                  outlined
                  dense
                  bg-color="white"
                  placeholder="Ej: OMAR-8421 (Ingresa el código proporcionado por Omar)"
                  :rules="[val => !!val || 'El código generado por el organizador Omar es obligatorio']"
                >
                  <template #prepend>
                    <q-icon :name="matVpnKey" color="amber-9" />
                  </template>
                </q-input>
                <div class="text-caption text-grey-8 font-10">
                  ℹ️ Solo el organizador principal <strong>Omar</strong> recibe este código al iniciar sesión para autorizar la creación de nuevos organizadores.
                </div>
              </div>

              <q-btn
                type="submit"
                color="primary"
                unelevated
                no-caps
                class="full-width q-py-sm text-weight-bold shadow-1 q-mt-sm"
                :loading="store.cargando"
                label="Crear Cuenta e Ingresar"
                :icon="matPersonAdd"
              />

              <div class="text-center q-pt-xs">
                <span class="text-caption text-grey-7">¿Ya tienes cuenta? </span>
                <q-btn
                  flat
                  dense
                  no-caps
                  color="primary"
                  label="Inicia sesión aquí"
                  class="text-weight-bold text-caption"
                  @click="tabAcceso = 'login'"
                />
              </div>
            </form>
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </div>

    <!-- APLICACIÓN COMPLETA (Solo visible una vez autenticado) -->
    <template v-else>
      <!-- Navbar Oficial -->
      <q-header class="bg-dark-header text-white">
        <div class="container">
          <div class="header-nav-row row items-center justify-between no-wrap q-py-sm">
            <!-- Zona 1: Brand & Status -->
            <div class="row items-center no-wrap brand-zone">
              <div class="brand-crest-wrapper q-mr-sm">
                <img
                  :src="logoCrest"
                  alt="Logo"
                  class="brand-crest-img"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div class="brand-title">FUTBOLITO</div>
                <div class="row items-center no-wrap">
                  <span class="live-pulse q-mr-xs" />
                  <span class="text-caption text-grey-4 font-mono font-11">MongoDB Atlas</span>
                </div>
              </div>
            </div>

            <!-- Zona 2: Navegación Central -->
            <div class="nav-links-zone hidden lg:flex items-center">
              <q-tabs
                dense
                no-caps
                active-color="emerald-400"
                indicator-color="primary"
                class="text-grey-4 header-tabs"
              >
                <q-route-tab to="/" exact :icon="matTableChart" label="Posiciones" />
                <q-route-tab to="/fixture" :icon="matCalendarMonth" label="Fixture" />
                <q-route-tab to="/equipos" :icon="matShield" label="Clubes" />
                <q-route-tab to="/ranking" :icon="matMilitaryTech" label="Goleadores" />
                <q-route-tab
                  v-if="store.esEntrenador"
                  to="/entrenador"
                  :icon="matSports"
                  label="Pizarra DT"
                  class="text-positive text-weight-bold"
                />
              </q-tabs>
            </div>

            <!-- Zona 3: Rol Oficial Asignado (Fijo), Notificaciones y Usuario Logueado -->
            <div class="row items-center q-gutter-xs no-wrap">
              <!-- Rol Oficial Asignado (Fijo, sin posibilidad de cambiar de rol) -->
              <div
                class="role-badge-official row items-center q-px-sm q-py-xs rounded-borders text-caption text-weight-bolder shadow-1"
                :class="roleColorClass"
              >
                <span>{{ store.rolInfo.badge }}</span>
                <q-tooltip>Rol asignado oficial de tu cuenta: {{ store.rolInfo.titulo }} (No modificable)</q-tooltip>
              </div>

              <!-- Badge de Dorsal Oficial para Futbolistas -->
              <q-btn
                v-if="store.esJugador && store.miJugador"
                flat
                dense
                no-caps
                to="/equipos"
                class="bg-indigo-9 text-indigo-1 q-px-sm rounded-borders font-mono text-caption text-weight-bold"
              >
                <span>👕 Dorsal #{{ store.miJugador.numero ?? store.miJugador.dorsal ?? '—' }}</span>
                <q-tooltip>Tu número de camiseta en {{ store.miEquipo?.nombre || 'tu club' }} (Clic para cambiar)</q-tooltip>
              </q-btn>

              <!-- Campana de Notificaciones Oficiales para el Administrador / Usuarios -->
              <q-btn
                flat
                round
                dense
                :icon="matNotifications"
                color="grey-4"
                class="q-mx-xs relative-position notif-bell-btn"
                @click="mostrarModalNotificaciones = true"
              >
                <q-badge
                  v-if="store.notificacionesNoLeidas.length"
                  color="negative"
                  floating
                  rounded
                  class="text-weight-bold animate-pulse-gentle"
                >
                  {{ store.notificacionesNoLeidas.length }}
                </q-badge>
                <q-tooltip>
                  {{ store.notificacionesNoLeidas.length ? `${store.notificacionesNoLeidas.length} notificaciones del torneo pendientes` : 'Bandeja de Notificaciones Oficiales' }}
                </q-tooltip>
              </q-btn>

              <!-- Código Exclusivo de Organizador para Omar (Visible inmediatamente) -->
              <div
                v-if="store.esOrganizadorOmar"
                class="row items-center no-wrap bg-amber-4 text-slate-950 q-px-sm q-py-xs rounded-borders shadow-2 cursor-pointer q-mx-xs border border-amber-6"
                @click="copiarCodigoOrganizador"
              >
                <q-icon :name="matVpnKey" size="16px" class="q-mr-xs text-amber-10" />
                <div class="row items-center no-wrap q-gutter-xs">
                  <span class="text-caption text-weight-bolder">Código Org:</span>
                  <q-badge color="amber-10" text-color="white" class="font-mono text-weight-bolder font-12 q-px-xs">
                    {{ store.codigoOrganizadorActivo || 'Cargando...' }}
                  </q-badge>
                </div>
                <q-tooltip class="bg-dark text-white">
                  🔑 Código dinámico exclusivo de tu cuenta Omar. Haz clic para copiarlo y compartirlo con quien desees crear como nuevo Organizador.
                </q-tooltip>
              </div>

              <!-- Perfil del Usuario Activo (Click para gestionar cuenta / editar / eliminar) -->
              <div
                class="row items-center no-wrap q-ml-xs bg-slate-800 hover:bg-slate-700 q-px-sm q-py-xs rounded-borders cursor-pointer border border-slate-700 transition"
                @click="abrirModalPerfil"
              >
                <q-avatar size="24px" color="positive" text-color="white" class="q-mr-xs">
                  <span class="text-weight-bold font-mono">{{ ((store.user?.usuario || 'U').charAt(0)).toUpperCase() }}</span>
                </q-avatar>
                <div class="column no-wrap leading-tight" style="max-width: 130px">
                  <span class="text-caption text-weight-bolder text-emerald-300 ellipsis" :title="`@${store.user?.usuario}`">
                    @{{ store.user?.usuario }}
                  </span>
                  <span v-if="store.user?.nombre && store.user?.nombre !== store.user?.usuario" class="font-10 text-grey-4 ellipsis" :title="store.user?.nombre">
                    {{ store.user?.nombre }}
                  </span>
                </div>
                <q-icon :name="matSettings" size="14px" color="grey-4" class="q-ml-xs" />
                <q-tooltip class="bg-dark text-white">⚙️ Administrar tu cuenta (editar usuario o darte de baja)</q-tooltip>
              </div>

              <!-- Botón de Sincronización -->
              <q-btn
                flat
                round
                dense
                :icon="matRefresh"
                color="grey-4"
                :loading="store.cargando"
                @click="store.cargarTodo()"
              >
                <q-tooltip>Sincronizar datos</q-tooltip>
              </q-btn>

              <!-- Botón Cerrar Sesión (Vuelve a mostrar la pantalla de login) -->
              <q-btn
                unelevated
                dense
                no-caps
                color="negative"
                size="sm"
                :icon="matLogout"
                label="Salir"
                class="q-px-sm text-weight-bold q-ml-xs"
                @click="cerrarSesion"
              >
                <q-tooltip>Cerrar sesión y volver al ingreso</q-tooltip>
              </q-btn>
            </div>
          </div>

          <!-- Barra Móvil de Pestañas -->
          <div class="flex lg:hidden border-t-subtle q-py-xs overflow-x-auto">
            <q-tabs
              dense
              no-caps
              active-color="primary"
              indicator-color="primary"
              class="full-width text-grey-4"
            >
              <q-route-tab to="/" exact :icon="matTableChart" label="Posiciones" />
              <q-route-tab to="/fixture" :icon="matCalendarMonth" label="Fixture" />
              <q-route-tab to="/equipos" :icon="matShield" label="Clubes" />
              <q-route-tab to="/ranking" :icon="matMilitaryTech" label="Goleadores" />
              <q-route-tab v-if="store.esEntrenador" to="/entrenador" :icon="matSports" label="Pizarra DT" />
            </q-tabs>
          </div>
        </div>
      </q-header>

      <q-page-container>
        <q-page class="container q-py-lg q-px-md">
          <!-- Banner de Error si falla la conexión -->
          <q-banner v-if="store.error" class="bg-negative text-white q-mb-md rounded-borders" rounded>
            Error de conexión con MongoDB: {{ store.error }}
            <template #action>
              <q-btn flat text-color="white" label="Reintentar" @click="store.cargarTodo()" />
            </template>
          </q-banner>

          <!-- Indicador de Carga -->
          <q-inner-loading :showing="store.cargando" color="primary" label="Cargando datos de Atlas..." />

          <!-- Vistas oficiales -->
          <router-view />
        </q-page>
      </q-page-container>

      <!-- Footer -->
      <q-footer class="bg-dark-footer text-grey-5 border-t-subtle">
        <div class="container q-py-md q-px-md row items-center justify-between q-gutter-md">
          <div class="row items-center no-wrap">
            <q-icon :name="matSportsSoccer" color="primary" size="20px" class="q-mr-sm" />
            <span class="text-white text-weight-bold">FUTBOLITO</span>
            <span class="q-ml-sm text-caption text-grey-6">· Sistema de Gestión de Torneos Barriales</span>
          </div>
          <div class="text-caption text-grey-6 font-mono">
            MongoDB Atlas Cloud Activo
          </div>
        </div>
      </q-footer>
    </template>

    <!-- Diálogos Globales -->
    <PartidoDialog v-model="store.dialogoPartido" />
    <EquipoDialog v-model="store.dialogoEquipo" />

    <!-- Diálogo de Notificaciones Oficiales para el Administrador -->
    <q-dialog v-model="mostrarModalNotificaciones">
      <q-card style="width: 580px; max-width: 95vw;" class="rounded-borders overflow-hidden bg-white shadow-10">
        <!-- Cabecera de Notificaciones -->
        <q-card-section class="bg-slate-900 text-white row items-center justify-between q-py-md">
          <div class="row items-center q-gutter-sm">
            <q-avatar size="36px" color="amber-5" text-color="slate-900">
              <q-icon :name="matNotifications" size="22px" />
            </q-avatar>
            <div>
              <div class="text-subtitle1 text-weight-bolder row items-center q-gutter-xs">
                <span>Notificaciones Oficiales</span>
                <q-badge v-if="store.notificacionesNoLeidas.length" color="negative" class="text-weight-bold q-ml-xs">
                  {{ store.notificacionesNoLeidas.length }} nuevas
                </q-badge>
              </div>
              <div class="text-caption text-grey-4 font-11">
                Avisos reglamentarios y reportes de goleadores de los directores técnicos
              </div>
            </div>
          </div>
          <div class="row items-center q-gutter-xs">
            <q-btn
              v-if="store.notificacionesNoLeidas.length"
              flat
              dense
              no-caps
              size="sm"
              color="amber-4"
              label="Marcar leídas"
              :icon="matDoneAll"
              @click="store.marcarTodasNotificacionesLeidas()"
            />
          </div>
        </q-card-section>

        <!-- Contenido / Lista de Notificaciones -->
        <q-card-section class="q-pa-md" style="max-height: 65vh; overflow-y: auto;">
          <div v-if="!store.notificacionesDelUsuario.length" class="text-center q-py-xl text-grey-6">
            <q-icon :name="matNotifications" size="52px" color="grey-4" class="q-mb-sm" />
            <div class="text-subtitle2 text-weight-bold text-slate-800">No hay notificaciones registradas</div>
            <div class="text-caption text-grey-5 q-mt-xs">
              Cuando un Entrenador registre los goleadores de su club, el aviso oficial llegará aquí automáticamente.
            </div>
          </div>

          <div v-else class="q-gutter-y-sm">
            <q-card
              v-for="n in store.notificacionesDelUsuario"
              :key="n._id || n.id"
              flat
              bordered
              class="rounded-borders transition-all"
              :class="n.leida ? 'bg-slate-50 border-slate-200' : 'bg-amber-50 border-amber-3 shadow-1'"
            >
              <q-card-section class="q-pa-sm">
                <div class="row items-center justify-between no-wrap q-mb-xs">
                  <div class="row items-center q-gutter-xs">
                    <span class="text-caption text-weight-bolder" :class="n.leida ? 'text-slate-800' : 'text-amber-10'">
                      {{ n.titulo }}
                    </span>
                    <q-badge
                      :color="n.leida ? 'grey-5' : 'negative'"
                      :label="n.leida ? 'Leído' : 'NUEVO'"
                      class="text-weight-bold"
                      size="xs"
                    />
                  </div>
                  <span class="text-caption text-grey-6 font-mono font-11">
                    {{ formatearFechaNotif(n.createdAt) }}
                  </span>
                </div>

                <div class="text-caption text-grey-8 q-mb-xs whitespace-pre-line" style="line-height: 1.45;">
                  {{ n.mensaje }}
                </div>

                <!-- Desglose de Goleadores -->
                <div v-if="n.datos?.goleadores && n.datos.goleadores.length" class="bg-white q-pa-xs rounded-borders border q-my-xs">
                  <div class="text-caption text-weight-bold text-slate-700 q-mb-xs">
                    ⚽ Goleadores seleccionados por el DT:
                  </div>
                  <div class="row q-gutter-xs">
                    <q-chip
                      v-for="(g, idx) in n.datos.goleadores"
                      :key="idx"
                      dense
                      outline
                      color="primary"
                      icon="sports_soccer"
                      class="text-weight-bold font-12"
                    >
                      {{ g.nombre }} (#{{ g.dorsal || '—' }}): {{ g.goles }} gol(es){{ g.minuto ? ` · Min ${g.minuto}` : '' }}
                    </q-chip>
                  </div>
                </div>

                <div class="row items-center justify-between q-mt-xs pt-1 border-t">
                  <span class="text-caption text-weight-medium text-grey-7">
                    Remitente: <strong class="text-slate-900">{{ n.remitente }}</strong>
                  </span>
                  <div class="row items-center q-gutter-xs">
                    <!-- ACCIONES EXCLUSIVAS DEL ENTRENADOR: Aceptar o Rechazar jugador en su plantel -->
                    <template v-if="n.tipo === 'solicitud_jugador' && store.esEntrenador">
                      <q-btn
                        dense
                        unelevated
                        no-caps
                        size="xs"
                        color="positive"
                        label="✅ Aceptar en el Equipo"
                        class="text-weight-bold q-px-xs"
                        @click="autorizarJugadorDesdeNotif(n)"
                      />
                      <q-btn
                        dense
                        flat
                        no-caps
                        size="xs"
                        color="negative"
                        label="❌ Rechazar"
                        class="text-weight-bold q-px-xs"
                        @click="rechazarJugadorDesdeNotif(n)"
                      />
                    </template>

                    <!-- ACCIONES DE TRASPASO FASE 1: DT de Origen autoriza carta de salida -->
                    <template v-else-if="n.tipo === 'traspaso_salida' && store.esEntrenador">
                      <q-btn
                        dense
                        unelevated
                        no-caps
                        size="xs"
                        color="positive"
                        label="✅ Autorizar Salida"
                        class="text-weight-bold q-px-xs"
                        @click="autorizarSalidaDesdeNotif(n)"
                      />
                      <q-btn
                        dense
                        flat
                        no-caps
                        size="xs"
                        color="negative"
                        label="❌ Denegar Salida"
                        class="text-weight-bold q-px-xs"
                        @click="rechazarTraspasoDesdeNotif(n)"
                      />
                    </template>

                    <!-- ACCIONES DE TRASPASO FASE 2: DT de Destino autoriza incorporación final -->
                    <template v-else-if="n.tipo === 'traspaso_llegada' && store.esEntrenador">
                      <q-btn
                        dense
                        unelevated
                        no-caps
                        size="xs"
                        color="positive"
                        label="✅ Aceptar en mi Club"
                        class="text-weight-bold q-px-xs"
                        @click="confirmarLlegadaDesdeNotif(n)"
                      />
                      <q-btn
                        dense
                        flat
                        no-caps
                        size="xs"
                        color="negative"
                        label="❌ Denegar Fichaje"
                        class="text-weight-bold q-px-xs"
                        @click="rechazarTraspasoDesdeNotif(n)"
                      />
                    </template>

                    <!-- ACCIONES DEL ORGANIZADOR: Autorizar o Rechazar clubes -->
                    <template v-else-if="n.tipo === 'solicitud_club' && store.esOrganizador">
                      <q-btn
                        dense
                        unelevated
                        no-caps
                        size="xs"
                        color="positive"
                        label="Autorizar Club"
                        class="text-weight-bold q-px-xs"
                        @click="autorizarClubDesdeNotif(n)"
                      />
                      <q-btn
                        dense
                        flat
                        no-caps
                        size="xs"
                        color="negative"
                        label="Rechazar"
                        class="text-weight-bold q-px-xs"
                        @click="rechazarClubDesdeNotif(n)"
                      />
                    </template>

                    <q-btn
                      v-if="!n.leida"
                      flat
                      dense
                      no-caps
                      size="xs"
                      color="positive"
                      label="Marcar Leído"
                      :icon="matCheckCircle"
                      @click="store.marcarNotificacionLeida(n._id || n.id)"
                    />
                    <q-btn
                      flat
                      dense
                      no-caps
                      size="xs"
                      color="primary"
                      label="Ver Fixture"
                      v-close-popup
                      @click="router.push('/fixture')"
                    />
                    <q-btn
                      flat
                      dense
                      no-caps
                      size="xs"
                      color="amber-9"
                      label="Ver Goleadores"
                      v-close-popup
                      @click="router.push('/ranking')"
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  <!-- DIÁLOGO MODAL: GESTIÓN DE PERFIL (EDITAR USUARIO / ELIMINAR CUENTA) -->
    <q-dialog v-model="mostrarModalPerfil">
      <q-card style="width: 440px; max-width: 92vw;" class="rounded-xl overflow-hidden bg-white shadow-24 column no-wrap">
        <!-- Encabezado -->
        <q-card-section class="bg-slate-900 text-white row items-center justify-between q-py-sm q-px-md shrink-0">
          <div class="row items-center q-gutter-xs">
            <q-icon :name="matManageAccounts" color="positive" size="22px" />
            <div class="text-subtitle1 text-weight-bolder">Mi Cuenta y Perfil</div>
          </div>
          <q-btn flat round dense icon="close" text-color="white" v-close-popup size="sm" />
        </q-card-section>

        <q-card-section class="q-pa-md q-gutter-y-md scroll">
          <!-- Resumen de Cuenta Actual -->
          <div class="bg-slate-50 border rounded-lg p-3 row items-center justify-between">
            <div>
              <div class="text-caption text-grey-7 font-bold">USUARIO ACTUAL</div>
              <div class="text-subtitle1 text-weight-bolder text-dark font-mono">@{{ store.user?.usuario }}</div>
              <div class="text-caption text-slate-500 font-medium">{{ store.user?.nombre }}</div>
            </div>
            <div class="text-right">
              <q-badge :color="store.esOrganizador ? 'amber-9' : store.esEntrenador ? 'emerald-8' : 'indigo-8'" text-color="white" class="font-bold text-caption q-px-sm q-py-xs">
                {{ store.rolInfo.badge }}
              </q-badge>
            </div>
          </div>

          <!-- Pestañas internas: Editar vs Eliminar Cuenta -->
          <q-tabs v-model="tabPerfil" dense no-caps class="text-grey-7 bg-slate-100 rounded-borders p-1" active-color="primary" indicator-color="primary">
            <q-tab name="editar" icon="edit" label="Editar Perfil" class="text-weight-bold" />
            <q-tab name="eliminar" icon="delete_forever" label="Eliminar Cuenta" class="text-weight-bold text-negative" />
          </q-tabs>

          <!-- TAB 1: EDITAR PERFIL -->
          <div v-if="tabPerfil === 'editar'" class="q-gutter-y-sm">
            <div>
              <div class="text-caption text-weight-bold text-slate-700 q-mb-xs">Nombre de Usuario (@username)</div>
              <q-input
                v-model="perfilForm.nuevoUsuario"
                outlined
                dense
                bg-color="white"
                placeholder="Ej: lion99"
                :disable="store.user?.usuario === 'omar'"
                hint="Tu nombre único para iniciar sesión"
              >
                <template #prepend><span class="text-grey-6 font-bold">@</span></template>
              </q-input>
              <div v-if="store.user?.usuario === 'omar'" class="font-10 text-amber-9 font-bold q-mt-xs">
                🔒 El identificador maestro "@omar" está protegido reglamentariamente.
              </div>
            </div>

            <div>
              <div class="text-caption text-weight-bold text-slate-700 q-mb-xs">Nombre Completo Visible</div>
              <q-input
                v-model="perfilForm.nombre"
                outlined
                dense
                bg-color="white"
                placeholder="Tu nombre y apellido"
              />
            </div>

            <!-- Cambio opcional de clave -->
            <div class="bg-indigo-50/60 p-2 rounded-lg border border-indigo-1 q-mt-xs q-gutter-y-xs">
              <div class="text-caption text-weight-bold text-indigo-9">Cambiar Contraseña (Opcional)</div>
              <q-input
                v-model="perfilForm.passwordActual"
                type="password"
                outlined
                dense
                bg-color="white"
                placeholder="Contraseña actual (requerida para cambiarla)"
              />
              <q-input
                v-model="perfilForm.nuevoPassword"
                type="password"
                outlined
                dense
                bg-color="white"
                placeholder="Nueva contraseña (mínimo 4 caracteres)"
              />
            </div>

            <q-btn
              unelevated
              no-caps
              color="positive"
              text-color="white"
              icon="save"
              label="Guardar Cambios de Perfil"
              class="full-width text-weight-bolder q-mt-md shadow-2"
              :loading="guardandoPerfil"
              @click="guardarCambiosPerfil"
            />
          </div>

          <!-- TAB 2: ELIMINAR CUENTA (REGLAMENTARIO) -->
          <div v-else-if="tabPerfil === 'eliminar'" class="q-gutter-y-sm">
            <!-- CASO OMAR: NO SE PUEDE ELIMINAR -->
            <div v-if="store.user?.usuario === 'omar'" class="bg-amber-50 border border-amber-300 rounded-lg p-3 text-center q-gutter-y-xs">
              <q-icon name="gavel" color="amber-10" size="32px" />
              <div class="text-subtitle2 text-weight-bold text-amber-10">Cuenta Fundacional Protegida</div>
              <div class="text-caption text-slate-700 font-medium">
                El usuario <strong>@omar</strong> es el Organizador Maestro de la Liga. Por reglamento oficial del torneo, su cuenta no puede ser eliminada para garantizar la estabilidad institucional del campeonato.
              </div>
            </div>

            <!-- CASO ENTRENADOR: CASCADA TOTAL -->
            <div v-else-if="store.esEntrenador" class="bg-rose-50 border border-rose-300 rounded-lg p-3 q-gutter-y-xs">
              <div class="row items-center q-gutter-xs text-negative">
                <q-icon name="warning" size="20px" />
                <span class="text-subtitle2 text-weight-bolder">ADVERTENCIA CRÍTICA: Baja de Club y Plantel</span>
              </div>
              <div class="text-caption text-slate-800 leading-normal font-medium">
                Si eliminas tu cuenta de Entrenador:
                <ul class="q-my-xs q-pl-md font-11">
                  <li>Se <strong>disolverá tu club oficial</strong> de forma definitiva en MongoDB.</li>
                  <li>Se <strong>eliminarán todas las cuentas de los futbolistas</strong> vinculados a tu plantilla.</li>
                  <li>Se removerán todos los partidos pendientes del club en el fixture.</li>
                </ul>
                <div class="font-10 text-rose-9 font-bold bg-rose-100 p-1 rounded">
                  ⚠️ Esta acción es irreversible y deja fuera del campeonato a todo el plantel.
                </div>
              </div>
            </div>

            <!-- CASO JUGADOR: ELIMINACIÓN INDIVIDUAL -->
            <div v-else-if="store.esJugador" class="bg-slate-100 border border-slate-300 rounded-lg p-3 q-gutter-y-xs">
              <div class="text-subtitle2 text-weight-bolder text-slate-900">Baja Deportiva Individual</div>
              <div class="text-caption text-slate-700 font-medium">
                Al eliminar tu cuenta, tu ficha en la plantilla del club será retirada. <strong>No perjudica a tu club ni a tus compañeros</strong>; el equipo conservará su lugar en el torneo.
              </div>
            </div>

            <!-- OTRO ORGANIZADOR -->
            <div v-else class="bg-slate-100 border border-slate-300 rounded-lg p-3">
              <div class="text-caption text-slate-700 font-medium">
                Se dará de baja tu cuenta de organizador secundario del sistema.
              </div>
            </div>

            <!-- Formulario de confirmación con password -->
            <div v-if="store.user?.usuario !== 'omar'" class="q-pt-xs q-gutter-y-xs">
              <div class="text-caption text-weight-bold text-slate-900">Ingresa tu contraseña para confirmar la eliminación:</div>
              <q-input
                v-model="passwordEliminarCuenta"
                type="password"
                outlined
                dense
                bg-color="white"
                placeholder="Tu contraseña actual"
              />
              <q-btn
                unelevated
                no-caps
                color="negative"
                text-color="white"
                icon="delete_forever"
                label="Confirmar y Eliminar Definitivamente"
                class="full-width text-weight-bolder q-mt-md shadow-2"
                :loading="eliminandoCuenta"
                :disable="!passwordEliminarCuenta"
                @click="ejecutarEliminarCuenta"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import logoCrest from './assets/images/league_crest_badge_1790957070182.jpg'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useTorneo, ROLES } from './store/torneo.js'
import PartidoDialog from './components/PartidoDialog.vue'
import EquipoDialog from './components/EquipoDialog.vue'

// Quasar SVG Icons
import {
  matSportsSoccer,
  matTableChart,
  matCalendarMonth,
  matShield,
  matMilitaryTech,
  matGroupAdd,
  matRefresh,
  matSports,
  matLogin,
  matPersonAdd,
  matLogout,
  matKey,
  matPerson,
  matLock,
  matVisibility,
  matVisibilityOff,
  matErrorOutline,
  matCheckCircle,
  matNotifications,
  matDoneAll,
  matClose,
  matManageAccounts,
  matSettings,
  matVpnKey,
  matEventSeat
} from '@quasar/extras/material-icons'

const $q = useQuasar()
const store = useTorneo()
const router = useRouter()

// Control del Formulario de Ingreso Obligatorio
const tabAcceso = ref('login')
const errorAcceso = ref('')

function copiarCodigoOrganizador() {
  if (!store.codigoOrganizadorActivo) return
  navigator.clipboard?.writeText(store.codigoOrganizadorActivo)
  $q.notify({
    type: 'positive',
    icon: 'content_copy',
    message: `Código "${store.codigoOrganizadorActivo}" copiado al portapapeles. Compártelo con el nuevo organizador.`,
    position: 'top',
    timeout: 3500
  })
}

const esEquipoCancelado = ref(false)

function abrirRegistroNuevoEquipoRechazado() {
  tabAcceso.value = 'registro'
  seleccionarRolRegistro('entrenador')
  registroForm.value.nombreEquipo = ''
  registroForm.value.barriadaEquipo = ''
  registroForm.value.usuario = loginForm.value.usuario || ''
  errorAcceso.value = ''
  esEquipoCancelado.value = false
}
const verPasswordLogin = ref(false)
const verPasswordReg = ref(false)

const loginForm = ref({
  usuario: '',
  password: ''
})

const registroForm = ref({
  usuario: '',
  password: '',
  nombre: '',
  rol: 'organizador',
  codigo: '',
  equipo: null,
  nombreEquipo: '',
  barriada: '',
  posicion: 'En Banca',
  escudocolor: '#059669',
  escudoFigura: '🛡️',
  escudoUrl: ''
})

const tabEscudo = ref('figuras')

const figurasEscudoDisponibles = [
  { emoji: '🛡️', label: 'Escudo' },
  { emoji: '🦅', label: 'Águilas' },
  { emoji: '🦁', label: 'Leones' },
  { emoji: '⚡', label: 'Rayos' },
  { emoji: '⚽', label: 'Balón' },
  { emoji: '👑', label: 'Corona' },
  { emoji: '🐯', label: 'Tigres' },
  { emoji: '🐺', label: 'Lobos' },
  { emoji: '🏆', label: 'Copa' },
  { emoji: '⚔️', label: 'Gladiadores' },
  { emoji: '🐉', label: 'Dragones' },
  { emoji: '🥊', label: 'Guerreros' }
]

const coloresEscudoDisponibles = [
  '#059669', '#dc2626', '#2563eb', '#d97706', '#7c3aed', '#0f172a', '#e11d48', '#0891b2'
]

function seleccionarFiguraEscudo(emoji) {
  registroForm.value.escudoFigura = emoji
  registroForm.value.escudoUrl = ''
}

function cargarArchivoEscudo(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    $q.notify({ type: 'negative', message: 'Por favor selecciona un archivo de imagen válido.' })
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    registroForm.value.escudoUrl = e.target.result
    $q.notify({ type: 'positive', message: '¡Escudo cargado correctamente!', position: 'top', timeout: 2000 })
  }
  reader.readAsDataURL(file)
}

const opcionesPosiciones = [
  { label: '🧤 Portero', value: 'Arquero', desc: 'Bajo los tres palos' },
  { label: '🛡️ Defensa', value: 'Defensor', desc: 'Recuperación y marca' },
  { label: '⚙️ Mediocampo', value: 'Mediocampista', desc: 'Creación y juego' },
  { label: '⚡ Delantero', value: 'Delantero', desc: 'Goles y ataque' },
  { label: '🪑 En Banca', value: 'En Banca', desc: 'Suplente a la espera' }
]

const opcionesEquipos = computed(() =>
  store.equipos.map(e => ({
    label: e.nombre,
    value: e._id || e.id
  }))
)

function seleccionarRolRegistro(nuevoRol) {
  registroForm.value.rol = nuevoRol
  if (nuevoRol === 'organizador') registroForm.value.codigo = ''
  else if (nuevoRol === 'entrenador') registroForm.value.codigo = '2'
  else if (nuevoRol === 'jugador') {
    registroForm.value.codigo = '3'
    // No auto-rellenar contraseñas
    if (!registroForm.value.password) {
      registroForm.value.password = ''
    }
  }
}

async function ejecutarLogin() {
  errorAcceso.value = ''
  try {
    const res = await store.login({
      usuario: loginForm.value.usuario,
      password: loginForm.value.password
    })
    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: `¡Bienvenido ${res.usuario.nombre || res.usuario.usuario}! Acceso concedido al torneo.`,
      position: 'top',
      timeout: 3500
    })
  } catch (err) {
    const rawMsg = err.message || 'Credenciales incorrectas'
    errorAcceso.value = rawMsg
    if (rawMsg.toLowerCase().includes('rechazad') || rawMsg.toLowerCase().includes('cancelad') || rawMsg.toLowerCase().includes('denegad')) {
      esEquipoCancelado.value = true
    } else {
      esEquipoCancelado.value = false
    }
  }
}

async function ejecutarRegistro() {
  errorAcceso.value = ''
  if (registroForm.value.rol === 'entrenador') registroForm.value.codigo = '2'
  else if (registroForm.value.rol === 'jugador') registroForm.value.codigo = '3'

  if (registroForm.value.rol === 'entrenador') {
    if (!registroForm.value.nombreEquipo || registroForm.value.nombreEquipo.trim().length < 3) {
      errorAcceso.value = 'Como entrenador debes crear obligatoriamente un equipo propio (mínimo 3 caracteres).'
      return
    }
  }

  if (registroForm.value.rol === 'jugador') {
    if (!registroForm.value.equipo) {
      errorAcceso.value = 'Como jugador debes escoger obligatoriamente un equipo existente en la plataforma.'
      return
    }
registroForm.value.posicion = 'En Banca'
  }

  try {
    const res = await store.registro({
      usuario: registroForm.value.usuario,
      password: registroForm.value.password,
      nombre: registroForm.value.nombre,
      rol: registroForm.value.rol,
      codigo: registroForm.value.codigo,
      equipo: registroForm.value.equipo,
      nombreEquipo: registroForm.value.nombreEquipo,
      barriada: registroForm.value.barriada,
      posicion: registroForm.value.posicion,
      escudocolor: registroForm.value.escudocolor,
      escudoFigura: registroForm.value.escudoFigura,
      escudoUrl: registroForm.value.escudoUrl
    })
    // 1. Si es ENTRENADOR: Su club queda en espera de la aprobación del Organizador (Omar)
    if (registroForm.value.rol === 'entrenador') {
      store.logout()
      tabAcceso.value = 'login'
      $q.notify({
        type: 'warning',
        icon: 'hourglass_empty',
        message: `📋 Solicitud enviada al Administrador: El club "${registroForm.value.nombreEquipo}" quedó en estado PENDIENTE. Debes esperar a que el Organizador lo autorice para poder ingresar.`,
        position: 'top',
        timeout: 7000
      })
      errorAcceso.value = `⏳ Registro recibido: Tu club "${registroForm.value.nombreEquipo}" está en revisión. El Organizador del Torneo debe autorizar la afiliación antes de que puedas iniciar sesión.`
      return
    }

    // 2. Si es JUGADOR: Pasa igual al de equipo, queda en espera de la autorización del Entrenador del club
    if (registroForm.value.rol === 'jugador') {
      store.logout()
      tabAcceso.value = 'login'
      const nomClub = store.nombreEquipo(registroForm.value.equipo) || 'el club seleccionado'
      $q.notify({
        type: 'warning',
        icon: 'hourglass_empty',
        message: `👤 Solicitud de incorporación enviada al Entrenador de "${nomClub}". Tu ficha quedó en estado PENDIENTE. Debes esperar su aceptación para ingresar.`,
        position: 'top',
        timeout: 7000
      })
      errorAcceso.value = `⏳ Solicitud enviada: Tu ficha quedó pendiente de autorización. El Entrenador de "${nomClub}" debe aceptarte en su nómina antes de que puedas iniciar sesión o realizar cualquier acción en el sistema.`
      return
    }

    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: `¡Cuenta creada exitosamente! Rol oficial asignado: ${res?.usuario?.rol?.toUpperCase() || 'ORGANIZADOR'}`,
      position: 'top',
      timeout: 3500
    })
  } catch (err) {
    errorAcceso.value = err.message || 'Error al registrar la cuenta'
  }
}


async function autorizarClubDesdeNotif(n) {
  const eqId = n.datos?.equipoId || n.equipo
  if (!eqId) return
  try {
    const res = await store.autorizarEquipo(eqId)
    await store.marcarNotificacionLeida(n._id || n.id)
    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: res?.msg || 'Club autorizado oficialmente para el torneo.',
      position: 'top',
      timeout: 3500
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      icon: 'error',
      message: err.message || 'Error al autorizar club',
      position: 'top'
    })
  }
}

async function rechazarClubDesdeNotif(n) {
  const eqId = n.datos?.equipoId || n.equipo
  if (!eqId) return
  try {
    await store.rechazarEquipo(eqId)
    await store.marcarNotificacionLeida(n._id || n.id)
    $q.notify({
      type: 'warning',
      icon: 'cancel',
      message: 'Solicitud de club rechazada.',
      position: 'top',
      timeout: 3000
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      icon: 'error',
      message: err.message || 'Error al rechazar club',
      position: 'top'
    })
  }
}

async function autorizarSalidaDesdeNotif(n) {
  const jId = n.datos?.jugadorId
  const clubDestinoId = n.datos?.clubDestinoId
  if (!jId || !clubDestinoId) return
  try {
    const res = await store.autorizarSalidaTraspaso({
      jugadorId: jId,
      clubDestinoId,
      notificacionId: n._id || n.id
    })
    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: res.msg || 'Carta de salida concedida al futbolista.',
      position: 'top',
      timeout: 4500
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.message || 'Error al autorizar la salida'
    })
  }
}

async function confirmarLlegadaDesdeNotif(n) {
  const jId = n.datos?.jugadorId
  const clubDestinoId = n.datos?.clubDestinoId
  if (!jId || !clubDestinoId) return
  try {
    const res = await store.confirmarLlegadaTraspaso({
      jugadorId: jId,
      clubDestinoId,
      notificacionId: n._id || n.id
    })
    $q.notify({
      type: 'positive',
      icon: 'verified',
      message: res.msg || '¡Futbolista transferido e incorporado a tu club exitosamente!',
      position: 'top',
      timeout: 5000
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.message || 'Error al confirmar llegada del fichaje'
    })
  }
}

async function rechazarTraspasoDesdeNotif(n) {
  try {
    await store.marcarNotificacionLeida(n._id || n.id)
    $q.notify({
      type: 'info',
      icon: 'cancel',
      message: 'Solicitud de traspaso desestimada por el cuerpo técnico.',
      position: 'top',
      timeout: 3500
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.message || 'Error al rechazar solicitud'
    })
  }
}

async function autorizarJugadorDesdeNotif(n) {
  const jId = n.datos?.jugadorId
  try {
    let jugadorTarget = null
    if (jId) {
      jugadorTarget = store.jugadores.find(j => (j.id || j._id) === jId)
    }
    if (!jugadorTarget && n.datos?.jugador) {
      jugadorTarget = store.jugadores.find(j => j.email?.includes(n.datos.jugador) || j.nombre?.toLowerCase().includes(n.datos.jugador.toLowerCase()))
    }
    const targetId = jugadorTarget ? (jugadorTarget.id || jugadorTarget._id) : (jId || n.datos?.clubId)
    if (targetId) {
      await store.autorizarJugador(targetId)
    }
    await store.marcarNotificacionLeida(n._id || n.id)
    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: '¡Futbolista autorizado e incorporado al club exitosamente!',
      position: 'top',
      timeout: 3500
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      icon: 'error',
      message: err.message || 'Error al autorizar jugador',
      position: 'top'
    })
  }
}

async function rechazarJugadorDesdeNotif(n) {
  await store.marcarNotificacionLeida(n._id || n.id)
  $q.notify({
    type: 'warning',
    icon: 'cancel',
    message: 'Solicitud de incorporación de futbolista desestimada.',
    position: 'top',
    timeout: 3000
  })
}

function cerrarSesion() {
  store.logout()
  loginForm.value.password = ''
  tabAcceso.value = 'login'
  $q.notify({
    type: 'info',
    message: 'Has cerrado sesión. Ingresa tus credenciales para volver a entrar.',
    position: 'top',
    timeout: 3000
  })
}

// Modal de Notificaciones Oficiales para el Administrador
const mostrarModalNotificaciones = ref(false)

function formatearFechaNotif(dateStr) {
  if (!dateStr) return 'Reciente'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 'Reciente'
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + d.toLocaleDateString([], { day: '2-digit', month: 'short' })
}

const roleColorClass = computed(() => {
  if (store.esOrganizador) return 'bg-amber-6 text-slate-900 font-bold'
  if (store.esEntrenador) return 'bg-emerald-6 text-white font-bold'
  return 'bg-indigo-6 text-white font-bold'
})


// ----------------------------------------------------------------------------
// ESTADO Y MÉTODOS PARA GESTIÓN DE PERFIL (EDITAR USUARIO / ELIMINAR CUENTA)
// ----------------------------------------------------------------------------
const mostrarModalPerfil = ref(false)
const tabPerfil = ref('editar')
const perfilForm = ref({
  nuevoUsuario: '',
  nombre: '',
  passwordActual: '',
  nuevoPassword: ''
})
const guardandoPerfil = ref(false)
const passwordEliminarCuenta = ref('')
const eliminandoCuenta = ref(false)

function abrirModalPerfil() {
  if (!store.user) return
  tabPerfil.value = 'editar'
  perfilForm.value = {
    nuevoUsuario: store.user.usuario || '',
    nombre: store.user.nombre || '',
    passwordActual: '',
    nuevoPassword: ''
  }
  passwordEliminarCuenta.value = ''
  mostrarModalPerfil.value = true
}

async function guardarCambiosPerfil() {
  guardandoPerfil.value = true
  try {
    const res = await store.actualizarPerfil({
      nuevoUsuario: perfilForm.value.nuevoUsuario,
      nombre: perfilForm.value.nombre,
      passwordActual: perfilForm.value.passwordActual,
      nuevoPassword: perfilForm.value.nuevoPassword
    })
    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: res?.msg || 'Perfil actualizado con éxito',
      position: 'top',
      timeout: 3500
    })
    mostrarModalPerfil.value = false
    await store.cargarTodo()
  } catch (err) {
    $q.notify({
      type: 'negative',
      icon: 'error',
      message: err.response?.data?.msg || err.message || 'Error al actualizar perfil',
      position: 'top'
    })
  } finally {
    guardandoPerfil.value = false
  }
}

async function ejecutarEliminarCuenta() {
  if (!passwordEliminarCuenta.value) {
    $q.notify({ type: 'warning', message: 'Ingresa tu contraseña para confirmar' })
    return
  }
  
  $q.dialog({
    title: '⚠️ Confirmación Final Irreversible',
    message: store.esEntrenador 
      ? '¿Estás absolutamente seguro? Se eliminará tu cuenta, tu club oficial y todas las cuentas de tus futbolistas vinculados.'
      : '¿Deseas eliminar definitivamente tu cuenta del sistema?',
    ok: { label: 'Sí, Eliminar Todo', color: 'negative', unelevated: true },
    cancel: { label: 'Cancelar', flat: true }
  }).onOk(async () => {
    eliminandoCuenta.value = true
    try {
      const res = await store.eliminarCuenta(passwordEliminarCuenta.value)
      mostrarModalPerfil.value = false
      $q.notify({
        type: 'info',
        icon: 'delete_forever',
        message: res?.msg || 'Cuenta eliminada del sistema',
        position: 'top',
        timeout: 6000
      })
      tabAcceso.value = 'login'
      await store.cargarTodo()
    } catch (err) {
      $q.notify({
        type: 'negative',
        icon: 'error',
        message: err.response?.data?.msg || err.message || 'Error al eliminar la cuenta',
        position: 'top'
      })
    } finally {
      eliminandoCuenta.value = false
    }
  })
}

onMounted(() => {
  store.cargarTodo()
})
</script>

<style>
/* Reset y Tipografía */
body {
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  background-color: #f8fafc;
  color: #0f172a;
}
.font-mono {
  font-family: 'JetBrains Mono', monospace;
  font-variant-numeric: tabular-nums;
}
.font-11 {
  font-size: 11px;
}
.container {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* Pantalla de Acceso */
.login-gatekeeper-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #090d16 0%, #064e3b 50%, #022c22 100%);
}
.login-card {
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
  border-radius: 16px;
  overflow: hidden;
}
.login-card-header {
  background: linear-gradient(180deg, #090d16 0%, #0f172a 100%) !important;
  color: #ffffff !important;
  border-bottom: 2px solid #059669;
}
.login-header-tabs {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 4px;
  color: #94a3b8;
}
.login-header-tabs .q-tab {
  border-radius: 8px;
  transition: all 0.2s ease;
  min-height: 42px;
}
.login-header-tabs .q-tab--active {
  color: #34d399 !important;
  background: rgba(16, 185, 129, 0.18);
  font-weight: 700;
}

/* Clases utilitarias de color y contraste */
.bg-slate-900 {
  background-color: #0f172a !important;
}
.bg-slate-800 {
  background-color: #1e293b !important;
}
.bg-slate-200 {
  background-color: #e2e8f0 !important;
}
.bg-slate-50 {
  background-color: #f8fafc !important;
}
.text-slate-900 {
  color: #0f172a !important;
}
.text-slate-800 {
  color: #1e293b !important;
}
.text-slate-700 {
  color: #334155 !important;
}
.text-slate-300 {
  color: #cbd5e1 !important;
}
.text-emerald-4, .text-emerald-400 {
  color: #34d399 !important;
}
.text-emerald-300 {
  color: #6ee7b7 !important;
}
.text-emerald-800 {
  color: #065f46 !important;
}
.text-emerald-9, .text-emerald-10 {
  color: #047857 !important;
}
.bg-emerald-100 {
  background-color: #d1fae5 !important;
}
.bg-emerald-1, .bg-emerald-50 {
  background-color: #ecfdf5 !important;
}
.border-emerald-8 {
  border: 1px solid #059669 !important;
}
.bg-amber-1 {
  background-color: #fffbeb !important;
}
.border-amber-8 {
  border: 1px solid #d97706 !important;
}
.text-amber-10 {
  color: #92400e !important;
}

/* Header Styles */
.bg-dark-header {
  background-color: #090d16 !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.bg-dark-footer {
  background-color: #090d16 !important;
}
.border-t-subtle {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.brand-crest-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  overflow: hidden;
  background-color: #059669;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}
.brand-crest-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.brand-title {
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #ffffff;
  line-height: 1.1;
}
.live-pulse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #10b981;
  display: inline-block;
  box-shadow: 0 0 6px #10b981;
}
.header-tabs .q-tab {
  padding: 0 14px;
  min-height: 48px;
  font-size: 0.86rem;
  font-weight: 600;
}
.header-tabs .q-tab__icon {
  margin-right: 6px;
}
.role-badge-official {
  font-size: 0.78rem;
  font-weight: 700;
  border-radius: 6px;
  letter-spacing: 0.02em;
}
.escudo-preview-box {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  overflow: hidden;
  color: white;
  border: 1px solid rgba(0,0,0,0.1);
}
.escudo-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.color-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid white;
  transition: transform 0.15s ease;
}
.color-dot:hover {
  transform: scale(1.15);
}
.ring-active {
  box-shadow: 0 0 0 2px #059669;
  transform: scale(1.1);
}
</style>
