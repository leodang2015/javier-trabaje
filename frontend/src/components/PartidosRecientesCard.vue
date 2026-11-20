<template>
  <q-card flat bordered class="bg-white rounded-borders overflow-hidden">
    <q-card-section class="row items-center justify-between q-py-sm bg-slate-50 border-b">
      <div class="row items-center">
        <q-icon :name="matCalendarMonth" size="18px" color="primary" class="q-mr-xs" />
        <span class="text-subtitle2 text-weight-bold text-dark">{{ titulo }}</span>
      </div>
      <AppActionButton flat dense no-caps tone="primary" label="Ver Fixture" to="/fixture" size="sm" :icon-right="matArrowForward" />
    </q-card-section>

    <q-list separator class="match-mini-list">
      <q-item v-for="p in partidos" :key="p.id" class="q-py-sm">
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

      <q-item v-if="!totalPartidos" class="q-py-md text-center text-grey-6">
        <q-item-section>
          <div class="text-caption">Aún no se han programado partidos</div>
        </q-item-section>
      </q-item>
    </q-list>
  </q-card>
</template>

<script setup>
import AppActionButton from './AppActionButton.vue'
import { matCalendarMonth, matArrowForward } from '@quasar/extras/material-icons'

defineProps({
  titulo: {
    type: String,
    required: true
  },
  partidos: {
    type: Array,
    required: true
  },
  totalPartidos: {
    type: Number,
    default: 0
  },
  finalizado: {
    type: Function,
    required: true
  },
  nombreEquipo: {
    type: Function,
    required: true
  },
  colorEquipo: {
    type: Function,
    required: true
  }
})
</script>

<style scoped>
.club-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-block;
}
.border-b {
  border-bottom: 1px solid #e2e8f0;
}
.bg-slate-50 {
  background-color: #f8fafc;
}
</style>
