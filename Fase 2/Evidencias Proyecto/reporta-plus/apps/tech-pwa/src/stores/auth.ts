import { create } from 'zustand'

type Role = 'ADMIN'|'SUP'|'TECH'
type User = { id:string; email:string; name:string; role:Role }

type State = {
  user: User | null
  login: (email:string, password:string) => Promise<void>
  logout: () => void
  loadMe: () => Promise<void>
}

export const useAuth = create<State>((set)=>({
  user: null,
  async login(email, password) {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email, password })
    })
    if (!res.ok) throw new Error('Credenciales inválidas')
    const data = await res.json()
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    set({ user: data.user })
  },
  logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ user: null })
  },
  async loadMe() {
    const token = localStorage.getItem('access_token'); if(!token) return
    const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, { headers:{ Authorization:`Bearer ${token}` } })
    if (res.ok) set({ user: await res.json() }); else set({ user: null })
  }
}))