import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL })

let refreshPromise: Promise<string> | null = null
const getA = () => localStorage.getItem('access_token') || ''
const getR = () => localStorage.getItem('refresh_token') || ''
const setT = (a: string, r?: string) => {
  localStorage.setItem('access_token', a)
  if (r) localStorage.setItem('refresh_token', r)
}

api.interceptors.request.use(cfg => {
  const t = getA()
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  async err => {
    const orig = err.config as any
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true
      if (!refreshPromise) {
        refreshPromise = (async () => {
          const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh`, {
            refresh_token: getR(),
          })
          setT(data.access_token, data.refresh_token)
          return data.access_token
        })().finally(() => (refreshPromise = null))
      }
      const a = await refreshPromise
      orig.headers.Authorization = `Bearer ${a}`
      return api(orig)
    }
    return Promise.reject(err)
  },
)

export default api

// Envia el informe de servicio por email
export async function signAndSendService(
  id: string,
  data: { clientEmails: string[]; notes?: string }
) {
  const res = await api.patch(`/services/${id}/sign-and-send`, data)
  return res.data
}