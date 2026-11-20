<template>
  <div class="q-pa-md">
    <div class="row items-center justify-between q-mb-sm">
      <div>
        <div class="text-subtitle2 text-weight-bold text-dark row items-center q-gutter-xs">
          <span>Plantel Oficial del Club</span>
          <q-badge v-if="esMiClub" color="indigo-7" text-color="white" class="font-10 text-weight-bold">
            ⭐ Tu Club
          </q-badge>
        </div>
        <div v-if="!store.esJugador" class="text-caption text-grey-7 font-mono">
          {{ plantel.length }} en nómina ·
          <span :class="store.cantidadEnCancha(equipoId) > 11 ? 'text-negative text-weight-bolder' : 'text-emerald-8 text-weight-bold'">
            {{ store.cantidadEnCancha(equipoId) }}/11 en cancha
          </span>
          <span v-if="store.cantidadEnCancha(equipoId) > 11" class="text-negative text-weight-bolder q-ml-xs">
            ⚠️ (Excedido en +{{ store.cantidadEnCancha(equipoId) - 11 }})
          </span>
          · {{ store.cantidadEnBanca(equipoId) }} en banca
        </div>
        <div v-else class="text-caption text-grey-7 font-mono">
          {{ plantel.length }} futbolistas inscritos · Plantel público oficial
        </div>
      </div>
      <q-btn
        v-if="!store.esJugador && store.cantidadEnCancha(equipoId) > 11"
        unelevated
        dense
        size="sm"
        color="negative"
        no-caps
        label="Enviar excedentes a banca"
        @click="store.enviarExcedentesABanca(equipoId)"
      />
    </div>

    <div class="table-responsive">
      <table class="roster-table">
        <thead>
          <tr>
            <th class="th-dorsal text-center">Dorsal</th>
            <th class="th-name text-left">Jugador</th>
            <th class="th-pos text-center">Posición / Rol</th>
            <th class="th-goles text-center">Goles</th>
            <th class="th-cards text-center">Tarjetas</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="j in plantel"
            :key="j.id"
            class="roster-row"
            :class="{ 'bg-indigo-50 border-l-4 border-indigo-7': esMismoJugador(j) }"
          >
            <td class="text-center font-mono text-weight-bold text-primary">
              <div class="row items-center justify-center q-gutter-xs">
                <span class="dorsal-tag">#{{ j.dorsal ?? j.numero ?? '—' }}</span>
                <span v-if="j.expulsadoDelTorneo" class="text-negative text-weight-bolder font-10" title="Expulsado del equipo y torneo por 3 rojas">
                  🚫 EXPULSADO
                </span>
                <span v-else-if="j.partidosSuspendidosRestantes > 0" class="text-amber-10 text-weight-bolder font-10 bg-amber-100 q-px-xs rounded" :title="j.motivoSancion">
                  🛑 Suspendido ({{ j.partidosSuspendidosRestantes }} PJ)
                </span>
                <span v-else-if="j.tarjetasRojasAcumuladas > 0" class="text-negative font-10 font-bold">
                  🟥 x{{ j.tarjetasRojasAcumuladas }}
                </span>
                <q-btn
                  v-if="store.esJugador && esMismoJugador(j)"
                  flat
                  round
                  dense
                  size="xs"
                  color="indigo-7"
                  :icon="matEdit"
                  @click="$emit('cambiar-dorsal', j)"
                >
                  <q-tooltip>Cambiar tu número de camiseta</q-tooltip>
                </q-btn>
              </div>
            </td>
            <td class="text-weight-bold text-dark">
              <div class="row items-center no-wrap q-gutter-xs">
                <span>{{ [j.nombre, j.apellido].filter(Boolean).join(' ') }}</span>
                <q-badge
                  v-if="esMismoJugador(j)"
                  color="indigo-7"
                  text-color="white"
                  class="text-weight-bolder font-10 q-px-xs"
                >
                  TÚ
                </q-badge>
                <q-badge
                  v-if="j.esCapitan || equipo?.capitan === j.nombre"
                  color="amber-9"
                  text-color="white"
                  class="text-weight-bolder font-10 q-px-xs"
                  title="Capitán Oficial del Club"
                >
                  Ⓒ CAPITÁN
                </q-badge>
              </div>
            </td>
            <td class="text-center">
              <span
                class="pos-badge"
                :class="store.normalizarPosicion(j.posicion) === 'banca' ? 'pos-badge-banca' : 'pos-badge-cancha'"
              >
                {{ store.normalizarPosicion(j.posicion) === 'banca' ? '🪑 En Banca' : (j.posicion || 'Delantero') }}
              </span>
            </td>
            <td class="text-center font-mono text-weight-bold">
              {{ j.goles ?? 0 }}
            </td>
            <td class="text-center">
              <span class="card-pill bg-amber-500 text-white q-mr-xs">{{ j.amarillas ?? 0 }}</span>
              <span class="card-pill bg-rose-600 text-white">{{ j.rojas ?? 0 }}</span>
            </td>
          </tr>

          <tr v-if="!plantel.length">
            <td colspan="5" class="text-center q-py-lg text-grey-6">
              <div class="q-py-md">
                <q-icon :name="matPersonOutline" size="32px" color="grey-4" class="q-mb-xs" />
                <div class="text-body2 text-weight-medium">Aún no hay jugadores registrados en este club.</div>
                <div class="text-caption text-grey-6 q-mt-xs">
                  Los futbolistas se incorporan al registrarse con rol jugador (con su clave de acceso) o mediante la nómina completada por el organizador.
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTorneo } from '../store/torneo.js'
import { matEdit, matPersonOutline } from '@quasar/extras/material-icons'

const props = defineProps({
  plantel: {
    type: Array,
    required: true
  },
  equipo: {
    type: Object,
    default: null
  },
  esMiClub: {
    type: Boolean,
    default: false
  },
  esMismoJugador: {
    type: Function,
    required: true
  }
})

defineEmits(['cambiar-dorsal'])

const store = useTorneo()
const equipoId = computed(() => props.equipo?.id || props.equipo?._id || '')
</script>

<style scoped>
.table-responsive {
  overflow-x: auto;
  width: 100%;
}
.roster-table {
  width: 100%;
  border-collapse: collapse;
}
.roster-table thead th {
  background-color: #f8fafc;
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 10px 12px;
  border-bottom: 2px solid #e2e8f0;
}
.roster-table tbody td {
  padding: 10px 12px;
  font-size: 0.88rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.roster-row:hover {
  background-color: #f8fafc;
}
.pos-badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.74rem;
  font-weight: 600;
  display: inline-block;
}
.pos-badge-banca {
  background-color: #f1f5f9;
  color: #475569;
  border: 1px dashed #94a3b8;
}
.pos-badge-cancha {
  background-color: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
  font-weight: 700;
}
.card-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  font-size: 0.68rem;
  font-weight: 700;
}
.dorsal-tag {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: #e0e7ff;
  color: #3730a3;
  font-size: 0.85rem;
}
</style>
