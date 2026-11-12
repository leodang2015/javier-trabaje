<template>
  <div class="fixture-view">
    <!-- Header de Fixture con Filtro de Jornada -->
    <q-card flat bordered class="bg-white rounded-borders q-mb-md">
      <q-card-section class="row items-center justify-between q-py-md">
        <div class="row items-center">
          <q-icon :name="matCalendarMonth" color="primary" size="24px" class="q-mr-sm" />
          <div>
            <div class="text-subtitle1 text-weight-bold text-dark">Fixture & Calendario Oficial</div>
            <div class="text-caption text-grey-6">Resultados de encuentros y fechas programadas</div>
          </div>
        </div>

        <div class="row items-center q-gutter-sm">
                    <!-- Selector de Equipos para el Organizador (o Switch para Entrenador con club propio) -->
          <div v-if="store.esOrganizador" class="row items-center">
            <q-select
              v-model="equipoFiltroOrganizador"
              :options="opcionesEquiposFiltro"
              emit-value
              map-options
              dense
              outlined
              bg-color="white"
              style="min-width: 195px"
            >
              <template #prepend>
                <q-icon :name="matShield" size="18px" color="emerald-8" />
              </template>
            </q-select>
          </div>

          <!-- Para DT / Jugador con club asignado: Toggle rápido para alternar su club o todos -->
          <div v-else-if="store.miEquipoId" class="row items-center bg-slate-50 border border-slate-200 rounded-lg q-px-sm q-py-xs shadow-xs">
            <q-toggle
              v-model="mostrarSoloMiClub"
              dense
              color="emerald-8"
              size="sm"
            />
            <span class="text-caption font-11 text-weight-bold q-ml-xs text-slate-800">
              {{ mostrarSoloMiClub ? store.miEquipo?.nombre : 'Todos los Clubes' }}
            </span>
            <q-tooltip>
              {{ mostrarSoloMiClub ? 'Mostrando tu club. Haz clic para ver todo el torneo.' : 'Mostrando todo el torneo. Haz clic para ver solo tu club.' }}
            </q-tooltip>
          </div>

          <q-select
            v-model="fecha"
            :options="opciones"
            emit-value
            map-options
            dense
            outlined
            bg-color="white"
            style="min-width: 200px"
          >
            <template #prepend>
              <q-icon :name="matEvent" size="18px" color="grey-6" />  
            </template>
          </q-select>
        </div>
      </q-card-section>
    </q-card>

    

    <!-- TARJETA DESTACADA: Próximo Partido de tu Equipo -->
    <q-card
      v-if="(store.esJugador || store.esEntrenador) && proximoPartido"
      flat
      bordered
      class="bg-emerald-50 border border-emerald-4 rounded-borders q-mb-md q-pa-md shadow-2"
    >
      <div class="row items-center justify-between no-wrap q-col-gutter-md">
        <div class="row items-center q-gutter-md">
          <q-avatar size="44px" color="emerald-7" text-color="white" class="text-weight-bold text-h6 shadow-1">
            ⚔️
          </q-avatar>
          <div>
            <div class="text-caption text-uppercase text-weight-bolder text-emerald-9">
              Próximo Partido Programado de tu Equipo
            </div>
            <div class="text-subtitle1 text-weight-bolder text-slate-900 row items-center q-gutter-xs">
              <span>{{ store.miEquipo?.nombre }}</span>
              <span class="text-grey-6 text-caption text-weight-bold">VS</span>
              <span class="text-positive">{{ rivalProximo?.nombre || 'Rival Oficial' }}</span>
            </div>
            <div class="text-caption text-grey-8">
              Jornada {{ proximoPartido.fecha }} · Tu equipo jugará contra <strong>{{ rivalProximo?.nombre || 'el rival asignado' }}</strong>.
              <span v-if="rivalProximo?.capitan" class="q-ml-xs text-grey-7 font-mono font-11">
                (Capitán rival: {{ rivalProximo.capitan }} Ⓒ)
              </span>
            </div>
          </div>
        </div>
        <q-badge color="positive" text-color="white" label="Tu Próximo Encuentro" class="text-weight-bold font-11 q-px-sm q-py-xs" />
      </div>
    </q-card>

    <!-- Lista de Partidos en Tarjetas de Marcador -->
    <div class="row q-col-gutter-md">
      <div v-for="p in lista" :key="p.id" class="col-12 col-md-6">
        <q-card flat bordered class="match-card bg-white rounded-borders overflow-hidden">
          <!-- Franja superior con Jornada y Estado -->
          <div class="match-card-top row items-center justify-between q-px-md q-py-xs bg-slate-50 border-b">
            <div class="row items-center q-gutter-xs">
              <span class="text-caption text-weight-bold text-primary font-mono">
                JORNADA {{ p.fecha }}
              </span>
              <span v-if="p.fechaHora" class="text-caption text-grey-7 font-mono font-10">
                · {{ formatearFecha(p.fechaHora) }}
              </span>
            </div>
            <div class="row items-center q-gutter-xs">
              <!-- Botón Eliminar Encuentro (Exclusivo Organizador para corregir cruces o cumplir reglas de terminación) -->
              <q-btn
                v-if="store.esOrganizador && !finalizado(p)"
                dense
                flat
                round
                size="xs"
                color="negative"
                icon="delete"
                @click="confirmarEliminarPartido(p)"
              >
                <q-tooltip>Quitar este partido del fixture oficial</q-tooltip>
              </q-btn>

              <!-- Botón Posponer Partido (Exclusivo Organizador en partidos no finalizados) -->
              <q-btn
                v-if="store.esOrganizador && !finalizado(p)"
                dense
                unelevated
                no-caps
                size="sm"
                color="amber-9"
                text-color="white"
                :icon="matSchedule"
                label="⚠️ Posponer"
                class="q-px-xs text-weight-bold shadow-1"
                @click="abrirModalPosponer(p)"
              >
                <q-tooltip>Posponer encuentro por mal clima o fuerza mayor y notificar a ambos clubes</q-tooltip>
              </q-btn>

              <!-- Acción del Organizador o badge informativo para los demás roles -->
              <q-btn
                v-if="store.esOrganizador && !finalizado(p) && yaPasoElPartido(p)"
                dense
                unelevated
                no-caps
                size="sm"
                color="positive"
                text-color="white"
                :icon="matSportsScore"
                label="Oficializar Resultado"
                class="q-px-sm text-weight-bold shadow-1 animate-pulse-gentle"
                @click="abrirModalPuntuacion(p)"
              >
                <q-tooltip>Como Organizador: Cargar el resultado oficial y planilla del encuentro</q-tooltip>
              </q-btn>
              <span
                v-else-if="!finalizado(p)"
                class="text-caption text-indigo-9 bg-indigo-50 q-px-xs q-py-xs rounded border border-indigo-2 font-10 text-weight-bold"
              >
                ⏳ En preparación previa (Se disputa el {{ formatearFecha(p.fechaHora) }})
              </span>

              <!-- Indicador para Organizador / Jugador si el partido no ha ocurrido -->
              <span
                v-else-if="!finalizado(p) && !yaPasoElPartido(p)"
                class="text-caption text-indigo-9 bg-indigo-50 q-px-xs q-py-xs rounded border border-indigo-2 font-10 text-weight-bold"
              >
                ⏳ En preparación previa (Se disputa el {{ formatearFecha(p.fechaHora) }})
              </span>

              <span
                class="status-badge"
                :class="statusBadgeClass(p)"
              >
                {{ statusBadgeLabel(p) }}
              </span>
            </div>
          </div>

          <!-- BANNER DE PARTIDO POSPUESTO -->
          <div v-if="String(p.estado || '').toLowerCase().includes('pospuesto')" class="bg-amber-50 border-y border-amber-300 q-px-md q-py-xs text-caption text-amber-10 row items-center justify-between font-11">
            <div class="row items-center q-gutter-xs">
              <span class="text-weight-bolder">⚠️ PARTIDO POSPUESTO:</span>
              <span>"{{ p.motivoPostergacion || 'Causa de fuerza mayor / Clima' }}"</span>
            </div>
            <span class="font-mono text-grey-8 font-10">Notificado a los dos equipos</span>
          </div>

          <!-- Enfrentamiento y Marcador -->
          <q-card-section class="q-py-md q-px-lg">
            <div class="row items-center justify-between no-wrap">
              <!-- Equipo Local -->
              <div class="team-side col-5 row items-center no-wrap">
                <div class="club-badge-container q-mr-xs" :style="{ backgroundColor: color(p.localId || p.local) }">
                  <img
                    v-if="crestUrl(p.localId || p.local)"
                    :src="crestUrl(p.localId || p.local)"
                    alt="Escudo"
                    class="club-badge-img"
                  />
                  <span v-else-if="crestFigura(p.localId || p.local)" class="club-badge-emoji">{{ crestFigura(p.localId || p.local) }}</span>
                  <span v-else class="club-badge-dot" />
                </div>
                <span class="team-name text-weight-bold text-dark ellipsis" :title="nombre(p.localId || p.local)">
                  {{ nombre(p.localId || p.local) }}
                </span>
              </div>

              <!-- Marcador Central -->
              <div class="col-2 text-center">
                <div class="score-display font-mono">
                  <template v-if="finalizado(p)">
                    <span class="score-num">{{ p.golesLocal }}</span>
                    <span class="score-divider">-</span>
                    <span class="score-num">{{ p.golesVisitante }}</span>
                  
    

</template>
                  <template v-else>
                    <span class="score-vs text-caption text-grey-5 font-bold">VS</span>
                  
    

</template>
                </div>
              </div>

              <!-- Equipo Visitante -->
              <div class="team-side col-5 row items-center justify-end no-wrap text-right">
                <span class="team-name text-weight-bold text-dark ellipsis" :title="nombre(p.visitanteId || p.visitante)">
                  {{ nombre(p.visitanteId || p.visitante) }}
                </span>
                <div class="club-badge-container q-ml-xs" :style="{ backgroundColor: color(p.visitanteId || p.visitante) }">
                  <img
                    v-if="crestUrl(p.visitanteId || p.visitante)"
                    :src="crestUrl(p.visitanteId || p.visitante)"
                    alt="Escudo"
                    class="club-badge-img"
                  />
                  <span v-else-if="crestFigura(p.visitanteId || p.visitante)" class="club-badge-emoji">{{ crestFigura(p.visitanteId || p.visitante) }}</span>
                  <span v-else class="club-badge-dot" />
                </div>
              </div>
            </div>
          </q-card-section>

          <!-- Detalle de Goleadores y Asistencias (Solo en Finalizados) -->
          <div v-if="finalizado(p) && (p.golesLocal > 0 || p.golesVisitante > 0)" class="q-px-md q-py-xs bg-slate-50 border-t border-slate-200">
            <div class="row items-center justify-between no-wrap q-mb-xs">
              <span class="text-caption text-weight-bolder text-emerald-9 font-11">
                ⚽ Goleadores y Asistencias Oficiales
              </span>
              <div class="row items-center q-gutter-xs">
                <q-btn
                  v-if="(store.esOrganizador || store.esEntrenador) && (!p.goleadores || !p.goleadores.length)"
                  flat
                  dense
                  no-caps
                  size="xs"
                  color="emerald-9"
                  :icon="matBolt"
                  label="⚡ Auto-asignar Goleadores"
                  :loading="generandoGoleadoresId === (p.id || p._id)"
                  @click="generarGoleadoresPartido(p.id || p._id)"
                >
                  <q-tooltip>Asignar automáticamente quiénes hicieron los goles de cada equipo y cuántos hicieron</q-tooltip>
                </q-btn>
                <span v-else class="text-caption text-positive font-mono font-10 text-weight-bold">
                  🔒 Acta Cerrada
                </span>
                <span class="text-caption text-grey-6 font-mono font-10">Acta Oficial</span>
              </div>
            </div>
            <!-- Estadísticas de Faltas y Tarjetas del Partido -->
            <div v-if="p.faltasLocal || p.faltasVisitante || (p.tarjetas && p.tarjetas.length)" class="bg-amber-50/60 rounded-lg border border-amber-200/70 q-pa-xs q-mb-xs row items-center justify-between text-caption font-11 text-slate-700">
              <div class="row items-center q-gutter-xs">
                <span class="text-weight-bold text-amber-9">⚠️ Faltas:</span>
                <span>{{ p.faltasLocal || 0 }} ({{ nombre(p.localId || p.local) }}) - {{ p.faltasVisitante || 0 }} ({{ nombre(p.visitanteId || p.visitante) }})</span>
              </div>
              <div v-if="p.tarjetas && p.tarjetas.length" class="row items-center q-gutter-xs">
                <span class="text-weight-bold text-slate-800">Tarjetas:</span>
                <span v-for="(t, ti) in p.tarjetas" :key="'badge-tarjeta-' + ti" class="q-px-xs rounded font-10 text-weight-bolder" :class="t.tipo === 'Roja' ? 'bg-rose-600 text-white' : 'bg-amber-400 text-slate-900'">
                  {{ t.tipo === 'Roja' ? '🟥' : '🟨' }} {{ t.nombre || 'Jugador' }}
                </span>
              </div>
            </div>

            <!-- GOLES DIVIDIDOS POR EQUIPO: Columna Local y Columna Visitante -->
            <div v-if="goleadoresDelPartido(p).length" class="row q-col-gutter-sm q-mt-xs">
              <!-- Columna Goles de Local -->
              <div class="col-12 col-sm-6">
                <div class="bg-emerald-50/60 p-2 rounded-lg border border-emerald-200 h-full">
                  <div class="text-caption text-weight-bolder text-emerald-9 q-mb-xs row items-center justify-between border-b border-emerald-200 pb-1">
                    <span>⚽ Goles de {{ nombre(p.localId || p.local) }}</span>
                    <span class="font-mono text-weight-bold">({{ golesDelClubEnPartido(p, p.localId).length }})</span>
                  </div>
                  <div v-if="golesDelClubEnPartido(p, p.localId).length === 0" class="text-caption text-slate-400 font-10 italic py-1 text-center">
                    Sin goles marcados
                  </div>
                  <div v-else class="q-gutter-y-xs">
                    <div
                      v-for="(g, gIdx) in golesDelClubEnPartido(p, p.localId)"
                      :key="'loc-gol-' + gIdx"
                      class="bg-white q-pa-xs rounded border border-emerald-100 text-caption font-11 shadow-xs"
                    >
                      <div class="row items-center justify-between no-wrap">
                        <span class="text-weight-bold text-slate-900 ellipsis">
  <span v-if="g.esAutogol" class="text-rose-7">🥅 {{ g.nombre }} (Autogol)</span>
  <span v-else>⚽ {{ g.nombre }}</span>
</span>
                        <span class="text-emerald-700 font-mono text-weight-bold font-10">{{ g.minuto ? `${g.minuto}'` : 'Gol' }}</span>
                      </div>
                      <div v-if="g.asistenteNombre" class="text-slate-600 font-10 row items-center q-gutter-xs q-mt-xs">
                        <span class="text-indigo-7">👟 Asist:</span>
                        <span class="text-weight-medium">{{ g.asistenteNombre }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Columna Goles de Visitante -->
              <div class="col-12 col-sm-6">
                <div class="bg-indigo-50/60 p-2 rounded-lg border border-indigo-200 h-full">
                  <div class="text-caption text-weight-bolder text-indigo-9 q-mb-xs row items-center justify-between border-b border-indigo-200 pb-1">
                    <span>⚽ Goles de {{ nombre(p.visitanteId || p.visitante) }}</span>
                    <span class="font-mono text-weight-bold">({{ golesDelClubEnPartido(p, p.visitanteId).length }})</span>
                  </div>
                  <div v-if="golesDelClubEnPartido(p, p.visitanteId).length === 0" class="text-caption text-slate-400 font-10 italic py-1 text-center">
                    Sin goles marcados
                  </div>
                  <div v-else class="q-gutter-y-xs">
                    <div
                      v-for="(g, gIdx) in golesDelClubEnPartido(p, p.visitanteId)"
                      :key="'vis-gol-' + gIdx"
                      class="bg-white q-pa-xs rounded border border-indigo-100 text-caption font-11 shadow-xs"
                    >
                      <div class="row items-center justify-between no-wrap">
                        <span class="text-weight-bold text-slate-900 ellipsis">
  <span v-if="g.esAutogol" class="text-rose-7">🥅 {{ g.nombre }} (Autogol)</span>
  <span v-else>⚽ {{ g.nombre }}</span>
</span>
                        <span class="text-indigo-700 font-mono text-weight-bold font-10">{{ g.minuto ? `${g.minuto}'` : 'Gol' }}</span>
                      </div>
                      <div v-if="g.asistenteNombre" class="text-slate-600 font-10 row items-center q-gutter-xs q-mt-xs">
                        <span class="text-indigo-7">👟 Asist:</span>
                        <span class="text-weight-medium">{{ g.asistenteNombre }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center q-pa-xs text-caption text-grey-6 font-11">
              Goles registrados. Haz clic en "⚡ Auto-asignar Goleadores" para asignar automáticamente autores y asistencias.
            </div>
          </div>
        </q-card>
      </div>

      <!-- Estado Vacío cuando no hay partidos -->
      <div v-if="!lista.length" class="col-12">
        <q-card flat bordered class="bg-white rounded-borders q-pa-xl text-center">
          <q-icon :name="matEventBusy" size="48px" color="grey-4" class="q-mb-md" />
          <div class="text-subtitle1 text-weight-bold text-dark q-mb-xs">No hay partidos registrados</div>
          <p class="text-grey-6 text-body2 text-wrap-balance max-w-md q-mx-auto q-mb-md">
            {{ fecha === 'todos' ? 'Aún no se han computado encuentros en la base de datos de MongoDB Atlas.' : `No hay partidos registrados en la Fecha ${fecha}.` }}
          </p>
        </q-card>
      </div>
    </div>
    <!-- DIÁLOGO PARA CARGAR / MODIFICAR PUNTUACIÓN DEL PARTIDO (El día del partido) -->
    <q-dialog v-model="modalPuntuacionAbierto" position="standard">
      <q-card class="bg-white rounded-xl shadow-24 column no-wrap" style="width: 560px; max-width: 94vw; height: 88vh; max-height: 88vh; margin: auto; overflow: hidden;">
        <!-- Encabezado Fijo con buen espacio y padding -->
        <q-card-section class="bg-slate-900 text-white row items-center justify-between q-py-md q-px-lg shrink-0 border-b border-slate-800">
          <div class="row items-center q-gutter-sm">
            <q-avatar size="32px" color="emerald-9" text-color="white">
              <q-icon :name="matSportsScore" size="20px" />
            </q-avatar>
            <div class="text-subtitle1 text-weight-bolder text-white tracking-wide">
              Cargar Puntuación y Goleadores Oficiales
            </div>
          </div>
          <q-btn flat round dense :icon="matClose" v-close-popup text-color="grey-4" size="sm" />
        </q-card-section>

        <!-- Cuerpo Scrollable Con Barra de Desplazamiento Cómoda -->
        <q-card-section v-if="partidoEditandoPuntuacion" class="scroll q-pa-md q-gutter-y-md bg-slate-50 col">
          <!-- Encabezado con Jornada y Fecha -->
          <div class="text-center bg-white q-pa-xs rounded border text-caption text-grey-8 font-mono">
            Jornada {{ partidoEditandoPuntuacion.fecha }} · {{ formatearFecha(partidoEditandoPuntuacion.fechaHora) }}
          </div>

          <!-- Marcador Frente a Frente -->
          <div class="row q-col-gutter-xs items-center justify-center bg-white q-py-sm q-px-xs rounded-borders border shadow-xs">
            <!-- Local -->
            <div class="col-5 text-center">
              <div class="text-caption text-weight-bold text-dark ellipsis q-mb-xs" :title="nombre(partidoEditandoPuntuacion.localId)">
                {{ nombre(partidoEditandoPuntuacion.localId) }}
              </div>
              <q-badge color="emerald-1" text-color="emerald-9" class="text-weight-bolder font-10 q-mb-xs">Local</q-badge>
              <div class="row items-center justify-center q-gutter-xs q-mt-xs">
                <q-btn round dense flat size="sm" :icon="matRemove" :disable="golesLocalInput <= 0" @click="golesLocalInput = Math.max(0, golesLocalInput - 1); sincronizarGolesModal()" />
                <span class="font-mono text-h4 text-weight-bolder text-emerald-8 q-px-xs">{{ golesLocalInput }}</span>
                <q-btn round dense flat size="sm" :icon="matAdd" @click="golesLocalInput++; sincronizarGolesModal()" />
              </div>
            </div>

            <!-- VS -->
            <div class="col-2 text-center text-weight-bolder text-grey-4 text-h5">
              VS
            </div>

            <!-- Visitante -->
            <div class="col-5 text-center">
              <div class="text-caption text-weight-bold text-dark ellipsis q-mb-xs" :title="nombre(partidoEditandoPuntuacion.visitanteId)">
                {{ nombre(partidoEditandoPuntuacion.visitanteId) }}
              </div>
              <q-badge color="indigo-1" text-color="indigo-9" class="text-weight-bolder font-10 q-mb-xs">Visitante</q-badge>
              <div class="row items-center justify-center q-gutter-xs q-mt-xs">
                <q-btn round dense flat size="sm" :icon="matRemove" :disable="golesVisInput <= 0" @click="golesVisInput = Math.max(0, golesVisInput - 1); sincronizarGolesModal()" />
                <span class="font-mono text-h4 text-weight-bolder text-indigo-9 q-px-xs">{{ golesVisInput }}</span>
                <q-btn round dense flat size="sm" :icon="matAdd" @click="golesVisInput++; sincronizarGolesModal()" />
              </div>
            </div>
          </div>

          <!-- Sección de Goleadores Oficiales Definidos por el Organizador -->
          <div class="bg-white q-pa-md rounded-borders border shadow-xs q-gutter-y-sm">
            <div class="row items-center justify-between">
              <div>
                <div class="text-subtitle2 text-weight-bold text-slate-800 row items-center q-gutter-xs">
                  <q-icon :name="matSportsSoccer" size="18px" color="positive" />
                  <span>Autores Oficiales de los Goles</span>
                </div>
                <div class="text-caption text-grey-6 font-11">
                  Define los goleadores y asistidores según el marcador ingresado
                </div>
              </div>

              <!-- SWITCH TÁCTIL PARA ESCOGER MEJOR: Asignación Manual vs Auto-asignar -->
              <div class="row items-center bg-emerald-50 border border-emerald-300 rounded-lg q-px-sm q-py-xs shadow-xs">
                <q-toggle
                  v-model="modoManualGoleadores"
                  dense
                  color="positive"
                  size="sm"
                  @update:model-value="alCambiarSwitchModoGoles"
                />
                <span class="text-caption font-11 text-weight-bold q-ml-xs" :class="modoManualGoleadores ? 'text-emerald-9' : 'text-slate-600'">
                  {{ modoManualGoleadores ? '✍️ Escoger Jugador (Manual)' : '⚡ Auto-asignar' }}
                </span>
                <q-tooltip>
                  {{ modoManualGoleadores ? 'Modo Manual: Escoge quién metió cada gol de la lista' : 'Modo Automático: Asigna futbolistas automáticamente' }}
                </q-tooltip>
              </div>
            </div>

            <!-- Goleadores y Asistidores Local -->
            <div v-if="golesLocalInput > 0" class="q-pa-sm bg-emerald-50/70 rounded border border-emerald-2 q-gutter-y-xs">
              <div class="text-caption text-weight-bold text-emerald-9 q-mb-xs">
                ⚽ Goles y Asistencias de {{ nombre(partidoEditandoPuntuacion.localId) }} ({{ golesLocalInput }} gol/es):
              </div>
              <div v-for="(g, idx) in goleadoresLocalModal" :key="'loc-' + idx" class="bg-white q-pa-xs rounded border border-slate-200 q-gutter-y-xs">
                <div class="row items-center justify-between no-wrap">
                  <span class="text-caption font-mono font-bold text-emerald-8">Gol #{{ idx + 1 }}</span>
                  <div class="row items-center q-gutter-xs">
                    <span class="font-10 text-grey-7 font-bold">⏱️ Minuto:</span>
                    <q-input
                      v-model.number="g.minuto"
                      type="number"
                      min="1"
                      max="95"
                      dense
                      outlined
                      bg-color="white"
                      placeholder="Auto"
                      style="width: 75px; font-size: 11px"
                    >
                      <template #append><span class="font-10 text-grey-6">'</span></template>
                    </q-input>
                    <q-checkbox
                      v-model="g.esAutogol"
                      dense
                      size="xs"
                      color="rose"
                      label="Autogol"
                      class="font-10 text-weight-bold text-rose-8"
                      @update:model-value="g.asistenteId = ''; g.jugadorId = ''"
                    />
                  </div>
                </div>
                <div class="row q-col-gutter-sm items-center q-pt-xs">
                  <div class="col-12 col-sm-6">
                    <q-select
                      v-model="g.jugadorId"
                      :options="g.esAutogol ? opcionesJugadores(partidoEditandoPuntuacion.visitanteId) : opcionesJugadores(partidoEditandoPuntuacion.localId)"
                      emit-value
                      map-options
                      outlined
                      dense
                      bg-color="white"
                      :label="g.esAutogol ? '🥅 Anotador en contra' : '⚽ Autor del gol'"
                      class="text-weight-medium"
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-select
                      v-if="!g.esAutogol"
                      v-model="g.asistenteId"
                      :options="opcionesAsistidores(partidoEditandoPuntuacion.localId, g.jugadorId)"
                      emit-value
                      map-options
                      outlined
                      dense
                      bg-color="white"
                      label="👟 Asistidor (Pase de gol)"
                      class="text-weight-medium"
                      clearable
                    />
                    <div v-else class="text-caption text-rose-7 font-10 italic q-pa-xs bg-rose-50 rounded border border-rose-2 text-center">
                      🥅 Gol a favor de {{ nombre(partidoEditandoPuntuacion.localId) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Goleadores y Asistidores Visitante -->
            <div v-if="golesVisInput > 0" class="q-pa-sm bg-indigo-50/70 rounded border border-indigo-2 q-gutter-y-xs">
              <div class="text-caption text-weight-bold text-indigo-9 q-mb-xs">
                ⚽ Goles y Asistencias de {{ nombre(partidoEditandoPuntuacion.visitanteId) }} ({{ golesVisInput }} gol/es):
              </div>
              <div v-for="(g, idx) in goleadoresVisModal" :key="'vis-' + idx" class="bg-white q-pa-xs rounded border border-slate-200 q-gutter-y-xs">
                <div class="row items-center justify-between no-wrap">
                  <span class="text-caption font-mono font-bold text-indigo-8">Gol #{{ idx + 1 }}</span>
                  <div class="row items-center q-gutter-xs">
                    <span class="font-10 text-grey-7 font-bold">⏱️ Minuto:</span>
                    <q-input
                      v-model.number="g.minuto"
                      type="number"
                      min="1"
                      max="95"
                      dense
                      outlined
                      bg-color="white"
                      placeholder="Auto"
                      style="width: 75px; font-size: 11px"
                    >
                      <template #append><span class="font-10 text-grey-6">'</span></template>
                    </q-input>
                    <q-checkbox
                      v-model="g.esAutogol"
                      dense
                      size="xs"
                      color="rose"
                      label="Autogol"
                      class="font-10 text-weight-bold text-rose-8"
                      @update:model-value="g.asistenteId = ''; g.jugadorId = ''"
                    />
                  </div>
                </div>
                <div class="row q-col-gutter-sm items-center q-pt-xs">
                  <div class="col-12 col-sm-6">
                    <q-select
                      v-model="g.jugadorId"
                      :options="g.esAutogol ? opcionesJugadores(partidoEditandoPuntuacion.localId) : opcionesJugadores(partidoEditandoPuntuacion.visitanteId)"
                      emit-value
                      map-options
                      outlined
                      dense
                      bg-color="white"
                      :label="g.esAutogol ? '🥅 Anotador en contra' : '⚽ Autor del gol'"
                      class="text-weight-medium"
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-select
                      v-if="!g.esAutogol"
                      v-model="g.asistenteId"
                      :options="opcionesAsistidores(partidoEditandoPuntuacion.visitanteId, g.jugadorId)"
                      emit-value
                      map-options
                      outlined
                      dense
                      bg-color="white"
                      label="👟 Asistidor (Pase de gol)"
                      class="text-weight-medium"
                      clearable
                    />
                    <div v-else class="text-caption text-rose-7 font-10 italic q-pa-xs bg-rose-50 rounded border border-rose-2 text-center">
                      🥅 Gol a favor de {{ nombre(partidoEditandoPuntuacion.visitanteId) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

                        <!-- SECCIÓN OFICIAL DE CAMBIOS / SUSTITUCIONES (REGLAMENTO: LOS SUPLENTES DEBEN ENTRAR PARA ANOTAR) -->
            <div class="bg-indigo-50/70 q-pa-sm rounded border border-indigo-200 q-gutter-y-xs q-mt-sm">
              <div class="row items-center justify-between">
                <div>
                  <div class="text-caption text-weight-bold text-indigo-10 row items-center q-gutter-xs">
                    <q-icon :name="matSwapHoriz" size="18px" color="indigo-9" />
                    <span>🔄 Cambios y Sustituciones Oficiales</span>
                  </div>
                  <div class="text-caption text-indigo-9 font-10">
                    📋 <strong>Regla Básica:</strong> Los jugadores suplentes ("En Banca") solo pueden anotar si ingresaron por un cambio y su gol es posterior a dicho minuto.
                  </div>
                </div>
                <q-btn
                  dense
                  unelevated
                  no-caps
                  size="xs"
                  color="indigo-9"
                  text-color="white"
                  :icon="matAdd"
                  label="+ Registrar Cambio"
                  @click="agregarCambioModal"
                />
              </div>

              <!-- Lista de cambios del partido -->
              <div v-if="cambiosOrganizadorModal.length === 0" class="text-caption text-grey-5 font-10 italic text-center q-py-xs bg-white rounded border border-indigo-100">
                Sin sustituciones registradas (solo los 11 titulares en formación pueden anotar goles)
              </div>
              <div v-else class="q-gutter-y-xs">
                <div
                  v-for="(c, cIdx) in cambiosOrganizadorModal"
                  :key="'org-cambio-' + cIdx"
                  class="row items-center q-gutter-xs bg-white q-pa-xs rounded border border-indigo-200 shadow-xs"
                >
                  <span class="text-caption font-mono font-bold text-indigo-9 bg-indigo-100 q-px-xs rounded">
                    Cambio #{{ cIdx + 1 }}
                  </span>

                  <!-- Club del cambio -->
                  <div class="col-12 col-sm-3">
                    <q-select
                      v-model="c.equipoId"
                      :options="opcionesClubesPartido"
                      emit-value
                      map-options
                      dense
                      outlined
                      bg-color="white"
                      label="Club"
                      style="font-size: 11px"
                      @update:model-value="c.jugadorSaleId = ''; c.jugadorEntraId = ''"
                    />
                  </div>

                  <!-- Jugador Titular que Sale -->
                  <div class="col-12 col-sm-3">
                    <q-select
                      v-model="c.jugadorSaleId"
                      :options="opcionesTitularesClub(c.equipoId)"
                      emit-value
                      map-options
                      dense
                      outlined
                      bg-color="white"
                      label="🔴 Sale (Titular)"
                      style="font-size: 11px"
                    />
                  </div>

                  <!-- Jugador Suplente que Entra -->
                  <div class="col-12 col-sm-3">
                    <q-select
                      v-model="c.jugadorEntraId"
                      :options="opcionesSuplentesClub(c.equipoId)"
                      emit-value
                      map-options
                      dense
                      outlined
                      bg-color="white"
                      label="🟢 Entra (Suplente)"
                      style="font-size: 11px"
                    />
                  </div>

                  <!-- Minuto del Cambio -->
                  <div class="col-auto">
                    <q-input
                      v-model.number="c.minuto"
                      type="number"
                      dense
                      outlined
                      bg-color="white"
                      label="Minuto"
                      style="width: 75px; font-size: 11px"
                    />
                  </div>

                  <q-btn
                    flat
                    round
                    dense
                    size="xs"
                    color="negative"
                    :icon="matClose"
                    @click="cambiosOrganizadorModal.splice(cIdx, 1)"
                  />
                </div>
              </div>
            </div>

<!-- SECCIÓN DE FALTAS Y TARJETAS REGISTRADAS POR EL ORGANIZADOR -->
            <div class="bg-amber-50/60 q-pa-sm rounded border border-amber-200 q-gutter-y-xs q-mt-sm">
              <div class="row items-center justify-between">
                <div>
                  <div class="text-caption text-weight-bold text-amber-10">
                    ⚠️ Faltas y Tarjetas Disciplinarias del Encuentro
                  </div>
                  <div class="text-caption text-amber-9 font-10 font-bold">
                    ⚖️ Regla Única: 1 roja directa o 2 amarillas = 1 partido sin jugar (no se acumulan).
                  </div>
                </div>
                <q-btn
                  dense
                  unelevated
                  no-caps
                  size="xs"
                  color="amber-9"
                  text-color="white"
                  :icon="matAdd"
                  label="+ Agregar Falta / Tarjeta"
                  @click="agregarTarjetaOrganizador"
                />
              </div>

              <!-- Lista de faltas/tarjetas en el modal del organizador -->
              <div v-if="tarjetasOrganizadorModal.length === 0" class="text-caption text-grey-5 font-10 italic text-center q-py-xs">
                Sin faltas ni tarjetas registradas en este partido
              </div>
              <div v-else class="q-gutter-y-xs">
                <div
                  v-for="(t, tIdx) in tarjetasOrganizadorModal"
                  :key="'org-tarjeta-' + tIdx"
                  class="row items-center q-gutter-xs bg-white q-pa-xs rounded border border-slate-200"
                >
                  <span class="text-caption font-mono font-bold text-slate-700 bg-slate-100 q-px-xs rounded">
                    #{{ tIdx + 1 }}
                  </span>
                  <q-select
                    v-model="t.tipo"
                    :options="['Falta', 'Amarilla', 'Roja']"
                    dense
                    outlined
                    bg-color="white"
                    style="width: 105px; font-size: 11px"
                  />
                  <div class="col">
                    <q-select
                      v-model="t.jugadorId"
                      :options="opcionesJugadoresAmbosClubes(partidoEditandoPuntuacion)"
                      emit-value
                      map-options
                      outlined
                      dense
                      bg-color="white"
                      label="Futbolista"
                      style="font-size: 11px"
                    />
                  </div>
                  <div class="col-auto">
                    <q-input
                      v-model.number="t.minuto"
                      type="number"
                      dense
                      outlined
                      bg-color="white"
                      label="Minuto"
                      style="width: 75px; font-size: 11px"
                    />
                  </div>
                  <q-btn flat round dense size="xs" color="negative" :icon="matClose" @click="tarjetasOrganizadorModal.splice(tIdx, 1)" />
                </div>
              </div>
            </div>

            <div v-if="golesLocalInput === 0 && golesVisInput === 0" class="text-caption text-grey-6 italic text-center q-pa-sm">
              Empate sin goles (0 - 0). No requiere registro de goleadores.
            </div>
          </div>


        </q-card-section>
        <q-card-actions align="right" class="bg-white q-pa-md border-t shrink-0">
          <q-btn flat no-caps label="Cancelar" color="grey-7" v-close-popup />
          <q-btn
            unelevated
            no-caps
            color="positive"
            :icon="matCheckCircle"
            label="Guardar Puntuación Oficial"
            class="text-weight-bold q-px-md"
            :loading="guardandoPuntuacion"
            @click="guardarPuntuacionPartido"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>

    


    <!-- DIÁLOGO PARA QUE EL ENTRENADOR REPORTE EXCLUSIVAMENTE LOS GOLES DE SU EQUIPO -->
    

  
    <!-- MODAL OFICIAL PARA POSPONER PARTIDO Y NOTIFICAR A AMBOS EQUIPOS -->
    <q-dialog v-model="modalPosponerAbierto">
      <q-card style="width: 440px; max-width: 92vw; max-height: 90vh;" class="rounded-xl overflow-hidden bg-white shadow-10 column no-wrap">
        <q-card-section class="bg-amber-9 text-white row items-center justify-between q-py-md">
          <div class="row items-center q-gutter-sm">
            <q-avatar size="36px" color="amber-1" text-color="amber-10">
              <q-icon :name="matSchedule" size="24px" />
            </q-avatar>
            <div>
              <div class="text-subtitle1 text-weight-bolder">Posponer Encuentro Oficial</div>
              <div class="text-caption font-11 text-amber-1">
                {{ partidoParaPosponer ? `${nombre(partidoParaPosponer.localId)} vs ${nombre(partidoParaPosponer.visitanteId)}` : 'Partido' }}
              </div>
            </div>
          </div>
          <q-btn flat round dense icon="close" text-color="white" v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-md q-gutter-y-md col scroll">
          <div class="bg-amber-50 border border-amber-3 rounded-borders q-pa-sm text-caption text-slate-800">
            📢 <strong>Notificación Automática Reglamentaria:</strong>
            Al confirmar la postergación, se enviará una notificación oficial e inmediata a las bandejas del <strong>{{ partidoParaPosponer ? nombre(partidoParaPosponer.localId) : 'Equipo Local' }}</strong> y del <strong>{{ partidoParaPosponer ? nombre(partidoParaPosponer.visitanteId) : 'Equipo Visitante' }}</strong> (tanto al Director Técnico como a sus futbolistas).
          </div>

          <!-- Motivo de la postergación -->
          <div>
            <div class="text-caption text-weight-bolder text-slate-900 q-mb-xs">
              Motivo o Causa de la Postergación *
            </div>
            <q-select
              v-model="motivoPosponerSeleccionado"
              :options="[
                'Lluvias torrenciales / Mal estado de la cancha',
                'Condiciones climáticas adversas / Tormenta eléctrica',
                'Causa de fuerza mayor / Falta de fluido eléctrico en escenario',
                'Acuerdo mutuo y solicitud formal entre directivas de clubes',
                'Duelo o motivo de fuerza mayor institucional'
              ]"
              outlined
              dense
              bg-color="white"
              placeholder="Selecciona o escribe el motivo"
            />
          </div>

          <!-- Detalles adicionales opcionales -->
          <div>
            <div class="text-caption text-weight-bolder text-slate-900 q-mb-xs">
              Detalle o Justificación Adicional
            </div>
            <q-input
              v-model="detalleMotivoPosponer"
              type="textarea"
              rows="2"
              outlined
              dense
              bg-color="white"
              placeholder="Ej: El árbitro y comisario determinaron que el campo está inundado y no garantiza la integridad de los jugadores."
            />
          </div>

          <!-- Reprogramación de nueva fecha opcional -->
          <div>
            <div class="row items-center justify-between q-mb-xs">
              <span class="text-caption text-weight-bolder text-slate-900">
                Reprogramar Nueva Fecha y Hora (Opcional)
              </span>
              <span class="text-caption text-grey-6 font-10">Si se deja vacío, queda 'A definir'</span>
            </div>
            <q-input
              v-model="nuevaFechaHoraPosponer"
              type="datetime-local"
              outlined
              dense
              bg-color="white"
              class="font-mono text-caption"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md bg-slate-50 border-t">
          <q-btn flat no-caps label="Cancelar" color="grey-7" v-close-popup />
          <q-btn
            unelevated
            no-caps
            color="amber-10"
            text-color="white"
            :loading="guardandoPosponer"
            label="⚠️ Confirmar y Notificar a Ambos Clubes"
            class="text-weight-bolder q-px-md shadow-2"
            @click="ejecutarPosponerPartido"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useTorneo } from '../store/torneo.js'
import { matCalendarMonth, matEvent, matEventBusy, matSportsSoccer, matBolt, matSportsScore, matEdit, matCheckCircle, matClose, matAdd, matRemove, matShield } from '@quasar/extras/material-icons'

const $q = useQuasar()
const store = useTorneo()
const fecha = ref('todos')
// Encendedor para alternar vista general del torneo o enfoque de club
const mostrarSoloMiClub = ref(false)
const equipoFiltroOrganizador = ref('todos')

const opcionesEquiposFiltro = computed(() => {
  const lista = [
    { label: '🛡️ Todos los Equipos', value: 'todos' }
  ]
  if (Array.isArray(store.equipos)) {
    store.equipos.forEach(e => {
      lista.push({
        label: `⚽ ${e.nombre}`,
        value: String(e.id || e._id)
      })
    })
  }
  return lista
})
const filtroVistaFixture = ref('todos')
const generandoGoleadoresId = ref(null)

async function generarGoleadoresPartido(partidoId) {
  generandoGoleadoresId.value = partidoId
  try {
    await store.autogenerarGoleadoresPartido(partidoId)
    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: '⚽ Goleadores y cantidad de goles asignados automáticamente para ambos equipos.',
      position: 'top',
      timeout: 3500
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      icon: 'error',
      message: err.message || 'Error al asignar goleadores automáticamente',
      position: 'top',
      timeout: 3500
    })
  } finally {
    generandoGoleadoresId.value = null
  }
}

const opciones = computed(() => [
  { label: '⚽ Todos los partidos', value: 'todos' },
  { label: '⏳ Próximos Encuentros (Por disputarse)', value: 'proximo' },
  { label: '📋 En Preparación / Hora de Cargar Eventos', value: 'preparacion' },
  { label: '✅ Partidos Finalizados (Con Acta Oficial)', value: 'finalizado' }
])

const finalizado = (p) => ['jugado', 'finalizado'].includes(String(p?.estado || '').toLowerCase())

const statusBadgeLabel = (p) => {
  const est = String(p?.estado || '').toLowerCase()
  if (est.includes('pospuesto')) return '⚠️ Pospuesto'
  if (['jugado', 'finalizado'].includes(est)) return 'Finalizado'
  if (yaPasoElPartido(p)) return '📋 En Preparación / Eventos'
  return '⏳ Próximo Encuentro'
}

const statusBadgeClass = (p) => {
  const est = String(p?.estado || '').toLowerCase()
  if (est.includes('pospuesto')) return 'bg-amber-100 text-amber-900 border-2 border-amber-500 font-bold'
  if (['jugado', 'finalizado'].includes(est)) return 'bg-emerald-100 text-emerald-800 border border-emerald-300'
  if (est.includes('preparaci') || est.includes('proceso')) return 'bg-amber-100 text-amber-900 border border-amber-300'
  if (est.includes('confirmar')) return 'bg-sky-100 text-sky-800 border border-sky-300'
  return 'bg-slate-100 text-slate-700 border border-slate-300'
}
const nombre = (id) => {
  if (!id) return 'Club no asignado'
  if (typeof id === 'object' && id.nombre) return id.nombre
  const eq = store.equipoPorId(id)
  return eq?.nombre ?? 'Club no asignado'
}
const color = (id) => {
  if (typeof id === 'object' && (id.color || id.escudocolor)) return id.color || id.escudocolor
  const eq = store.equipoPorId(id)
  return eq?.color || eq?.escudocolor || '#059669'
}
const crestUrl = (id) => {
  if (typeof id === 'object' && id.escudoUrl) return id.escudoUrl
  return store.equipoPorId(id)?.escudoUrl
}
const crestFigura = (id) => {
  if (typeof id === 'object' && id.escudoFigura) return id.escudoFigura
  return store.equipoPorId(id)?.escudoFigura
}

const lista = computed(() => {
  const all = store.partidos || []

  let base = all

  // Filtro por equipo para el Organizador
  if (store.esOrganizador && equipoFiltroOrganizador.value && equipoFiltroOrganizador.value !== 'todos') {
    const targetEq = String(equipoFiltroOrganizador.value).trim()
    base = base.filter(p => {
      const locId = String(p.localId || (p.local && typeof p.local === 'object' ? (p.local._id || p.local.id) : p.local) || '').trim()
      const visId = String(p.visitanteId || (p.visitante && typeof p.visitante === 'object' ? (p.visitante._id || p.visitante.id) : p.visitante) || '').trim()
      return locId === targetEq || visId === targetEq
    })
  } else if (!store.esOrganizador && mostrarSoloMiClub.value && store.miEquipoId) {
    // Para DT o Jugador cuando activan el filtro de su propio club
    const miId = String(store.miEquipoId).trim()
    base = base.filter(p => {
      const locId = String(p.localId || (p.local && typeof p.local === 'object' ? (p.local._id || p.local.id) : p.local) || '').trim()
      const visId = String(p.visitanteId || (p.visitante && typeof p.visitante === 'object' ? (p.visitante._id || p.visitante.id) : p.visitante) || '').trim()
      return locId === miId || visId === miId
    })
  }

  if (fecha.value === 'finalizado') {
    return base.filter(p => finalizado(p))
  }

  // Próximos Encuentros: Aquellos cuya fecha/hora todavía NO ha ocurrido
  if (fecha.value === 'proximo') {
    return base.filter(p => !finalizado(p) && !yaPasoElPartido(p))
  }

  // En Preparación / Hora de Cargar Eventos: Aquellos cuya fecha/hora ya llegó o pasó y están listos para oficializar
  if (fecha.value === 'preparacion') {
    return base.filter(p => !finalizado(p) && yaPasoElPartido(p))
  }

  // 'todos': Todos los partidos del torneo (o de su equipo si activó el encendedor)
  return base
})

const proximoPartido = computed(() => {
  if ((!store.esJugador && !store.esEntrenador) || !store.miEquipoId) return null
  const miId = String(store.miEquipoId || '').trim()
  return store.partidos.find(p =>
    !finalizado(p) && (String(p.localId || '').trim() === miId || String(p.visitanteId || '').trim() === miId)
  )
})

const rivalProximo = computed(() => {
  if (!proximoPartido.value) return null
  const miId = String(store.miEquipoId || '').trim()
  const esLocal = String(proximoPartido.value.localId || '').trim() === miId
  const rivalId = esLocal ? proximoPartido.value.visitanteId : proximoPartido.value.localId
  return store.equipoPorId(rivalId)
})

// Control de puntuación del partido (habilitado cuando es el día)
const modalPosponerAbierto = ref(false)
const partidoParaPosponer = ref(null)
const motivoPosponerSeleccionado = ref('Lluvias torrenciales / Mal estado de la cancha')
const detalleMotivoPosponer = ref('')
const nuevaFechaHoraPosponer = ref('')
const guardandoPosponer = ref(false)


async function confirmarEliminarPartido(p) {
  const pId = p.id || p._id
  const locNom = nombre(p.localId)
  const visNom = nombre(p.visitanteId)

  $q.dialog({
    title: '🗑️ Quitar Partido del Fixture',
    message: `¿Deseas eliminar el partido entre "${locNom}" y "${visNom}" para cumplir con el orden del torneo?`,
    cancel: { label: 'Cancelar', flat: true, color: 'grey-7' },
    ok: { label: 'Sí, Eliminar Partido', color: 'negative', unelevated: true }
  }).onOk(async () => {
    try {
      await store.eliminarPartido(pId)
      $q.notify({
        type: 'positive',
        icon: 'delete',
        message: 'Partido removido exitosamente del fixture oficial.',
        position: 'top',
        timeout: 4000
      })
    } catch (err) {
      $q.notify({
        type: 'negative',
        icon: 'error',
        message: err.message || 'Error al eliminar el partido',
        position: 'top'
      })
    }
  })
}

function abrirModalPosponer(p) {
  partidoParaPosponer.value = p
  motivoPosponerSeleccionado.value = 'Lluvias torrenciales / Mal estado de la cancha'
  detalleMotivoPosponer.value = ''
  nuevaFechaHoraPosponer.value = ''
  modalPosponerAbierto.value = true
}

async function ejecutarPosponerPartido() {
  if (!partidoParaPosponer.value) return
  guardandoPosponer.value = true
  try {
    const motivoFinal = detalleMotivoPosponer.value
      ? `${motivoPosponerSeleccionado.value} - ${detalleMotivoPosponer.value}`
      : motivoPosponerSeleccionado.value

    const pId = partidoParaPosponer.value.id || partidoParaPosponer.value._id
    const res = await store.posponerPartido({
      partidoId: pId,
      motivo: motivoFinal,
      nuevaFechaHora: nuevaFechaHoraPosponer.value || null
    })

    modalPosponerAbierto.value = false
    $q.notify({
      type: 'positive',
      icon: 'campaign',
      message: res.msg || 'Partido pospuesto y notificado exitosamente a ambos clubes.',
      position: 'top',
      timeout: 5000
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      icon: 'error',
      message: err.message || 'Error al posponer el partido',
      position: 'top',
      timeout: 4000
    })
  } finally {
    guardandoPosponer.value = false
  }
}

const modalPuntuacionAbierto = ref(false)
const modoManualGoleadores = ref(true)

function alCambiarSwitchModoGoles(val) {
  if (!val) {
    autoDistribuirGoleadoresEnModal()
  } else {
    sincronizarGolesModal()
  }
}

function sincronizarGolesModal() {
  const p = partidoEditandoPuntuacion.value
  if (!p) return

  const optsLoc = opcionesJugadores(p.localId)
  const diffLoc = (Number(golesLocalInput.value) || 0) - goleadoresLocalModal.value.length
  if (diffLoc > 0) {
    for (let i = 0; i < diffLoc; i++) {
      const jug = optsLoc[i % (optsLoc.length || 1)]
      goleadoresLocalModal.value.push({
        jugadorId: jug?.value || '',
        nombre: jug?.nombre || 'Jugador',
        dorsal: jug?.dorsal || '-',
        asistenteId: ''
      })
    }
  } else if (diffLoc < 0) {
    goleadoresLocalModal.value.splice(diffLoc)
  }

  const optsVis = opcionesJugadores(p.visitanteId)
  const diffVis = (Number(golesVisInput.value) || 0) - goleadoresVisModal.value.length
  if (diffVis > 0) {
    for (let i = 0; i < diffVis; i++) {
      const jug = optsVis[i % (optsVis.length || 1)]
      goleadoresVisModal.value.push({
        jugadorId: jug?.value || '',
        nombre: jug?.nombre || 'Jugador',
        dorsal: jug?.dorsal || '-',
        asistenteId: ''
      })
    }
  } else if (diffVis < 0) {
    goleadoresVisModal.value.splice(diffVis)
  }
}
const partidoEditandoPuntuacion = ref(null)
const golesLocalInput = ref(0)
const golesVisInput = ref(0)
const guardandoPuntuacion = ref(false)
const goleadoresLocalModal = ref([])
const goleadoresVisModal = ref([])
const tarjetasOrganizadorModal = ref([])
const cambiosOrganizadorModal = ref([])

const opcionesClubesPartido = computed(() => {
  const p = partidoEditandoPuntuacion.value
  if (!p) return []
  return [
    { label: nombre(p.localId), value: p.localId },
    { label: nombre(p.visitanteId), value: p.visitanteId }
  ]
})

function opcionesTitularesClub(eqId) {
  if (!eqId) return []
  const idStr = String(eqId).trim()
  return (store.jugadores || [])
    .filter(j => {
      const jEq = String(j.equipoId || (j.equipo && typeof j.equipo === 'object' ? (j.equipo._id || j.equipo.id) : j.equipo) || '').trim()
      const pos = String(j.posicion || '').trim()
      return jEq === idStr && pos !== 'En Banca' && j.estadoAprobacion !== 'Rechazado'
    })
    .map(j => ({
      label: `${j.nombre} (#${j.numero ?? j.dorsal ?? '-'}) · ${j.posicion}`,
      value: j.id || j._id
    }))
}

function opcionesSuplentesClub(eqId) {
  if (!eqId) return []
  const idStr = String(eqId).trim()
  return (store.jugadores || [])
    .filter(j => {
      const jEq = String(j.equipoId || (j.equipo && typeof j.equipo === 'object' ? (j.equipo._id || j.equipo.id) : j.equipo) || '').trim()
      const pos = String(j.posicion || '').trim()
      return jEq === idStr && pos === 'En Banca' && j.estadoAprobacion !== 'Rechazado'
    })
    .map(j => ({
      label: `${j.nombre} (#${j.numero ?? j.dorsal ?? '-'}) [Suplente]`,
      value: j.id || j._id
    }))
}

function siguienteMinutoDisponible(tipo = 'cambio') {
  // Recopilar todos los minutos ocupados actualmente
  const ocupados = new Set()
  for (const c of cambiosOrganizadorModal.value) {
    if (c.minuto) ocupados.add(Number(c.minuto))
  }
  for (const t of tarjetasOrganizadorModal.value) {
    if (t.minuto) ocupados.add(Number(t.minuto))
  }

  let base = tipo === 'cambio' ? 55 : 25
  while (ocupados.has(base) && base <= 89) {
    base += 1
  }
  return Math.min(89, base)
}

function agregarCambioModal() {
  const p = partidoEditandoPuntuacion.value
  if (!p) return
  const proximoMin = siguienteMinutoDisponible('cambio')
  cambiosOrganizadorModal.value.push({
    equipoId: p.localId,
    jugadorSaleId: '',
    jugadorEntraId: '',
    minuto: proximoMin
  })
}

function agregarTarjetaOrganizador() {
  const p = partidoEditandoPuntuacion.value
  if (!p) return
  const opts = opcionesJugadoresAmbosClubes(p)
  const proximoMin = siguienteMinutoDisponible('falta')
  tarjetasOrganizadorModal.value.push({
    tipo: 'Amarilla',
    jugadorId: opts[0]?.value || '',
    nombre: opts[0]?.nombre || 'Jugador',
    minuto: proximoMin
  })
}

function opcionesJugadoresAmbosClubes(p) {
  if (!p) return []
  const optsLoc = opcionesJugadores(p.localId).map(j => ({ ...j, label: `[${nombre(p.localId)}] ${j.label}` }))
  const optsVis = opcionesJugadores(p.visitanteId).map(j => ({ ...j, label: `[${nombre(p.visitanteId)}] ${j.label}` }))
  return [...optsLoc, ...optsVis]
}


const modalReporteDTAbierto = ref(false)
const partidoReporteDT = ref(null)
const golesEquipoDTInput = ref(0)
const faltasEquipoDTInput = ref(0)
const tarjetasDTModal = ref([])


const alertaTarjetasDT = ref('')

function validarTarjetasReglamentarias() {
  alertaTarjetasDT.value = ''
  const recuento = {}
  
  for (const t of tarjetasDTModal.value) {
    if (!t.jugadorId) continue
    if (!recuento[t.jugadorId]) {
      recuento[t.jugadorId] = { amarillas: 0, rojas: 0, nombre: t.nombre || 'Futbolista' }
    }
    const found = store.jugadores.find(j => String(j.id || j._id) === String(t.jugadorId))
    if (found) recuento[t.jugadorId].nombre = found.nombre

    if (t.tipo === 'Amarilla') recuento[t.jugadorId].amarillas++
    if (t.tipo === 'Roja') recuento[t.jugadorId].rojas++
  }

  for (const [jId, r] of Object.entries(recuento)) {
    if (r.rojas > 1) {
      alertaTarjetasDT.value = `⚠️ Reglamento: Solo se permite tener como máximo 1 tarjeta roja por partido para ${r.nombre}.`
      return false
    }
    if (r.amarillas >= 2 && r.rojas === 1) {
      alertaTarjetasDT.value = `⚠️ Aviso disciplinario: ${r.nombre} acumula 2 amarillas y 1 roja. Su sanción será de 2 partidos de suspensión oficial.`
    } else if (r.amarillas >= 2) {
      alertaTarjetasDT.value = `⚠️ Doble amarilla: ${r.nombre} tiene 2 amarillas; equivalen a una expulsión (tarjeta roja) para el siguiente encuentro.`
    }
  }
  return true
}

function opcionesJugadoresHabilitados(equipoId) {
  return opcionesJugadores(equipoId).map(opt => {
    const jug = store.jugadores.find(j => String(j.id || j._id) === String(opt.value))
    let extraLabel = ''
    if (jug?.expulsadoDelTorneo) {
      extraLabel = ' [EXPULSADO DEL TORNEO 🚫]'
    } else if (jug?.partidosSuspendidosRestantes > 0) {
      extraLabel = ` [SUSPENDIDO: ${jug.partidosSuspendidosRestantes} PJ 🛑]`
    } else if (jug?.tarjetasRojasAcumuladas > 0) {
      extraLabel = ` (${jug.tarjetasRojasAcumuladas} 🟥 acum.)`
    }
    return {
      ...opt,
      label: `${opt.label}${extraLabel}`
    }
  })
}

function agregarTarjetaDT() {
  const opts = opcionesJugadores(store.miEquipoId)
  tarjetasDTModal.value.push({
    tipo: 'Falta',
    jugadorId: opts[0]?.value || '',
    nombre: opts[0]?.nombre || 'Jugador',
    dorsal: opts[0]?.dorsal || '-'
  })
  faltasEquipoDTInput.value = tarjetasDTModal.value.length
}
const goleadoresDTModal = ref([])
const enviandoReporteDT = ref(false)

function partidoInvolucraMiClub(p) {
  if (!p || !store.miEquipoId) return false
  const miId = String(store.miEquipoId).trim()
  const locId = String(p.localId || (p.local && typeof p.local === 'object' ? (p.local._id || p.local.id) : p.local) || '').trim()
  const visId = String(p.visitanteId || (p.visitante && typeof p.visitante === 'object' ? (p.visitante._id || p.visitante.id) : p.visitante) || '').trim()
  return miId === locId || miId === visId
}

function yaReporteGolesMiEquipo(p) {
  if (!partidoInvolucraMiClub(p)) return false
  const miId = String(store.miEquipoId).trim()
  const locId = String(p.localId || (p.local && typeof p.local === 'object' ? (p.local._id || p.local.id) : p.local) || '').trim()
  if (miId === locId) {
    return Boolean(p.reporteGolesLocal?.reportado)
  } else {
    return Boolean(p.reporteGolesVisitante?.reportado)
  }
}

function misGolesReportados(p) {
  const miId = String(store.miEquipoId).trim()
  const locId = String(p.localId || (p.local && typeof p.local === 'object' ? (p.local._id || p.local.id) : p.local) || '').trim()
  if (miId === locId) {
    return p.reporteGolesLocal?.goles ?? p.golesLocal ?? 0
  } else {
    return p.reporteGolesVisitante?.goles ?? p.golesVisitante ?? 0
  }
}

function nombreRival(p) {
  if (!p || !store.miEquipoId) return 'Equipo Rival'
  const miId = String(store.miEquipoId).trim()
  const locId = String(p.localId || (p.local && typeof p.local === 'object' ? (p.local._id || p.local.id) : p.local) || '').trim()
  const visId = String(p.visitanteId || (p.visitante && typeof p.visitante === 'object' ? (p.visitante._id || p.visitante.id) : p.visitante) || '').trim()
  return miId === locId ? nombre(visId) : nombre(locId)
}

function abrirModalReporteDT(p) {
  partidoReporteDT.value = p
  golesEquipoDTInput.value = misGolesReportados(p) || 0
  
  const miId = String(store.miEquipoId).trim()
  const locId = String(p.localId || (p.local && typeof p.local === 'object' ? (p.local._id || p.local.id) : p.local) || '').trim()
  faltasEquipoDTInput.value = (miId === locId ? p.faltasLocal : p.faltasVisitante) || 0
  tarjetasDTModal.value = []
  
  sincronizarGoleadoresDT()
  modalReporteDTAbierto.value = true
}

function opcionesAsistidores(equipoId, autorId) {
  const opts = opcionesJugadores(equipoId)
  const sinAsist = [{ label: '— Sin Asistencia (Jugada individual / penal) —', value: '' }]
  const filtrados = opts.filter(j => String(j.value) !== String(autorId))
  return [...sinAsist, ...filtrados]
}

function sincronizarGoleadoresDT() {
  const opts = opcionesJugadores(store.miEquipoId)
  const diff = golesEquipoDTInput.value - goleadoresDTModal.value.length
  if (diff > 0) {
    for (let i = 0; i < diff; i++) {
      const j = opts[i % (opts.length || 1)]
      goleadoresDTModal.value.push({
        jugadorId: j?.value || '',
        nombre: j?.nombre || 'Futbolista',
        dorsal: j?.dorsal || '-',
        asistenteId: ''
      })
    }
  } else if (diff < 0) {
    goleadoresDTModal.value.splice(diff)
  }
}

async function enviarReporteGolesDT() {
  if (!partidoReporteDT.value) return
  enviandoReporteDT.value = true
  const p = partidoReporteDT.value
  const pId = p.id || p._id
  try {
    const opts = opcionesJugadores(store.miEquipoId)
    const listaCompilada = goleadoresDTModal.value.map((g, idx) => {
      const found = opts.find(j => j.value === g.jugadorId) || opts[idx % (opts.length || 1)]
      const foundAsist = g.asistenteId ? opts.find(j => j.value === g.asistenteId) : null
      return {
        jugadorId: found?.value || g.jugadorId,
        nombre: found?.nombre || g.nombre,
        dorsal: found?.dorsal || g.dorsal,
        asistenteId: foundAsist ? String(foundAsist.value) : '',
        asistenteNombre: foundAsist ? String(foundAsist.nombre) : '',
        goles: 1
      }
    })

    const optsTarjetas = opcionesJugadores(store.miEquipoId)
    const tarjetasCompiladas = tarjetasDTModal.value.map(t => {
      const found = optsTarjetas.find(j => j.value === t.jugadorId)
      return {
        tipo: t.tipo || 'Amarilla',
        jugadorId: found?.value || t.jugadorId,
        nombre: found?.nombre || t.nombre,
        dorsal: found?.dorsal || t.dorsal
      }
    })

    const res = await store.reportarGolesEquipoDT(pId, {
      goles: Number(golesEquipoDTInput.value) || 0,
      goleadores: listaCompilada,
      faltas: Number(faltasEquipoDTInput.value) || 0,
      tarjetas: tarjetasCompiladas
    })

    modalReporteDTAbierto.value = false
    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: res?.msg || 'Goles de tu equipo reportados exitosamente.',
      position: 'top',
      timeout: 3500
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      icon: 'error',
      message: err.message || 'Error al enviar reporte de goles',
      position: 'top'
    })
  } finally {
    enviandoReporteDT.value = false
  }
}

function opcionesJugadores(equipoId) {
  if (!equipoId) return []
  const eqStr = String(equipoId).trim()
  const suplentesConCambioIds = new Set(
    (cambiosOrganizadorModal.value || [])
      .filter(c => String(c.equipoId).trim() === eqStr && c.jugadorEntraId)
      .map(c => String(c.jugadorEntraId))
  )

  return store.jugadores
    .filter(j => {
      const jEq = String(j.equipoId || (j.equipo && typeof j.equipo === 'object' ? (j.equipo._id || j.equipo.id) : j.equipo) || '').trim()
      if (jEq !== eqStr || j.estadoAprobacion === 'Rechazado') return false
      const esTitular = String(j.posicion || '').trim() !== 'En Banca'
      const jId = String(j.id || j._id)
      return esTitular || suplentesConCambioIds.has(jId)
    })
    .map(j => {
      const esTitular = String(j.posicion || '').trim() !== 'En Banca'
      const prefix = esTitular ? '⚽ [Titular]' : '🔄 [Entró por Cambio]'
      return {
        label: `${prefix} #${j.numero || j.dorsal || '-'} ${j.nombre} ${j.apellido && j.apellido !== '-' ? j.apellido : ''}`,
        value: j.id || j._id,
        nombre: `${j.nombre} ${j.apellido && j.apellido !== '-' ? j.apellido : ''}`.trim(),
        dorsal: j.numero || j.dorsal || '-',
        esTitular
      }
    })
}

function sincronizarFilasGoleadoresModal() {
  const diffLocal = golesLocalInput.value - goleadoresLocalModal.value.length
  if (diffLocal > 0) {
    const opts = opcionesJugadores(partidoEditandoPuntuacion.value?.localId)
    for (let i = 0; i < diffLocal; i++) {
      const jug = opts[i % (opts.length || 1)]
      goleadoresLocalModal.value.push({
        jugadorId: jug?.value || '',
        nombre: jug?.nombre || 'Jugador',
        dorsal: jug?.dorsal || '-'
      })
    }
  } else if (diffLocal < 0) {
    goleadoresLocalModal.value.splice(diffLocal)
  }

  const diffVis = golesVisInput.value - goleadoresVisModal.value.length
  if (diffVis > 0) {
    const opts = opcionesJugadores(partidoEditandoPuntuacion.value?.visitanteId)
    for (let i = 0; i < diffVis; i++) {
      const jug = opts[i % (opts.length || 1)]
      goleadoresVisModal.value.push({
        jugadorId: jug?.value || '',
        nombre: jug?.nombre || 'Jugador',
        dorsal: jug?.dorsal || '-'
      })
    }
  } else if (diffVis < 0) {
    goleadoresVisModal.value.splice(diffVis)
  }
}

function autoDistribuirGoleadoresEnModal() {
  const optsLoc = opcionesJugadores(partidoEditandoPuntuacion.value?.localId)
  goleadoresLocalModal.value = []
  for (let i = 0; i < golesLocalInput.value; i++) {
    const jug = optsLoc[i % (optsLoc.length || 1)]
    goleadoresLocalModal.value.push({
      jugadorId: jug?.value || '',
      nombre: jug?.nombre || 'Jugador',
      dorsal: jug?.dorsal || '-'
    })
  }

  const optsVis = opcionesJugadores(partidoEditandoPuntuacion.value?.visitanteId)
  goleadoresVisModal.value = []
  for (let i = 0; i < golesVisInput.value; i++) {
    const jug = optsVis[i % (optsVis.length || 1)]
    goleadoresVisModal.value.push({
      jugadorId: jug?.value || '',
      nombre: jug?.nombre || 'Jugador',
      dorsal: jug?.dorsal || '-'
    })
  }
}


function yaPasoElPartido(p) {
  if (!p) return false
  if (!p.fechaHora) return true
  try {
    const fechaP = new Date(p.fechaHora)
    const ahora = new Date()
    // Regla Oficial: Solo se muestra el botón si ya se pasó el tiempo/hora programada del partido
    return ahora.getTime() >= fechaP.getTime()
  } catch (_) {
    return true
  }
}

function esDiaDelPartido(p) {
  return yaPasoElPartido(p)
}

function abrirModalPuntuacion(p) {
  partidoEditandoPuntuacion.value = p
  golesLocalInput.value = Number(p.golesLocal ?? 0)
  golesVisInput.value = Number(p.golesVisitante ?? 0)
  tarjetasOrganizadorModal.value = []
  cambiosOrganizadorModal.value = []
  if (Array.isArray(p.cambios)) {
    cambiosOrganizadorModal.value = p.cambios.map(c => ({
      equipoId: c.equipo?._id || c.equipo || c.equipoId,
      jugadorSaleId: c.jugadorSaleId,
      jugadorEntraId: c.jugadorEntraId,
      minuto: c.minuto || 60
    }))
  }
  if (Array.isArray(p.tarjetas)) {
    tarjetasOrganizadorModal.value = p.tarjetas.map(t => ({
      tipo: t.tipo || 'Amarilla',
      jugadorId: t.jugadorId || t.jugador || '',
      nombre: t.nombre || ''
    }))
  }
  sincronizarGolesModal()
  modalPuntuacionAbierto.value = true
}

async function guardarPuntuacionPartido() {
  if (!partidoEditandoPuntuacion.value) return
  guardandoPuntuacion.value = true
  const p = partidoEditandoPuntuacion.value
  const pId = p.id || p._id
  try {
    // Compilar goleadores designados por el Organizador
    const listaGoleadores = []
    const optsLoc = opcionesJugadores(p.localId)
    const optsVis = opcionesJugadores(p.visitanteId)

    goleadoresLocalModal.value.forEach((g, idx) => {
      const jug = optsLoc.find(j => j.value === g.jugadorId) || optsLoc[idx % (optsLoc.length || 1)]
      const foundAsist = g.asistenteId ? optsLoc.find(j => j.value === g.asistenteId) : null
      if (jug) {
        listaGoleadores.push({
          jugadorId: jug.value,
          nombre: g.esAutogol ? `${jug.nombre} (Autogol)` : jug.nombre,
          dorsal: jug.dorsal,
          asistenteId: foundAsist ? String(foundAsist.value) : '',
          asistenteNombre: foundAsist ? String(foundAsist.nombre) : '',
          equipo: p.localId,
          equipoNombre: nombre(p.localId),
          goles: 1,
          minuto: 0,
          esAutogol: Boolean(g.esAutogol)
        })
      }
    })

    goleadoresVisModal.value.forEach((g, idx) => {
      const jug = optsVis.find(j => j.value === g.jugadorId) || optsVis[idx % (optsVis.length || 1)]
      const foundAsist = g.asistenteId ? optsVis.find(j => j.value === g.asistenteId) : null
      if (jug) {
        listaGoleadores.push({
          jugadorId: jug.value,
          nombre: g.esAutogol ? `${jug.nombre} (Autogol)` : jug.nombre,
          dorsal: jug.dorsal,
          asistenteId: foundAsist ? String(foundAsist.value) : '',
          asistenteNombre: foundAsist ? String(foundAsist.nombre) : '',
          equipo: p.visitanteId,
          equipoNombre: nombre(p.visitanteId),
          goles: 1,
          minuto: 0,
          esAutogol: Boolean(g.esAutogol)
        })
      }
    })

    // Separación obligatoria de mínimo 2 minutos entre CADA gol del partido
    
    // REGLA: Si anota un suplente, verificar que entró en un cambio y que su gol sea posterior al cambio
    for (const g of listaGoleadores) {
      const jDoc = store.jugadores.find(j => String(j.id || j._id) === String(g.jugadorId))
      if (jDoc && String(jDoc.posicion || '').trim() === 'En Banca') {
        const cambio = cambiosOrganizadorModal.value.find(c => String(c.jugadorEntraId) === String(jDoc.id || jDoc._id))
        if (!cambio) {
          throw new Error(`⚠️ REGLA OFICIAL: "${jDoc.nombre}" está En Banca. Solo puede anotar si registras su cambio oficial sustituyendo a un titular.`)
        }
      }
    }

    // -------------------------------------------------------------------------
    // CRONOLOGÍA REGLAMENTARIA ESTRICTA DE EVENTOS (SIN COINCIDENCIAS DE MINUTO)
    // 1. No puede haber dos eventos en el mismo minuto (minutos únicos por evento).
    // 2. Cada cambio o falta debe tener al menos 1 minuto de diferencia con cualquier otro evento.
    // 3. Entre un gol y otro gol debe existir un intervalo mínimo de 5 MINUTOS.
    // 4. Los suplentes que anoten deben hacerlo con gol posterior a su cambio (+1 min).
    // -------------------------------------------------------------------------

    // A. Validar que no haya dos cambios o faltas manuales compartiendo el mismo minuto
    const minutosEventosManuales = new Map()
    cambiosOrganizadorModal.value.forEach((c, cIdx) => {
      const minC = Number(c.minuto) || 60
      if (minutosEventosManuales.has(minC)) {
        throw new Error(`⚠️ REGLA DE TIEMPOS: El Cambio #${cIdx + 1} está en el Minuto ${minC}', pero ya existe otro evento en ese mismo minuto. Cada cambio o falta debe tener una diferencia de al menos 1 minuto.`)
      }
      minutosEventosManuales.set(minC, `Cambio #${cIdx + 1}`)
    })

    tarjetasOrganizadorModal.value.forEach((t, tIdx) => {
      const minT = Number(t.minuto) || 30
      if (minutosEventosManuales.has(minT)) {
        throw new Error(`⚠️ REGLA DE TIEMPOS: La Tarjeta/Falta #${tIdx + 1} está en el Minuto ${minT}', coincidiendo con "${minutosEventosManuales.get(minT)}". No puede haber dos eventos en el mismo minuto.`)
      }
      minutosEventosManuales.set(minT, `Tarjeta/Falta #${tIdx + 1}`)
    })

    // B. Asignar minutos a los goles garantizando 5 MINUTOS entre goles y 1 minuto libre de otros eventos
    const minutosOcupadosGlobal = new Set(minutosEventosManuales.keys())
    const totalG = listaGoleadores.length

    if (totalG > 0) {
      let minCursor = 12 + Math.floor(Math.random() * 3)

      for (let i = 0; i < totalG; i++) {
        const item = listaGoleadores[i]
        const jDoc = store.jugadores.find(j => String(j.id || j._id) === String(item.jugadorId))
        const cambio = jDoc && String(jDoc.posicion || '').trim() === 'En Banca'
          ? cambiosOrganizadorModal.value.find(c => String(c.jugadorEntraId) === String(jDoc.id || jDoc._id))
          : null

        // Si es suplente, su gol DEBE ser después del minuto del cambio (+ 1 minuto mínimo)
        if (cambio) {
          const minCambio = Number(cambio.minuto) || 60
          minCursor = Math.max(minCursor, minCambio + 1)
        }

        // Buscar el primer minuto libre que no choque con cambios ni faltas
        while (minutosOcupadosGlobal.has(minCursor) && minCursor <= 90) {
          minCursor += 1
        }

        item.minuto = Math.min(90, minCursor)
        minutosOcupadosGlobal.add(item.minuto)

        // Próximo gol: OBLIGATORIO al menos 5 minutos después del gol actual
        minCursor = item.minuto + 5
      }

      // Ordenar goles cronológicamente
      listaGoleadores.sort((a, b) => Number(a.minuto) - Number(b.minuto))
    }

    const faltasLoc = tarjetasOrganizadorModal.value.filter(t => {
      const j = store.jugadores.find(x => String(x.id || x._id) === String(t.jugadorId))
      return j && String(j.equipoId || j.equipo) === String(p.localId)
    }).length

    const faltasVis = tarjetasOrganizadorModal.value.filter(t => {
      const j = store.jugadores.find(x => String(x.id || x._id) === String(t.jugadorId))
      return j && String(j.equipoId || j.equipo) === String(p.visitanteId)
    }).length

    const tarjetasCompiladas = tarjetasOrganizadorModal.value.map(t => {
      const j = store.jugadores.find(x => String(x.id || x._id) === String(t.jugadorId))
      return {
        tipo: t.tipo,
        jugadorId: t.jugadorId,
        nombre: j ? j.nombre : 'Jugador',
        dorsal: j ? (j.numero ?? j.dorsal) : '-'
      }
    })

    await store.fijarMarcadorOrganizador(pId, {
      golesLocal: Number(golesLocalInput.value) || 0,
      golesVisitante: Number(golesVisInput.value) || 0,
      asistenciasLocal: listaGoleadores.filter(g => g.asistenteId && String(g.equipoId) === String(p.localId)).length,
      asistenciasVisitante: listaGoleadores.filter(g => g.asistenteId && String(g.equipoId) === String(p.visitanteId)).length,
      faltasLocal: faltasLoc,
      faltasVisitante: faltasVis,
      goleadores: listaGoleadores,
      cambios: cambiosOrganizadorModal.value.map(c => ({
        equipo: c.equipoId,
        jugadorSaleId: c.jugadorSaleId,
        jugadorEntraId: c.jugadorEntraId,
        minuto: Number(c.minuto) || 60
      })),
      tarjetas: tarjetasCompiladas
    })
    modalPuntuacionAbierto.value = false
    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: `⚽ Puntuación guardada: ${nombre(p.localId)} ${golesLocalInput.value} - ${golesVisInput.value} ${nombre(p.visitanteId)}`,
      position: 'top',
      timeout: 3500
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      icon: 'error',
      message: err.message || 'Error al guardar puntuación',
      position: 'top',
      timeout: 3500
    })
  } finally {
    guardandoPuntuacion.value = false
  }
}


function golesDelClubEnPartido(p, targetEquipoId) {
  if (!p || !Array.isArray(p.goleadores)) return []
  const eqStr = String(targetEquipoId || '').trim()
  const eqNom = String(nombre(targetEquipoId) || '').trim().toLowerCase()

  return p.goleadores.filter(g => {
    const gEqId = String(g.equipoId || (g.equipo && typeof g.equipo === 'object' ? (g.equipo._id || g.equipo.id) : g.equipo) || '').trim()
    const gEqNom = String(g.equipoNombre || '').trim().toLowerCase()

    if (eqStr && gEqId && eqStr === gEqId) return true
    if (eqNom && gEqNom && eqNom === gEqNom) return true

    // Si no tiene equipo en el objeto de gol, verificar en store.jugadores
    const matchJ = store.jugadores.find(j => 
      String(j.id || j._id) === String(g.jugadorId || g.jugador) ||
      `${j.nombre} ${j.apellido && j.apellido !== '-' ? j.apellido : ''}`.trim().toLowerCase() === String(g.nombre || '').trim().toLowerCase()
    )
    if (matchJ) {
      const jEqId = String(matchJ.equipoId || matchJ.equipo || '').trim()
      return jEqId === eqStr
    }
    return false
  })
}

function goleadoresDelPartido(p) {
  if (!p || !Array.isArray(p.goleadores)) return []
  let list = p.goleadores

  // Si es jugador o entrenador, solo ver los goles/asistencias de su propio club
  if (store.esJugador || store.esEntrenador) {
    const miId = String(store.miEquipoId || '').trim()
    const miClubNom = String(store.miEquipo?.nombre || '').trim().toLowerCase()
    list = list.filter(g => {
      const gEqId = String(g.equipoId || g.equipo || '').trim()
      const gEqNom = String(g.equipoNombre || '').trim().toLowerCase()
      if (miId && gEqId && miId === gEqId) return true
      if (miClubNom && gEqNom && miClubNom === gEqNom) return true
      if (!gEqId && !gEqNom) {
        // En caso de que no tenga equipo en el registro, verificar si el jugador pertenece al club del usuario
        const matchJ = store.jugadores.find(j => 
          String(j.id || j._id) === String(g.jugadorId || g.jugador) ||
          `${j.nombre} ${j.apellido || ''}`.trim().toLowerCase() === String(g.nombre || '').trim().toLowerCase()
        )
        if (matchJ && String(matchJ.equipoId || matchJ.equipo || '').trim() === miId) return true
      }
      return false
    })
  }

  // Deduplicar para garantizar que no se repitan goles por error de captura
  const vistos = new Set()
  const unicos = []
  for (const g of list) {
    const key = `${g.jugadorId || g.nombre}_${g.minuto || ''}`
    if (!vistos.has(key)) {
      vistos.add(key)
      unicos.push(g)
    }
  }
  return unicos
}

function formatearFecha(f) {
  if (!f) return ''
  try {
    const d = new Date(f)
    return d.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch (_) {
    return ''
  }
}
</script>

<style scoped>
.club-fixture-crest {
  width: 20px;
  height: 20px;
  object-fit: contain;
  border-radius: 4px;
}
.match-card {
  border: 1px solid #e2e8f0;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.match-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
.match-card-top {
  font-size: 0.72rem;
  letter-spacing: 0.05em;
}
.status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
}
.club-crest-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-block;
}
.team-name {
  font-size: 0.92rem;
}
.score-display {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #0f172a;
  color: #ffffff;
  padding: 4px 12px;
  border-radius: 6px;
  font-weight: 800;
  font-size: 1.05rem;
  min-width: 64px;
}
.score-divider {
  margin: 0 4px;
  color: #94a3b8;
}
.score-vs {
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}
.bg-slate-50 {
  background-color: #f8fafc;
}
.border-b {
  border-bottom: 1px solid #e2e8f0;
}
.text-wrap-balance {
  text-wrap: balance;
}
.max-w-md {
  max-width: 28rem;
}

.club-badge-container {
  width: 26px;
  height: 26px;
  min-width: 26px;
  min-height: 26px;
  max-width: 26px;
  max-height: 26px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
}
.club-badge-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.club-badge-emoji {
  font-size: 14px;
  line-height: 1;
}
.club-badge-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: white;
}


.badge-pospuesto {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #f59e0b;
  font-weight: 800;
}

</style>
