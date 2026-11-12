<template>
  <div class="col-12 col-md-6">
    <q-card flat bordered class="bg-white rounded-borders overflow-hidden ranking-card">
      <q-card-section class="row items-center justify-between q-py-md bg-slate-50 border-b">
        <div class="row items-center">
          <q-avatar size="32px" :color="tabla.avatarBg" :text-color="tabla.avatarColor" class="q-mr-sm">
            <q-icon :name="tabla.icon" size="18px" />
          </q-avatar>
          <div>
            <div class="text-subtitle1 text-weight-bold text-dark">{{ tabla.titulo }}</div>
            <div class="text-caption text-grey-6">{{ tabla.subtitulo }}</div>
          </div>
        </div>
        <span class="text-caption text-weight-bold text-grey-5 uppercase font-mono">TOP 10</span>
      </q-card-section>

      <div class="table-responsive">
        <table class="ranking-table">
          <thead>
            <tr>
              <th class="th-pos text-center">Rank</th>
              <th class="th-player text-left">Jugador</th>
              <th class="th-club text-left">Club</th>
              <th class="th-count text-right">{{ tabla.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(jugador, indice) in tabla.datos" :key="jugador.id" class="ranking-row">
              <td class="text-center font-mono td-pos">
                <span
                  class="rank-badge"
                  :class="{
                    'gold-badge': indice === 0,
                    'silver-badge': indice === 1,
                    'bronze-badge': indice === 2,
                    'normal-badge': indice > 2
                  }"
                >
                  {{ indice + 1 }}
                </span>
              </td>

              <td class="td-player">
                <div class="text-weight-bold text-dark">
                  {{ [jugador.nombre, jugador.apellido].filter(Boolean).join(' ') }}
                </div>
                <div class="text-caption text-grey-5 font-mono">
                  Dorsal #{{ jugador.dorsal ?? jugador.numero ?? '—' }} · {{ jugador.posicion || 'Jugador' }}
                </div>
              </td>

              <td class="td-club">
                <div class="row items-center no-wrap">
                  <span
                    class="club-dot q-mr-xs"
                    :style="{ background: colorEquipo(jugador.equipoId ?? jugador.equipo) }"
                  />
                  <span class="text-grey-8 ellipsis text-caption text-weight-medium">
                    {{ nombreEquipo(jugador.equipoId ?? jugador.equipo) }}
                  </span>
                </div>
              </td>

              <td class="text-right font-mono td-score text-weight-bolder">
                <RankingScoreBadge :valor="jugador[tabla.campo] ?? 0" :campo="tabla.campo" />
              </td>
            </tr>

            <tr v-if="!tabla.datos.length">
              <td colspan="4" class="text-center q-py-xl text-grey-6">
                <q-icon :name="tabla.icon" size="36px" color="grey-4" class="q-mb-xs" />
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
</template>

<script setup>
import { useTorneo } from '../store/torneo.js'
import RankingScoreBadge from './RankingScoreBadge.vue'

defineProps({
  tabla: {
    type: Object,
    required: true
  }
})

const store = useTorneo()

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
