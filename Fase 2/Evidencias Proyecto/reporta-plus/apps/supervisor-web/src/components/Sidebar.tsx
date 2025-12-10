import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { House, Files, Users, Buildings, Gear, SignOut } from 'phosphor-react'
import Icon from './Icon'
import api, { clearTokens, setTokens, getMe } from '../api/client'
import { showToast } from './Toast'

const NavItem = ({ to, label, C }: { to: string; label: string; C: any }) => {
  const loc = useLocation()
  const active = loc.pathname === to || (to !== '/' && loc.pathname.startsWith(to))
  return (
    <Link to={to} className={`sidebar-item ${active ? 'active' : ''}`} title={label}>
      <Icon C={C} size={18} />
      <span>{label}</span>
    </Link>
  )
}

export default function Sidebar() {
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null)
  const nav = useNavigate()

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const { data } = await api.get('/auth/me')
        if (!mounted) return
        setUser({ name: data.name, email: data.email })
        // store simple copy for fallback
        localStorage.setItem('user', JSON.stringify({ name: data.name, email: data.email }))
      } catch (e) {
        // fallback a localStorage si existe
        try {
          const raw = localStorage.getItem('user')
          if (raw) setUser(JSON.parse(raw))
        } catch (_) { /* ignore */ }
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  async function logout() {
    try {
      // opcional: notificar al backend
      try { await api.post('/auth/logout') } catch (_) { /* ignore */ }
    } finally {
      clearTokens()
      localStorage.removeItem('user')
      showToast('Sesión cerrada', 'info')
      nav('/login', { replace: true })
    }
  }

  return (
    <aside className="sidebar" role="navigation" aria-label="Navegación principal">
      <div>
        <div className="brand-badge">
          <img src="/logo-reporta-plus.png" alt="Reporta+ logo" className="logo-img" />
          <div>
            <div className="brand-name">Reporta+</div>
            <div className="brand-sub">Panel Supervisor</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Secciones">
          <NavItem to="/dashboard" label="Dashboard" C={House} />
          <NavItem to="/services" label="Servicios" C={Files} />
          <NavItem to="/clients" label="Clientes" C={Buildings} />
          <NavItem to="/users" label="Técnicos" C={Users} />
          <NavItem to="/settings" label="Ajustes" C={Gear} />
        </nav>
      </div>

      <div className="sidebar-bottom">
        <div className="sidebar-user" title="Usuario actual">
          <div className="avatar">{(user?.name || 'U').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()}</div>
          <div>
            <div className="user-name">{user?.name || 'Usuario'}</div>
            <div className="user-role small">{user?.email || 'email@ejemplo.com'}</div>
          </div>
        </div>
        <button onClick={logout} className="signout small" style={{ background:'transparent', border:'none', color:'inherit', padding:0, cursor:'pointer' }}>
          <Icon C={SignOut} size={14} /> Cerrar sesión
        </button>
      </div>
    </aside>
  )
}