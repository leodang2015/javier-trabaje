<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="width: 480px; max-width: 95vw" class="rounded-borders">
      <q-card-section class="bg-grey-10 text-white row items-center justify-between q-py-md">
        <div class="row items-center">
          <q-icon :name="matShield" color="positive" size="24px" class="q-mr-sm" />
          <div class="text-subtitle1 text-weight-bold">Registrar Club</div>
        </div>
        <q-btn flat round dense :icon="matClose" v-close-popup text-color="grey-4" />
      </q-card-section>

      <q-card-section class="q-gutter-md q-pt-md">
        <div>
          <div class="text-caption text-weight-medium text-grey-8 q-mb-xs">Nombre Oficial del Club *</div>
          <q-input v-model="form.nombre" placeholder="Ej: Deportivo Huracán" outlined dense autofocus />
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <div class="text-caption text-weight-medium text-grey-8 q-mb-xs">Barrio / Sector</div>
            <q-input v-model="form.barriada" placeholder="Ej: Sector Norte" outlined dense />
          </div>
          <div class="col-12 col-sm-6">
            <div class="text-caption text-weight-medium text-grey-8 q-mb-xs">Capitán / DT</div>
            <q-input v-model="form.capitan" placeholder="Ej: Carlos Silva" outlined dense />
          </div>
        </div>

        <div>
          <div class="text-caption text-weight-medium text-grey-8 q-mb-xs">Color Distintivo del Escudo</div>
          <div class="row items-center q-gutter-sm">
            <div
              v-for="col in colores"
              :key="col"
              class="color-chip cursor-pointer"
              :style="{ background: col, outline: form.escudocolor === col ? '3px solid #059669' : 'none' }"
              @click="form.escudocolor = col"
            />
            <q-input v-model="form.escudocolor" dense outlined style="width: 110px" placeholder="#059669">
              <template #append>
                <div class="color-preview" :style="{ background: form.escudocolor }" />
              </template>
            </q-input>
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
          label="Guardar en MongoDB"
          :icon="matCheck"
          :loading="guardando"
          @click="guardar"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useTorneo } from '../store/torneo.js'
import { matShield, matClose, matCheck } from '@quasar/extras/material-icons'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])
const store = useTorneo()

const colores = [
  '#059669', '#1e3a8a', '#dc2626', '#d97706', '#7c3aed', '#0284c7', '#0d9488', '#18181b'
]

const form = ref({
  nombre: '',
  barriada: '',
  capitan: '',
  escudocolor: '#059669'
})

const error = ref('')
const guardando = ref(false)

async function guardar() {
  error.value = ''
  if (!form.value.nombre.trim()) {
    error.value = 'El nombre del club es obligatorio.'
    return
  }

  guardando.value = true
  try {
    await store.agregarEquipo({
      nombre: form.value.nombre.trim(),
      barriada: form.value.barriada.trim() || undefined,
      capitan: form.value.capitan.trim() || undefined,
      escudocolor: form.value.escudocolor || '#059669'
    })
    form.value = { nombre: '', barriada: '', capitan: '', escudocolor: '#059669' }
    emit('update:modelValue', false)
  } catch (err) {
    error.value = err.message || 'Error al guardar el equipo.'
  } finally {
    guardando.value = false
  }
}
</script>

<style scoped>
.color-chip {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  transition: transform 0.15s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
.color-chip:hover {
  transform: scale(1.15);
}
.color-preview {
  width: 18px;
  height: 18px;
  border-radius: 4px;
}
</style>
