<template>
  <div class="index-torneo-page">
    <!-- Hero Header del Torneo -->
    <div class="tournament-hero-card rounded-borders q-mb-lg overflow-hidden">
      <div class="hero-content-wrap q-pa-lg row items-center justify-between">
        <div class="col-12 col-md-8">
          <div class="row items-center q-gutter-xs q-mb-xs">
            <span class="hero-kicker text-uppercase text-weight-bolder text-emerald-400">
              Torneo Barrial Oficial
            </span>
            <span class="live-dot q-ml-xs" />
            <span class="text-caption text-emerald-300 font-mono">En vivo</span>
          </div>
          <h1 class="hero-heading text-weight-bolder text-white q-my-none">
            {{ store.torneo?.nombre || 'Liga de Fútbol Barrial' }}
          </h1>
          <p class="hero-subtext text-grey-3 q-mt-xs q-mb-md">
            {{ store.torneo?.descripcion || 'Resultados oficiales, tabla de posiciones y fixture en tiempo real desde MongoDB Atlas.' }}
          </p>

          <!-- Barra de Acción Contextual Única según el Rol Activo (Sin duplicados) -->
          <div class="hero-role-action-bar row items-center q-gutter-sm">
            <!-- Badge oficial con color distintivo por rol -->
            <div
              class="role-pill row items-center q-px-sm q-py-xs rounded-borders text-caption text-weight-bolder shadow-2"
              :class="roleBadgeClass"
            >
              <span>{{ store.rolInfo?.badge || '👑 Organizador' }}</span>
            </div>

            <!-- Botones de Acción (Únicos, específicos del rol) -->
            <template v-if="roleStore.esOrganizador">
              <q-btn
                unelevated
                dense
                no-caps
                color="primary"
                :icon="matSportsScore"
                label="+ Registrar Partido"
                class="q-px-md text-weight-bold"
                :disable="store.equipos.length < 2"
                @click="store.abrirDialogoPartido()"
              >
                <q-tooltip>
                  Se requiere un mínimo de 11 jugadores en nómina por equipo para disputar partidos oficiales.
                </q-tooltip>
              </q-btn>
            </template>

            <template v-else-if="roleStore.esEntrenador">
              <q-btn
                unelevated
                dense
                no-caps
                color="positive"
                :icon="matSports"
                label="Abrir Pizarra Táctica DT"
                class="q-px-md text-weight-bold"
                to="/entrenador"
              />
            </template>

            <template v-else>
              <q-btn
                unelevated
                dense
                no-caps
                color="indigo"
                :icon="matShield"
                label="Ver Clubes del Torneo"
                class="q-px-md text-weight-bold"
                to="/equipos"
              />
            </template>
          </div>
        </div>

        <div class="col-12 col-md-4 text-left text-md-right q-mt-md q-mt-md-none">
          <div class="atlas-badge inline-flex items-center">
            <span class="atlas-dot q-mr-xs" />
            <span class="text-caption text-white font-mono">Cluster MongoDB Atlas</span>
          </div>
          <div class="text-caption text-grey-4 q-mt-xs">
            Actualización automática
          </div>
        </div>
      </div>
    </div>

    <!-- Fila de Estadísticas Oficiales con SVG icons -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div v-for="s in metricas" :key="s.label" class="col-6 col-md-3">
        <q-card flat bordered class="metric-card bg-white rounded-borders">
          <q-card-section class="q-pa-md">
            <div class="row items-center justify-between no-wrap q-mb-xs">
              <span class="metric-label text-caption text-grey-7 text-weight-medium">{{ s.label }}</span>
              <div class="metric-icon-box" :class="s.bgClass">
                <q-icon :name="s.icon" size="18px" :class="s.iconClass" />
              </div>
            </div>
            <div class="metric-value font-mono text-h4 text-weight-bold text-dark q-mt-xs">
              {{ s.value }}
            </div>
            <div class="metric-sub text-caption text-grey-6 q-mt-xs">
              {{ s.sub }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Estado vacío cuando no hay clubes registrados -->
    <div
      v-if="!store.cargando && store.equipos.length === 0"
      class="empty-onboarding-card bg-white q-pa-xl rounded-borders text-center q-mb-lg"
    >
      <div class="empty-icon-wrap q-mx-auto q-mb-md">
        <q-icon :name="matSportsSoccer" size="40px" color="primary" />
      </div>
      <div class="text-h6 text-weight-bold text-dark q-mb-xs">Tu Liga Barrial está Lista para Comenzar</div>
      <p class="text-grey-7 text-body2 max-w-lg q-mx-auto q-mb-lg">
        Actualmente no hay clubes registrados en tu base de datos de MongoDB Atlas. Cada entrenador funda y registra su propio equipo al crear su cuenta en la plataforma.
      </p>
      <div>
        <q-btn
          color="primary"
          unelevated
          no-caps
          :icon="matShield"
          label="Ver Clubes del Torneo"
          class="q-px-lg text-weight-bold"
          to="/equipos"
        />
      </div>
    </div>

    <!-- Contenido Principal: Tabla Oficial + Widgets Laterales -->
    <div class="row q-col-gutter-lg">
      <!-- Columna Principal: Tabla Oficial de Posiciones -->
      <div class="col-12 col-lg-8">
        <!-- BANNER DE INFORMACIÓN DEL CLUB (Jugador) -->
        <q-banner
          v-if="store.esJugador"
          dense
          rounded
          class="bg-indigo-1 text-indigo-10 q-mb-md q-py-sm q-px-md border border-indigo-2 shadow-1"
        >
          <template #avatar>
            <q-icon :name="matSportsSoccer" size="26px" color="indigo-8" />
          </template>
          <div class="row items-center justify-between no-wrap">
            <div>
              <div class="text-subtitle2 text-weight-bolder">
                ⚽ Ficha de tu Club: {{ miClubEnTabla?.nombre || store.miEquipo?.nombre || 'Tu Equipo' }}
              </div>
              <div class="text-caption text-indigo-9">
                Tu club se ubica en el <strong>Puesto {{ miClubEnTabla?.pos ? `${miClubEnTabla.pos}°` : '—' }}</strong> con <strong>{{ miClubEnTabla?.pts || 0 }} pts</strong> oficiales ({{ miClubEnTabla?.pj || 0 }} PJ, {{ miClubEnTabla?.pg || 0 }} PG, {{ miClubEnTabla?.pe || 0 }} PE, {{ miClubEnTabla?.pp || 0 }} PP). Como jugador, tienes tu resumen enfocado en tu club.
              </div>
            </div>
            <q-badge color="indigo-8" text-color="white" class="text-weight-bolder q-px-sm q-py-xs font-12 shadow-1">
              {{ miClubEnTabla?.pos ? `Puesto #${miClubEnTabla.pos}` : 'Sin posición' }}
            </q-badge>
          </div>
        </q-banner>

        <!-- BANNER INFORMATIVO PARA ENTRENADOR (Visión completa de la tabla) -->
        <q-banner
          v-else-if="store.esEntrenador"
          dense
          rounded
          class="bg-emerald-1 text-emerald-10 q-mb-md q-py-sm q-px-md border border-emerald-3 shadow-1"
        >
          <template #avatar>
            <q-icon :name="matTableChart" size="26px" color="positive" />
          </template>
          <div class="row items-center justify-between no-wrap">
            <div>
              <div class="text-subtitle2 text-weight-bolder">
                🏆 Tabla General de la Liga · Vista Completa de Entrenador
              </div>
              <div class="text-caption text-emerald-9">
                Como <strong>Director Técnico</strong>, puedes visualizar la posición y rendimiento de todos los clubes de la competición para planificar tus tácticas y seguir a tus rivales directos.
              </div>
            </div>
            <q-badge color="positive" text-color="white" class="text-weight-bold q-px-sm q-py-xs font-11">
              {{ miClubEnTabla ? `Tu Club: Puesto #${miClubEnTabla.pos}` : 'DT Oficial' }}
            </q-badge>
          </div>
        </q-banner>

        <q-card flat bordered class="main-table-card bg-white rounded-borders overflow-hidden">
          <!-- Toolbar Superior: Filtro y Leyenda -->
          <q-card-section class="table-toolbar row items-center justify-between q-col-gutter-sm bg-slate-50 border-b">
            <div v-if="store.esOrganizador || store.esEntrenador" class="row items-center q-gutter-sm">
              <q-input
                v-model="buscar"
                dense
                outlined
                bg-color="white"
                placeholder="Buscar club por nombre o barrio..."
                class="search-input"
                clearable
              >
                <template #prepend>
                  <q-icon :name="matSearch" size="18px" color="grey-6" />
                </template>
              </q-input>
              <span v-if="buscar" class="text-caption text-grey-6 font-mono">
                {{ filas.length }} resultado(s)
              </span>
              <q-badge v-if="store.esEntrenador && miClubEnTabla" color="emerald-9" text-color="white" class="font-11">
                Tu Club: {{ miClubEnTabla.nombre }} (Puesto #{{ miClubEnTabla.pos }})
              </q-badge>
            </div>
            <div v-else class="row items-center q-gutter-xs">
              <q-icon :name="matLock" size="18px" color="indigo-8" class="q-mr-xs" />
              <span class="text-subtitle2 text-weight-bold text-slate-800">
                Información de tu Club: {{ miClubEnTabla?.nombre || store.miEquipo?.nombre || 'Tu Equipo' }}
              </span>
              <q-badge color="indigo-8" text-color="white" class="text-weight-bolder font-11 q-ml-xs shadow-1">
                Puesto Oficial: {{ miClubEnTabla?.pos ? ('#' + miClubEnTabla.pos) : '—' }}
              </q-badge>
            </div>

            <div class="row items-center q-gutter-md text-caption text-grey-7">
              <div class="row items-center q-gutter-xs">
                <span class="legend-badge legend-v">V</span>
                <span class="text-weight-bold text-slate-800">Victoria (+3)</span>
              </div>
              <div class="row items-center q-gutter-xs">
                <span class="legend-badge legend-e">E</span>
                <span class="text-weight-bold text-slate-800">Empate (+1)</span>
              </div>
              <div class="row items-center q-gutter-xs">
                <span class="legend-badge legend-d">D</span>
                <span class="text-weight-bold text-slate-800">Derrota (0)</span>
              </div>
            </div>
          </q-card-section>

          <!-- Tabla Oficial de Posiciones -->
          <div class="table-responsive">
            <table class="posiciones-table">
              <thead>
                <tr>
                  <th class="th-pos text-center">#</th>
                  <th class="th-club text-left">Club</th>
                  <th class="th-num text-center">PJ</th>
                  <th class="th-num text-center">G</th>
                  <th class="th-num text-center">E</th>
                  <th class="th-num text-center">P</th>
                  <th class="th-num text-center">GF</th>
                  <th class="th-num text-center">GC</th>
                  <th class="th-num text-center">DG</th>
                  <th class="th-pts text-center">PTS</th>
                  <th class="th-racha text-center">Forma</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="e in filas"
                  :key="e.id"
                  class="table-row"
                  :class="{ 'leader-row': e.pos === 1, 'playoff-zone': e.pos > 1 && e.pos <= 4 }"
                >
                  <!-- Posición -->
                  <td class="text-center font-mono td-pos">
                    <span v-if="e.pos === 1" class="rank-crown text-amber-500 font-bold">1★</span>
                    <span v-else class="rank-num text-weight-medium">{{ e.pos }}</span>
                  </td>

                  <!-- Club -->
                  <td class="td-club">
                    <div class="row items-center no-wrap">
                      <span class="club-color-dot q-mr-sm" :style="{ background: e.color }" />
                      <span class="text-weight-bold text-dark ellipsis">{{ e.nombre }}</span>
                      <span v-if="e.barriada" class="text-caption text-grey-6 q-ml-sm hidden sm:inline">
                        ({{ e.barriada }})
                      </span>
                    </div>
                  </td>

                  <!-- Métricas numéricas -->
                  <td class="text-center font-mono td-stat">{{ e.pj }}</td>
                  <td class="text-center font-mono td-stat">{{ e.pg }}</td>
                  <td class="text-center font-mono td-stat">{{ e.pe }}</td>
                  <td class="text-center font-mono td-stat">{{ e.pp }}</td>
                  <td class="text-center font-mono td-stat text-grey-8">{{ e.gf }}</td>
                  <td class="text-center font-mono td-stat text-grey-8">{{ e.gc }}</td>

                  <!-- Diferencia de Gol -->
                  <td
                    class="text-center font-mono td-stat text-weight-bold"
                    :class="e.dg > 0 ? 'text-positive' : e.dg < 0 ? 'text-negative' : 'text-grey-6'"
                  >
                    {{ e.dg > 0 ? `+${e.dg}` : e.dg }}
                  </td>

                  <!-- Puntos Totales -->
                  <td class="text-center font-mono td-pts text-weight-bolder text-primary">
                    {{ e.pts }}
                  </td>

                  <!-- Racha / Forma -->
                  <td class="text-center td-racha">
                    <div v-if="e.racha && e.racha.length" class="row items-center justify-center q-gutter-xs no-wrap">
                      <span
                        v-for="(r, idx) in e.racha.slice(-4)"
                        :key="idx"
                        class="racha-chip"
                        :class="{
                          'racha-v': r === 'V',
                          'racha-e': r === 'E',
                          'racha-d': r === 'D'
                        }"
                        :title="r === 'V' ? 'Victoria (+3 pts)' : r === 'E' ? 'Empate (+1 pto)' : 'Derrota (0 pts)'"
                      >
                        {{ r }}
                      </span>
                    </div>
                    <span v-else class="text-caption text-grey-6 font-mono bg-slate-100 q-px-xs rounded-borders">
                      Sin partidos
                    </span>
                  </td>
                </tr>

                <!-- Estado Vacío -->
                <tr v-if="!filas.length">
                  <td colspan="11" class="text-center q-py-xl text-grey-6">
                    <div class="q-py-md">
                      <q-icon :name="matSports" size="36px" color="grey-4" class="q-mb-sm" />
                      <div class="text-body2 text-weight-medium">
                        {{ buscar ? `No se encontraron clubes que coincidan con "${buscar}"` : 'No hay clubes registrados todavía en MongoDB Atlas.' }}
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pie de Tabla Informativo -->
          <q-card-section class="table-footer row items-center justify-between text-caption text-grey-7 bg-slate-50 border-t">
            <div class="row items-center q-gutter-xs">
              <span class="zone-marker bg-primary" />
              <span v-if="store.esOrganizador">Zona de clasificación a fase final (puestos 1 a 4)</span>
              <span v-else>Tu club ocupa el puesto {{ miClubEnTabla?.pos ? `${miClubEnTabla.pos}°` : '—' }} en la competencia oficial</span>
            </div>
            <div class="font-mono text-grey-8">
              Promedio del torneo: <strong class="text-dark">{{ store.stats.promedio }}</strong> goles/partido
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Columna Lateral: Resumen de Partidos & Goleadores -->
      <div class="col-12 col-lg-4 q-gutter-y-md">
        <!-- Widget: Últimos Resultados o Próximos Encuentros -->
        <q-card flat bordered class="bg-white rounded-borders overflow-hidden">
          <q-card-section class="row items-center justify-between q-py-sm bg-slate-50 border-b">
            <div class="row items-center">
              <q-icon :name="matCalendarMonth" size="18px" color="primary" class="q-mr-xs" />
              <span class="text-subtitle2 text-weight-bold text-dark">
                {{ store.esOrganizador ? 'Partidos Recientes' : 'Partidos de tu Club' }}
              </span>
            </div>
            <!-- Original: <q-btn flat dense no-caps color="primary" label="Ver Fixture" to="/fixture" size="sm" :icon-right="matArrowForward" /> -->
            <AppActionButton flat dense no-caps tone="primary" label="Ver Fixture" to="/fixture" size="sm" :icon-right="matArrowForward" />
          </q-card-section>

          <q-list separator class="match-mini-list">
            <q-item v-for="p in partidosResumen" :key="p.id" class="q-py-sm">
              <q-item-section>
                <div class="row items-center justify-between text-caption text-grey-6 font-mono q-mb-xs">
                  <span>Jornada {{ p.fecha }}</span>
                  <q-badge :color="finalizado(p) ? 'positive' : 'amber-8'" text-color="white" size="xs">
                    {{ finalizado(p) ? 'Finalizado' : 'En Preparación' }}
                  </q-badge>
                </div>
                <div class="row items-center justify-between no-wrap">
                  <div class="row items-center no-wrap ellipsis" style="max-width: 140px">
                    <span class="club-color-dot q-mr-xs" :style="{ background: colorEquipo(p.localId) }" />
                    <span class="text-weight-medium ellipsis">{{ nombreEquipo(p.localId) }}</span>
                  </div>
                  <div class="font-mono text-weight-bolder text-dark q-px-sm">
                    {{ finalizado(p) ? `${p.golesLocal} - ${p.golesVisitante}` : 'vs' }}
                  </div>
                  <div class="row items-center justify-end no-wrap ellipsis" style="max-width: 140px">
                    <span class="text-weight-medium ellipsis text-right">{{ nombreEquipo(p.visitanteId) }}</span>
                    <span class="club-color-dot q-ml-xs" :style="{ background: colorEquipo(p.visitanteId) }" />
                  </div>
                </div>

                <!-- Información de Goleadores y Asistencias del Partido -->
                <div v-if="finalizado(p) && p.goleadores && p.goleadores.length" class="text-caption text-grey-8 font-mono font-10 q-mt-xs bg-slate-50 q-pa-xs rounded-borders border">
                  <div class="row items-center q-gutter-xs">
                    <span class="text-emerald-9 text-weight-bold">⚽ Goles:</span>
                    <span class="text-dark">
                      {{ p.goleadores.map(g => `${g.nombre}${g.dorsal ? ` (#${g.dorsal})` : ''}${g.minuto ? ` ${g.minuto}'` : ''}`).join(' · ') }}
                    </span>
                  </div>
                  <div v-if="p.goleadores.some(g => g.asistenteNombre)" class="row items-center q-gutter-xs q-mt-xs">
                    <span class="text-indigo-9 text-weight-bold">🎯 Asistencias:</span>
                    <span class="text-dark">
                      {{ p.goleadores.filter(g => g.asistenteNombre).map(g => `${g.asistenteNombre} ➔ ${g.nombre}`).join(' · ') }}
                    </span>
                  </div>
                </div>
              </q-item-section>
            </q-item>

            <q-item v-if="!store.partidos.length" class="q-py-md text-center text-grey-6">
              <q-item-section>
                <div class="text-caption">Aún no se han programado partidos</div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- Widget: Top Goleadores -->
        <q-card flat bordered class="bg-white rounded-borders overflow-hidden">
          <q-card-section class="row items-center justify-between q-py-sm bg-slate-50 border-b">
            <div class="row items-center">
              <q-icon :name="matMilitaryTech" size="18px" color="amber-9" class="q-mr-xs" />
              <span class="text-subtitle2 text-weight-bold text-dark">Top Goleadores</span>
            </div>
            <!-- Original: <q-btn flat dense no-caps color="primary" label="Ver Tabla" to="/ranking" size="sm" :icon-right="matArrowForward" /> -->
            <AppActionButton flat dense no-caps tone="primary" label="Ver Tabla" to="/ranking" size="sm" :icon-right="matArrowForward" />
          </q-card-section>

          <q-list separator>
            <q-item v-for="(g, idx) in goleadoresResumen" :key="g.id" class="q-py-sm">
              <q-item-section avatar style="min-width: 32px">
                <span class="font-mono text-weight-bold" :class="idx === 0 ? 'text-amber-8 text-h6' : 'text-grey-7'">
                  {{ idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.` }}
                </span>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold text-dark">{{ g.nombre }} {{ g.apellido || '' }}</q-item-label>
                <q-item-label caption class="text-grey-6">
                  Dorsal #{{ g.numero || g.dorsal || '-' }} · {{ nombreEquipo(g.equipoId ?? g.equipo) }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge color="positive" text-color="white" class="font-mono text-weight-bold q-px-sm">
                  {{ g.goles || 0 }} goles ⚽
                </q-badge>
              </q-item-section>
            </q-item>

            <q-item v-if="!goleadoresResumen.length" class="q-py-md text-center text-grey-6">
              <q-item-section>
                <div class="text-caption">Aún no hay goleadores registrados</div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- Widget: Top Asistidores -->
        <q-card flat bordered class="bg-white rounded-borders overflow-hidden q-mt-md">
          <q-card-section class="row items-center justify-between q-py-sm bg-slate-50 border-b">
            <div class="row items-center">
              <q-icon :name="matAutoAwesome" size="18px" color="blue-9" class="q-mr-xs" />
              <span class="text-subtitle2 text-weight-bold text-dark">Top Asistidores</span>
            </div>
            <!-- Original: <q-btn flat dense no-caps color="primary" label="Ver Ranking" to="/ranking" size="sm" :icon-right="matArrowForward" /> -->
            <AppActionButton flat dense no-caps tone="primary" label="Ver Ranking" to="/ranking" size="sm" :icon-right="matArrowForward" />
          </q-card-section>

          <q-list separator>
            <q-item v-for="(a, idx) in asistidoresResumen" :key="a.id" class="q-py-sm">
              <q-item-section avatar style="min-width: 32px">
                <span class="font-mono text-weight-bold" :class="idx === 0 ? 'text-blue-8 text-h6' : 'text-grey-7'">
                  {{ idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.` }}
                </span>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold text-dark">{{ a.nombre }} {{ a.apellido || '' }}</q-item-label>
                <q-item-label caption class="text-grey-6">
                  Dorsal #{{ a.numero || a.dorsal || '-' }} · {{ nombreEquipo(a.equipoId ?? a.equipo) }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge color="indigo-8" text-color="white" class="font-mono text-weight-bold q-px-sm">
                  {{ a.asistencias || 0 }} asist. 🎯
                </q-badge>
              </q-item-section>
            </q-item>

            <q-item v-if="!asistidoresResumen.length" class="q-py-md text-center text-grey-6">
              <q-item-section>
                <div class="text-caption">Aún no hay asistencias registradas</div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTorneo } from '../store/torneo.js'
import AppActionButton from '../components/AppActionButton.vue'
import {
  matSearch,
  matSports,
  matSportsSoccer,
  matSportsScore,
  matGroupAdd,
  matAdd,
  matCalendarMonth,
  matMilitaryTech,
  matArrowForward,
  matShield,
  matSpeed,
  matLock,
  matAutoAwesome
} from '@quasar/extras/material-icons'

const store = useTorneo()
const roleStore = store

const roleBadgeClass = computed(() => {
  if (store.esOrganizador) return 'bg-amber-6 text-slate-900 font-bold border border-amber-400'
  if (store.esEntrenador) return 'bg-emerald-6 text-white font-bold border border-emerald-400'
  if (store.esJugador) return 'bg-indigo-6 text-white font-bold border border-indigo-400'
  return 'bg-slate-700 text-white font-bold border border-slate-600'
})
const buscar = ref('')
const filtroVistaTabla = ref('todos')
const filtroVistaPartidos = ref('todos')

const finalizado = (p) => ['jugado', 'finalizado'].includes(String(p?.estado || '').toLowerCase())

const metricas = computed(() => [
  { label: 'Clubes Inscriptos', value: store.stats.equipos, sub: 'Equipos en competencia', icon: matShield, bgClass: 'bg-emerald-50', iconClass: 'text-emerald-700' },
  { label: 'Partidos Jugados', value: store.stats.partidos, sub: 'Encuentros disputados', icon: matSportsSoccer, bgClass: 'bg-indigo-50', iconClass: 'text-indigo-700' },
  { label: 'Goles Totales', value: store.stats.goles, sub: 'Goles anotados en el torneo', icon: matSpeed, bgClass: 'bg-amber-50', iconClass: 'text-amber-800' },
  { label: 'Promedio de Gol', value: store.stats.promedio, sub: 'Por encuentro oficial', icon: matMilitaryTech, bgClass: 'bg-teal-50', iconClass: 'text-teal-700' }
])

const tablaConPosiciones = computed(() => {
  return store.tabla.map((e, i) => ({
    ...e,
    pos: i + 1,
    color: e.color || e.escudocolor || '#059669',
    esMiClub: (store.esJugador || store.esEntrenador) && String(e.id || e._id || '').trim() === String(store.miEquipoId || '').trim()
  }))
})

const miClubEnTabla = computed(() => {
  const miEqId = String(store.miEquipoId || '').trim()
  if (!miEqId) return null
  return tablaConPosiciones.value.find(e => String(e.id || e._id || '').trim() === miEqId) || null
})

const filas = computed(() => {
  const todas = tablaConPosiciones.value

  // El Entrenador y el Organizador pueden ver la tabla completa con todos los equipos
  // El jugador mantiene su filtro personal si no está usando el buscador
  if (store.esJugador && !buscar.value) {
    const miEqId = String(store.miEquipoId || '').trim()
    if (miEqId) {
      return todas.filter(e => String(e.id || e._id || '').trim() === miEqId)
    }
  }

  return todas.filter(e =>
    !buscar.value ||
    e.nombre?.toLowerCase().includes(buscar.value.toLowerCase()) ||
    e.barriada?.toLowerCase().includes(buscar.value.toLowerCase())
  )
})

const partidosResumen = computed(() => {
  let list = [...store.partidos]
  if (store.esJugador || store.esEntrenador) {
    const miEqId = String(store.miEquipoId || '').trim()
    if (miEqId) {
      list = list.filter(p => String(p.localId || '').trim() === miEqId || String(p.visitanteId || '').trim() === miEqId)
    }
  }
  return list.slice(-8).reverse()
})

const goleadoresResumen = computed(() => {
  let list = store.goleadores
  if (store.esJugador || store.esEntrenador) {
    const miId = String(store.miEquipoId || '').trim()
    list = list.filter(g => String((g.equipoId || g.equipo || '')).trim() === miId)
  }
  return [...list].slice(0, 5)
})

const asistidoresResumen = computed(() => {
  let list = store.asistidores
  if (store.esJugador || store.esEntrenador) {
    const miId = String(store.miEquipoId || '').trim()
    list = list.filter(a => String((a.equipoId || a.equipo || '')).trim() === miId)
  }
  return [...list].slice(0, 5)
})

function nombreEquipo(id) {
  const eq = store.equipoPorId(id)
  return eq ? eq.nombre : 'Club'
}

function colorEquipo(id) {
  const eq = store.equipoPorId(id)
  return eq?.color || eq?.escudocolor || '#059669'
}
</script>

<style scoped>
.tournament-hero-card {
  background: linear-gradient(135deg, #064e3b 0%, #022c22 60%, #0f172a 100%);
  border: 1px solid #047857;
  box-shadow: 0 10px 25px -5px rgba(2, 44, 34, 0.4);
}
.hero-heading {
  font-size: clamp(1.6rem, 3.5vw, 2.3rem);
  line-height: 1.15;
}
.hero-subtext {
  font-size: 0.95rem;
  max-width: 620px;
}
.atlas-badge {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 6px 14px;
  border-radius: 9999px;
}
.atlas-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #34d399;
  box-shadow: 0 0 10px #34d399;
}
.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #34d399;
  display: inline-block;
}
.role-pill {
  display: inline-flex;
  align-items: center;
}
.metric-card {
  border: 1px solid #e2e8f0;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px -4px rgba(0, 0, 0, 0.06);
}
.metric-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-onboarding-card {
  border: 1px dashed #cbd5e1;
}
.empty-icon-wrap {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background-color: #ecfdf5;
  display: flex;
  align-items: center;
  justify-content: center;
}
.main-table-card {
  border: 1px solid #e2e8f0;
}
.table-toolbar {
  border-bottom: 1px solid #e2e8f0;
}
.search-input {
  min-width: 260px;
}
.legend-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  font-size: 0.74rem;
  font-weight: 800;
  color: #ffffff !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}
.legend-v {
  background-color: #16a34a !important;
}
.legend-e {
  background-color: #d97706 !important;
}
.legend-d {
  background-color: #dc2626 !important;
}
.table-responsive {
  overflow-x: auto;
  width: 100%;
}
.posiciones-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}
.posiciones-table thead th {
  background-color: #f8fafc;
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 12px 14px;
  border-bottom: 2px solid #e2e8f0;
}
.posiciones-table tbody td {
  padding: 12px 14px;
  font-size: 0.88rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.table-row:hover {
  background-color: #f8fafc;
}
.leader-row {
  background-color: #f0fdf4;
}
.leader-row:hover {
  background-color: #dcfce7;
}
.playoff-zone {
  border-left: 3px solid #059669;
}
.club-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-block;
}
.td-pts {
  font-size: 1.05rem;
  font-weight: 800;
}
.th-racha, .td-racha {
  min-width: 140px;
}
.racha-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  font-size: 0.76rem;
  font-weight: 800;
  line-height: 1;
  color: #ffffff !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
.racha-v {
  background-color: #16a34a !important;
}
.racha-e {
  background-color: #d97706 !important;
}
.racha-d {
  background-color: #dc2626 !important;
}
.zone-marker {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  display: inline-block;
}
.border-b {
  border-bottom: 1px solid #e2e8f0;
}
.border-t {
  border-top: 1px solid #e2e8f0;
}
.bg-slate-50 {
  background-color: #f8fafc;
}
</style>
