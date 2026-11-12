import { ref, computed } from 'vue'
import axios from 'axios'
import { API_URL, authHeaders, idDe, lista } from '../api.js'
import { user } from './authStore.js'
import { miEquipoId, tieneCapitan, cargarEquipos } from './equipoStore.js'

export const jugadores = ref([])

export const miJugador = computed(() => {
  if (!user.value) return null
  const uNom = String(user.value.nombre || '').toLowerCase().trim()
  const uUsr = String(user.value.usuario || '').toLowerCase().trim()
  const mEq = miEquipoId.value

  return jugadores.value.find(j => {
    const eqMatch = !mEq || idDe(j.equipo) === mEq
    if (!eqMatch) return false
    const jNom = String(j.nombre || '').toLowerCase().trim()
    const jUsr = String(j.usuarioAsociado || '').toLowerCase().trim()
    const jEmail = String(j.email || '').toLowerCase().trim()
    return (uNom && jNom === uNom) || (uUsr && (jUsr === uUsr || jEmail.startsWith(uUsr)))
  }) || null
})

export function normalizarPosicion(pos) {
  const p = String(pos || '').trim().toLowerCase()
  if (['portero', 'arquero', 'guardameta'].includes(p)) return 'Portero'
  if (['defensa', 'defensor', 'central', 'lateral'].includes(p)) return 'Defensa'
  if (['medio', 'mediocampista', 'volante', 'mediocentro'].includes(p)) return 'Mediocampista'
  if (['delantero', 'atacante', 'punta', 'extremo'].includes(p)) return 'Delantero'
  return 'En Banca'
}

export function jugadoresEnCanchaEquipo(equipoId) {
  const target = idDe(equipoId)
  if (!target) return []
  return jugadores.value.filter(j => {
    const jEq = idDe(j.equipoId) || idDe(j.equipo)
    if (jEq !== target) return false
    const pos = normalizarPosicion(j.posicion)
    return pos !== 'En Banca'
  })
}

export function jugadoresEnBancaEquipo(equipoId) {
  const target = idDe(equipoId)
  if (!target) return []
  return jugadores.value.filter(j => {
    const jEq = idDe(j.equipoId) || idDe(j.equipo)
    if (jEq !== target) return false
    const pos = normalizarPosicion(j.posicion)
    return pos === 'En Banca'
  })
}

export function cantidadEnCancha(equipoId) {
  return jugadoresEnCanchaEquipo(equipoId).length
}

export function cantidadEnBanca(equipoId) {
  return jugadoresEnBancaEquipo(equipoId).length
}

export function tieneExcesoEnCancha(equipoId) {
  return cantidadEnCancha(equipoId) > 11
}

export function cantidadJugadoresEquipo(equipoId) {
  const target = idDe(equipoId)
  if (!target) return 0
  return jugadores.value.filter(j => {
    const jEq = idDe(j.equipoId) || idDe(j.equipo)
    return jEq === target
  }).length
}

export function equipoHabilitadoParaJugar(equipoId) {
  const count = cantidadJugadoresEquipo(equipoId)
  const enCancha = cantidadEnCancha(equipoId)
  const hayCap = tieneCapitan(equipoId)
  return count >= 11 && enCancha <= 11 && hayCap
}

export function normalizarJugador(j) {
  if (!j) return j
  const eqId = idDe(j.equipoId) || idDe(j.equipo)
  return {
    ...j,
    id: j._id || j.id,
    equipoId: eqId,
    equipo: eqId
  }
}

export async function cargarJugadores() {
  try {
    const res = await axios.get(`${API_URL}/jugadores`)
    const raw = lista(res.data)
    jugadores.value = raw.map(normalizarJugador)
    return jugadores.value
  } catch (err) {
    console.error('Error al cargar jugadores:', err)
  }
}

export async function agregarJugador(datos) {
  const res = await axios.post(`${API_URL}/jugadores`, datos, { headers: authHeaders() })
  await cargarJugadores()
  return res.data
}

export async function actualizarPosicionJugador(param1, param2) {
  let jugadorId, posicion
  if (typeof param1 === 'object' && param1 !== null && 'jugadorId' in param1) {
    jugadorId = param1.jugadorId
    posicion = param1.posicion
  } else {
    jugadorId = param1
    posicion = param2
  }
  const jId = idDe(jugadorId)
  const res = await axios.patch(
    `${API_URL}/jugadores/${jId}/posicion`,
    { posicion },
    { headers: authHeaders() }
  )
  await cargarJugadores()
  return res.data
}

export async function actualizarJugador(jugadorId, datos) {
  const res = await axios.patch(
    `${API_URL}/jugadores/${jugadorId}`,
    datos,
    { headers: authHeaders() }
  )
  await cargarJugadores()
  return res.data
}

export async function cambiarDorsalJugador({ jugadorId, numero }) {
  const res = await axios.patch(
    `${API_URL}/jugadores/${jugadorId}/dorsal`,
    { numero },
    { headers: authHeaders() }
  )
  await cargarJugadores()
  return res.data
}

export async function enviarExcedentesABanca(equipoId) {
  const target = idDe(equipoId)
  const enCancha = jugadores.value.filter(j => idDe(j.equipo) === target && normalizarPosicion(j.posicion) !== 'En Banca')
  if (enCancha.length <= 11) return []

  const aMover = enCancha.slice(11)
  for (const jug of aMover) {
    const jId = jug._id || jug.id
    await axios.patch(`${API_URL}/jugadores/${jId}/posicion`, { posicion: 'En Banca' }, { headers: authHeaders() })
  }
  await cargarJugadores()
  return aMover
}

export async function completarPlantelEquipo(equipoId) {
  const res = await axios.post(`${API_URL}/jugadores/completar-plantel`, { equipoId }, { headers: authHeaders() })
  await cargarJugadores()
  await cargarEquipos()
  return res.data
}

export async function autorizarJugador(id) {
  const res = await axios.patch(`${API_URL}/jugadores/${id}/autorizar`, {}, { headers: authHeaders() })
  await cargarJugadores()
  return res.data
}

export async function rechazarJugador(id) {
  const res = await axios.patch(`${API_URL}/jugadores/${id}/rechazar`, {}, { headers: authHeaders() })
  await cargarJugadores()
  return res.data
}

export async function solicitarTraspaso({ jugadorId, nuevoEquipoId, motivo }) {
  const res = await axios.post(
    `${API_URL}/jugadores/${jugadorId}/solicitar-traspaso`,
    { nuevoEquipoId, motivo },
    { headers: authHeaders() }
  )
  await cargarJugadores()
  return res.data
}

export async function autorizarSalidaTraspaso(params) {
  // Soporta tanto objeto ({ jugadorId, clubDestinoId, notificacionId }) como traspasoId directo
  let jId = params
  let body = {}
  if (typeof params === 'object' && params !== null) {
    jId = params.jugadorId || params.id
    body = {
      clubDestinoId: params.clubDestinoId,
      notificacionId: params.notificacionId
    }
  }
  const idLimpio = idDe(jId)
  const res = await axios.put(
    `${API_URL}/jugadores/${idLimpio}/autorizar-salida-traspaso`,
    body,
    { headers: authHeaders() }
  )
  await cargarJugadores()
  return res.data
}

export async function confirmarLlegadaTraspaso(params) {
  // Soporta tanto objeto ({ jugadorId, clubDestinoId, notificacionId }) como traspasoId directo
  let jId = params
  let body = {}
  if (typeof params === 'object' && params !== null) {
    jId = params.jugadorId || params.id
    body = {
      clubDestinoId: params.clubDestinoId,
      notificacionId: params.notificacionId
    }
  }
  const idLimpio = idDe(jId)
  const res = await axios.put(
    `${API_URL}/jugadores/${idLimpio}/confirmar-llegada-traspaso`,
    body,
    { headers: authHeaders() }
  )
  await cargarJugadores()
  return res.data
}
