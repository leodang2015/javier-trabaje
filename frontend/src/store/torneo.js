import { reactive, ref } from 'vue'

// Importar submódulos ordenados que reflejan los modelos del backend:
// auth (Usuario), torneo (Torneo), equipo (Equipo), jugador (Jugador) y partido (Partido)
export * from './api.js'
export * from './modules/authStore.js'
export * from './modules/torneoStore.js'
export * from './modules/equipoStore.js'
export * from './modules/jugadorStore.js'
export * from './modules/partidoStore.js'

import * as authMod from './modules/authStore.js'
import * as torneoMod from './modules/torneoStore.js'
import * as equipoMod from './modules/equipoStore.js'
import * as jugadorMod from './modules/jugadorStore.js'
import * as partidoMod from './modules/partidoStore.js'

const cargandoGlobal = ref(false)
const errorGlobal = ref('')

export async function cargarTodo() {
  cargandoGlobal.value = true
  errorGlobal.value = ''
  try {
    await Promise.allSettled([
      torneoMod.cargarTorneo(),
      equipoMod.cargarEquipos(),
      jugadorMod.cargarJugadores(),
      partidoMod.cargarPartidos(),
      torneoMod.cargarNotificaciones()
    ])
  } catch (err) {
    console.error('Error al cargar datos globales:', err)
    errorGlobal.value = err.message || 'Error al conectar con la base de datos'
  } finally {
    cargandoGlobal.value = false
  }
}

// Objeto de estado único compartido y reactivo para compatibilidad 100% con toda la app
const state = reactive({
  // Modulo Auth / Usuario
  ...authMod,
  // Modulo Torneo / Notificaciones
  ...torneoMod,
  // Modulo Equipo
  ...equipoMod,
  // Modulo Jugador
  ...jugadorMod,
  // Modulo Partido
  ...partidoMod,
  // Globales
  cargando: cargandoGlobal,
  error: errorGlobal,
  cargarTodo
})

export function useTorneo() { return state }
export function useTorneoStore() { return state }
export function useRoleStore() { return state }
export function useAuthStore() { return state }
export function useEquipoStore() { return equipoMod }
export function useJugadorStore() { return jugadorMod }
export function usePartidoStore() { return partidoMod }

export default state
