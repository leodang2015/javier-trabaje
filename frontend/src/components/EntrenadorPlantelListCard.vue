<template>
  <q-card flat bordered class="bg-white rounded-borders">
    <q-card-section class="bg-slate-900 text-white row items-center justify-between q-py-sm">
      <div class="row items-center q-gutter-xs">
        <q-icon :name="matSwapHoriz" size="20px" color="amber" />
        <span class="text-subtitle2 text-weight-bold">Asignar Posiciones de Jugadores</span>
      </div>
      <q-badge color="primary" text-color="white" :label="`${jugadores.length} futbolistas`" />
    </q-card-section>

    <q-card-section class="q-pa-md">
      <div class="text-caption text-grey-7 q-mb-md">
        Como <strong>Entrenador</strong>, selecciona la posición táctica o asigna el rol <strong>"En Banca"</strong> a tus suplentes. Solo pueden jugar 11 en cancha.
      </div>

      <q-banner v-if="mensajeExito" dense rounded class="bg-emerald-1 text-positive q-mb-md text-caption">
        <template #avatar>
          <q-icon :name="matCheckCircle" color="positive" size="18px" />
        </template>
        {{ mensajeExito }}
      </q-banner>

      <div v-if="!jugadores.length" class="text-center q-py-lg text-grey-6">
        <q-icon :name="matGroups" size="36px" color="grey-4" class="q-mb-xs" />
        <div class="text-subtitle2 text-weight-medium text-slate-800">No hay futbolistas en {{ equipoNombre || 'este club' }} todavía.</div>
        <div class="text-caption text-grey-6 q-mt-xs">
          Los jugadores se integran al iniciar sesión con su cuenta asignada (mediante su contraseña de cuenta) o mediante la nómina oficial completada por el organizador.
        </div>
      </div>

      <q-list v-else separator class="rounded-borders overflow-hidden border">
        <q-item
          v-for="j in jugadores"
          :key="j.id"
          class="q-py-sm items-center"
          :class="{ 'bg-emerald-50': jugadorEditandoId === j.id, 'bg-slate-50 opacity-90': normalizarPos(j.posicion) === 'banca' }"
        >
          <q-item-section avatar style="min-width: 44px">
            <div
              class="dorsal-badge text-weight-bold text-center"
              :style="{ backgroundColor: colorPorPosicion(j.posicion) }"
            >
              {{ j.numero || j.dorsal || '—' }}
            </div>
          </q-item-section>

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

          <q-item-section side class="row items-center no-wrap q-gutter-xs">
            <template v-if="puedeEditar">
              <q-btn
                v-if="!esElCapitan(j)"
                dense
                flat
                round
                size="sm"
                color="amber-8"
                :icon="matMilitaryTech"
                title="Nombrar Capitán del Equipo (Ⓒ)"
                @click="$emit('nombrar-capitan', j)"
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
                @click="$emit('cambiar-posicion', { jugador: j, posicion: 'Delantero' })"
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
                @click="$emit('cambiar-posicion', { jugador: j, posicion: 'En Banca' })"
              />

              <q-select
                :model-value="normalizarPos(j.posicion) === 'banca' ? 'En Banca' : (j.posicion || 'Delantero')"
                :options="posicionesDisponibles"
                outlined
                dense
                options-dense
                :loading="actualizandoId === j.id"
                :disable="actualizandoId === j.id"
                @update:model-value="$emit('cambiar-posicion', { jugador: j, posicion: $event })"
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
</template>

<script setup>
import {
  matSwapHoriz,
  matCheckCircle,
  matGroups,
  matMilitaryTech,
  matArrowUpward,
  matEventSeat
} from '@quasar/extras/material-icons'

defineProps({
  jugadores: {
    type: Array,
    required: true
  },
  equipoNombre: {
    type: String,
    default: ''
  },
  mensajeExito: {
    type: String,
    default: ''
  },
  jugadorEditandoId: {
    type: [String, Number],
    default: null
  },
  actualizandoId: {
    type: [String, Number],
    default: null
  },
  puedeEditar: {
    type: Boolean,
    default: false
  },
  posicionesDisponibles: {
    type: Array,
    required: true
  },
  normalizarPos: {
    type: Function,
    required: true
  },
  colorPorPosicion: {
    type: Function,
    required: true
  },
  badgeColorPorPosicion: {
    type: Function,
    required: true
  },
  esElCapitan: {
    type: Function,
    required: true
  }
})

defineEmits(['nombrar-capitan', 'cambiar-posicion'])
</script>

<style scoped>
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
.bg-emerald-50 {
  background-color: #ecfdf5;
}
</style>
