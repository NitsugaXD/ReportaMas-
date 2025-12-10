import axios, { AxiosHeaders } from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

/**
 * Helpers para tokens y usuario
 */
export function setTokens(accessToken: string | null, refreshToken?: string | null) {
  if (accessToken) {
    localStorage.setItem('access_token', accessToken)
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
  } else {
    localStorage.removeItem('access_token')
    delete api.defaults.headers.common['Authorization']
  }

  if (typeof refreshToken !== 'undefined') {
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken)
    else localStorage.removeItem('refresh_token')
  }
}

/** Limpia tokens y user */
export function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
  delete api.defaults.headers.common['Authorization']
}

/** Obtener perfil actual */
export async function getMe() {
  return api.get('/auth/me')
}

/**
 * Interceptor para refrescar token al recibir 401.
 * Implementación simple con cola para evitar múltiples refresh simultáneos.
 */
let isRefreshing = false
let failedQueue: Array<{ resolve: (v?: any) => void; reject: (e?: any) => void; config: any }> = []

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach(p => {
    if (error) p.reject(error)
    else {
      // Aseguramos headers usando AxiosHeaders para mantener la tipificación correcta
      p.config.headers = new AxiosHeaders(p.config.headers || {})
      if (token) p.config.headers.set('Authorization', 'Bearer ' + token)
      p.resolve(axios(p.config))
    }
  })
  failedQueue = []
}

/**
 * Request interceptor: añadimos Authorization si existe token
 * Usamos AxiosHeaders para no romper la tipificación de Axios.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    // normalizamos headers a AxiosHeaders
    config.headers = new AxiosHeaders(config.headers || {})
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
}, (err) => Promise.reject(err))

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const originalConfig: any = err.config
    const status = err?.response?.status

    // Si no es 401 o ya hemos reintentado, rechazamos
    if (status !== 401 || originalConfig?._retry) {
      if (status === 401 && !localStorage.getItem('refresh_token')) {
        try { clearTokens(); if (typeof window !== 'undefined') window.location.href = '/login' } catch (_) {}
      }
      return Promise.reject(err)
    }

    originalConfig._retry = true

    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      clearTokens()
      if (typeof window !== 'undefined') window.location.href = '/login'
      return Promise.reject(err)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, config: originalConfig })
      })
    }

    isRefreshing = true

    return new Promise(async (resolve, reject) => {
      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: refreshToken })
        const newAccess = data.access_token || data.token || data.accessToken
        const newRefresh = data.refresh_token || data.refreshToken || refreshToken

        setTokens(newAccess, newRefresh)
        processQueue(null, newAccess)

        // reintentar la petición original con nuevo token (tipada)
        originalConfig.headers = new AxiosHeaders(originalConfig.headers || {})
        originalConfig.headers.set('Authorization', 'Bearer ' + newAccess)
        resolve(axios(originalConfig))
      } catch (e) {
        processQueue(e, null)
        clearTokens()
        try { if (typeof window !== 'undefined') window.location.href = '/login' } catch (_) {}
        reject(e)
      } finally {
        isRefreshing = false
      }
    })
  }
)

export default api