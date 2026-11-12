import { ref, computed } from 'vue'
import axios from 'axios'
import { API_URL, authHeaders } from '../api.js'

export const torneo = ref(null)
export const cargando = ref(false)
export const error = ref('')

export const notificacionesGuardadas = (() => {
  try {
    return JSON.parse(localStorage.getItem('futbolito_notificaciones') || '[]')
  } catch {
    return []
  }
})()

export const notificaciones = ref(notificacionesGuardadas)

export const notificacionesNoLeidas = computed(() => {
  return (notificaciones.value || []).filter(n => !n.leida).length
})

export const notificacionesDelUsuario = computed(() => {
  return notificaciones.value || []
})

export async function cargarTorneo() {
  try {
    const res = await axios.get(`${API_URL}/torneos`)
    const t = Array.isArray(res.data) ? res.data[0] : res.data
    torneo.value = t || null
    return torneo.value
  } catch (err) {
    console.error('Error al cargar torneo:', err)
  }
}

export async function crearTorneo(datos) {
  cargando.value = true
  try {
    const res = await axios.post(`${API_URL}/torneos`, datos, { headers: authHeaders() })
    torneo.value = res.data
    return res.data
  } finally {
    cargando.value = false
  }
}

export async function cargarNotificaciones() {
  try {
    const res = await axios.get(`${API_URL}/notificaciones`, { headers: authHeaders() })
    if (Array.isArray(res.data)) {
      notificaciones.value = res.data
      localStorage.setItem('futbolito_notificaciones', JSON.stringify(res.data))
    }
  } catch (_) {}
}

export async function marcarNotificacionLeida(id) {
  try {
    await axios.patch(`${API_URL}/notificaciones/${id}/leida`, {}, { headers: authHeaders() })
  } catch (_) {}
  const n = notificaciones.value.find(item => (item._id || item.id) === id)
  if (n) n.leida = true
  localStorage.setItem('futbolito_notificaciones', JSON.stringify(notificaciones.value))
}

export async function marcarTodasNotificacionesLeidas() {
  try {
    await axios.patch(`${API_URL}/notificaciones/marcar-todas`, {}, { headers: authHeaders() })
  } catch (_) {}
  notificaciones.value.forEach(item => { item.leida = true })
  localStorage.setItem('futbolito_notificaciones', JSON.stringify(notificaciones.value))
}
