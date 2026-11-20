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

        <PosicionesTableCard
          v-model="buscar"
          :filas="filas"
          :mi-club-en-tabla="miClubEnTabla"
          :es-organizador="store.esOrganizador"
          :es-entrenador="store.esEntrenador"
          :mi-equipo-nombre="store.miEquipo?.nombre || ''"
          :promedio-torneo="store.stats.promedio"
        />
      </div>

      <!-- Columna Lateral: Resumen de Partidos & Goleadores -->
      <div class="col-12 col-lg-4 q-gutter-y-md">
        <PartidosRecientesCard
          :titulo="store.esOrganizador ? 'Partidos Recientes' : 'Partidos de tu Club'"
          :partidos="partidosResumen"
          :total-partidos="store.partidos.length"
          :finalizado="finalizado"
          :nombre-equipo="nombreEquipo"
          :color-equipo="colorEquipo"
        />

        <ResumenRankingCard
          titulo="Top Goleadores"
          :icon="matMilitaryTech"
          icon-color="amber-9"
          action-label="Ver Tabla"
          :jugadores="goleadoresResumen"
          campo="goles"
          badge-color="positive"
          rank-color-class="text-amber-8"
          empty-text="Aún no hay goleadores registrados"
          :nombre-equipo="nombreEquipo"
        />

        <ResumenRankingCard
          class="q-mt-md"
          titulo="Top Asistidores"
          :icon="matAutoAwesome"
          icon-color="blue-9"
          action-label="Ver Ranking"
          :jugadores="asistidoresResumen"
          campo="asistencias"
          badge-color="indigo-8"
          rank-color-class="text-blue-8"
          empty-text="Aún no hay asistencias registradas"
          :nombre-equipo="nombreEquipo"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTorneo } from '../store/torneo.js'
import PosicionesTableCard from '../components/PosicionesTableCard.vue'
import PartidosRecientesCard from '../components/PartidosRecientesCard.vue'
import ResumenRankingCard from '../components/ResumenRankingCard.vue'
import {
  matSports,
  matSportsSoccer,
  matSportsScore,
  matGroupAdd,
  matAdd,
  matMilitaryTech,
  matShield,
  matSpeed,
  matAutoAwesome,
  matTableChart
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
</style>
