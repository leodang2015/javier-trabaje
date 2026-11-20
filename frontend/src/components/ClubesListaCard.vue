<template>
  <q-card flat bordered class="bg-white rounded-borders overflow-hidden">
    <q-card-section class="q-py-md bg-slate-50 border-b">
      <div>
        <div class="text-subtitle1 text-weight-bold text-dark">Clubes del Torneo</div>
        <div class="text-caption text-grey-6">{{ clubes.length }} equipos registrados</div>
      </div>
    </q-card-section>

    <q-list separator class="club-list">
      <q-item
        v-for="e in clubes"
        :key="e.id || e._id"
        clickable
        :active="(e.id || e._id) === modelValue"
        active-class="active-club-item"
        class="q-py-md"
        @click="$emit('update:modelValue', e.id || e._id)"
      >
        <q-item-section avatar>
          <div class="club-list-badge-box" :style="{ backgroundColor: e.escudocolor || e.color || '#059669' }">
            <img
              v-if="e.escudoUrl"
              :src="e.escudoUrl"
              alt="Escudo"
              class="club-list-badge-img"
            />
            <span v-else-if="e.escudoFigura" class="club-list-badge-emoji">{{ e.escudoFigura }}</span>
            <span v-else class="club-list-badge-dot" />
          </div>
        </q-item-section>

        <q-item-section>
          <div class="row items-center justify-between no-wrap">
            <div class="row items-center no-wrap ellipsis">
              <q-item-label class="text-weight-bold text-dark ellipsis">{{ e.nombre }}</q-item-label>
              <q-badge
                v-if="e.estadoAprobacion === 'Pendiente'"
                color="amber-9"
                text-color="white"
                class="q-ml-xs text-weight-bolder font-10"
              >
                Pendiente Autorización
              </q-badge>
              <q-badge
                v-if="esJugador && (e.id === miEquipoId || e._id === miEquipoId)"
                color="indigo-7"
                text-color="white"
                size="xs"
                class="q-ml-xs text-weight-bold"
              >
                Tu Club
              </q-badge>
            </div>
            <q-badge
              :color="equipoHabilitado(e.id || e._id) ? 'positive' : 'grey-7'"
              text-color="white"
              size="xs"
              class="q-ml-xs text-weight-bold"
            >
              {{ cantidadJugadores(e.id || e._id) }}/11 jug.
            </q-badge>
          </div>
          <q-item-label caption class="text-grey-6">
            {{ e.barriada || e.barrio || 'Sede Barrial' }} · DT: {{ e.capitan || e.tecnico || 'Sin asignar' }}
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-icon :name="matChevronRight" color="grey-5" size="18px" />
        </q-item-section>
      </q-item>

      <q-item v-if="!totalEquipos" class="q-py-xl text-center">
        <q-item-section class="text-grey-6">
          <q-icon :name="matGroups" size="36px" color="grey-4" class="q-mx-auto q-mb-xs" />
          <div class="text-body2 text-weight-medium">Sin equipos registrados</div>
          <div class="text-caption q-mt-xs">Los clubes son creados automáticamente por cada entrenador al registrarse.</div>
        </q-item-section>
      </q-item>
    </q-list>
  </q-card>
</template>

<script setup>
import { matChevronRight, matGroups } from '@quasar/extras/material-icons'

defineProps({
  modelValue: {
    type: [String, Number],
    default: null
  },
  clubes: {
    type: Array,
    required: true
  },
  totalEquipos: {
    type: Number,
    default: 0
  },
  esJugador: {
    type: Boolean,
    default: false
  },
  miEquipoId: {
    type: [String, Number],
    default: null
  },
  equipoHabilitado: {
    type: Function,
    required: true
  },
  cantidadJugadores: {
    type: Function,
    required: true
  }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.border-b {
  border-bottom: 1px solid #e2e8f0;
}
.bg-slate-50 {
  background-color: #f8fafc;
}
.active-club-item {
  background-color: #f0fdf4 !important;
  border-left: 3px solid #059669;
}
.club-list-badge-box {
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  max-width: 32px;
  max-height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}
.club-list-badge-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.club-list-badge-emoji {
  font-size: 18px;
  line-height: 1;
}
.club-list-badge-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: white;
}
</style>
