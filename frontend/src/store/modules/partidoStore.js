import { ref, computed } from 'vue'
import axios from 'axios'
import { API_URL, authHeaders, idDe, lista } from '../api.js'
import { equipos, cargarEquipos } from './equipoStore.js'
import { jugadores, cargarJugadores } from './jugadorStore.js'

export const partidos = ref([])
export const dialogoPartido = ref(false)

export function abrirDialogoPartido() {
  dialogoPartido.value = true
}

export function cerrarDialogoPartido() {
  dialogoPartido.value = false
}

export function esFinalizado(p) {
  if (!p) return false
  const est = String(p.estado || '').toLowerCase().trim()
  return ['finalizado', 'jugado', 'terminado'].includes(est)
}

export const jugados = computed(() => partidos.value.filter(esFinalizado))
export const pendientes = computed(() => partidos.value.filter(p => !esFinalizado(p)))

export const fechas = computed(() => {
  const fSet = new Set()
  partidos.value.forEach(p => {
    if (p.fecha) fSet.add(Number(p.fecha))
  })
  return Array.from(fSet).sort((a, b) => a - b)
})

export const tabla = computed(() => {
  const map = {}
  equipos.value.forEach(e => {
    const eId = idDe(e)
    map[eId] = {
      id: eId,
      _id: eId,
      equipo: e,
      nombre: e.nombre || 'Club',
      barriada: e.barriada || '',
      color: e.color || e.escudocolor || '#059669',
      escudocolor: e.escudocolor || e.color || '#059669',
      escudoFigura: e.escudoFigura || '🛡️',
      escudoUrl: e.escudoUrl || '',
      pj: 0,
      pg: 0,
      pe: 0,
      pp: 0,
      gf: 0,
      gc: 0,
      dg: 0,
      puntos: 0,
      pts: 0,
      racha: []
    }
  })

  // Ordenar partidos por fecha para computar racha histórica
  const partidosOrdenados = [...partidos.value].sort((a, b) => new Date(a.fechaHora || 0) - new Date(b.fechaHora || 0))

  partidosOrdenados.forEach(p => {
    if (!esFinalizado(p)) return
    const locId = idDe(p.localId) || idDe(p.local)
    const visId = idDe(p.visitanteId) || idDe(p.visitante)
    const gl = Number(p.golesLocal ?? 0)
    const gv = Number(p.golesVisitante ?? 0)

    if (map[locId] && map[visId]) {
      map[locId].pj++
      map[visId].pj++
      map[locId].gf += gl
      map[locId].gc += gv
      map[visId].gf += gv
      map[visId].gc += gl

      if (gl > gv) {
        map[locId].pg++
        map[locId].puntos += 3
        map[locId].pts += 3
        map[locId].racha.push('V')

        map[visId].pp++
        map[visId].racha.push('D')
      } else if (gl < gv) {
        map[visId].pg++
        map[visId].puntos += 3
        map[visId].pts += 3
        map[visId].racha.push('V')

        map[locId].pp++
        map[locId].racha.push('D')
      } else {
        map[locId].pe++
        map[locId].puntos += 1
        map[locId].pts += 1
        map[locId].racha.push('E')

        map[visId].pe++
        map[visId].puntos += 1
        map[visId].pts += 1
        map[visId].racha.push('E')
      }
    }
  })

  return Object.values(map)
    .map(row => ({
      ...row,
      dg: row.gf - row.gc
    }))
    .sort((a, b) => {
      if (b.puntos !== a.puntos) return b.puntos - a.puntos
      if (b.dg !== a.dg) return b.dg - a.dg
      return b.gf - a.gf
    })
})

export const stats = computed(() => {
  let golesTotales = 0
  partidos.value.forEach(p => {
    if (esFinalizado(p)) {
      golesTotales += Number(p.golesLocal ?? 0) + Number(p.golesVisitante ?? 0)
    }
  })
  const totalEquipos = equipos.value.length
  const totalPartidos = partidos.value.length
  const jug = jugados.value.length
  const pend = pendientes.value.length
  const promGoles = jug > 0 ? (golesTotales / jug).toFixed(1) : '0.0'

  return {
    totalEquipos,
    totalPartidos,
    jugados: jug,
    pendientes: pend,
    golesTotales,
    promGoles
  }
})

export const goleadores = computed(() => {
  const map = {}
  jugadores.value.forEach(j => {
    const jId = idDe(j)
    const eqId = idDe(j.equipo)
    const eq = equipos.value.find(e => idDe(e) === eqId)
    map[jId] = {
      id: jId,
      _id: jId,
      nombre: [j.nombre, j.apellido && j.apellido !== '-' ? j.apellido : ''].filter(Boolean).join(' '),
      equipoId: eqId,
      equipo: eqId,
      equipoNombre: eq?.nombre || '',
      jugador: j,
      goles: Number(j.goles ?? 0)
    }
  })

  partidos.value.forEach(p => {
    if (!esFinalizado(p)) return
    if (Array.isArray(p.goleadores)) {
      p.goleadores.forEach(g => {
        if (g.esAutogol) return
        const jId = idDe(g.jugadorId)
        if (map[jId]) {
          map[jId].goles = Math.max(map[jId].goles, Number(g.goles ?? 1))
        }
      })
    }
  })

  return Object.values(map)
    .filter(row => row.goles > 0)
    .sort((a, b) => b.goles - a.goles)
})

export const asistidores = computed(() => {
  const map = {}
  jugadores.value.forEach(j => {
    const jId = idDe(j)
    const eqId = idDe(j.equipo)
    const eq = equipos.value.find(e => idDe(e) === eqId)
    map[jId] = {
      id: jId,
      _id: jId,
      nombre: [j.nombre, j.apellido && j.apellido !== '-' ? j.apellido : ''].filter(Boolean).join(' '),
      equipoId: eqId,
      equipo: eqId,
      equipoNombre: eq?.nombre || '',
      jugador: j,
      asistencias: Number(j.asistencias ?? 0)
    }
  })

  partidos.value.forEach(p => {
    if (!esFinalizado(p)) return
    if (Array.isArray(p.goleadores)) {
      p.goleadores.forEach(g => {
        if (g.esAutogol) return
        const aId = idDe(g.asistenteId)
        if (aId && map[aId]) {
          map[aId].asistencias = (map[aId].asistencias || 0) + 1
        }
      })
    }
  })

  return Object.values(map)
    .filter(row => row.asistencias > 0)
    .sort((a, b) => b.asistencias - a.asistencias)
})

export function normalizarPartido(p) {
  if (!p) return p
  const locId = p.localId || (typeof p.local === 'object' ? (p.local?._id || p.local?.id) : p.local)
  const visId = p.visitanteId || (typeof p.visitante === 'object' ? (p.visitante?._id || p.visitante?.id) : p.visitante)
  return {
    ...p,
    id: p._id || p.id,
    localId: locId ? String(locId).trim() : '',
    visitanteId: visId ? String(visId).trim() : ''
  }
}

export async function cargarPartidos() {
  try {
    const res = await axios.get(`${API_URL}/partidos`)
    const rawList = lista(res.data)
    partidos.value = rawList.map(normalizarPartido)
    return partidos.value
  } catch (err) {
    console.error('Error al cargar partidos:', err)
  }
}

export async function guardarPartido(datos) {
  const res = await axios.post(`${API_URL}/partidos`, datos, { headers: authHeaders() })
  await cargarPartidos()
  return res.data
}

export async function fijarMarcadorOrganizador(param1, param2) {
  let partidoId
  let payload
  if (typeof param1 === 'object' && param1 !== null) {
    partidoId = param1.partidoId || param1.id
    payload = param1
  } else {
    partidoId = param1
    payload = param2 || {}
  }

  const idLimpio = idDe(partidoId)
  const listaGoleadores = payload.goleadores || payload.listaGoleadores || []
  const listaCambios = payload.cambios || payload.sustituciones || []

  const res = await axios.patch(
    `${API_URL}/partidos/${idLimpio}/marcador-organizador`,
    {
      golesLocal: Number(payload.golesLocal) || 0,
      golesVisitante: Number(payload.golesVisitante) || 0,
      asistenciasLocal: Number(payload.asistenciasLocal) || 0,
      asistenciasVisitante: Number(payload.asistenciasVisitante) || 0,
      faltasLocal: Number(payload.faltasLocal) || 0,
      faltasVisitante: Number(payload.faltasVisitante) || 0,
      goleadores: listaGoleadores,
      cambios: listaCambios,
      tarjetas: payload.tarjetas || []
    },
    { headers: authHeaders() }
  )
  await cargarPartidos()
  await cargarEquipos()
  await cargarJugadores()
  return res.data
}

export async function autogenerarGoleadoresPartido(partidoId) {
  const res = await axios.post(`${API_URL}/partidos/${partidoId}/autogenerar-goleadores`, {}, { headers: authHeaders() })
  await cargarPartidos()
  await cargarEquipos()
  await cargarJugadores()
  return res.data
}

export async function generarPartidosConIA({ cantidadPartidos, intervaloDias = 1 }) {
  const res = await axios.post(`${API_URL}/partidos/generar-automaticos-ia`, { cantidadPartidos, intervaloDias }, { headers: authHeaders() })
  await cargarPartidos()
  return res.data
}

export async function posponerPartido({ partidoId, motivo, nuevaFechaHora }) {
  const res = await axios.put(`${API_URL}/partidos/${partidoId}/posponer`, { motivo, nuevaFechaHora }, { headers: authHeaders() })
  await cargarPartidos()
  return res.data
}

export async function eliminarPartido(partidoId) {
  const res = await axios.delete(`${API_URL}/partidos/${partidoId}`, { headers: authHeaders() })
  await cargarPartidos()
  return res.data
}

export async function confirmarPartidoDT({ partidoId, equipoId }) {
  const res = await axios.post(`${API_URL}/partidos/${partidoId}/confirmar`, { equipoId }, { headers: authHeaders() })
  await cargarPartidos()
  return res.data
}

export async function reportarGolesEquipoDT({ partidoId, goles, goleadores = [] }) {
  const res = await axios.post(`${API_URL}/partidos/${partidoId}/reportar-goles-dt`, { goles, goleadores }, { headers: authHeaders() })
  await cargarPartidos()
  return res.data
}

export async function registrarGoleadoresDT({ partidoId, goleadores }) {
  const res = await axios.patch(`${API_URL}/partidos/${partidoId}/goleadores`, { goleadores }, { headers: authHeaders() })
  await cargarPartidos()
  return res.data
}
