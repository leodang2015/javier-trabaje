<template>
  <div class="ranking-view">
    <div class="row q-col-gutter-lg">
      <div v-for="t in tablas" :key="t.titulo" class="col-12 col-md-6">
        <q-card flat bordered class="bg-white rounded-borders overflow-hidden ranking-card">
          <!-- Encabezado de la tabla de figuras -->
          <q-card-section class="row items-center justify-between q-py-md bg-slate-50 border-b">
            <div class="row items-center">
              <q-avatar size="32px" :color="t.avatarBg" :text-color="t.avatarColor" class="q-mr-sm">
                <q-icon :name="t.icon" size="18px" />
              </q-avatar>
              <div>
                <div class="text-subtitle1 text-weight-bold text-dark">{{ t.titulo }}</div>
                <div class="text-caption text-grey-6">{{ t.subtitulo }}</div>
              </div>
            </div>
            <span class="text-caption text-weight-bold text-grey-5 uppercase font-mono">TOP 10</span>
          </q-card-section>

          <!-- Tabla de Jugadores -->
          <div class="table-responsive">
            <table class="ranking-table">
              <thead>
                <tr>
                  <th class="th-pos text-center">Rank</th>
                  <th class="th-player text-left">Jugador</th>
                  <th class="th-club text-left">Club</th>
                  <th class="th-count text-right">{{ t.label }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(j, i) in t.datos" :key="j.id" class="ranking-row">
                  <!-- Posición con medalla -->
                  <td class="text-center font-mono td-pos">
                    <span
                      class="rank-badge"
                      :class="{
                        'gold-badge': i === 0,
                        'silver-badge': i === 1,
                        'bronze-badge': i === 2,
                        'normal-badge': i > 2
                      }"
                    >
                      {{ i + 1 }}
                    </span>
                  </td>

                  <!-- Jugador -->
                  <td class="td-player">
                    <div class="text-weight-bold text-dark">
                      {{ [j.nombre, j.apellido].filter(Boolean).join(' ') }}
                    </div>
                    <div class="text-caption text-grey-5 font-mono">
                      Dorsal #{{ j.dorsal ?? j.numero ?? '—' }} · {{ j.posicion || 'Jugador' }}
                    </div>
                  </td>

                  <!-- Club -->
                  <td class="td-club">
                    <div class="row items-center no-wrap">
                      <span
                        class="club-dot q-mr-xs"
                        :style="{ background: colorEquipo(j.equipoId ?? j.equipo) }"
                      />
                      <span class="text-grey-8 ellipsis text-caption text-weight-medium">
                        {{ nombreEquipo(j.equipoId ?? j.equipo) }}
                      </span>
                    </div>
                  </td>

                  <!-- Cifra Oficial -->
                  <td class="text-right font-mono td-score text-weight-bolder">
                    <span
                      class="q-px-sm q-py-xs rounded-borders text-weight-bolder text-subtitle2 shadow-xs"
                      :class="t.campo === 'goles' ? 'bg-orange-1 text-orange-9 border border-orange-3' : 'bg-blue-1 text-blue-9 border border-blue-3'"
                    >
                      {{ j[t.campo] ?? 0 }} {{ t.campo === 'goles' ? '⚽' : '🎯' }}
                    </span>
                  </td>
                </tr>

                <tr v-if="!t.datos.length">
                  <td colspan="4" class="text-center q-py-xl text-grey-6">
                    <q-icon :name="t.icon" size="36px" color="grey-4" class="q-mb-xs" />
                    <div class="text-body2 text-weight-medium">Sin registros computados aún.</div>
                    <div class="text-caption text-grey-5">
                      Los datos se actualizarán automáticamente a medida que se carguen partidos.
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTorneo } from '../store/torneo.js'
import { matLocalFireDepartment, matAutoAwesome } from '@quasar/extras/material-icons'

const store = useTorneo()

const goleadoresFiltrados = computed(() => {
  let list = store.goleadores
  if (store.esJugador || store.esEntrenador) {
    const miId = String(store.miEquipoId || '').trim()
    list = list.filter(g => String((g.equipoId || g.equipo || '')).trim() === miId)
  }
  return list
})

const asistidoresFiltrados = computed(() => {
  let list = store.asistidores
  if (store.esJugador || store.esEntrenador) {
    const miId = String(store.miEquipoId || '').trim()
    list = list.filter(a => String((a.equipoId || a.equipo || '')).trim() === miId)
  }
  return list
})

const tablas = computed(() => [
  {
    titulo: (store.esJugador || store.esEntrenador) ? `Goleadores de tu Club (${store.miEquipo?.nombre || 'Mi Equipo'})` : 'Tabla de Goleadores',
    subtitulo: (store.esJugador || store.esEntrenador) ? 'Anotadores oficiales de tu plantel' : 'Máximos artilleros del torneo',
    icon: matLocalFireDepartment,
    avatarBg: 'orange-1',
    avatarColor: 'orange-9',
    scoreColor: 'text-emerald-700',
    campo: 'goles',
    label: 'Goles',
    datos: goleadoresFiltrados.value
  },
  {
    titulo: (store.esJugador || store.esEntrenador) ? `Asistidores de tu Club (${store.miEquipo?.nombre || 'Mi Equipo'})` : 'Máximos Asistidores',
    subtitulo: (store.esJugador || store.esEntrenador) ? 'Líderes en pases gol de tu plantel' : 'Líderes en pases gol y juego colectivo',
    icon: matAutoAwesome,
    avatarBg: 'blue-1',
    avatarColor: 'blue-9',
    scoreColor: 'text-blue-700',
    campo: 'asistencias',
    label: 'Asistencias',
    datos: asistidoresFiltrados.value
  }
])

function nombreEquipo(id) {
  return store.equipoPorId(id)?.nombre ?? 'Club no asignado'
}

function colorEquipo(id) {
  return store.equipoPorId(id)?.color || store.equipoPorId(id)?.escudocolor || '#059669'
}
</script>

<style scoped>
.border-b {
  border-bottom: 1px solid #e2e8f0;
}
.bg-slate-50 {
  background-color: #f8fafc;
}
.ranking-card {
  border: 1px solid #e2e8f0;
}
.table-responsive {
  overflow-x: auto;
  width: 100%;
}
.ranking-table {
  width: 100%;
  border-collapse: collapse;
}
.ranking-table thead th {
  background-color: #f8fafc;
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 10px 14px;
  border-bottom: 2px solid #e2e8f0;
}
.ranking-table tbody td {
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.ranking-row:hover {
  background-color: #f8fafc;
}
.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 800;
}
.gold-badge {
  background-color: #fef08a;
  color: #854d0e;
}
.silver-badge {
  background-color: #e2e8f0;
  color: #334155;
}
.bronze-badge {
  background-color: #ffedd5;
  color: #9a3412;
}
.normal-badge {
  background-color: #f1f5f9;
  color: #64748b;
}
.club-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.td-score {
  font-size: 1.15rem;
}
</style>
