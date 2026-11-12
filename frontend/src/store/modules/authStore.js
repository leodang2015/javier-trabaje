const getStorage = (k) => {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(k) : null
  } catch {
    return null
  }
}

import { ref, computed } from 'vue'
import axios from 'axios'
import { API_URL, authHeaders } from '../api.js'

export const ROLES = {
  ORGANIZADOR: 'organizador',
  ENTRENADOR: 'entrenador',
  JUGADOR: 'jugador',
  INSCRIPCION: 'jugador'
}

export const CODIGOS_ROL = {
  organizador: '1',
  entrenador: '2',
  jugador: '3'
}

const usuarioGuardado = (() => {
  try {
    return JSON.parse(localStorage.getItem('futbolito_user') || 'null')
  } catch {
    return null
  }
})()

export const user = ref(usuarioGuardado)
export const token = ref(getStorage('futbolito_auth_token') || '')
export const rolActual = ref(getStorage('futbolito_rol') || (usuarioGuardado?.rol || ROLES.ORGANIZADOR))
export const equipoEntrenadorId = ref(getStorage('futbolito_dt_equipo') || '')

export const mostrarAuthModal = ref(false)
export const errorAuth = ref('')
export const cargando = ref(false)
export const codigoOrganizadorActivo = ref(getStorage('futbolito_codigo_omar') || '')

export const isAuthenticated = computed(() => Boolean(user.value || token.value))
export const esOrganizador = computed(() => rolActual.value === ROLES.ORGANIZADOR)
export const esOrganizadorOmar = computed(() => {
  if (rolActual.value !== ROLES.ORGANIZADOR) return false
  // REGLA ESTRICTA: Solo el USUARIO exacto 'omar' (nombre de usuario / username)
  // tiene el código para autorizar organizadores.
  const usr = String(user.value?.usuario || '').toLowerCase().trim()
  return usr === 'omar'
})
export const esEntrenador = computed(() => rolActual.value === ROLES.ENTRENADOR)
export const esJugador = computed(() => rolActual.value === ROLES.JUGADOR)
export const esInscripcion = computed(() => rolActual.value === ROLES.INSCRIPCION)

export const nombreDisplay = computed(() => {
  if (user.value?.nombre) return user.value.nombre
  if (user.value?.usuario) return `@${user.value.usuario}`
  return 'Invitado'
})

export const rolInfo = computed(() => {
  switch (rolActual.value) {
    case ROLES.ORGANIZADOR:
      return {
        label: 'Organizador Oficial',
        badge: '👑 Organizador',
        color: 'amber-9',
        bgClass: 'bg-amber-400 text-slate-950 font-black shadow-md border border-amber-300',
        textColor: 'text-slate-950',
        descripcion: 'Gestión de fixture, aprobación de clubes y cómputo de posiciones'
      }
    case ROLES.ENTRENADOR:
      return {
        label: 'Director Técnico',
        badge: '📋 Entrenador',
        color: 'emerald-8',
        bgClass: 'bg-emerald-500 text-white font-black shadow-md border border-emerald-400',
        textColor: 'text-white',
        descripcion: 'Pizarra táctica, dorsales, alineación y confirmación de encuentros'
      }
    case ROLES.JUGADOR:
      return {
        label: 'Futbolista',
        badge: '🏃 Jugador',
        color: 'indigo-8',
        bgClass: 'bg-indigo-600 text-white font-black shadow-md border border-indigo-400',
        textColor: 'text-white',
        descripcion: 'Ficha personal, dorsal, estadísticas y calendario oficial'
      }
    default:
      return {
        label: 'Aficionado',
        badge: '⚽ Visitante',
        color: 'slate-700',
        bgClass: 'bg-slate-700 text-white font-bold',
        textColor: 'text-white',
        descripcion: 'Consulta de partidos y resultados en tiempo real'
      }
  }
})

export async function login({ usuario, password, codigo, rol }) {
  cargando.value = true
  errorAuth.value = ''
  try {
    const res = await axios.post(`${API_URL}/auth/login`, {
      usuario,
      password,
      codigo,
      rol
    })
    const data = res.data
    user.value = data.usuario
    token.value = data.token
    rolActual.value = data.usuario.rol || ROLES.ORGANIZADOR
    localStorage.setItem('futbolito_auth_token', data.token)
    localStorage.setItem('futbolito_user', JSON.stringify(data.usuario))
    localStorage.setItem('futbolito_rol', rolActual.value)

    if (data.codigoOrganizadorDinamico) {
      codigoOrganizadorActivo.value = data.codigoOrganizadorDinamico
      localStorage.setItem('futbolito_codigo_omar', data.codigoOrganizadorDinamico)
    } else {
      codigoOrganizadorActivo.value = ''
      localStorage.removeItem('futbolito_codigo_omar')
    }

    if (data.usuario.equipo) {
      const eqId = typeof data.usuario.equipo === 'object' ? data.usuario.equipo._id : data.usuario.equipo
      equipoEntrenadorId.value = eqId
      localStorage.setItem('futbolito_dt_equipo', eqId)
    }
    cerrarModal()
    return data
  } catch (err) {
    errorAuth.value = err.response?.data?.msg || err.message || 'Error al iniciar sesión'
    throw err
  } finally {
    cargando.value = false
  }
}

export async function registro(datos) {
  cargando.value = true
  errorAuth.value = ''
  try {
    const res = await axios.post(`${API_URL}/auth/registro`, datos)
    const data = res.data

    if (data.requiereAprobacion) {
      logout()
      return data
    }

    user.value = data.usuario
    token.value = data.token
    rolActual.value = data.usuario.rol || ROLES.ORGANIZADOR
    localStorage.setItem('futbolito_auth_token', data.token)
    localStorage.setItem('futbolito_user', JSON.stringify(data.usuario))
    localStorage.setItem('futbolito_rol', rolActual.value)

    if (data.codigoOrganizadorDinamico) {
      codigoOrganizadorActivo.value = data.codigoOrganizadorDinamico
      localStorage.setItem('futbolito_codigo_omar', data.codigoOrganizadorDinamico)
    } else {
      codigoOrganizadorActivo.value = ''
      localStorage.removeItem('futbolito_codigo_omar')
    }

    if (data.usuario?.equipo) {
      const eqId = typeof data.usuario.equipo === 'object' ? data.usuario.equipo._id : data.usuario.equipo
      equipoEntrenadorId.value = eqId
      localStorage.setItem('futbolito_dt_equipo', eqId)
    }
    return data
  } catch (err) {
    errorAuth.value = err.response?.data?.msg || err.message || 'Error al registrar'
    throw err
  } finally {
    cargando.value = false
  }
}

export function logout() {
  user.value = null
  token.value = ''
  rolActual.value = ROLES.ORGANIZADOR
  equipoEntrenadorId.value = ''
  codigoOrganizadorActivo.value = ''
  localStorage.removeItem('futbolito_auth_token')
  localStorage.removeItem('futbolito_user')
  localStorage.removeItem('futbolito_rol')
  localStorage.removeItem('futbolito_dt_equipo')
  localStorage.removeItem('futbolito_codigo_omar')
}

export function cambiarRol(nuevoRol) {
  if (Object.values(ROLES).includes(nuevoRol)) {
    rolActual.value = nuevoRol
    localStorage.setItem('futbolito_rol', nuevoRol)
  }
}

export function setEquipoEntrenador(eqId) {
  equipoEntrenadorId.value = eqId || ''
  if (eqId) {
    localStorage.setItem('futbolito_dt_equipo', eqId)
  } else {
    localStorage.removeItem('futbolito_dt_equipo')
  }
}

export function abrirLogin() {
  errorAuth.value = ''
  mostrarAuthModal.value = true
}

export function abrirRegistro() {
  errorAuth.value = ''
  mostrarAuthModal.value = true
}

export function cerrarModal() {
  mostrarAuthModal.value = false
  errorAuth.value = ''
}


export async function actualizarPerfil({ nombre, nuevoUsuario, passwordActual, nuevoPassword }) {
  cargando.value = true
  try {
    const res = await axios.put(`${API_URL}/auth/perfil`, {
      nombre,
      nuevoUsuario,
      passwordActual,
      nuevoPassword
    }, { headers: authHeaders() })
    const data = res.data
    user.value = data.usuario
    if (data.token) {
      token.value = data.token
      localStorage.setItem('futbolito_auth_token', data.token)
    }
    localStorage.setItem('futbolito_user', JSON.stringify(data.usuario))
    return data
  } finally {
    cargando.value = false
  }
}

export async function eliminarCuenta(password) {
  cargando.value = true
  try {
    const res = await axios.delete(`${API_URL}/auth/cuenta`, {
      headers: authHeaders(),
      data: { password }
    })
    logout()
    return res.data
  } finally {
    cargando.value = false
  }
}
