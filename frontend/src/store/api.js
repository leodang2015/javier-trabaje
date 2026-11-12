import axios from 'axios'

export const API_URL = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_URL) || '/api'

export function authHeaders() {
  const token = localStorage.getItem('futbolito_auth_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const idDe = (v) => {
  if (!v) return ''
  if (typeof v === 'object') {
    return String(v._id ?? v.id ?? '').trim()
  }
  return String(v).trim()
}

export const lista = (d) => (Array.isArray(d) ? d : d?.data ?? d?.equipos ?? d?.jugadores ?? d?.partidos ?? [])
