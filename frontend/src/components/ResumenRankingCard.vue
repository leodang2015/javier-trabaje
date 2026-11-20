<template>
  <q-card flat bordered class="bg-white rounded-borders overflow-hidden">
    <q-card-section class="row items-center justify-between q-py-sm bg-slate-50 border-b">
      <div class="row items-center">
        <q-icon :name="icon" size="18px" :color="iconColor" class="q-mr-xs" />
        <span class="text-subtitle2 text-weight-bold text-dark">{{ titulo }}</span>
      </div>
      <AppActionButton
        flat
        dense
        no-caps
        tone="primary"
        :label="actionLabel"
        to="/ranking"
        size="sm"
        :icon-right="matArrowForward"
      />
    </q-card-section>

    <q-list separator>
      <q-item v-for="(jugador, idx) in jugadores" :key="jugador.id" class="q-py-sm">
        <q-item-section avatar style="min-width: 32px">
          <span class="font-mono text-weight-bold" :class="idx === 0 ? `${rankColorClass} text-h6` : 'text-grey-7'">
            {{ idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.` }}
          </span>
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-bold text-dark">{{ jugador.nombre }} {{ jugador.apellido || '' }}</q-item-label>
          <q-item-label caption class="text-grey-6">
            Dorsal #{{ jugador.numero || jugador.dorsal || '-' }} · {{ nombreEquipo(jugador.equipoId ?? jugador.equipo) }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-badge :color="badgeColor" text-color="white" class="font-mono text-weight-bold q-px-sm">
            {{ jugador[campo] || 0 }} {{ campo === 'goles' ? 'goles ⚽' : 'asist. 🎯' }}
          </q-badge>
        </q-item-section>
      </q-item>

      <q-item v-if="!jugadores.length" class="q-py-md text-center text-grey-6">
        <q-item-section>
          <div class="text-caption">{{ emptyText }}</div>
        </q-item-section>
      </q-item>
    </q-list>
  </q-card>
</template>

<script setup>
import AppActionButton from './AppActionButton.vue'
import { matArrowForward } from '@quasar/extras/material-icons'

defineProps({
  titulo: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  iconColor: {
    type: String,
    default: 'amber-9'
  },
  actionLabel: {
    type: String,
    default: 'Ver Ranking'
  },
  jugadores: {
    type: Array,
    required: true
  },
  campo: {
    type: String,
    default: 'goles'
  },
  badgeColor: {
    type: String,
    default: 'positive'
  },
  rankColorClass: {
    type: String,
    default: 'text-amber-8'
  },
  emptyText: {
    type: String,
    default: 'Aún no hay registros'
  },
  nombreEquipo: {
    type: Function,
    required: true
  }
})
</script>

<style scoped>
.border-b {
  border-bottom: 1px solid #e2e8f0;
}
.bg-slate-50 {
  background-color: #f8fafc;
}
</style>
