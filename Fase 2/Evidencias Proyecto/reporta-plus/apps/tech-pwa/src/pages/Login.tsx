import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../stores/auth'
// Ajusta la ruta/nombre si tu logo se llama distinto
import logo from '../assets/logo-reporta-plus.png'

export default function Login() {
  const nav = useNavigate()
  const login = useAuth((s) => s.login)
  const loadMe = useAuth((s) => s.loadMe)
  const user = useAuth((s) => s.user)

  const [email, setEmail] = useState('admin@reporta.plus')
  const [password, setPassword] = useState('admin123')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const stored = localStorage.getItem('theme')
    return stored === 'dark'
  })

  useEffect(() => {
    loadMe()
  }, [loadMe])

  useEffect(() => {
    if (user) nav('/')
  }, [user, nav])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      await login(email, password)
      nav('/')
    } catch (e: any) {
      setErr(e?.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-base-light via-card-light to-base-light dark:from-base-dark dark:via-card-dark dark:to-base-dark text-tmain-light dark:text-tmain-dark transition-colors relative overflow-hidden">
      {/* Fondos decorativos */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-24 w-64 h-64 rounded-full bg-brand-soft blur-3xl opacity-70 dark:bg-brand-darkSoft" />
        <div className="absolute -bottom-32 -left-16 w-72 h-72 rounded-full bg-accent-light blur-3xl opacity-60 dark:bg-accent-dark" />
      </div>

      <div className="relative w-full max-w-md px-4">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-card-light dark:bg-card-dark border border-borderc-light dark:border-borderc-dark flex items-center justify-center shadow-sm">
              {logo ? (
                <img
                  src={logo}
                  alt="Reporta+"
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <span className="text-lg font-bold text-brand-primary">
                  R+
                </span>
              )}
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">
                Reporta+
              </div>
              <div className="text-[11px] text-tmuted-light dark:text-tmuted-dark">
                Plataforma para técnicos
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDark((v) => !v)}
            className="px-3 py-1 text-xs rounded-full border border-borderc-light bg-card-light text-tmuted-light hover:bg-base-light active:scale-[0.98] transition dark:border-borderc-dark dark:bg-card-dark dark:text-tmuted-dark dark:hover:bg-base-dark"
          >
            {isDark ? 'Modo claro' : 'Modo oscuro'}
          </button>
        </div>

        <div className="rounded-2xl border border-borderc-light dark:border-borderc-dark bg-card-light/90 dark:bg-card-dark/90 shadow-xl backdrop-blur-md overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-brand-primary via-accent-light to-brand-primary dark:from-brand-darkPrimary dark:via-accent-dark dark:to-brand-darkPrimary animate-pulse" />

          <div className="px-6 py-6 space-y-4">
            <div className="space-y-1">
              <h1 className="text-xl font-semibold tracking-tight">
                Inicia sesión
              </h1>
              <p className="text-xs text-tmuted-light dark:text-tmuted-dark">
                Ingresa con tu usuario asignado por el supervisor para
                registrar tus servicios en terreno.
              </p>
            </div>

            {err && (
              <div className="text-xs border border-red-300 bg-red-50 text-red-700 rounded px-3 py-2">
                {err}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-tmuted-light dark:text-tmuted-dark">
                  Correo electrónico
                </label>
                <input
                  className="w-full rounded-lg px-3 py-2 text-sm border border-borderc-light bg-card-light text-tmain-light placeholder:text-tmuted-light focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition dark:bg-card-dark dark:border-borderc-dark dark:text-tmain-dark dark:placeholder:text-tmuted-dark"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ej: tecnico@empresa.cl"
                  type="email"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-tmuted-light dark:text-tmuted-dark">
                  Contraseña
                </label>
                <input
                  className="w-full rounded-lg px-3 py-2 text-sm border border-borderc-light bg-card-light text-tmain-light placeholder:text-tmuted-light focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition dark:bg-card-dark dark:border-borderc-dark dark:text-tmain-dark dark:placeholder:text-tmuted-dark"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  type="password"
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-brand-primary to-accent-light dark:from-brand-darkPrimary dark:to-accent-dark shadow-md hover:brightness-110 active:scale-[0.98] transition disabled:opacity-70"
              >
                {loading ? 'Ingresando...' : 'Entrar'}
              </button>
            </form>

            <p className="text-[11px] text-center text-tmuted-light dark:text-tmuted-dark pt-1">
              Si olvidaste tus credenciales, contacta al administrador o
              supervisor.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}