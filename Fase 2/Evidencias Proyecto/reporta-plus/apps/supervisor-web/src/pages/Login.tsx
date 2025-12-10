import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { setTokens, getMe } from '../api/client'
import Card from '../components/Card'
import { showToast } from '../components/Toast'
import '../styles/ui.css'

export default function Login() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e?: any) {
    e?.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      const data = res.data || {}
      const access = data.access_token || data.token || data.accessToken
      const refresh = data.refresh_token || data.refreshToken

      if (!access) throw new Error('Respuesta de login inválida: falta token')

      // Guardamos tokens y header
      setTokens(access, refresh ?? null)

      // Intentamos obtener perfil y guardarlo (no bloquear login si falla)
      try {
        const me = await getMe()
        const profile = me.data || {}
        localStorage.setItem('user', JSON.stringify({
          id: profile.id,
          name: profile.name ?? profile.fullName ?? profile.username ?? '',
          email: profile.email ?? ''
        }))
      } catch (meErr) {
        console.warn('No se pudo obtener perfil tras login', meErr)
      }

      showToast('Inicio de sesión correcto', 'success')
      nav('/dashboard')
    } catch (err: any) {
      console.error(err)
      const msg = err?.response?.data?.message || err?.message || 'Error al iniciar sesión'
      setError(String(msg))
      showToast(String(msg), 'error')
      setTokens(null, null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={page}>
      <header style={header}>
        <div style={brandInline}>
          <img src="/logo-reporta-plus.png" alt="Reporta+" style={brandLogo} />
          <div>
            <div style={brandTitle}>Reporta+</div>
            <div style={brandSub}>Panel de supervisores</div>
          </div>
        </div>
      </header>

      <main style={main}>
        <Card className="login-card" style={{ maxWidth: 540, width: '100%' }}>
          <div style={accentTop} aria-hidden />
          <div style={loginInner}>
            <h2 style={{ margin: 0, fontSize: 22 }}>Inicia sesión</h2>
            <p style={{ marginTop: 6, marginBottom: 14, color: '#6b7280' }}>
              Ingresa con tu usuario asignado por el supervisor para acceder al panel.
            </p>

            {error && <div className="error-box" role="alert" style={{ marginBottom: 12 }}>{error}</div>}

            <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="small">Correo electrónico</label>
                <input
                  className="input"
                  placeholder="ejemplo@ejemplo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  style={{ padding: 12 }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="small">Contraseña</label>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ padding: 12 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}>
                <button
                  type="submit"
                  className="btn"
                  disabled={loading}
                  style={{ minWidth: 160, fontWeight: 700 }}
                >
                  {loading ? 'Ingresando...' : 'Entrar'}
                </button>
              </div>

              <div style={{ marginTop: 6, textAlign: 'center' }} className="small" aria-hidden>
                Si olvidaste tus credenciales contacta al administrador o supervisor.
              </div>
            </form>
          </div>
        </Card>
      </main>
    </div>
  )
}

/* Inline styles (rápidos para que lo veas inmediatamente) */
const page: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  background: 'linear-gradient(180deg, #ffffff 0%, #fbfaf9 100%)',
  paddingTop: 18,
  paddingBottom: 36,
}

const header: React.CSSProperties = {
  width: '100%',
  maxWidth: 1100,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '18px',
  boxSizing: 'border-box',
}

const brandInline: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'center'
}

const brandLogo: React.CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: 999,
  objectFit: 'cover',
  boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
  background: '#fff',
  padding: 8
}

const brandTitle: React.CSSProperties = { fontWeight: 800, fontSize: 18 }
const brandSub: React.CSSProperties = { fontSize: 13, color: '#6b7280' }

const main: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  padding: '12px',
  boxSizing: 'border-box'
}

const accentTop: React.CSSProperties = {
  height: 12,
  width: 'calc(100% - 28px)',
  margin: 14,
  borderRadius: 10,
  background: 'linear-gradient(90deg,#ff8a5b,#ffb86b)',
  boxShadow: '0 6px 20px rgba(255,138,91,0.06)'
}

const loginInner: React.CSSProperties = {
  padding: '18px 26px 26px 26px'
}