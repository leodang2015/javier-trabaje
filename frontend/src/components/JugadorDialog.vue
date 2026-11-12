<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="width: 480px; max-width: 95vw" class="rounded-borders">
      <q-card-section class="bg-grey-10 text-white row items-center justify-between q-py-md">
        <div class="row items-center">
          <q-icon :name="matPersonAdd" color="positive" size="24px" class="q-mr-sm" />
          <div class="text-subtitle1 text-weight-bold">Registrar Jugador en Plantel</div>
        </div>
        <q-btn flat round dense :icon="matClose" v-close-popup text-color="grey-4" />
      </q-card-section>

      <q-card-section class="q-gutter-md q-pt-md">
        <div>
          <div class="text-caption text-weight-medium text-grey-8 q-mb-xs">Equipo Destino *</div>
          <q-select
            v-model="form.equipo"
            :options="opcionesEquipos"
            emit-value
            map-options
            outlined
            dense
            placeholder="Selecciona el club"
          />
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <div class="text-caption text-weight-medium text-grey-8 q-mb-xs">Nombre *</div>
            <q-input v-model="form.nombre" placeholder="Ej: Mateo" outlined dense />
          </div>
          <div class="col-12 col-sm-6">
            <div class="text-caption text-weight-medium text-grey-8 q-mb-xs">Apellido *</div>
            <q-input v-model="form.apellido" placeholder="Ej: González" outlined dense />
          </div>
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <div class="row items-center justify-between q-mb-xs">
              <span class="text-caption text-weight-medium text-grey-8">Dorsal / Número *</span>
              <span v-if="dorsalOcupadoPor" class="text-negative text-caption text-weight-bold">
                ⚠️ Ocupado
              </span>
            </div>
            <q-input
              v-model.number="form.dorsal"
              type="number"
              min="1"
              max="99"
              placeholder="Ej: 10"
              outlined
              dense
              :error="!!dorsalOcupadoPor"
              :error-message="dorsalOcupadoPor ? `En uso por ${dorsalOcupadoPor.nombre}` : ''"
            />
            <div v-if="siguienteDorsalDisponible && dorsalOcupadoPor" class="text-caption text-grey-7 q-mt-xs">
              Sugerencia libre: <q-btn flat dense no-caps color="primary" class="q-pa-none text-weight-bold" :label="'#' + siguienteDorsalDisponible" @click="form.dorsal = siguienteDorsalDisponible" />
            </div>
          </div>
          <div class="col-12 col-sm-6">
            <div class="text-caption text-weight-medium text-grey-8 q-mb-xs">Posición</div>
            <q-select
              v-model="form.posicion"
              :options="['Arquero', 'Defensor', 'Mediocampista', 'Delantero', 'En Banca']"
              outlined
              dense
            />
          </div>
        </div>

        <div v-if="error" class="text-negative text-caption q-mt-sm">{{ error }}</div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md bg-grey-1">
        <q-btn flat label="Cancelar" v-close-popup no-caps color="grey-7" />
        <q-btn
          color="primary"
          unelevated
          no-caps
          label="Guardar Jugador"
          :icon="matCheck"
          :loading="guardando"
          @click="guardar"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useTorneo } from '../store/torneo.js'
import { matPersonAdd, matClose, matCheck } from '@quasar/extras/material-icons'

const props = defineProps({
  modelValue: Boolean,
  equipoPreseleccionado: String
})
const emit = defineEmits(['update:modelValue'])
const store = useTorneo()

const form = ref({
  equipo: props.equipoPreseleccionado || '',
  nombre: '',
  apellido: '',
  dorsal: 10,
  posicion: 'Delantero'
})

watch(() => props.equipoPreseleccionado, (val) => {
  if (val) form.value.equipo = val
})

const error = ref('')
const guardando = ref(false)

const opcionesEquipos = computed(() =>
  store.equipos.map(e => ({
    label: e.nombre,
    value: e.id || e._id
  }))
)

const jugadoresDelEquipo = computed(() => {
  if (!form.value.equipo) return []
  return store.jugadores.filter(j => {
    const eqId = typeof j.equipo === 'object' ? (j.equipo._id || j.equipo.id) : j.equipo
    return String(eqId) === String(form.value.equipo)
  })
})

const dorsalOcupadoPor = computed(() => {
  const d = Number(form.value.dorsal)
  if (!d) return null
  return jugadoresDelEquipo.value.find(j => (Number(j.dorsal) === d || Number(j.numero) === d))
})

const siguienteDorsalDisponible = computed(() => {
  const usados = new Set(jugadoresDelEquipo.value.map(j => Number(j.dorsal || j.numero)))
  for (let num = 1; num <= 99; num++) {
    if (!usados.has(num)) return num
  }
  return 10
})

async function guardar() {
  error.value = ''
  if (!form.value.equipo) {
    error.value = 'Selecciona el equipo al que pertenece el jugador.'
    return
  }
  if (!form.value.nombre.trim()) {
    error.value = 'El nombre es obligatorio.'
    return
  }
  if (dorsalOcupadoPor.value) {
    error.value = `El dorsal #${form.value.dorsal} ya está asignado a ${dorsalOcupadoPor.value.nombre} en este equipo. Cada jugador debe tener un dorsal único.`
    return
  }

  guardando.value = true
  try {
    const nom = form.value.nombre.trim()
    const ape = (form.value.apellido || '').trim() || '-'
    const num = Number(form.value.dorsal) || 10
    const cleanNom = nom.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jugador'
    const cleanApe = ape.toLowerCase().replace(/[^a-z0-9]/g, '') || 'club'
    const autoEmail = `${cleanNom}.${cleanApe}.${Math.floor(1000 + Math.random() * 9000)}@futbolito.local`

    await store.agregarJugador({
      equipo: form.value.equipo,
      nombre: nom,
      apellido: ape,
      numero: num,
      dorsal: num,
      posicion: form.value.posicion || 'Delantero',
      email: autoEmail,
      password: 'futbolito123'
    })
    form.value = {
      equipo: props.equipoPreseleccionado || (store.equipos[0]?.id ?? ''),
      nombre: '',
      apellido: '',
      dorsal: 10,
      posicion: 'Delantero'
    }
    emit('update:modelValue', false)
  } catch (err) {
    error.value = err.message || 'Error al guardar el jugador.'
  } finally {
    guardando.value = false
  }
}
</script>
