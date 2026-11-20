<template>
  <q-card flat bordered class="main-table-card bg-white rounded-borders overflow-hidden">
    <!-- Toolbar Superior: Filtro y Leyenda -->
    <q-card-section class="table-toolbar row items-center justify-between q-col-gutter-sm bg-slate-50 border-b">
      <div v-if="esOrganizador || esEntrenador" class="row items-center q-gutter-sm">
        <q-input
          :model-value="modelValue"
          dense
          outlined
          bg-color="white"
          placeholder="Buscar club por nombre o barrio..."
          class="search-input"
          clearable
          @update:model-value="$emit('update:modelValue', $event ?? '')"
        >
          <template #prepend>
            <q-icon :name="matSearch" size="18px" color="grey-6" />
          </template>
        </q-input>
        <span v-if="modelValue" class="text-caption text-grey-6 font-mono">
          {{ filas.length }} resultado(s)
        </span>
        <q-badge v-if="esEntrenador && miClubEnTabla" color="emerald-9" text-color="white" class="font-11">
          Tu Club: {{ miClubEnTabla.nombre }} (Puesto #{{ miClubEnTabla.pos }})
        </q-badge>
      </div>
      <div v-else class="row items-center q-gutter-xs">
        <q-icon :name="matLock" size="18px" color="indigo-8" class="q-mr-xs" />
        <span class="text-subtitle2 text-weight-bold text-slate-800">
          Información de tu Club: {{ miClubEnTabla?.nombre || miEquipoNombre || 'Tu Equipo' }}
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
                  {{ modelValue ? `No se encontraron clubes que coincidan con "${modelValue}"` : 'No hay clubes registrados todavía en MongoDB Atlas.' }}
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
        <span v-if="esOrganizador">Zona de clasificación a fase final (puestos 1 a 4)</span>
        <span v-else>Tu club ocupa el puesto {{ miClubEnTabla?.pos ? `${miClubEnTabla.pos}°` : '—' }} en la competencia oficial</span>
      </div>
      <div class="font-mono text-grey-8">
        Promedio del torneo: <strong class="text-dark">{{ promedioTorneo }}</strong> goles/partido
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { matSearch, matLock, matSports } from '@quasar/extras/material-icons'

defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  filas: {
    type: Array,
    required: true
  },
  miClubEnTabla: {
    type: Object,
    default: null
  },
  esOrganizador: {
    type: Boolean,
    default: false
  },
  esEntrenador: {
    type: Boolean,
    default: false
  },
  miEquipoNombre: {
    type: String,
    default: ''
  },
  promedioTorneo: {
    type: [Number, String],
    default: 0
  }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
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
