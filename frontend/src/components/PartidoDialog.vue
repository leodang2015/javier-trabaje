<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="width: 640px; max-width: 95vw; max-height: 90vh" class="rounded-borders column no-wrap overflow-hidden shadow-10">
      <!-- Encabezado Pinned -->
      <q-card-section class="bg-grey-10 text-white row items-center justify-between q-py-sm q-px-md shrink-0">
        <div class="row items-center q-gutter-xs">
          <q-icon :name="matSportsScore" color="positive" size="22px" />
          <div class="text-subtitle1 text-weight-bold">Programar Partido Oficial</div>
        </div>
        <q-btn
          unelevated
          no-caps
          dense
          color="amber-9"
          text-color="white"
          :icon="matAutoAwesome"
          label="✨ Generador Inteligente con IA Gemini"
          class="text-weight-bolder q-px-sm shadow-2"
          @click="mostrarModalIA = true"
        >
          <q-tooltip>Crea múltiples partidos automáticamente con lógica de paridad y fechas separadas por días usando Gemini AI</q-tooltip>
        </q-btn>
        <q-btn flat round dense :icon="matClose" v-close-popup text-color="grey-4" size="sm" />
      </q-card-section>

      <!-- Cuerpo Scrolleable Cómodo -->
      <q-card-section class="scroll q-pa-md q-gutter-y-sm col">


        <!-- Fila 1: Jornada Oficial y Fecha/Hora del Partido -->
        <div class="row q-col-gutter-sm items-stretch">
          <div class="col-12 col-sm-5">
            <div class="bg-slate-50 border q-pa-sm rounded-borders full-height column justify-between">
              <div>
                <div class="text-caption text-weight-bold text-slate-800">Criterio de Paridad</div>
                <div class="text-caption text-grey-6 font-10">Equipos con igual número de partidos</div>
              </div>
              <div class="bg-white q-pa-xs rounded border q-mt-xs text-caption font-mono text-center text-weight-bolder text-emerald-9">
                ⚖️ Enfrentamiento entre Pares
              </div>
            </div>
          </div>

          <div class="col-12 col-sm-7">
            <div class="bg-slate-50 border q-pa-sm rounded-borders full-height column justify-between">
              <div class="row items-center justify-between no-wrap q-mb-xs">
                <span class="text-caption text-weight-bold text-slate-800 ellipsis">📅 Fecha y Hora Oficial *</span>
                <q-btn
                  flat
                  dense
                  no-caps
                  size="xs"
                  color="primary"
                  label="⏱️ Fijar Actual"
                  class="font-10 text-weight-bold"
                  @click="fijarHoraActual"
                />
              </div>
              <q-input
                v-model="form.fechaHora"
                type="datetime-local"
                outlined
                dense
                bg-color="white"
                class="font-mono text-caption"
                
              />
            </div>
          </div>
        </div>

        <!-- Fila 2: Selección de Equipos -->
        <div class="bg-slate-50 border q-pa-sm rounded-borders">
          <div class="row q-col-gutter-sm items-start">
            <!-- Local -->
            <div class="col-12 col-sm-6">
              <div class="text-caption text-weight-bold text-slate-800 q-mb-xs row items-center justify-between">
                <span>🏠 Equipo Local *</span>
                <span v-if="form.local" class="text-caption text-weight-bold font-11" :style="{ color: colorEquipo(form.local) }">
                  ● {{ nombreEquipo(form.local) }}
                </span>
              </div>
              <q-select
                v-model="form.local"
                :options="opciones"
                emit-value
                map-options
                outlined
                dense
                bg-color="white"
                placeholder="Elige club local"
              >
                <template #option="scope">
                  <q-item v-bind="scope.itemProps" dense>
                    <q-item-section avatar style="min-width: 22px">
                      <span class="dot" :style="{ background: colorEquipo(scope.opt.value) }" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-weight-bold font-12">{{ scope.opt.label }}</q-item-label>
                      <q-item-label caption class="font-10">
                        <span :class="scope.opt.habilitado ? 'text-positive text-weight-bold' : 'text-negative text-weight-bold'">
                          {{ scope.opt.badgeText }}
                        </span>
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>

              <!-- Estado de nómina local -->
              <div v-if="form.local" class="q-mt-xs font-11">
                <span v-if="store.equipoHabilitadoParaJugar(form.local)" class="text-positive text-weight-bold">
                  ✅ Habilitado ({{ store.cantidadEnCancha(form.local) }} en cancha)
                </span>
                <div v-else-if="store.tieneExcesoEnCancha(form.local)" class="row items-center q-gutter-xs">
                  <span class="text-negative text-weight-bold font-10">
                    ⚠️ {{ store.cantidadEnCancha(form.local) }}/11 en cancha
                  </span>
                  <q-btn
                    flat
                    dense
                    no-caps
                    size="xs"
                    color="negative"
                    label="🪑 A banca"
                    @click="store.enviarExcedentesABanca(form.local)"
                  />
                </div>
                <div v-else class="row items-center q-gutter-xs">
                  <span class="text-negative text-weight-bold font-10">
                    ⚠️ {{ store.cantidadJugadoresEquipo(form.local) }}/11 jug.
                  </span>

                </div>
              </div>
            </div>

            <!-- Visitante -->
            <div class="col-12 col-sm-6">
              <div class="text-caption text-weight-bold text-slate-800 q-mb-xs row items-center justify-between">
                <span>✈️ Equipo Visitante *</span>
                <span v-if="form.visitante" class="text-caption text-weight-bold font-11" :style="{ color: colorEquipo(form.visitante) }">
                  ● {{ nombreEquipo(form.visitante) }}
                </span>
              </div>
              <q-select
                v-model="form.visitante"
                :options="opciones"
                emit-value
                map-options
                outlined
                dense
                bg-color="white"
                placeholder="Elige club visitante"
              >
                <template #option="scope">
                  <q-item v-bind="scope.itemProps" dense>
                    <q-item-section avatar style="min-width: 22px">
                      <span class="dot" :style="{ background: colorEquipo(scope.opt.value) }" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-weight-bold font-12">{{ scope.opt.label }}</q-item-label>
                      <q-item-label caption class="font-10">
                        <span :class="scope.opt.habilitado ? 'text-positive text-weight-bold' : 'text-negative text-weight-bold'">
                          {{ scope.opt.badgeText }}
                        </span>
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>

              <!-- Estado de nómina visitante -->
              <div v-if="form.visitante" class="q-mt-xs font-11">
                <span v-if="store.equipoHabilitadoParaJugar(form.visitante)" class="text-positive text-weight-bold">
                  ✅ Habilitado ({{ store.cantidadEnCancha(form.visitante) }} en cancha)
                </span>
                <div v-else-if="store.tieneExcesoEnCancha(form.visitante)" class="row items-center q-gutter-xs">
                  <span class="text-negative text-weight-bold font-10">
                    ⚠️ {{ store.cantidadEnCancha(form.visitante) }}/11 en cancha
                  </span>
                  <q-btn
                    flat
                    dense
                    no-caps
                    size="xs"
                    color="negative"
                    label="🪑 A banca"
                    @click="store.enviarExcedentesABanca(form.visitante)"
                  />
                </div>
                <div v-else class="row items-center q-gutter-xs">
                  <span class="text-negative text-weight-bold font-10">
                    ⚠️ {{ store.cantidadJugadoresEquipo(form.visitante) }}/11 jug.
                  </span>

                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Alerta Reglamentaria: Mínimo 11 personas -->
        <div v-if="alertaReglamentaria" class="bg-amber-1 border border-amber-3 q-pa-xs rounded-borders text-amber-10 row items-center no-wrap font-11">
          <q-icon name="warning" size="18px" class="q-mr-xs shrink-0" color="amber-9" />
          <div class="text-caption text-weight-medium">
            {{ alertaReglamentaria }}
          </div>
        </div>

        <!-- Nota de Creación y Programación de Partido -->
        <div class="bg-emerald-50 border border-emerald-2 q-pa-sm rounded-borders row items-center no-wrap">
          <q-icon name="event" size="20px" color="positive" class="q-mr-xs shrink-0" />
          <div class="text-caption text-emerald-10 font-11" style="line-height: 1.45;">
            El encuentro se creará en el fixture oficial en estado <strong>Programado</strong>. Una vez transcurrido el tiempo del partido, la autoridad del torneo cargará el marcador y la planilla oficial.
          </div>
        </div>

        <div v-if="error" class="text-negative text-caption text-center q-mt-xs">{{ error }}</div>
      </q-card-section>

      <!-- Pie Pinned de Acciones -->
      <q-card-actions align="right" class="q-py-sm q-px-md bg-grey-1 border-t shrink-0">
        <q-btn flat no-caps label="Cancelar" v-close-popup color="grey-7" />
        <q-btn
          color="primary"
          unelevated
          no-caps
          label="Programar Partido"
          :icon="matCheck"
          :loading="guardando"
          :disable="!puedeGuardar"
          class="text-weight-bold"
          @click="guardar"
        >
          <q-tooltip v-if="!puedeGuardar">
            Ambos clubes deben contar con al menos 11 jugadores registrados para habilitar el partido.
          </q-tooltip>
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>

    <!-- DIÁLOGO OFICIAL: GENERADOR AUTOMÁTICO DE PARTIDOS CON IA GEMINI -->
    <q-dialog v-model="mostrarModalIA" position="standard">
      <q-card style="width: 520px; max-width: 95vw; max-height: 88vh;" class="rounded-xl overflow-hidden bg-white shadow-24 column no-wrap">
        <!-- Encabezado Oscuro de Alto Contraste Fijo -->
        <q-card-section class="bg-slate-900 text-white row items-center justify-between q-py-sm q-px-md border-b border-slate-800 shrink-0">
          <div class="row items-center q-gutter-md">
            <div class="avatar-robot flex flex-center shadow-2">
              <span style="font-size: 24px;">🤖</span>
            </div>
            <div>
              <div class="text-subtitle1 text-weight-bolder text-white row items-center q-gutter-xs">
                <span>Generador de Partidos con IA Gemini</span>
                <q-badge color="amber-5" text-color="dark" class="text-weight-bolder font-11 q-px-xs">
                  PRO
                </q-badge>
              </div>
              <div class="text-caption font-11 text-amber-3 text-weight-medium">
                Fixture inteligente con paridad deportiva y días diferenciados
              </div>
            </div>
          </div>
          <q-btn flat round dense icon="close" text-color="grey-4" v-close-popup size="sm" />
        </q-card-section>

        <!-- Cuerpo Scrolleable con barra y cursor de desplazamiento -->
        <q-card-section class="scroll q-pa-md q-gutter-y-md col bg-slate-50/50">
          <!-- Reglas reglamentarias garantizadas -->
          <div class="bg-indigo-50 border border-indigo-2 rounded-borders q-pa-sm text-caption text-slate-800">
            <strong>🧠 Lógica Aplicada por Gemini AI:</strong>
            <ul class="q-my-xs q-pl-md font-11" style="line-height: 1.4;">
              <li><strong>Paridad competitiva:</strong> Empareja clubes con nivel similar de puntos y partidos disputados.</li>
              <li><strong>Separación por días:</strong> Cada encuentro o jornada queda programado en <strong>días distintos y consecutivos</strong> (por ejemplo: Día 1 a las 16:00, Día 2 a las 16:00...).</li>
              <li><strong>Sin repetición:</strong> Un equipo no juega contra sí mismo ni se duplican cruces inmediatos.</li>
            </ul>
          </div>

          
          <!-- AVISO OFICIAL: REGLA DE PARTIDO ÚNICO EN CURSO -->
          <div v-if="clubesConPartidoPendienteInfo && clubesConPartidoPendienteInfo.length" class="bg-amber-50 border-2 border-amber-400 rounded-borders q-pa-sm text-caption text-amber-10">
            <div class="row items-center q-gutter-xs q-mb-xs text-weight-bolder font-12 text-amber-9">
              <q-icon name="warning" size="20px" color="amber-9" />
              <span>⚠️ Aviso Oficial del Torneo:</span>
            </div>
            <div class="font-12 text-weight-bold text-slate-900 q-py-xs" style="line-height: 1.4;">
              Todos están jugando un partido, no se puede más.
            </div>
            <div class="font-11 text-grey-8" style="line-height: 1.3;">
              Los clubes ({{ clubesConPartidoPendienteNombres }}) tienen un encuentro en curso o pendiente en el fixture. Para habilitar nuevos encuentros o programar más partidos, primero se deben finalizar o cargar los resultados de los partidos actuales.
            </div>
          </div>

          <!-- Selector 1: Cantidad de Partidos -->
          <div class="bg-slate-50 border rounded-borders q-pa-sm">
            <div class="row items-center justify-between q-mb-sm">
              <div class="text-caption text-weight-bolder text-slate-900">
                1. ¿Cuántos partidos deseas programar con IA? *
              </div>
              <q-badge color="primary" text-color="white" class="font-mono text-weight-bolder font-12 q-px-xs">
                {{ cantidadPartidosIA }} {{ cantidadPartidosIA === 1 ? 'partido' : 'partidos' }}
              </q-badge>
            </div>
            <div class="row q-col-gutter-xs">
              <div v-for="n in [1, 2, 3, 4, 5, 6]" :key="n" class="col-4 col-sm-2">
                <q-btn
                  unelevated
                  no-caps
                  class="full-width text-weight-bolder border shadow-1"
                  :color="cantidadPartidosIA === n ? 'primary' : 'white'"
                  :text-color="cantidadPartidosIA === n ? 'white' : 'slate-800'"
                  :style="cantidadPartidosIA === n ? 'border-color: var(--q-primary) !important;' : 'border-color: #cbd5e1 !important;'"
                  :label="`${n}`"
                  @click="cantidadPartidosIA = n"
                >
                  <q-tooltip>{{ n }} {{ n === 1 ? 'partido' : 'partidos' }}</q-tooltip>
                </q-btn>
              </div>
            </div>
          </div>

          <!-- Selector 2: Separación Cronológica entre Partidos (Días) -->
          <div class="bg-slate-50 border rounded-borders q-pa-sm">
            <div class="row items-center justify-between q-mb-sm">
              <div class="text-caption text-weight-bolder text-slate-900">
                2. Separación de días entre cada partido *
              </div>
              <q-badge color="emerald-9" text-color="white" class="font-mono text-weight-bolder font-12 q-px-xs">
                {{ intervaloDiasIA === 1 ? '1 día (Días consecutivos)' : `${intervaloDiasIA} días entre partidos` }}
              </q-badge>
            </div>
            <div class="row q-col-gutter-xs">
              <div
                v-for="opt in [
                  { dias: 1, label: '1 día (Consecutivo)', badge: 'Recomendado' },
                  { dias: 2, label: '2 días', badge: 'Descanso' },
                  { dias: 3, label: '3 días', badge: 'Espaciado' },
                  { dias: 7, label: '7 días (Semanal)', badge: 'Fin de semana' }
                ]"
                :key="opt.dias"
                class="col-6 col-sm-3"
              >
                <q-card
                  flat
                  bordered
                  class="cursor-pointer text-center q-pa-xs column items-center justify-center transition-all"
                  :class="intervaloDiasIA === opt.dias ? 'bg-emerald-50 border-2 border-emerald-6 text-emerald-10 shadow-2 text-weight-bolder' : 'bg-white border-slate-300 text-slate-700'"
                  @click="intervaloDiasIA = opt.dias"
                >
                  <div class="text-weight-bold font-12">{{ opt.label }}</div>
                  <div class="font-10 text-grey-6">{{ opt.badge }}</div>
                </q-card>
              </div>
            </div>
          </div>
        </q-card-section>

        <!-- Barra de Acciones Fija en la Base -->
        <q-card-actions align="right" class="q-pa-md bg-white border-t shrink-0">
          <q-btn flat no-caps label="Cancelar" color="grey-7" v-close-popup />
          <q-btn
            unelevated
            no-caps
            color="positive"
            text-color="white"
            :loading="generandoConIA"
            :icon="matAutoAwesome"
            :label="`Crear ${cantidadPartidosIA} Partido(s) con IA`"
            class="text-weight-bolder q-px-md shadow-2"
            @click="ejecutarGeneracionIA"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTorneo } from '../store/torneo.js'
import { useQuasar } from 'quasar'
import { matSportsScore, matClose, matRemove, matAdd, matCheck } from '@quasar/extras/material-icons'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])
const store = useTorneo()
const $q = useQuasar()

const clubesConPartidoPendienteInfo = computed(() => {
  const pendientes = new Set()
  const finalizadoFn = (p) => ['jugado', 'finalizado'].includes(String(p?.estado || '').toLowerCase())
  for (const p of (store?.partidos || [])) {
    if (!finalizadoFn(p)) {
      const loc = p.localId || (p.local && typeof p.local === 'object' ? (p.local._id || p.local.id) : p.local)
      const vis = p.visitanteId || (p.visitante && typeof p.visitante === 'object' ? (p.visitante._id || p.visitante.id) : p.visitante)
      if (loc) pendientes.add(String(loc).trim())
      if (vis) pendientes.add(String(vis).trim())
    }
  }
  return (store?.equipos || []).filter(e => pendientes.has(String(e.id || e._id).trim()))
})

const clubesConPartidoPendienteNombres = computed(() => {
  return (clubesConPartidoPendienteInfo.value || []).map(c => c.nombre).join(', ')
})


function getAhoraString() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

const vacio = () => ({
  fecha: 1,
  fechaHora: getAhoraString(),
  local: null,
  visitante: null,
  golesLocal: 0,
  golesVisitante: 0
})

const maxFechaHoraActual = computed(() => {
  const d = new Date(Date.now() + 60000)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
})

function fijarHoraActual() {
  form.value.fechaHora = getAhoraString()
}

const form = ref(vacio())
const error = ref('')
const guardando = ref(false)
const completando = ref(false)

const opciones = computed(() =>
  store.equipos.map(e => {
    const id = e.id || e._id
    const cant = store.cantidadJugadoresEquipo(id)
    const enCancha = store.cantidadEnCancha(id)
    const tieneExceso = store.tieneExcesoEnCancha(id)
    const tieneCap = store.tieneCapitan(id)
    const habilitado = cant >= 11 && !tieneExceso && tieneCap
    const pj = partidosJugadosDeEquipo(id); let badgeText = `${cant} jug. (${pj} PJ)`
    if (cant < 11) badgeText = `${cant}/11 jug. ⚠️`
    else if (tieneExceso) badgeText = `⚠️ ${enCancha}/11 en cancha`
    else if (!tieneCap) badgeText = `⚠️ Falta Capitán`

    return {
      label: e.nombre,
      value: id,
      cant,
      enCancha,
      tieneExceso,
      tieneCap,
      habilitado,
      badgeText,
      badgeColor: habilitado ? 'positive' : 'negative'
    }
  })
)

function nombreEquipo(id) {
  return store.equipoPorId(id)?.nombre
}

function colorEquipo(id) {
  return store.equipoPorId(id)?.color || store.equipoPorId(id)?.escudocolor || '#059669'
}

function partidosJugadosDeEquipo(eqId) {
  if (!eqId) return 0
  const target = String(eqId).trim()
  return store.partidos.filter(p => {
    const l = String(p.localId || (p.local && typeof p.local === 'object' ? (p.local._id || p.local.id) : p.local) || '').trim()
    const v = String(p.visitanteId || (p.visitante && typeof p.visitante === 'object' ? (p.visitante._id || p.visitante.id) : p.visitante) || '').trim()
    const fin = ['finalizado', 'jugado'].includes(String(p.estado || '').toLowerCase())
    return fin && (l === target || v === target)
  }).length
}

const conflictoDescanso = computed(() => {
  if (!form.value.local || !form.value.visitante) return ''
  const locTarget = String(form.value.local || '').trim()
  const visTarget = String(form.value.visitante || '').trim()

  const finalizadoFn = (p) => ['jugado', 'finalizado'].includes(String(p?.estado || '').toLowerCase())

  // REGLA 1: Solo se puede tener UN partido en estado Programado a la vez por club.
  // Solo cuando dicho partido ya pase y se finalice, se podrá crear/programar otro.
  for (const p of store.partidos) {
    if (!finalizadoFn(p)) {
      const locId = String(p.localId || (p.local && typeof p.local === 'object' ? (p.local._id || p.local.id) : p.local) || '').trim()
      const visId = String(p.visitanteId || (p.visitante && typeof p.visitante === 'object' ? (p.visitante._id || p.visitante.id) : p.visitante) || '').trim()

      if (locTarget && (locId === locTarget || visId === locTarget)) {
        return `⚠️ REGLA OFICIAL: "${nombreEquipo(locTarget)}" ya tiene un partido pendiente o programado en el fixture. Solo se podrá programar un nuevo encuentro una vez que el partido actual se dispute y finalice.`
      }
      if (visTarget && (locId === visTarget || visId === visTarget)) {
        return `⚠️ REGLA OFICIAL: "${nombreEquipo(visTarget)}" ya tiene un partido pendiente o programado en el fixture. Solo se podrá programar un nuevo encuentro una vez que el partido actual se dispute y finalice.`
      }
    }
  }

  // REGLA 2: Cronología de fechas (no puede programarse con una fecha u hora anterior al último partido)
  if (form.value.fechaHora) {
    const tNueva = new Date(form.value.fechaHora).getTime()

    for (const p of store.partidos) {
      if (!p.fechaHora) continue
      const tP = new Date(p.fechaHora).getTime()
      const locId = String(p.localId || (p.local && typeof p.local === 'object' ? (p.local._id || p.local.id) : p.local) || '').trim()
      const visId = String(p.visitanteId || (p.visitante && typeof p.visitante === 'object' ? (p.visitante._id || p.visitante.id) : p.visitante) || '').trim()

      const involucraClub = (locTarget && (locId === locTarget || visId === locTarget)) || (visTarget && (locId === visTarget || visId === visTarget))
      if (involucraClub && tNueva <= tP) {
        const fechaExistenteStr = new Date(p.fechaHora).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
        return `⚠️ REGLA CRONOLÓGICA: La fecha y hora de este nuevo partido no puede ser anterior ni igual a un encuentro previo del club (Encuentro previo: ${fechaExistenteStr}). Debe programarse posterior al último partido.`
      }
    }
  }

  return ''
})

const alertaReglamentaria = computed(() => {
  if (conflictoDescanso.value) {
    return conflictoDescanso.value
  }

  if (form.value.local) {
    const cant = store.cantidadJugadoresEquipo(form.value.local)
    const nom = nombreEquipo(form.value.local)
    if (cant < 11) {
      return `"${nom}" tiene ${cant}/11 jugadores. Se exige un mínimo reglamentario de 11 personas para disputar partidos.`
    }
    if (store.tieneExcesoEnCancha(form.value.local)) {
      const enCancha = store.cantidadEnCancha(form.value.local)
      return `⚠️ ADVERTENCIA: "${nom}" tiene ${enCancha} jugadores en cancha. Solo se permite jugar con un máximo de 11 futbolistas en la cancha. Debe asignar el rol 'En Banca' a los suplentes.`
    }
    if (!store.tieneCapitan(form.value.local)) {
      return `⚠️ REGLA OFICIAL: "${nom}" no tiene un Capitán asignado. Solo se podrá jugar cuando el entrenador escoja al capitán del equipo.`
    }
  }
  if (form.value.visitante) {
    const cant = store.cantidadJugadoresEquipo(form.value.visitante)
    const nom = nombreEquipo(form.value.visitante)
    if (cant < 11) {
      return `"${nom}" tiene ${cant}/11 jugadores. Se exige un mínimo reglamentario de 11 personas para disputar partidos.`
    }
    if (store.tieneExcesoEnCancha(form.value.visitante)) {
      const enCancha = store.cantidadEnCancha(form.value.visitante)
      return `⚠️ ADVERTENCIA: "${nom}" tiene ${enCancha} jugadores en cancha. Solo se permite jugar con un máximo de 11 futbolistas en la cancha. Debe asignar el rol 'En Banca' a los suplentes.`
    }
    if (!store.tieneCapitan(form.value.visitante)) {
      return `⚠️ REGLA OFICIAL: "${nom}" no tiene un Capitán asignado. Solo se podrá jugar cuando el entrenador escoja al capitán del equipo.`
    }
  }
  return ''
})


const mostrarModalIA = ref(false)
const cantidadPartidosIA = ref(3)
const intervaloDiasIA = ref(1)
const generandoConIA = ref(false)

async function ejecutarGeneracionIA() {
  generandoConIA.value = true
  try {
    const res = await store.generarPartidosConIA({
      cantidadPartidos: cantidadPartidosIA.value,
      intervaloDias: intervaloDiasIA.value
    })
    mostrarModalIA.value = false
    emit('update:modelValue', false)
    $q.notify({
      type: 'positive',
      icon: 'auto_awesome',
      message: res.msg || '¡Partidos programados con éxito por la IA Gemini!',
      position: 'top',
      timeout: 5000
    })
  } catch (err) {
    const errorMsg = err.response?.data?.msg || err.message || 'Todos están jugando un partido, no se puede más.'
    $q.notify({
      type: 'negative',
      icon: 'warning',
      message: errorMsg,
      position: 'top',
      timeout: 4500
    })
  } finally {
    generandoConIA.value = false
  }
}

const puedeGuardar = computed(() => {
  const esFechaHoraValida = Boolean(form.value.fechaHora)
  return Boolean(
    form.value.local &&
    form.value.visitante &&
    form.value.local !== form.value.visitante &&
    store.equipoHabilitadoParaJugar(form.value.local) &&
    store.equipoHabilitadoParaJugar(form.value.visitante) &&
    !conflictoDescanso.value &&
    esFechaHoraValida
  )
})

async function completarPlantel(equipoId) {
  completando.value = true
  error.value = ''
  try {
    await store.completarPlantelEquipo(equipoId)
  } catch (err) {
    error.value = err.message || 'Error al completar plantel'
  } finally {
    completando.value = false
  }
}

async function guardar() {
  error.value = ''
  if (!form.value.local || !form.value.visitante) {
    error.value = 'Selecciona ambos equipos para el encuentro.'
    return
  }
  if (form.value.local === form.value.visitante) {
    error.value = 'El equipo local y visitante no pueden ser el mismo.'
    return
  }

  if (conflictoDescanso.value) {
    error.value = conflictoDescanso.value
    return
  }



  const cantLocal = store.cantidadJugadoresEquipo(form.value.local)
  if (cantLocal < 11) {
    error.value = `El club local "${nombreEquipo(form.value.local)}" solo tiene ${cantLocal} jugadores. Se exige un mínimo reglamentario de 11 personas para registrarse a partidos.`
    return
  }

  const cantVisitante = store.cantidadJugadoresEquipo(form.value.visitante)
  if (cantVisitante < 11) {
    error.value = `El club visitante "${nombreEquipo(form.value.visitante)}" solo tiene ${cantVisitante} jugadores. Se exige un mínimo reglamentario de 11 personas para registrarse a partidos.`
    return
  }

  if (!store.tieneCapitan(form.value.local)) {
    error.value = `Solo se podrá jugar cuando el entrenador escoja al capitán del equipo. El club local "${nombreEquipo(form.value.local)}" no tiene capitán designado.`
    return
  }

  if (!store.tieneCapitan(form.value.visitante)) {
    error.value = `Solo se podrá jugar cuando el entrenador escoja al capitán del equipo. El club visitante "${nombreEquipo(form.value.visitante)}" no tiene capitán designado.`
    return
  }

  guardando.value = true
  try {
    await store.guardarPartido({
      fecha: Number(form.value.fecha) || 1,
      fechaHora: form.value.fechaHora || new Date().toISOString(),
      local: form.value.local,
      visitante: form.value.visitante,
      golesLocal: 0,
      golesVisitante: 0,
      estado: 'Programado'
    })
    form.value = vacio()
    emit('update:modelValue', false)
  } catch (e) {
    error.value = e.message || 'Error al guardar el partido.'
  } finally {
    guardando.value = false
  }
}
</script>

<style scoped>
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
.font-mono {
  font-family: 'JetBrains Mono', monospace;
  font-variant-numeric: tabular-nums;
}

.avatar-robot {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #f59e0b;
}
.bg-slate-900 {
  background-color: #0f172a !important;
}
</style>
