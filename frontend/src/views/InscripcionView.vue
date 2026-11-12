<template>
  <div class="inscripcion-view">
    <div class="row justify-center">
      <div class="col-12 col-md-9 col-lg-8">
        <!-- Tarjeta Principal de Inscripción -->
        <q-card flat bordered class="bg-white rounded-borders overflow-hidden">
          <q-card-section class="bg-slate-900 text-white q-py-lg text-center">
            <div class="text-overline text-emerald-4 text-weight-bold letter-spacing-1">
              TORNEO OFICIAL BARRIAL
            </div>
            <div class="text-h5 text-weight-bolder q-mt-xs">
              Formulario de Inscripción de Club
            </div>
            <div class="text-caption text-grey-4 q-mt-xs max-w-lg mx-auto">
              Inscribe a tu equipo barrial en el campeonato oficial. Una vez registrado, el entrenador podrá armar la alineación y definir las posiciones de sus jugadores.
            </div>
          </q-card-section>

          <!-- Paso de Éxito cuando se inscribe -->
          <q-card-section v-if="clubInscrito" class="q-pa-xl text-center">
            <q-avatar size="64px" color="emerald-1" text-color="positive" class="q-mb-md">
              <q-icon :name="matCheckCircle" size="36px" />
            </q-avatar>
            <div class="text-h6 text-weight-bold text-slate-900">
              ¡{{ clubInscrito.nombre }} ha sido inscripto exitosamente!
            </div>
            <div class="text-body2 text-grey-7 q-mt-sm max-w-md mx-auto">
              El club ya forma parte de la liga. Ahora puedes agregar a los jugadores o pasar directamente a la pizarra táctica para definir sus posiciones.
            </div>

            <div class="row justify-center q-gutter-md q-mt-lg">
              <q-btn
                color="primary"
                unelevated
                no-caps
                :icon="matPersonAdd"
                label="Registrar Jugadores a este Club"
                @click="abrirRegistroJugador(clubInscrito.id || clubInscrito._id)"
                class="text-weight-bold"
              />
              <q-btn
                outline
                color="slate-800"
                no-caps
                :icon="matSports"
                label="Ir a Pizarra Táctica (DT)"
                to="/entrenador"
              />
              <q-btn
                flat
                color="grey-7"
                no-caps
                label="Inscribir Otro Equipo"
                @click="reiniciarFormulario"
              />
            </div>
          </q-card-section>

          <!-- Formulario de Inscripción -->
          <q-form v-else @submit.prevent="inscribirClub" class="q-pa-lg">
            <div class="row q-col-gutter-lg">
              <!-- Nombre del Equipo -->
              <div class="col-12 col-sm-7">
                <div class="text-caption text-weight-bold text-slate-700 q-mb-xs">
                  Nombre del Club / Equipo *
                </div>
                <q-input
                  v-model="form.nombre"
                  placeholder="Ej: Huracán del Sur, Los Halcones"
                  outlined
                  dense
                  :rules="[val => !!val.trim() || 'El nombre del club es obligatorio']"
                >
                  <template #prepend>
                    <q-icon :name="matShield" color="grey-6" size="18px" />
                  </template>
                </q-input>
              </div>

              <!-- Barriada / Barrio -->
              <div class="col-12 col-sm-5">
                <div class="text-caption text-weight-bold text-slate-700 q-mb-xs">
                  Barrio o Localidad *
                </div>
                <q-input
                  v-model="form.barriada"
                  placeholder="Ej: Barrio Norte, La Pampa"
                  outlined
                  dense
                  :rules="[val => !!val.trim() || 'El barrio es obligatorio']"
                />
              </div>

              <!-- Director Técnico (Entrenador) -->
              <div class="col-12 col-sm-6">
                <div class="text-caption text-weight-bold text-slate-700 q-mb-xs">
                  Director Técnico (DT / Entrenador)
                </div>
                <q-input
                  v-model="form.dt"
                  placeholder="Ej: Prof. Carlos Bilardo"
                  outlined
                  dense
                >
                  <template #prepend>
                    <q-icon :name="matSports" color="grey-6" size="18px" />
                  </template>
                </q-input>
              </div>

              <!-- Capitán del Equipo -->
              <div class="col-12 col-sm-6">
                <div class="text-caption text-weight-bold text-slate-700 q-mb-xs">
                  Capitán o Delegado
                </div>
                <q-input
                  v-model="form.capitan"
                  placeholder="Ej: Juan Román Riquelme"
                  outlined
                  dense
                />
              </div>

              <!-- Color del Escudo / Camiseta -->
              <div class="col-12">
                <div class="text-caption text-weight-bold text-slate-700 q-mb-xs">
                  Color Representativo del Club
                </div>
                <div class="row items-center q-gutter-sm q-mb-sm">
                  <div
                    v-for="color in coloresSugeridos"
                    :key="color"
                    class="color-swatch cursor-pointer"
                    :style="{ backgroundColor: color }"
                    :class="{ 'swatch-selected': form.escudocolor === color }"
                    @click="form.escudocolor = color"
                  />
                  <q-input
                    v-model="form.escudocolor"
                    outlined
                    dense
                    style="width: 120px"
                    class="q-ml-sm"
                  >
                    <template #append>
                      <q-icon name="colorize" class="cursor-pointer">
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                          <q-color v-model="form.escudocolor" />
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                </div>
              </div>
            </div>

            <!-- Error -->
            <div v-if="error" class="text-negative text-caption q-mt-sm">
              {{ error }}
            </div>

            <div class="row justify-end q-gutter-sm q-mt-md">
              <q-btn
                type="submit"
                color="primary"
                unelevated
                no-caps
                label="Confirmar Inscripción del Club"
                :icon="matCheckCircle"
                :loading="guardando"
                class="text-weight-bold q-px-lg"
              />
            </div>
          </q-form>
        </q-card>

        <!-- Lista de Clubes ya Inscriptos -->
        <div class="q-mt-lg">
          <div class="text-subtitle2 text-weight-bold text-slate-800 q-mb-sm row items-center justify-between">
            <span>Clubes Inscriptos en el Torneo ({{ store.equipos.length }})</span>
            <span class="text-caption text-grey-6">MongoDB Atlas</span>
          </div>

          <div class="row q-col-gutter-sm">
            <div
              v-for="e in store.equipos"
              :key="e.id || e._id"
              class="col-12 col-sm-6 col-md-4"
            >
              <q-card flat bordered class="bg-white rounded-borders q-pa-sm row items-center">
                <span
                  class="club-dot q-mr-sm"
                  :style="{ backgroundColor: e.escudocolor || '#059669' }"
                />
                <div class="col ellipsis">
                  <div class="text-weight-bold text-slate-900 text-caption ellipsis">{{ e.nombre }}</div>
                  <div class="text-grey-6 text-xs ellipsis">{{ e.barriada || 'Barrio Oficial' }} • DT: {{ e.capitan || 'Por definir' }}</div>
                </div>
              </q-card>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Registro de Jugador post-inscripción -->
    <JugadorDialog
      v-model="mostrarDialogoJugador"
      :equipo-preseleccionado="clubRecienInscritoId"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useTorneo, ROLES } from '../store/torneo.js'
import JugadorDialog from '../components/JugadorDialog.vue'
import {
  matShield,
  matSports,
  matCheckCircle,
  matPersonAdd
} from '@quasar/extras/material-icons'

const store = useTorneo()
const roleStore = store

const guardando = ref(false)
const error = ref('')
const clubInscrito = ref(null)
const clubRecienInscritoId = ref('')
const mostrarDialogoJugador = ref(false)

const coloresSugeridos = [
  '#059669', '#0d9488', '#0284c7', '#2563eb',
  '#7c3aed', '#db2777', '#dc2626', '#ea580c', '#d97706', '#1e293b'
]

const form = ref({
  nombre: '',
  barriada: '',
  dt: '',
  capitan: '',
  escudocolor: '#059669'
})

async function inscribirClub() {
  error.value = ''
  if (!form.value.nombre.trim()) {
    error.value = 'El nombre del club es obligatorio.'
    return
  }

  guardando.value = true
  try {
    await store.agregarEquipo({
      nombre: form.value.nombre.trim(),
      barriada: form.value.barriada.trim() || 'Barrio Oficial',
      capitan: form.value.dt.trim() || form.value.capitan.trim() || 'Director Técnico',
      escudocolor: form.value.escudocolor
    })

    // Localizar el equipo recién creado
    const equipoCreado = store.equipos.find(
      e => e.nombre.toLowerCase() === form.value.nombre.trim().toLowerCase()
    ) || store.equipos[store.equipos.length - 1]

    clubInscrito.value = equipoCreado || { nombre: form.value.nombre }
    clubRecienInscritoId.value = equipoCreado ? (equipoCreado.id || equipoCreado._id) : ''

    // Asignamos el equipo creado al entrenador en el roleStore
    if (clubRecienInscritoId.value) {
      roleStore.setEquipoEntrenador(clubRecienInscritoId.value)
    }
  } catch (err) {
    error.value = err.message || 'Error al inscribir el club'
  } finally {
    guardando.value = false
  }
}

function abrirRegistroJugador(equipoId) {
  clubRecienInscritoId.value = equipoId
  mostrarDialogoJugador.value = true
}

function reiniciarFormulario() {
  clubInscrito.value = null
  form.value = {
    nombre: '',
    barriada: '',
    dt: '',
    capitan: '',
    escudocolor: '#059669'
  }
}
</script>

<style scoped>
.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  transition: transform 0.15s ease;
}

.color-swatch:hover {
  transform: scale(1.15);
}

.swatch-selected {
  border-color: #0f172a;
  box-shadow: 0 0 0 2px white, 0 0 0 4px #0f172a;
}

.club-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.text-xs {
  font-size: 11px;
}

.letter-spacing-1 {
  letter-spacing: 0.1em;
}

.max-w-lg {
  max-width: 500px;
}

.max-w-md {
  max-width: 420px;
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}
</style>
