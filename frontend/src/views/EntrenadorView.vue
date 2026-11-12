<template>
  <!-- SI ES ORGANIZADOR: ACCESO RESTRINGIDO - EL ORGANIZADOR NO PUEDE VER LA PIZARRA DT DE NINGÚN EQUIPO -->
  <div v-if="store.esOrganizador" class="q-pa-xl text-center">
    <q-card flat bordered class="bg-white rounded-borders q-pa-xl max-w-lg q-mx-auto shadow-1 border-rose-3">
      <q-avatar size="64px" color="rose-1" text-color="negative" class="q-mb-md">
        <q-icon :name="matLock" size="36px" />
      </q-avatar>
      <div class="text-h6 text-weight-bold text-slate-900 q-mb-xs">
        Acceso Restringido al Organizador
      </div>
      <p class="text-grey-7 text-body2 q-mb-lg">
        Por reglamento oficial de confidencialidad deportiva, el Organizador no puede ver la Pizarra Táctica (Pizarra DT) de ningún equipo. Las alineaciones, esquemas y pizarras son privadas y de uso exclusivo de los Directores Técnicos.
      </p>
      <q-btn
        color="primary"
        unelevated
        no-caps
        label="Ir al Fixture de Partidos"
        :icon="matCalendarMonth"
        to="/fixture"
        class="text-weight-bold q-px-md"
      />
    </q-card>
  </div>

  <div v-else class="entrenador-view">
    <!-- Header del Entrenador -->
    <q-card flat bordered class="bg-white rounded-borders q-mb-md">
      <q-card-section class="row items-center justify-between q-py-md">
        <div class="row items-center q-gutter-sm">
          <q-avatar size="44px" color="emerald-1" text-color="positive" class="text-weight-bold">
            <q-icon :name="matSports" size="24px" />
          </q-avatar>
          <div>
            <div class="row items-center q-gutter-xs">
              <span class="text-h6 text-weight-bold text-slate-900">Pizarra Táctica del Entrenador</span>
              <q-badge color="positive" text-color="white" label="Rol: DT / Club" class="q-ml-xs text-weight-medium" />
            </div>
            <div class="text-caption text-grey-6">
              Organiza la formación de tu equipo y asigna las posiciones tácticas de cada jugador en tiempo real.
            </div>
          </div>
        </div>

        <!-- Selector de Club para el Entrenador -->
        <div class="row items-center q-gutter-sm">
          <!-- Escudo del Club Seleccionado -->
          <div class="row items-center no-wrap bg-slate-50 q-px-sm q-py-xs rounded-borders border cursor-pointer" @click="abrirEditorEscudo" title="Clic para personalizar el escudo">
            <div class="club-badge-entrenador-box q-mr-xs" :style="{ backgroundColor: equipoActual?.escudocolor || '#059669' }">
              <img
                v-if="equipoActual?.escudoUrl"
                :src="equipoActual.escudoUrl"
                alt="Escudo"
                class="club-badge-entrenador-img"
              />
              <span v-else class="club-badge-entrenador-emoji">{{ equipoActual?.escudoFigura || '🛡️' }}</span>
            </div>
            <span class="text-caption text-weight-bolder text-slate-900 q-mr-xs">{{ equipoActual?.nombre }}</span>
            <q-btn
              v-if="!store.esJugador"
              flat
              round
              dense
              size="xs"
              color="positive"
              :icon="matShield"
              title="Personalizar Escudo del Club"
            />
          </div>

          <!-- Indicador del Capitán del Equipo -->
          <q-badge
            :color="tieneCapitanAsignado ? 'amber-9' : 'negative'"
            text-color="white"
            class="text-weight-bolder q-px-sm q-py-xs font-11"
          >
            {{ tieneCapitanAsignado ? `Ⓒ Capitán: ${capitanActual?.nombre || equipoActual?.capitan}` : '⚠️ Sin Capitán (Obligatorio para jugar)' }}
            <q-tooltip>
              {{ tieneCapitanAsignado ? 'Equipo habilitado por reglamento para disputar partidos oficiales' : 'Por reglamento, solo se puede jugar cuando el entrenador escoja al capitán' }}
            </q-tooltip>
          </q-badge>

          <!-- Si es Entrenador: Bloqueado a su propio equipo como responsable único -->
          <div v-if="store.esEntrenador" class="row items-center q-gutter-xs bg-emerald-50 q-px-sm q-py-xs rounded-borders border border-emerald-3">
            <span class="text-caption text-weight-bold text-emerald-9">Tu Club Responsable:</span>
            <span class="text-caption text-weight-bolder text-slate-900">{{ equipoActual?.nombre }}</span>
          </div>

          <!-- Si es Jugador: Ficha informativa de su club -->
          <q-badge v-else color="indigo-7" text-color="white" class="text-weight-bold q-px-sm q-py-xs">
            Modo Jugador: {{ equipoActual?.nombre || 'Tu Club' }}
          </q-badge>
        </div>
      </q-card-section>
    </q-card>

        <!-- SOLICITUDES DE TRASPASO: CARTA DE SALIDA (Fase 1) -->
    <div v-if="solicitudesSalidaPendientes.length" class="bg-amber-50 border-2 border-amber-5 rounded-borders q-pa-md q-mb-md shadow-2">
      <div class="row items-center justify-between q-mb-xs">
        <div class="row items-center q-gutter-xs">
          <q-icon :name="matSwapHoriz" color="amber-10" size="24px" />
          <span class="text-subtitle1 text-weight-bolder text-amber-10">
            🔄 Solicitudes de Salida / Traspaso de tu Equipo ({{ solicitudesSalidaPendientes.length }})
          </span>
        </div>
        <q-badge color="amber-10" text-color="white" class="text-weight-bold">
          Fase 1: Autorización de Salida
        </q-badge>
      </div>
      <div class="text-caption text-slate-700 q-mb-sm">
        Los siguientes futbolistas de tu club solicitan cambiar de equipo. Como DT de origen, debes autorizar su carta de salida para que el club de destino pueda evaluar su fichaje.
      </div>
      <div class="row q-col-gutter-sm">
        <div v-for="notif in solicitudesSalidaPendientes" :key="notif._id" class="col-12 col-md-6">
          <div class="bg-white q-pa-sm rounded border border-amber-4 row items-center justify-between">
            <div>
              <div class="text-weight-bold text-slate-900 font-12">{{ notif.datos?.jugadorNombre }}</div>
              <div class="text-caption text-grey-7 font-10">
                Destino solicitado: <strong class="text-primary">{{ notif.datos?.clubDestinoNombre }}</strong>
              </div>
            </div>
            <div class="row items-center q-gutter-xs">
              <q-btn
                dense
                unelevated
                no-caps
                size="sm"
                color="positive"
                label="✅ Conceder Salida"
                class="text-weight-bold q-px-xs"
                @click="autorizarSalidaDesdeNotif(notif)"
              />
              <q-btn
                dense
                flat
                no-caps
                size="sm"
                color="negative"
                label="❌ Retener"
                class="text-weight-bold q-px-xs"
                @click="store.marcarNotificacionLeida(notif._id)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SOLICITUDES DE TRASPASO: INCORPORACIÓN / LLEGADA (Fase 2) -->
    <div v-if="solicitudesLlegadaPendientes.length" class="bg-emerald-50 border-2 border-emerald-5 rounded-borders q-pa-md q-mb-md shadow-2">
      <div class="row items-center justify-between q-mb-xs">
        <div class="row items-center q-gutter-xs">
          <q-icon :name="matPersonAdd" color="emerald-9" size="24px" />
          <span class="text-subtitle1 text-weight-bolder text-emerald-9">
            📥 Nuevos Fichajes Liberados para tu Club ({{ solicitudesLlegadaPendientes.length }})
          </span>
        </div>
        <q-badge color="emerald-8" text-color="white" class="text-weight-bold">
          Fase 2: Visto Bueno del DT Destino
        </q-badge>
      </div>
      <div class="text-caption text-slate-700 q-mb-sm">
        El club de origen ya liberó la carta de salida. Como nuevo DT, tú tienes la última palabra para incorporarlo formalmente a tu plantel.
      </div>
      <div class="row q-col-gutter-sm">
        <div v-for="notif in solicitudesLlegadaPendientes" :key="notif._id" class="col-12 col-md-6">
          <div class="bg-white q-pa-sm rounded border border-emerald-4 row items-center justify-between">
            <div>
              <div class="text-weight-bold text-slate-900 font-12">{{ notif.datos?.jugadorNombre }}</div>
              <div class="text-caption text-grey-7 font-10">
                Procedencia: <strong class="text-slate-800">{{ notif.datos?.clubOrigenNombre }}</strong>
              </div>
            </div>
            <div class="row items-center q-gutter-xs">
              <q-btn
                dense
                unelevated
                no-caps
                size="sm"
                color="positive"
                label="✅ Aceptar en el Equipo"
                class="text-weight-bold q-px-xs"
                @click="confirmarLlegadaDesdeNotif(notif)"
              />
              <q-btn
                dense
                flat
                no-caps
                size="sm"
                color="negative"
                label="❌ Rechazar"
                class="text-weight-bold q-px-xs"
                @click="store.marcarNotificacionLeida(notif._id)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

<!-- Solicitudes de Jugadores Pendientes de Autorización por el DT -->
    <div v-if="jugadoresPendientesDeAprobacion.length" class="bg-amber-50 border-2 border-amber-4 rounded-borders q-pa-md q-mb-md shadow-2">
      <div class="row items-center justify-between q-mb-sm">
        <div class="row items-center q-gutter-xs">
          <q-icon :name="matPersonAdd" color="amber-10" size="24px" />
          <span class="text-subtitle1 text-weight-bolder text-amber-10">
            Solicitudes de Jugadores para Ingresar a tu Equipo ({{ jugadoresPendientesDeAprobacion.length }})
          </span>
        </div>
        <q-badge color="amber-9" text-color="white" class="text-weight-bold">
          Decisión exclusiva del Entrenador
        </q-badge>
      </div>
      <div class="text-caption text-slate-700 q-mb-sm">
        Como Director Técnico, tienes la potestad exclusiva de decidir qué futbolistas entran a tu plantel. El Organizador no interviene en estas solicitudes para garantizar imparcialidad deportiva.
      </div>
      <div class="row q-col-gutter-sm">
        <div
          v-for="j in jugadoresPendientesDeAprobacion"
          :key="j._id || j.id"
          class="col-12 col-md-6"
        >
          <div class="bg-white q-pa-sm rounded border border-amber-3 row items-center justify-between">
            <div class="row items-center q-gutter-xs">
              <q-avatar size="32px" color="emerald-1" text-color="positive" class="text-weight-bold font-mono">
                {{ (j.nombre ? j.nombre[0] : 'J').toUpperCase() }}
              </q-avatar>
              <div>
                <div class="text-weight-bold text-slate-900 font-12">{{ j.nombre }} {{ j.apellido && j.apellido !== '-' ? j.apellido : '' }}</div>
                <div class="text-caption text-grey-6 font-10">Posición solicitada: <strong class="text-emerald-8">{{ j.posicion || 'Delantero' }}</strong> · #{{ j.numero || j.dorsal || '-' }}</div>
              </div>
            </div>
            <div class="row items-center q-gutter-xs">
              <q-btn
                dense
                unelevated
                no-caps
                size="sm"
                color="positive"
                label="✅ Aceptar"
                class="text-weight-bold q-px-xs"
                :loading="procesandoJugadorId === (j._id || j.id)"
                @click="aceptarJugadorEnClub(j)"
              />
              <q-btn
                dense
                flat
                no-caps
                size="sm"
                color="negative"
                label="❌ Rechazar"
                class="text-weight-bold q-px-xs"
                :loading="procesandoJugadorId === (j._id || j.id)"
                @click="rechazarJugadorEnClub(j)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Barra Informativa de Pizarra Táctica Oficial -->
    <div class="row items-center justify-between bg-white q-pa-sm rounded-borders shadow-1 q-mb-md border">
      <div class="row items-center q-gutter-xs text-weight-bold text-slate-800">
        <q-icon :name="matStadium" size="20px" color="positive" />
        <span>Pizarra Táctica & Alineación Oficial (11 Titulares en Cancha)</span>
      </div>
      <div class="text-caption text-grey-7">
        ℹ️ Como Entrenador eres el encargado oficial de autorizar qué jugadores ingresan a tu equipo y armar tu formación.
      </div>
    </div>

    <!-- Si no hay equipos -->
    <q-card v-if="!store.equipos.length" flat bordered class="bg-white rounded-borders q-pa-xl text-center">
      <q-icon :name="matGroups" size="56px" color="grey-4" class="q-mb-md" />
      <div class="text-h6 text-weight-bold text-slate-800">No hay clubes registrados todavía</div>
      <div class="text-caption text-grey-6 q-mb-md">
        Cada entrenador funda su propio club al registrarse en la plataforma.
      </div>
      <q-btn
        color="primary"
        unelevated
        no-caps
        label="Ver Clubes del Torneo"
        :to="'/equipos'"
      />
    </q-card>

    <div v-else>
      <!-- ANUNCIO DE ADVERTENCIA REGLAMENTARIA: Falta designar Capitán -->
      <q-banner
        v-if="!tieneCapitanAsignado && jugadoresDelEquipo.length > 0"
        dense
        rounded
        class="bg-amber-1 text-amber-10 q-mb-md q-pa-md border border-amber-4 shadow-2 animate-pulse-gentle"
      >
        <template #avatar>
          <q-icon :name="matMilitaryTech" size="36px" color="amber-9" />
        </template>
        <div class="row items-center justify-between no-wrap q-gutter-md">
          <div>
            <div class="text-subtitle1 text-weight-bolder row items-center q-gutter-xs">
              <span>⚠️ REGLAMENTO OFICIAL: ¡FALTA ESCOGER AL CAPITÁN DEL EQUIPO!</span>
            </div>
            <div class="text-body2 text-slate-800 q-mt-xs">
              Por normativa oficial de la competición, <strong>solo se podrá jugar cuando el entrenador escoja al capitán del equipo (Ⓒ)</strong>.
              Tu club no podrá disputar partidos ni registrar marcadores hasta que nombres al Capitán oficial.
              Haz clic en el ícono de medalla 🎖️ o en <strong>"Nombrar Capitán (Ⓒ)"</strong> en cualquiera de tus futbolistas.
            </div>
          </div>
        </div>
      </q-banner>

      <!-- ADVERTENCIA REGLAMENTARIA: Falta el Arquero en Cancha -->
      <q-banner
        v-if="!arqueros.length && jugadoresDelEquipo.length"
        dense
        rounded
        class="bg-amber-1 text-amber-10 q-mb-md q-pa-md shadow-2 border border-amber-5 animate-pulse-gentle"
      >
        <template #avatar>
          <q-icon :name="matWarning" size="36px" color="amber-9" />
        </template>
        <div class="row items-center justify-between no-wrap q-gutter-md">
          <div>
            <div class="text-subtitle2 text-weight-bolder text-amber-10 row items-center q-gutter-xs">
              <span>🧤 ¡ATENCIÓN: FALTA UN ARQUERO EN CANCHA!</span>
              <q-badge color="negative" text-color="white" class="text-weight-bolder font-11">
                0 / 1 Arquero
              </q-badge>
            </div>
            <div class="text-caption text-slate-800 q-mt-xs">
              Por reglamento oficial del fútbol, todo club debe contar con <strong>1 arquero titular en el arco</strong> para disputar un partido.
              Actualmente no tienes ningún arquero designado en la cancha. Elige a uno de tus futbolistas en la lista y asígnale la posición <strong>"Arquero"</strong>.
            </div>
          </div>
        </div>
      </q-banner>

      <!-- ANUNCIO DE ADVERTENCIA REGLAMENTARIA: Más de 11 jugadores en cancha -->
      <q-banner
        v-if="hayExcesoEnCancha"
        dense
        rounded
        class="bg-negative text-white q-mb-md q-pa-md shadow-4 border-rose-8 animate-pulse-gentle"
      >
        <template #avatar>
          <q-icon :name="matWarning" size="40px" color="amber-3" />
        </template>
        <div class="row items-center justify-between no-wrap q-gutter-md">
          <div>
            <div class="text-subtitle1 text-weight-bolder row items-center q-gutter-xs">
              <span>🚨 ADVERTENCIA REGLAMENTARIA: ¡HAY MÁS DE 11 JUGADORES EN LA CANCHA!</span>
              <q-badge color="amber-3" text-color="dark" class="text-weight-bolder q-ml-sm font-12">
                {{ totalEnCancha }} en cancha (+{{ totalEnCancha - 11 }} de más)
              </q-badge>
            </div>
            <div class="text-body2 text-slate-100 q-mt-xs">
              Por reglamento oficial del torneo, <strong>solo se permite jugar con un máximo de 11 futbolistas en la cancha</strong>.
              Actualmente tienes <strong>{{ totalEnCancha }}</strong> jugadores en posición de juego.
              Debes asignar el rol <strong>"En Banca"</strong> a los <strong>{{ totalEnCancha - 11 }}</strong> suplentes para cumplir la regla.
            </div>
          </div>
          <q-btn
            unelevated
            no-caps
            color="amber-4"
            text-color="dark"
            :icon="matEventSeat"
            label="Enviar Excedentes a Banca"
            class="text-weight-bolder shadow-1 text-no-wrap"
            :loading="enviandoBanca"
            @click="autoAjustarBanca"
          />
        </div>
      </q-banner>

      <!-- BANNER DE CONFORMIDAD: Exactamente 11 jugadores en cancha -->
      <q-banner
        v-else-if="totalEnCancha === 11"
        dense
        rounded
        class="bg-emerald-1 text-emerald-10 q-mb-md q-py-sm q-px-md border-emerald-3"
      >
        <template #avatar>
          <q-icon :name="matCheckCircle" size="24px" color="positive" />
        </template>
        <div class="row items-center justify-between full-width">
          <div class="text-caption text-weight-bold">
            ✅ <strong>Alineación Oficial Reglamentaria:</strong> Tienes exactamente 11 jugadores en cancha.
            <span v-if="suplentesBanca.length" class="text-weight-normal text-grey-8 q-ml-xs">
              ({{ suplentesBanca.length }} suplentes en banca listos para ingresar).
            </span>
          </div>
          <q-badge color="positive" text-color="white" label="11 / 11 En Cancha" class="text-weight-bold font-12" />
        </div>
      </q-banner>

      <!-- BANNER INFORMATIVO: Menos de 11 jugadores en cancha -->
      <q-banner
        v-else-if="jugadoresDelEquipo.length >= 11 && totalEnCancha < 11"
        dense
        rounded
        class="bg-sky-1 text-sky-10 q-mb-md q-py-sm q-px-md border-sky-3"
      >
        <template #avatar>
          <q-icon :name="matInfo" size="24px" color="info" />
        </template>
        <div class="row items-center justify-between full-width">
          <div class="text-caption">
            ℹ️ <strong>Alineación en Cancha:</strong> Tienes <strong>{{ totalEnCancha }}/11</strong> titulares asignados.
            Faltan <strong>{{ 11 - totalEnCancha }}</strong> jugadores para completar los 11 reglamentarios en cancha (tienes {{ suplentesBanca.length }} en banca).
          </div>
          <q-badge color="info" text-color="white" :label="`${totalEnCancha}/11 en cancha`" class="text-weight-bold" />
        </div>
      </q-banner>

      <!-- Banner Informativo si no es el DT responsable -->
      <div v-if="!puedeEditarPizarra" class="q-mb-md">
        <q-banner dense rounded class="bg-indigo-1 text-indigo-10 q-pa-sm border border-indigo-2 shadow-1">
          <template #avatar>
            <q-icon :name="matInfo" size="24px" color="indigo-7" />
          </template>
          <div class="text-caption">
            <span v-if="store.esJugador">
              🔒 <strong>Modo Jugador (Solo Lectura):</strong> La Pizarra Táctica y la alineación son responsabilidad exclusiva del Director Técnico ({{ equipoActual?.nombre }}). Los futbolistas no pueden modificar la formación ni asignar roles.
            </span>
            <span v-else-if="store.esOrganizador">
              ℹ️ <strong>Modo Organizador (Supervisión):</strong> La alineación táctica, capitanía y roles son gestionados únicamente por el Director Técnico de cada club.
            </span>
            <span v-else>
              ℹ️ Solo el entrenador responsable del club puede modificar la alineación y posiciones.
            </span>
          </div>
        </q-banner>
      </div>

      <div v-if="tabVista === 'pizarra'" class="row q-col-gutter-lg">
        <!-- Columna Izquierda: Cancha Táctica Visual -->
        <div class="col-12 col-lg-7">
          <q-card flat bordered class="bg-white rounded-borders overflow-hidden">
            <q-card-section class="bg-slate-900 text-white row items-center justify-between q-py-sm">
              <div class="row items-center q-gutter-xs">
                <q-icon :name="matStadium" size="20px" color="positive" />
                <span class="text-subtitle2 text-weight-bold">Alineación Táctica en Cancha</span>
                <span v-if="equipoActual" class="text-caption text-grey-4">({{ equipoActual.nombre }})</span>
                <q-badge
                  :color="hayExcesoEnCancha ? 'negative' : (totalEnCancha === 11 ? 'positive' : 'amber-8')"
                  text-color="white"
                  :label="`${totalEnCancha}/11 en Cancha`"
                  class="q-ml-xs text-weight-bold"
                />
              </div>
              <div class="row items-center q-gutter-xs">
                <q-badge
                  :color="arqueros.length === 1 ? 'emerald-9' : 'amber-9'"
                  text-color="white"
                  class="text-weight-bold font-11 q-px-sm q-py-xs"
                >
                  {{ arqueros.length === 1 ? '🧤 1 Arquero Oficial en Cancha' : '⚠️ ¡FALTA UN ARQUERO EN CANCHA! (0/1)' }}
                </q-badge>
              </div>
            </q-card-section>

            <!-- Campo de Fútbol Virtual -->
            <div class="pitch-container q-pa-md">
              <div class="soccer-pitch">
                <!-- Líneas reglamentarias del campo -->
                <div class="pitch-line center-line"></div>
                <div class="pitch-circle center-circle"></div>
                <div class="pitch-circle center-dot"></div>
                <div class="pitch-area penalty-area-top"></div>
                <div class="pitch-area penalty-area-bottom"></div>
                <div class="pitch-area goal-area-bottom"></div>

                <!-- Zona Delanteros (Ataque) -->
                <div class="pitch-zone zone-attack">
                  <div class="zone-label text-caption text-weight-bolder">DELANTEROS ({{ delanteros.length }})</div>
                  <div class="players-row">
                    <div
                      v-for="j in delanteros"
                      :key="j.id"
                      class="pitch-player-card cursor-pointer"
                      @click="seleccionarParaEditar(j)"
                    >
                      <div class="player-number bg-amber-6 text-white" :class="{ 'ring-captain': esElCapitan(j) }">
                        {{ j.numero || j.dorsal || 9 }}
                      </div>
                      <div class="player-name ellipsis">
                        {{ j.nombre }} {{ j.apellido ? j.apellido[0] + '.' : '' }}
                        <span v-if="esElCapitan(j)" class="text-amber-4 text-weight-bolder"> Ⓒ</span>
                      </div>
                    </div>
                    <div v-if="!delanteros.length" class="empty-zone-hint">
                      Sin delanteros asignados
                    </div>
                  </div>
                </div>

                <!-- Zona Mediocampo -->
                <div class="pitch-zone zone-midfield">
                  <div class="zone-label text-caption text-weight-bolder">MEDIOCAMPISTAS ({{ mediocampistas.length }})</div>
                  <div class="players-row">
                    <div
                      v-for="j in mediocampistas"
                      :key="j.id"
                      class="pitch-player-card cursor-pointer"
                      @click="seleccionarParaEditar(j)"
                    >
                      <div class="player-number bg-sky-6 text-white" :class="{ 'ring-captain': esElCapitan(j) }">
                        {{ j.numero || j.dorsal || 8 }}
                      </div>
                      <div class="player-name ellipsis">
                        {{ j.nombre }} {{ j.apellido ? j.apellido[0] + '.' : '' }}
                        <span v-if="esElCapitan(j)" class="text-amber-4 text-weight-bolder"> Ⓒ</span>
                      </div>
                    </div>
                    <div v-if="!mediocampistas.length" class="empty-zone-hint">
                      Sin mediocampistas asignados
                    </div>
                  </div>
                </div>

                <!-- Zona Defensores -->
                <div class="pitch-zone zone-defense">
                  <div class="zone-label text-caption text-weight-bolder">DEFENSORES ({{ defensores.length }})</div>
                  <div class="players-row">
                    <div
                      v-for="j in defensores"
                      :key="j.id"
                      class="pitch-player-card cursor-pointer"
                      @click="seleccionarParaEditar(j)"
                    >
                      <div class="player-number bg-indigo-6 text-white" :class="{ 'ring-captain': esElCapitan(j) }">
                        {{ j.numero || j.dorsal || 4 }}
                      </div>
                      <div class="player-name ellipsis">
                        {{ j.nombre }} {{ j.apellido ? j.apellido[0] + '.' : '' }}
                        <span v-if="esElCapitan(j)" class="text-amber-4 text-weight-bolder"> Ⓒ</span>
                      </div>
                    </div>
                    <div v-if="!defensores.length" class="empty-zone-hint">
                      Sin defensores asignados
                    </div>
                  </div>
                </div>

                <!-- Zona Arquero (Bajo los 3 palos) -->
                <div class="pitch-zone zone-goalkeeper">
                  <div class="players-row justify-center">
                    <div
                      v-for="j in arqueros"
                      :key="j.id"
                      class="pitch-player-card cursor-pointer"
                      @click="seleccionarParaEditar(j)"
                    >
                      <div class="player-number bg-emerald-7 text-white" :class="esElCapitan(j) ? 'ring-captain' : 'ring-gold'">
                        {{ j.numero || j.dorsal || 1 }}
                      </div>
                      <div class="player-name ellipsis">
                        {{ j.nombre }} {{ j.apellido ? j.apellido[0] + '.' : '' }} (ARQ)
                        <span v-if="esElCapitan(j)" class="text-amber-4 text-weight-bolder"> Ⓒ</span>
                      </div>
                    </div>
                    <!-- Aviso visual destacado si falta arquero -->
                    <div v-if="!arqueros.length" class="empty-zone-hint bg-amber-9 text-white q-px-sm q-py-xs rounded-borders text-weight-bolder shadow-2 border border-white">
                      ⚠️ ¡Falta un arquero! (0/1)
                    </div>
                  </div>
                  <div class="zone-label text-caption text-weight-bolder text-center q-mt-xs" :class="!arqueros.length ? 'text-amber-3' : ''">
                    PORTERO ({{ arqueros.length }}/1) <span v-if="!arqueros.length" class="text-amber-3 text-weight-bolder">· ¡FALTA 1!</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Zona BANCA DE SUPLENTES (DUGOUT) -->
            <div class="dugout-section q-px-md q-py-sm bg-slate-900 border-top">
              <div class="row items-center justify-between q-mb-xs">
                <div class="row items-center q-gutter-xs">
                  <q-icon :name="matEventSeat" size="18px" color="amber-4" />
                  <span class="text-caption text-weight-bolder text-slate-200">BANCA DE SUPLENTES</span>
                  <q-badge color="blue-grey-7" text-color="white" :label="`${suplentesBanca.length} suplentes`" />
                </div>
                <div class="text-caption text-slate-400 font-11">
                  Rol: <strong>En Banca</strong> · Listos para sustitución
                </div>
              </div>

              <div class="row q-gutter-xs items-center q-py-xs">
                <div
                  v-for="j in suplentesBanca"
                  :key="j.id"
                  class="bench-chip row items-center q-px-sm q-py-xs rounded-borders cursor-pointer"
                  @click="seleccionarParaEditar(j)"
                >
                  <span class="bench-dorsal font-mono text-weight-bolder text-amber-4 q-mr-xs">#{{ j.numero || j.dorsal || '-' }}</span>
                  <span class="text-caption text-weight-bold text-white ellipsis" style="max-width: 90px">{{ j.nombre }}</span>
                  <q-btn
                    flat
                    round
                    dense
                    size="xs"
                    color="positive"
                    :icon="matArrowUpward"
                    title="Pasar a Titular en Cancha"
                    class="q-ml-xs"
                    @click.stop="cambiarPosicion(j, 'Delantero')"
                  />
                </div>
                <div v-if="!suplentesBanca.length" class="text-caption text-slate-400 italic q-pa-xs">
                  No hay suplentes en la banca. Puedes cambiar la posición de jugadores a "En Banca".
                </div>
              </div>
            </div>

            <!-- Resumen del Plantel Táctico -->
            <q-card-section class="bg-grey-1 row items-center justify-around q-py-sm border-top text-center">
              <div>
                <div class="text-caption text-grey-6">Arqueros</div>
                <div class="text-subtitle2 text-weight-bold" :class="arqueros.length === 1 ? 'text-emerald-8' : 'text-negative'">
                  {{ arqueros.length }} <span v-if="!arqueros.length" class="text-caption text-negative font-10 text-weight-bolder">(¡Falta 1!)</span>
                </div>
              </div>
              <div>
                <div class="text-caption text-grey-6">Defensores</div>
                <div class="text-subtitle2 text-weight-bold text-indigo-8">{{ defensores.length }}</div>
              </div>
              <div>
                <div class="text-caption text-grey-6">Mediocampo</div>
                <div class="text-subtitle2 text-weight-bold text-sky-8">{{ mediocampistas.length }}</div>
              </div>
              <div>
                <div class="text-caption text-grey-6">Delanteros</div>
                <div class="text-subtitle2 text-weight-bold text-amber-8">{{ delanteros.length }}</div>
              </div>
              <div class="q-px-sm q-py-xs rounded-borders" :class="hayExcesoEnCancha ? 'bg-red-1 border border-red-3' : (totalEnCancha === 11 ? 'bg-emerald-1 border border-emerald-3' : '')">
                <div class="text-caption text-weight-bold" :class="hayExcesoEnCancha ? 'text-negative' : 'text-grey-7'">En Cancha</div>
                <div
                  class="text-subtitle2 text-weight-bolder"
                  :class="hayExcesoEnCancha ? 'text-negative' : (totalEnCancha === 11 ? 'text-positive' : 'text-slate-900')"
                >
                  {{ totalEnCancha }}/11
                  <span v-if="hayExcesoEnCancha">⚠️</span>
                  <span v-else-if="totalEnCancha === 11">✅</span>
                </div>
              </div>
              <div>
                <div class="text-caption text-grey-6">En Banca</div>
                <div class="text-subtitle2 text-weight-bold text-blue-grey-8">{{ suplentesBanca.length }} 🪑</div>
              </div>
              <div>
                <div class="text-caption text-grey-6">Plantel Total</div>
                <div class="text-subtitle2 text-weight-bold text-slate-900">{{ jugadoresDelEquipo.length }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Columna Derecha: Asignación y Selección de Posición -->
        <div class="col-12 col-lg-5">
          <q-card flat bordered class="bg-white rounded-borders">
            <q-card-section class="bg-slate-900 text-white row items-center justify-between q-py-sm">
              <div class="row items-center q-gutter-xs">
                <q-icon :name="matSwapHoriz" size="20px" color="amber" />
                <span class="text-subtitle2 text-weight-bold">Asignar Posiciones de Jugadores</span>
              </div>
              <q-badge color="primary" text-color="white" :label="`${jugadoresDelEquipo.length} futbolistas`" />
            </q-card-section>

            <q-card-section class="q-pa-md">
              <div class="text-caption text-grey-7 q-mb-md">
                Como <strong>Entrenador</strong>, selecciona la posición táctica o asigna el rol <strong>"En Banca"</strong> a tus suplentes. Solo pueden jugar 11 en cancha.
              </div>

              <!-- Notificación de cambio reciente -->
              <q-banner v-if="mensajeExito" dense rounded class="bg-emerald-1 text-positive q-mb-md text-caption">
                <template #avatar>
                  <q-icon :name="matCheckCircle" color="positive" size="18px" />
                </template>
                {{ mensajeExito }}
              </q-banner>

              <!-- Lista de jugadores para asignación rápida -->
              <div v-if="!jugadoresDelEquipo.length" class="text-center q-py-lg text-grey-6">
                <q-icon :name="matGroups" size="36px" color="grey-4" class="q-mb-xs" />
                <div class="text-subtitle2 text-weight-medium text-slate-800">No hay futbolistas en {{ equipoActual?.nombre || 'este club' }} todavía.</div>
                <div class="text-caption text-grey-6 q-mt-xs">
                  Los jugadores se integran al iniciar sesión con su cuenta asignada (mediante su contraseña de cuenta) o mediante la nómina oficial completada por el organizador.
                </div>
              </div>

              <q-list v-else separator class="rounded-borders overflow-hidden border">
                <q-item
                  v-for="j in jugadoresDelEquipo"
                  :key="j.id"
                  class="q-py-sm items-center"
                  :class="{ 'bg-emerald-50': jugadorEditandoId === j.id, 'bg-slate-50 opacity-90': normalizarPos(j.posicion) === 'banca' }"
                >
                  <!-- Dorsal -->
                  <q-item-section avatar style="min-width: 44px">
                    <div
                      class="dorsal-badge text-weight-bold text-center"
                      :style="{ backgroundColor: colorPorPosicion(j.posicion) }"
                    >
                      {{ j.numero || j.dorsal || '—' }}
                    </div>
                  </q-item-section>

                  <!-- Nombre y Datos -->
                  <q-item-section>
                    <div class="row items-center q-gutter-xs">
                      <span class="text-weight-bold text-slate-800">{{ j.nombre }} {{ j.apellido || '' }}</span>
                      <q-badge v-if="esElCapitan(j)" color="amber-9" text-color="white" class="text-weight-bolder font-10 q-px-xs">
                        Ⓒ CAPITÁN OFICIAL
                      </q-badge>
                    </div>
                    <q-item-label caption class="text-grey-6 row items-center q-gutter-xs">
                      <span>Estado:</span>
                      <q-badge
                        :color="badgeColorPorPosicion(j.posicion)"
                        :label="normalizarPos(j.posicion) === 'banca' ? '🪑 En Banca' : j.posicion || 'Delantero'"
                        class="text-weight-medium"
                      />
                    </q-item-label>
                  </q-item-section>

                  <!-- Botón rápido Toggle Banca / Cancha y Capitán -->
                  <q-item-section side class="row items-center no-wrap q-gutter-xs">
                    <template v-if="puedeEditarPizarra">
                      <!-- Botón para Nombrar Capitán -->
                      <q-btn
                        v-if="!esElCapitan(j)"
                        dense
                        flat
                        round
                        size="sm"
                        color="amber-8"
                        :icon="matMilitaryTech"
                        title="Nombrar Capitán del Equipo (Ⓒ)"
                        @click="nombrarCapitan(j)"
                      />

                      <q-btn
                        v-if="normalizarPos(j.posicion) === 'banca'"
                        dense
                        flat
                        round
                        size="sm"
                        color="positive"
                        :icon="matArrowUpward"
                        title="Mover a Titular en Cancha"
                        @click="cambiarPosicion(j, 'Delantero')"
                      />
                      <q-btn
                        v-else
                        dense
                        flat
                        round
                        size="sm"
                        color="blue-grey-6"
                        :icon="matEventSeat"
                        title="Enviar a la Banca"
                        @click="cambiarPosicion(j, 'En Banca')"
                      />

                      <!-- Selector de Posición en Vivo -->
                      <q-select
                        :model-value="normalizarPos(j.posicion) === 'banca' ? 'En Banca' : (j.posicion || 'Delantero')"
                        :options="posicionesDisponibles"
                        outlined
                        dense
                        options-dense
                        :loading="actualizandoId === j.id"
                        :disable="actualizandoId === j.id"
                        @update:model-value="cambiarPosicion(j, $event)"
                        style="font-size: 11px; width: 130px;"
                        bg-color="white"
                      >
                        <template #selected-item="scope">
                          <span class="text-weight-bold text-caption ellipsis">
                            {{ scope.opt === 'En Banca' ? '🪑 En Banca' : scope.opt }}
                          </span>
                        </template>
                        <template #option="scope">
                          <q-item v-bind="scope.itemProps" dense>
                            <q-item-section>
                              <q-item-label :class="scope.opt === 'En Banca' ? 'text-blue-grey-8 text-weight-bold' : ''">
                                {{ scope.opt === 'En Banca' ? '🪑 En Banca' : scope.opt }}
                              </q-item-label>
                            </q-item-section>
                          </q-item>
                        </template>
                      </q-select>
                    </template>
                    <template v-else>
                      <q-badge
                        :color="badgeColorPorPosicion(j.posicion)"
                        :label="normalizarPos(j.posicion) === 'banca' ? '🪑 En Banca' : j.posicion || 'Delantero'"
                        class="text-weight-bold q-px-sm"
                      />
                    </template>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Modal para Personalizar Escudo Oficial del Club -->
    <q-dialog v-model="modalEscudo">
      <q-card style="width: 500px; max-width: 95vw;" class="rounded-borders bg-white">
        <q-card-section class="bg-slate-900 text-white row items-center justify-between q-py-sm">
          <div class="row items-center q-gutter-xs">
            <q-icon :name="matShield" color="positive" size="20px" />
            <span class="text-subtitle2 text-weight-bold">Escudo Oficial de {{ equipoActual?.nombre }}</span>
          </div>
          <q-btn flat round dense :icon="matClose" v-close-popup text-color="grey-4" />
        </q-card-section>

        <q-card-section class="q-pa-md q-gutter-y-sm">
          <!-- Vista Previa -->
          <div class="row items-center q-gutter-md bg-slate-50 q-pa-md rounded-borders border">
            <div
              class="escudo-preview-box flex flex-center rounded-borders shadow-1"
              :style="{ backgroundColor: formEscudo.color || '#059669' }"
            >
              <img
                v-if="formEscudo.url"
                :src="formEscudo.url"
                alt="Escudo"
                class="escudo-preview-img"
              />
              <span v-else class="text-h5">{{ formEscudo.figura || '🛡️' }}</span>
            </div>
            <div class="col">
              <div class="text-subtitle2 text-weight-bolder text-slate-900">{{ equipoActual?.nombre }}</div>
              <div class="text-caption text-grey-6 font-11">
                {{ formEscudo.url ? 'Imagen personalizada activa' : `Figura emblema: ${formEscudo.figura}` }}
              </div>
            </div>
          </div>

          <!-- Selector con pestañas: Figuras, Subir Archivo, Pegar URL -->
          <q-tabs
            v-model="tabModalEscudo"
            dense
            no-caps
            active-color="positive"
            indicator-color="positive"
            class="text-grey-7 border-b font-11"
            align="justify"
          >
            <q-tab name="figuras" label="Figuras Prediseñadas" />
            <q-tab name="subir" label="Subir desde Computadora" />
            <q-tab name="url" label="Pegar Enlace Web" />
          </q-tabs>

          <q-tab-panels v-model="tabModalEscudo" animated class="q-pa-none bg-transparent">
            <!-- Pestaña 1: Figuras -->
            <q-tab-panel name="figuras" class="q-pa-none">
              <div class="text-caption text-weight-medium text-grey-7 q-mb-xs font-11">Elige un emblema:</div>
              <div class="row q-col-gutter-xs q-mb-sm">
                <div
                  v-for="fig in figurasEscudoDisponibles"
                  :key="fig.emoji"
                  class="col-2 text-center"
                >
                  <div
                    class="cursor-pointer q-pa-xs rounded-borders text-center border transition-all"
                    :class="formEscudo.figura === fig.emoji && !formEscudo.url ? 'bg-emerald-1 border-emerald-6 shadow-1' : 'bg-white border-grey-3'"
                    @click="formEscudo.figura = fig.emoji; formEscudo.url = ''"
                  >
                    <span class="text-subtitle1">{{ fig.emoji }}</span>
                  </div>
                </div>
              </div>

              <div class="text-caption text-weight-medium text-grey-7 q-mb-xs font-11">Color de fondo:</div>
              <div class="row q-gutter-xs items-center">
                <div
                  v-for="c in coloresEscudoDisponibles"
                  :key="c"
                  class="color-dot cursor-pointer shadow-1"
                  :style="{ backgroundColor: c }"
                  :class="{ 'ring-active': formEscudo.color === c }"
                  @click="formEscudo.color = c"
                />
              </div>
            </q-tab-panel>

            <!-- Pestaña 2: Subir Archivo -->
            <q-tab-panel name="subir" class="q-pa-xs text-center">
              <div class="text-caption text-grey-7 q-mb-sm font-11">
                Selecciona una foto o imagen de escudo guardada en tu computadora:
              </div>
              <input
                type="file"
                id="modalArchivoEscudoInput"
                accept="image/*"
                style="display: none;"
                @change="cargarArchivoEscudoModal"
              />
              <q-btn
                unelevated
                dense
                no-caps
                color="positive"
                :icon="matCloudUpload"
                label="Elegir Archivo de Imagen"
                class="q-px-md text-weight-bold font-12"
                onclick="document.getElementById('modalArchivoEscudoInput').click()"
              />
              <div v-if="formEscudo.url" class="q-mt-xs">
                <q-btn
                  flat
                  dense
                  no-caps
                  size="xs"
                  color="negative"
                  label="Quitar imagen cargada"
                  @click="formEscudo.url = ''"
                />
              </div>
            </q-tab-panel>

            <!-- Pestaña 3: Pegar URL -->
            <q-tab-panel name="url" class="q-pa-none">
              <div class="text-caption text-grey-7 q-mb-xs font-11">
                Pega la dirección de internet (URL) de la imagen de tu escudo:
              </div>
              <q-input
                v-model="formEscudo.url"
                outlined
                dense
                bg-color="white"
                placeholder="https://ejemplo.com/escudo.png"
              >
                <template #append v-if="formEscudo.url">
                  <q-btn flat round dense size="xs" :icon="matClose" @click="formEscudo.url = ''" />
                </template>
              </q-input>
            </q-tab-panel>
          </q-tab-panels>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md bg-grey-1">
          <q-btn flat no-caps label="Cancelar" v-close-popup color="grey-7" />
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Guardar Escudo Oficial"
            :icon="matCheck"
            class="text-weight-bold"
            @click="guardarEscudo"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useTorneo } from '../store/torneo.js'
import {
  matSports,
  matStadium,
  matSwapHoriz,
  matPersonAdd,
  matCheckCircle,
  matGroups,
  matWarning,
  matEventSeat,
  matArrowUpward,
  matInfo,
  matMilitaryTech,
  matShield,
  matSportsSoccer,
  matCalendarMonth,
  matAdd,
  matDelete,
  matSend,
  matCloudUpload,
  matClose,
  matCheck,
  matBolt,
  matLock
} from '@quasar/extras/material-icons'

const router = useRouter()
const $q = useQuasar()
const store = useTorneo()
const roleStore = store

// El organizador no puede ver la Pizarra DT de ningún equipo
watch(() => store.esOrganizador, (esOrg) => {
  if (esOrg) {
    router.replace('/fixture')
  }
}, { immediate: true })

const tabVista = ref('pizarra')
const esquemaTactico = ref('4-3-3')
const mostrarDialogoJugador = ref(false)
const actualizandoId = ref(null)
const jugadorEditandoId = ref(null)
const mensajeExito = ref('')
const procesandoJugadorId = ref(null)

const solicitudesSalidaPendientes = computed(() => {
  if (!equipoActual.value) return []
  const eqId = String(equipoActual.value.id || equipoActual.value._id || '').trim()
  return (store.notificaciones || []).filter(n => {
    const nEqId = String(n.equipo?._id || n.equipo || '').trim()
    return n.tipo === 'traspaso_salida' && !n.leida && nEqId === eqId
  })
})

const solicitudesLlegadaPendientes = computed(() => {
  if (!equipoActual.value) return []
  const eqId = String(equipoActual.value.id || equipoActual.value._id || '').trim()
  return (store.notificaciones || []).filter(n => {
    const nEqId = String(n.equipo?._id || n.equipo || '').trim()
    return n.tipo === 'traspaso_llegada' && !n.leida && nEqId === eqId
  })
})

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
    await store.cargarTodo()
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.message || 'Error al autorizar salida'
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
      message: res.msg || '¡Futbolista transferido e incorporado exitosamente!',
      position: 'top',
      timeout: 5000
    })
    await store.cargarTodo()
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.message || 'Error al confirmar llegada del fichaje'
    })
  }
}


const jugadoresPendientesDeAprobacion = computed(() => {
  if (!equipoActual.value) return []
  const eqId = String(equipoActual.value.id || equipoActual.value._id || '').trim()
  return (store.jugadores || []).filter(j => {
    const jEqId = String(j.equipoId || (j.equipo && typeof j.equipo === 'object' ? (j.equipo._id || j.equipo.id) : j.equipo) || '').trim()
    return jEqId === eqId && j.estadoAprobacion === 'Pendiente'
  })
})

async function aceptarJugadorEnClub(j) {
  const jId = String(j._id || j.id).trim()
  procesandoJugadorId.value = jId
  try {
    await store.autorizarJugador(jId)
    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: `¡${j.nombre} ha sido aceptado oficialmente en el plantel de ${equipoActual.value?.nombre}!`,
      position: 'top',
      timeout: 3500
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      icon: 'error',
      message: err.message || 'Error al aceptar al jugador',
      position: 'top'
    })
  } finally {
    procesandoJugadorId.value = null
  }
}

async function rechazarJugadorEnClub(j) {
  const jId = String(j._id || j.id).trim()
  procesandoJugadorId.value = jId
  try {
    await store.rechazarJugador(jId)
    $q.notify({
      type: 'info',
      icon: 'cancel',
      message: `Solicitud de fichaje de ${j.nombre} rechazada por el cuerpo técnico.`,
      position: 'top',
      timeout: 3500
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      icon: 'error',
      message: err.message || 'Error al rechazar al jugador',
      position: 'top'
    })
  } finally {
    procesandoJugadorId.value = null
  }
}
const enviandoBanca = ref(false)

const posicionesDisponibles = ['Arquero', 'Defensor', 'Mediocampista', 'Delantero', 'En Banca']

const opcionesEquipos = computed(() =>
  store.equipos.map(e => ({
    label: e.nombre,
    value: e.id || e._id,
    color: e.escudocolor || '#059669'
  }))
)

const selectorOrganizadorId = ref('')

// Para el entrenador y el jugador, el club está estrictamente fijado a su equipo responsable
const equipoSeleccionadoId = computed({
  get: () => {
    if (store.esEntrenador || store.esJugador) {
      return String(store.miEquipoId || '').trim()
    }
    return String(selectorOrganizadorId.value || store.miEquipoId || store.equipos[0]?.id || '').trim()
  },
  set: (val) => {
    if (store.esOrganizador) {
      selectorOrganizadorId.value = val
    }
  }
})

// Solo el Director Técnico del club responsable puede modificar la pizarra táctica
const puedeEditarPizarra = computed(() => {
  return store.esEntrenador && Boolean(store.miEquipoId && String(store.miEquipoId).trim() === String(equipoSeleccionadoId.value).trim())
})

const golesMiEquipoOficial = computed(() => {
  if (!partidoSeleccionado.value) return 0
  return esLocal.value ? Number(marcadorLocal.value || 0) : Number(marcadorVisitante.value || 0)
})

const equipoActual = computed(() =>
  store.equipos.find(e => String(e.id || e._id || '').trim() === String(equipoSeleccionadoId.value).trim())
)

const jugadoresDelEquipo = computed(() => {
  const targetId = String(equipoSeleccionadoId.value || '').trim()
  if (!targetId) return []
  return store.jugadores.filter(j => {
    const eqId = j.equipoId || (j.equipo && typeof j.equipo === 'object' ? (j.equipo._id || j.equipo.id) : j.equipo)
    return String(eqId || '').trim() === targetId && j.estadoAprobacion !== 'Rechazado'
  })
})

const arqueros = computed(() =>
  jugadoresDelEquipo.value.filter(j => normalizarPos(j.posicion) === 'arquero')
)
const defensores = computed(() =>
  jugadoresDelEquipo.value.filter(j => normalizarPos(j.posicion) === 'defensor')
)
const mediocampistas = computed(() =>
  jugadoresDelEquipo.value.filter(j => normalizarPos(j.posicion) === 'mediocampista')
)
const delanteros = computed(() =>
  jugadoresDelEquipo.value.filter(j => normalizarPos(j.posicion) === 'delantero')
)
const suplentesBanca = computed(() =>
  jugadoresDelEquipo.value.filter(j => normalizarPos(j.posicion) === 'banca')
)
const jugadoresEnCancha = computed(() =>
  jugadoresDelEquipo.value.filter(j => normalizarPos(j.posicion) !== 'banca')
)

const totalEnCancha = computed(() => jugadoresEnCancha.value.length)
const hayExcesoEnCancha = computed(() => totalEnCancha.value > 11)

// CAPITÁN DE EQUIPO (Regla Oficial)
const capitanActual = computed(() => {
  return store.capitanDelEquipo(equipoSeleccionadoId.value)
})

const tieneCapitanAsignado = computed(() => {
  return store.tieneCapitan(equipoSeleccionadoId.value)
})

function esElCapitan(j) {
  if (j.esCapitan) return true
  if (equipoActual.value?.capitan && (equipoActual.value.capitan === j.nombre || equipoActual.value.capitanId === (j.id || j._id))) return true
  return false
}

async function nombrarCapitan(j) {
  if (!puedeEditarPizarra.value) return
  try {
    await store.designarCapitan(j.id || j._id, equipoSeleccionadoId.value)
    mensajeExito.value = `¡${j.nombre} ha sido nombrado Capitán oficial (Ⓒ)! Equipo reglamentariamente habilitado para jugar.`
    setTimeout(() => {
      mensajeExito.value = ''
    }, 4500)
  } catch (err) {
    console.error('Error al designar capitán:', err)
  }
}

// PERSONALIZAR ESCUDO DEL CLUB
const modalEscudo = ref(false)
const tabModalEscudo = ref('figuras')
const formEscudo = ref({
  figura: '🛡️',
  url: '',
  color: '#059669'
})

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
  { emoji: '🥊', label: 'Guerreros' },
  { emoji: '🦈', label: 'Tiburones' },
  { emoji: '🐆', label: 'Panteras' },
  { emoji: '🎯', label: 'Diana' },
  { emoji: '🔥', label: 'Fuego' },
  { emoji: '🏟️', label: 'Estadio' },
  { emoji: '🥇', label: 'Campeón' }
]

const coloresEscudoDisponibles = [
  '#059669', '#dc2626', '#2563eb', '#d97706', '#7c3aed',
  '#0f172a', '#e11d48', '#0891b2', '#16a34a', '#475569'
]

function abrirEditorEscudo() {
  if (!equipoActual.value) return
  formEscudo.value = {
    figura: equipoActual.value.escudoFigura || '🛡️',
    url: equipoActual.value.escudoUrl || '',
    color: equipoActual.value.escudocolor || '#059669'
  }
  modalEscudo.value = true
}

function cargarArchivoEscudoModal(e) {
  const file = e.target?.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    formEscudo.value.url = ev.target.result
  }
  reader.readAsDataURL(file)
}

async function guardarEscudo() {
  if (!equipoSeleccionadoId.value) return
  try {
    await store.actualizarEscudoEquipo(equipoSeleccionadoId.value, {
      escudoFigura: formEscudo.value.figura,
      escudoUrl: formEscudo.value.url,
      escudocolor: formEscudo.value.color
    })
    modalEscudo.value = false
    mensajeExito.value = '¡Escudo del club actualizado exitosamente!'
    setTimeout(() => { mensajeExito.value = '' }, 3500)
  } catch (err) {
    console.error('Error al actualizar escudo:', err)
  }
}

// REPORTAR GOLEADORES DEL PARTIDO
const partidoReporteId = ref('')
const marcadorLocal = ref(0)
const marcadorVisitante = ref(0)
const filasGoleadores = ref([])
const enviandoPlanilla = ref(false)

const partidosDelClub = computed(() => {
  const targetId = String(equipoSeleccionadoId.value || '').trim()
  if (!targetId) return []
  return store.partidos.filter(p => {
    const loc = String(p.localId || (p.local && typeof p.local === 'object' ? (p.local._id || p.local.id) : p.local) || '').trim()
    const vis = String(p.visitanteId || (p.visitante && typeof p.visitante === 'object' ? (p.visitante._id || p.visitante.id) : p.visitante) || '').trim()
    return loc === targetId || vis === targetId
  })
})

const esPartidoFinalizadoCerrado = computed(() => {
  if (!partidoSeleccionado.value) return false
  const est = String(partidoSeleccionado.value.estado || '').toLowerCase()
  return (est === 'finalizado' || est === 'jugado') && Array.isArray(partidoSeleccionado.value.goleadores) && partidoSeleccionado.value.goleadores.length > 0
})

const opcionesPartidosReporte = computed(() =>
  partidosDelClub.value.map(p => {
    const locNom = store.equipoPorId(p.localId)?.nombre || 'Local'
    const visNom = store.equipoPorId(p.visitanteId)?.nombre || 'Visitante'
    return {
      label: `${locNom} vs ${visNom} (Jornada ${p.fecha})`,
      value: p.id || p._id,
      jornada: p.fecha,
      estado: p.estado || 'Programado'
    }
  })
)

watch(partidosDelClub, (partidos) => {
  if (partidos.length && !partidoReporteId.value) {
    partidoReporteId.value = partidos[0].id || partidos[0]._id
  }
}, { immediate: true })

watch(() => store.miEquipoId, () => {
  partidoReporteId.value = ''
  filasGoleadores.value = []
})

const partidoSeleccionado = computed(() =>
  partidosDelClub.value.find(p => (p.id || p._id) === partidoReporteId.value)
)

const esLocal = computed(() => {
  const targetId = String(equipoSeleccionadoId.value || '').trim()
  if (!partidoSeleccionado.value || !targetId) return true
  const loc = String(partidoSeleccionado.value.localId || (partidoSeleccionado.value.local?._id || partidoSeleccionado.value.local) || '').trim()
  return loc === targetId
})

const rivalDelPartido = computed(() => {
  if (!partidoSeleccionado.value) return null
  const rivalId = esLocal.value ? partidoSeleccionado.value.visitanteId : partidoSeleccionado.value.localId
  return store.equipoPorId(rivalId)
})

const generandoAmbosEquipos = ref(false)

function autoAsignarGoleadores() {
  const golesTotal = Number(golesMiEquipoOficial.value) || 0
  if (golesTotal <= 0) {
    filasGoleadores.value = []
    return
  }
  const jugadores = jugadoresDelEquipo.value
  if (!jugadores || !jugadores.length) return

  // Priorizar jugadores de campo
  const deCampo = jugadores.filter(j => {
    const p = String(j.posicion || '').toLowerCase()
    return !p.includes('porter') && !p.includes('arqu') && !p.includes('banc')
  })
  const pool = deCampo.length >= 2 ? deCampo : jugadores

  let golesRestantes = golesTotal
  const minutosPosibles = [14, 28, 37, 49, 58, 67, 76, 84, 89]
  const asignaciones = []
  const shuffled = [...pool].sort(() => 0.5 - Math.random())
  let idx = 0

  while (golesRestantes > 0) {
    const jug = shuffled[idx % shuffled.length]
    const jId = jug.id || jug._id
    golesRestantes -= 1

    const asistentes = jugadores.filter(j => String(j.id || j._id) !== String(jId))
    const asistente = (asistentes.length > 0 && Math.random() > 0.35)
      ? asistentes[Math.floor(Math.random() * asistentes.length)]
      : null

    const baseMin = minutosPosibles[idx % minutosPosibles.length] || 15
    const minNum = Math.min(90, Math.max(1, baseMin + (idx * 7) % 15))

    asignaciones.push({
      jugadorId: jId,
      asistenteId: asistente ? (asistente.id || asistente._id) : '',
      goles: 1,
      minuto: `${minNum}'`
    })
    idx++
  }

  filasGoleadores.value = asignaciones
}

async function autogenerarAmbosEquipos() {
  if (!partidoSeleccionado.value) return
  generandoAmbosEquipos.value = true
  try {
    const pId = partidoSeleccionado.value.id || partidoSeleccionado.value._id
    await store.autogenerarGoleadoresPartido(pId)
    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: '⚽ Goleadores y número de goles de ambos equipos seleccionados automáticamente.',
      position: 'top',
      timeout: 3500
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      icon: 'error',
      message: err.message || 'Error al autogenerar goleadores',
      position: 'top',
      timeout: 3500
    })
  } finally {
    generandoAmbosEquipos.value = false
  }
}

watch(partidoSeleccionado, (nuevo) => {
  if (nuevo) {
    marcadorLocal.value = Number(nuevo.golesLocal ?? nuevo.goles_local ?? 0)
    marcadorVisitante.value = Number(nuevo.golesVisitante ?? nuevo.goles_visitante ?? 0)
    if (Array.isArray(nuevo.goleadores) && nuevo.goleadores.length) {
      const clubNom = equipoActual.value?.nombre ? equipoActual.value.nombre.toLowerCase().trim() : ''
      const delClub = nuevo.goleadores.filter(g => {
        if (!g.equipoNombre || !clubNom) return true
        return g.equipoNombre.toLowerCase().trim() === clubNom
      })
      if (delClub.length) {
        filasGoleadores.value = delClub.map(g => {
          let jId = g.jugadorId || g.jugador?._id || g.jugador || ''
          if (!jId && g.nombre) {
            const matchJ = jugadoresDelEquipo.value.find(j =>
              `${j.nombre} ${j.apellido || ''}`.trim().toLowerCase() === g.nombre.trim().toLowerCase() ||
              j.nombre.toLowerCase().includes(g.nombre.toLowerCase().split(' ')[0]) ||
              (g.dorsal && Number(j.numero || j.dorsal) === Number(g.dorsal))
            )
            if (matchJ) jId = matchJ.id || matchJ._id
          }
          let aId = g.asistenteId || g.asistente?._id || g.asistente || ''
          if (!aId && g.asistenteNombre) {
            const matchA = jugadoresDelEquipo.value.find(j =>
              `${j.nombre} ${j.apellido || ''}`.trim().toLowerCase() === g.asistenteNombre.trim().toLowerCase() ||
              j.nombre.toLowerCase().includes(g.asistenteNombre.toLowerCase().split(' ')[0])
            )
            if (matchA) aId = matchA.id || matchA._id
          }
          return {
            jugadorId: jId,
            asistenteId: aId,
            goles: Number(g.goles || 1),
            minuto: g.minuto || ''
          }
        })
      } else if (golesMiEquipoOficial.value > 0) {
        autoAsignarGoleadores()
      } else {
        filasGoleadores.value = []
      }
    } else if (golesMiEquipoOficial.value > 0) {
      autoAsignarGoleadores()
    } else {
      filasGoleadores.value = []
    }
  }
}, { immediate: true })

const opcionesJugadoresClub = computed(() =>
  jugadoresDelEquipo.value.map(j => ({
    label: `#${j.numero || j.dorsal || '-'} ${j.nombre} ${j.apellido || ''} (${j.posicion || 'Delantero'})`,
    value: j.id || j._id
  }))
)

function agregarFilaGoleador() {
  const primerJugador = jugadoresDelEquipo.value[0]?.id || ''
  filasGoleadores.value.push({
    jugadorId: primerJugador,
    asistenteId: '',
    goles: 1,
    minuto: ''
  })
}

function quitarFilaGoleador(idx) {
  filasGoleadores.value.splice(idx, 1)
}

async function enviarPlanillaGoleadores() {
  if (!partidoSeleccionado.value) return
  if (esPartidoFinalizadoCerrado.value) {
    $q.notify({
      type: 'warning',
      icon: 'lock',
      message: 'Este partido ya está Finalizado oficialmente. No se pueden modificar sus registros.',
      position: 'top',
      timeout: 4000
    })
    return
  }
  if (!tieneCapitanAsignado.value) {
    mensajeExito.value = '⚠️ No se puede enviar la planilla: El club debe tener un Capitán oficial designado.'
    return
  }

  enviandoPlanilla.value = true
  try {
    const listaReporte = filasGoleadores.value.filter(f => f.jugadorId).map(f => {
      const jug = jugadoresDelEquipo.value.find(j => (j.id || j._id) === f.jugadorId)
      const asis = f.asistenteId ? jugadoresDelEquipo.value.find(j => (j.id || j._id) === f.asistenteId) : null
      return {
        jugadorId: f.jugadorId,
        nombre: jug ? `${jug.nombre} ${jug.apellido || ''}`.trim() : 'Jugador',
        dorsal: jug?.numero || jug?.dorsal || '-',
        goles: Number(f.goles) || 1,
        minuto: f.minuto || '',
        asistenteId: f.asistenteId || '',
        asistenteNombre: asis ? `${asis.nombre} ${asis.apellido || ''}`.trim() : ''
      }
    })

    const golesClub = esLocal.value ? marcadorLocal.value : marcadorVisitante.value
    const golesRival = esLocal.value ? marcadorVisitante.value : marcadorLocal.value
    const rivalId = esLocal.value ? partidoSeleccionado.value.visitanteId : partidoSeleccionado.value.localId

    await store.registrarGoleadoresDT({
      partidoId: partidoSeleccionado.value.id || partidoSeleccionado.value._id,
      equipoId: equipoSeleccionadoId.value,
      equipoNombre: equipoActual.value?.nombre || 'Club',
      dtNombre: store.user?.usuario || 'Director Técnico',
      goleadores: listaReporte,
      golesClub,
      golesRival,
      rivalId,
      rivalNombre: rivalDelPartido.value?.nombre || 'Rival',
      jornada: partidoSeleccionado.value.fecha || 1
    })

    mensajeExito.value = '⚽ ¡Planilla de goleadores registrada y notificación oficial enviada al Administrador!'
    setTimeout(() => {
      mensajeExito.value = ''
    }, 5000)
  } catch (err) {
    console.error('Error al registrar goleadores:', err)
  } finally {
    enviandoPlanilla.value = false
  }
}

function normalizarPos(pos) {
  if (!pos) return 'delantero'
  const p = pos.toLowerCase()
  if (p.includes('banc') || p.includes('supl')) return 'banca'
  if (p.includes('arq') || p.includes('por') || p.includes('goalk')) return 'arquero'
  if (p.includes('def') || p.includes('cen') || p.includes('lat')) return 'defensor'
  if (p.includes('med') || p.includes('vol') || p.includes('mid')) return 'mediocampista'
  return 'delantero'
}

function colorPorPosicion(pos) {
  const p = normalizarPos(pos)
  if (p === 'banca') return '#64748b'
  if (p === 'arquero') return '#059669'
  if (p === 'defensor') return '#4f46e5'
  if (p === 'mediocampista') return '#0284c7'
  return '#d97706'
}

function badgeColorPorPosicion(pos) {
  const p = normalizarPos(pos)
  if (p === 'banca') return 'blue-grey-6'
  if (p === 'arquero') return 'positive'
  if (p === 'defensor') return 'indigo-7'
  if (p === 'mediocampista') return 'info'
  return 'warning'
}

async function autoAjustarBanca() {
  if (!equipoSeleccionadoId.value || !puedeEditarPizarra.value) return
  enviandoBanca.value = true
  try {
    const movidos = await store.enviarExcedentesABanca(equipoSeleccionadoId.value)
    mensajeExito.value = `¡Se enviaron ${movidos} futbolistas a la banca! La alineación en cancha ahora es reglamentaria (11 titulares).`
    setTimeout(() => {
      mensajeExito.value = ''
    }, 4500)
  } catch (err) {
    console.error('Error al auto-ajustar banca:', err)
  } finally {
    enviandoBanca.value = false
  }
}

async function cambiarPosicion(jugador, nuevaPosicion) {
  if (!puedeEditarPizarra.value) return

  // Regla Oficial: En el fútbol solo se puede 1 arquero titular en cancha por equipo
  const posNormalizada = String(nuevaPosicion || '').toLowerCase()
  if (posNormalizada.includes('arquero') || posNormalizada.includes('portero')) {
    const arqueroActual = arqueros.value.find(j => (j.id || j._id) !== (jugador.id || jugador._id))
    if (arqueroActual) {
      $q.notify({
        type: 'warning',
        icon: 'sports_soccer',
        message: `En el fútbol solo se puede 1 arquero en cancha. ${arqueroActual.nombre} ya es el arquero titular. Pasa a ${arqueroActual.nombre} a la banca o cámbialo de puesto antes de colocar a ${jugador.nombre} en el arco.`,
        position: 'top',
        timeout: 4500
      })
      return
    }
  }

  actualizandoId.value = jugador.id
  jugadorEditandoId.value = jugador.id
  mensajeExito.value = ''
  try {
    await store.actualizarPosicionJugador(jugador.id, nuevaPosicion)
    mensajeExito.value = `¡Posición de ${jugador.nombre} actualizada a ${nuevaPosicion}!`
    setTimeout(() => {
      mensajeExito.value = ''
      jugadorEditandoId.value = null
    }, 3000)
  } catch (err) {
    console.error('Error al actualizar posición:', err)
    $q.notify({
      type: 'negative',
      icon: 'error',
      message: err.message || 'Error al actualizar posición',
      position: 'top',
      timeout: 4000
    })
  } finally {
    actualizandoId.value = null
  }
}

function seleccionarParaEditar(jugador) {
  jugadorEditandoId.value = jugador.id
}

function alCerrarDialogo() {
  store.cargarTodo()
}

onMounted(() => {
  if (!store.equipos.length) {
    store.cargarTodo()
  }
})
</script>

<style scoped>
.club-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

/* Dugout / Banca de suplentes */
.dugout-section {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.bench-chip {
  background: rgba(30, 41, 59, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  transition: all 0.2s ease;
}

.bench-chip:hover {
  background: rgba(51, 65, 85, 1);
  transform: translateY(-1px);
}

.bench-dorsal {
  font-size: 11px;
}

.animate-pulse-gentle {
  animation: pulseGentle 2.5s infinite;
}

@keyframes pulseGentle {
  0%, 100% {
    box-shadow: 0 4px 6px -1px rgba(225, 29, 72, 0.3), 0 2px 4px -2px rgba(225, 29, 72, 0.3);
  }
  50% {
    box-shadow: 0 10px 15px -3px rgba(225, 29, 72, 0.5), 0 4px 6px -4px rgba(225, 29, 72, 0.5);
  }
}

/* Cancha Táctica */
.pitch-container {
  background: #14532d;
  border-radius: 0 0 8px 8px;
}

.soccer-pitch {
  position: relative;
  background: linear-gradient(180deg, #15803d 0%, #166534 50%, #15803d 100%);
  border: 2px solid rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  min-height: 520px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.4);
}

/* Líneas de la cancha */
.pitch-line.center-line {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(255, 255, 255, 0.6);
}

.pitch-circle.center-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90px;
  height: 90px;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-radius: 50%;
}

.pitch-circle.center-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
}

.pitch-area.penalty-area-top {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 180px;
  height: 60px;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-top: none;
}

.pitch-area.penalty-area-bottom {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 180px;
  height: 70px;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-bottom: none;
}

.pitch-area.goal-area-bottom {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 90px;
  height: 30px;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-bottom: none;
}

/* Zonas de Posición */
.pitch-zone {
  position: relative;
  z-index: 2;
  padding: 10px;
}

.zone-label {
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.1em;
  font-size: 10px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.players-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  gap: 8px;
  margin-top: 4px;
}

.pitch-player-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.15s ease;
  max-width: 90px;
}

.pitch-player-card:hover {
  transform: scale(1.08);
}

.player-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  border: 2px solid #ffffff;
}

.ring-gold {
  border-color: #fbbf24 !important;
}

.player-name {
  margin-top: 4px;
  font-size: 11px;
  font-weight: 700;
  color: #ffffff;
  background: rgba(15, 23, 42, 0.75);
  padding: 2px 6px;
  border-radius: 4px;
  max-width: 85px;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.empty-zone-hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
  padding: 4px;
}

.dorsal-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.border {
  border: 1px solid #e2e8f0;
}

.border-top {
  border-top: 1px solid #e2e8f0;
}

.bg-emerald-50 {
  background-color: #ecfdf5;
}

.ring-captain {
  border: 3px solid #fbbf24 !important;
  box-shadow: 0 0 10px rgba(251, 191, 36, 0.8) !important;
}

.escudo-preview-box {
  width: 52px;
  height: 52px;
  overflow: hidden;
}

.escudo-preview-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.color-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #ffffff;
}

.color-dot.ring-active {
  outline: 2px solid #0f172a;
}

.club-badge-entrenador-box {
  width: 28px;
  height: 28px;
  min-width: 28px;
  min-height: 28px;
  max-width: 28px;
  max-height: 28px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}
.club-badge-entrenador-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.club-badge-entrenador-emoji {
  font-size: 16px;
  line-height: 1;
}
.escudo-preview-box {
  width: 56px !important;
  height: 56px !important;
  min-width: 56px !important;
  min-height: 56px !important;
  max-width: 56px !important;
  max-height: 56px !important;
  border-radius: 10px;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.escudo-preview-img {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  display: block;
}

</style>
