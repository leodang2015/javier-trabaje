import { ref, computed } from 'vue'
import axios from 'axios'
import { API_URL, authHeaders, idDe, lista } from '../api.js'
import { user, equipoEntrenadorId } from './authStore.js'

export const equipos = ref([])
export const dialogoEquipo = ref(false)

export function abrirDialogoEquipo() {
  dialogoEquipo.value = true
}

export function cerrarDialogoEquipo() {
  dialogoEquipo.value = false
}

export const miEquipoId = computed(() => {
  if (equipoEntrenadorId.value) return String(equipoEntrenadorId.value).trim()
  if (user.value?.equipo) {
    const eq = user.value.equipo
    return (typeof eq === 'object' ? (eq._id || eq.id) : eq) || ''
  }
  return ''
})

export const miEquipo = computed(() => {
  const mId = miEquipoId.value
  if (!mId) return null
  return equipos.value.find(e => idDe(e) === mId) || null
})

export function equipoPorId(id) {
  if (!id) return null
  if (typeof id === 'object' && id.nombre) {
    return id
  }
  const target = idDe(id)
  return equipos.value.find(e => idDe(e) === target) || null
}

export function tieneCapitan(equipoId) {
  const eq = equipoPorId(equipoId)
  return Boolean(eq?.capitan && String(eq.capitan).trim().length > 0)
}

export function capitanDelEquipo(equipoId) {
  const eq = equipoPorId(equipoId)
  return eq?.capitan ? String(eq.capitan).trim() : null
}

export function normalizarEquipo(e) {
  if (!e) return e
  const eId = idDe(e._id || e.id)
  return {
    ...e,
    id: eId,
    _id: eId
  }
}

export async function cargarEquipos() {
  try {
    const res = await axios.get(`${API_URL}/equipos`)
    const raw = lista(res.data)
    equipos.value = raw.map(normalizarEquipo)
    return equipos.value
  } catch (err) {
    console.error('Error al cargar equipos:', err)
  }
}

export async function agregarEquipo(datos) {
  const res = await axios.post(`${API_URL}/equipos`, datos, { headers: authHeaders() })
  await cargarEquipos()
  return res.data
}

export async function designarCapitan({ equipoId, nombreCapitan, jugadorId }) {
  const res = await axios.patch(
    `${API_URL}/equipos/${equipoId}/capitan`,
    { capitan: nombreCapitan, jugadorId },
    { headers: authHeaders() }
  )
  await cargarEquipos()
  return res.data
}

export async function actualizarEscudoEquipo({ equipoId, escudocolor, escudoUrl, escudoFigura }) {
  const res = await axios.patch(
    `${API_URL}/equipos/${equipoId}/escudo`,
    { escudocolor, escudoUrl, escudoFigura },
    { headers: authHeaders() }
  )
  await cargarEquipos()
  return res.data
}

export async function autorizarEquipo(id) {
  const res = await axios.patch(`${API_URL}/equipos/${id}/autorizar`, {}, { headers: authHeaders() })
  await cargarEquipos()
  return res.data
}

export async function rechazarEquipo(id) {
  const res = await axios.patch(`${API_URL}/equipos/${id}/rechazar`, {}, { headers: authHeaders() })
  await cargarEquipos()
  return res.data
}
